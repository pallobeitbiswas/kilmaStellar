#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, IntoVal, Symbol};

/* ─── Types ─── */

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub enum ProjectStatus {
  Proposed,
  Funded,
  AuditSubmitted,
  Verified,
  Certified,
  Rejected,
  Refunded,
}

#[contracttype]
#[derive(Clone)]
pub struct Project {
  pub id: u64,
  pub sponsor: Address,
  pub developer: Address,
  pub auditor: Address,
  pub certifier: Address,
  pub amount: i128,
  pub status: ProjectStatus,
  pub created_at: u64,
}

/* ─── Storage keys ─── */

#[contracttype]
pub enum DataKey {
  ProjectCount,
  Project(u64),
  EscrowContract,
}

/* ─── Contract ─── */

#[contract]
pub struct RegistryContract;

#[contractimpl]
impl RegistryContract {
  /// Initialize with the authorized escrow vault contract address.
  pub fn initialize(env: Env, escrow_contract: Address) {
    env.storage().instance().set(&DataKey::ProjectCount, &0u64);
    env.storage()
      .instance()
      .set(&DataKey::EscrowContract, &escrow_contract);
    env.events().publish(("registry_contract", "initialized"), true);
  }

  /// Create a new carbon credit project.
  pub fn create_project(
    env: Env,
    sponsor: Address,
    developer: Address,
    auditor: Address,
    certifier: Address,
    amount: i128,
  ) -> u64 {
    sponsor.require_auth();

    let count: u64 = env
      .storage()
      .instance()
      .get(&DataKey::ProjectCount)
      .unwrap_or(0);
    let project_id = count + 1;

    let project = Project {
      id: project_id,
      sponsor,
      developer,
      auditor,
      certifier,
      amount,
      status: ProjectStatus::Proposed,
      created_at: env.ledger().sequence().into(),
    };

    env.storage()
      .instance()
      .set(&DataKey::Project(project_id), &project);
    env.storage()
      .instance()
      .set(&DataKey::ProjectCount, &project_id);

    env.events()
      .publish(("project", "created"), (project_id, amount));

    project_id
  }

  /// Mark the project as funded.
  /// Must only be called by the authorized Escrow Contract.
  pub fn mark_funded(env: Env, project_id: u64) {
    let escrow_contract: Address = env
      .storage()
      .instance()
      .get(&DataKey::EscrowContract)
      .unwrap();

    // Verify authentication from the Escrow Contract
    escrow_contract.require_auth();

    let mut project: Project = env
      .storage()
      .instance()
      .get(&DataKey::Project(project_id))
      .unwrap();

    if project.status != ProjectStatus::Proposed {
      panic!("Project cannot be funded in this state");
    }

    project.status = ProjectStatus::Funded;
    env.storage()
      .instance()
      .set(&DataKey::Project(project_id), &project);

    env.events().publish(("project", "funded"), project_id);
  }

  /// Log submission of environmental audit.
  /// Must be called by the designated auditor.
  pub fn submit_audit(env: Env, auditor: Address, project_id: u64) {
    auditor.require_auth();

    let mut project: Project = env
      .storage()
      .instance()
      .get(&DataKey::Project(project_id))
      .unwrap();

    if project.auditor != auditor {
      panic!("Not authorized auditor");
    }
    if project.status != ProjectStatus::Funded {
      panic!("Project must be funded to submit audit");
    }

    project.status = ProjectStatus::AuditSubmitted;
    env.storage()
      .instance()
      .set(&DataKey::Project(project_id), &project);

    env.events().publish(("project", "audit_submitted"), project_id);
  }

  /// Verify environmental impact.
  /// Must be called by the designated auditor.
  pub fn verify_impact(env: Env, auditor: Address, project_id: u64) {
    auditor.require_auth();

    let mut project: Project = env
      .storage()
      .instance()
      .get(&DataKey::Project(project_id))
      .unwrap();

    if project.auditor != auditor {
      panic!("Not authorized auditor");
    }
    if project.status != ProjectStatus::AuditSubmitted {
      panic!("Project must have audit submitted to verify");
    }

    project.status = ProjectStatus::Verified;
    env.storage()
      .instance()
      .set(&DataKey::Project(project_id), &project);

    env.events().publish(("project", "impact_verified"), project_id);
  }

  /// Certify environmental impact and decide whether to pass or fail certification.
  /// Must be called by the designated certifier.
  pub fn certify_impact(env: Env, certifier: Address, project_id: u64, passed: bool) {
    certifier.require_auth();

    let mut project: Project = env
      .storage()
      .instance()
      .get(&DataKey::Project(project_id))
      .unwrap();

    if project.certifier != certifier {
      panic!("Not authorized certifier");
    }
    if project.status != ProjectStatus::Verified {
      panic!("Project must be verified before certification");
    }

    let escrow_contract: Address = env
      .storage()
      .instance()
      .get(&DataKey::EscrowContract)
      .unwrap();

    if passed {
      project.status = ProjectStatus::Certified;

      // Make a cross-contract call to the Escrow contract to release payment to the developer
      env.invoke_contract::<()>(
        &escrow_contract,
        &Symbol::new(&env, "release_payment"),
        (project_id, project.developer.clone(), project.amount).into_val(&env),
      );
      env.events().publish(("project", "certification_passed"), project_id);
    } else {
      project.status = ProjectStatus::Rejected;
      env.events().publish(("project", "certification_failed"), project_id);
    }

    env.storage()
      .instance()
      .set(&DataKey::Project(project_id), &project);
  }

  /// Buyer requests refund for failed/disputed projects.
  pub fn refund_project(env: Env, sponsor: Address, project_id: u64) {
    sponsor.require_auth();

    let mut project: Project = env
      .storage()
      .instance()
      .get(&DataKey::Project(project_id))
      .unwrap();

    if project.sponsor != sponsor {
      panic!("Not authorized sponsor");
    }
    if project.status != ProjectStatus::Rejected {
      panic!("Refund only allowed if project certification failed");
    }

    let escrow_contract: Address = env
      .storage()
      .instance()
      .get(&DataKey::EscrowContract)
      .unwrap();

    project.status = ProjectStatus::Refunded;
    env.storage()
      .instance()
      .set(&DataKey::Project(project_id), &project);

    // Call escrow to return funds to sponsor
    env.invoke_contract::<()>(
      &escrow_contract,
      &Symbol::new(&env, "refund_payment"),
      (project_id, sponsor.clone()).into_val(&env),
    );

    env.events().publish(("project", "refunded"), project_id);
  }

  /* ─── Read functions ─── */

  pub fn get_project(env: Env, project_id: u64) -> Project {
    env.storage()
      .instance()
      .get(&DataKey::Project(project_id))
      .unwrap()
  }

  pub fn get_project_count(env: Env) -> u64 {
    env.storage()
      .instance()
      .get(&DataKey::ProjectCount)
      .unwrap_or(0)
  }
}

mod test;

