#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, IntoVal, Symbol};

/* ─── Storage keys ─── */

#[contracttype]
pub enum DataKey {
  RegistryContract,
  Escrow(u64),
  TotalEscrowed,
}

/* ─── Types ─── */

#[contracttype]
#[derive(Clone)]
pub struct EscrowDeposit {
  pub project_id: u64,
  pub sponsor: Address,
  pub amount: i128,
  pub is_active: bool,
}

/* ─── Contract ─── */

#[contract]
pub struct EscrowContract;

#[contractimpl]
impl EscrowContract {
  /// Initialize with the authorized order manager contract address.
  pub fn initialize(env: Env, registry_contract: Address) {
    env.storage()
      .instance()
      .set(&DataKey::RegistryContract, &registry_contract);
    env.storage()
      .instance()
      .set(&DataKey::TotalEscrowed, &0i128);
    env.events().publish(("escrow", "initialized"), true);
  }

  /// Buyer deposits funds into the escrow vault for an order.
  pub fn deposit(env: Env, sponsor: Address, project_id: u64, amount: i128) {
    sponsor.require_auth();

    if amount <= 0 {
      panic!("Deposit amount must be greater than zero");
    }

    let deposit = EscrowDeposit {
      project_id,
      sponsor: sponsor.clone(),
      amount,
      is_active: true,
    };

    env.storage()
      .instance()
      .set(&DataKey::Escrow(project_id), &deposit);

    let total: i128 = env
      .storage()
      .instance()
      .get(&DataKey::TotalEscrowed)
      .unwrap_or(0);
    env.storage()
      .instance()
      .set(&DataKey::TotalEscrowed, &(total + amount));

    env.events()
      .publish(("escrow", "deposited"), (project_id, amount));

    // Call registry_contract to mark the order as funded
    let registry_contract: Address = env
      .storage()
      .instance()
      .get(&DataKey::RegistryContract)
      .unwrap();

    env.invoke_contract::<()>(
      &registry_contract,
      &Symbol::new(&env, "mark_funded"),
      (project_id,).into_val(&env),
    );
  }

  /// Release escrowed payment to developer.
  /// Must only be called by the Order Contract.
  pub fn release_payment(env: Env, project_id: u64, developer: Address, amount: i128) {
    let registry_contract: Address = env
      .storage()
      .instance()
      .get(&DataKey::RegistryContract)
      .unwrap();

    // Enforce that only the Order Contract can trigger releases
    registry_contract.require_auth();

    let mut deposit: EscrowDeposit = env
      .storage()
      .instance()
      .get(&DataKey::Escrow(project_id))
      .unwrap();

    if !deposit.is_active {
      panic!("Escrow is not active");
    }

    if amount > deposit.amount {
      panic!("Release amount exceeds escrowed balance");
    }

    deposit.is_active = false;
    env.storage()
      .instance()
      .set(&DataKey::Escrow(project_id), &deposit);

    let total: i128 = env
      .storage()
      .instance()
      .get(&DataKey::TotalEscrowed)
      .unwrap_or(0);
    let new_total = if total >= amount { total - amount } else { 0 };
    env.storage()
      .instance()
      .set(&DataKey::TotalEscrowed, &new_total);

    env.events()
      .publish(("escrow", "released"), (project_id, developer, amount));
  }

  /// Refund remaining escrow to sponsor (for cancelled/failed orders).
  /// Must only be called by the Order Contract.
  pub fn refund_payment(env: Env, project_id: u64, sponsor: Address) {
    let registry_contract: Address = env
      .storage()
      .instance()
      .get(&DataKey::RegistryContract)
      .unwrap();

    registry_contract.require_auth();

    let mut deposit: EscrowDeposit = env
      .storage()
      .instance()
      .get(&DataKey::Escrow(project_id))
      .unwrap();

    if !deposit.is_active {
      panic!("Escrow is not active");
    }

    let refund_amount = deposit.amount;
    deposit.is_active = false;

    env.storage()
      .instance()
      .set(&DataKey::Escrow(project_id), &deposit);

    let total: i128 = env
      .storage()
      .instance()
      .get(&DataKey::TotalEscrowed)
      .unwrap_or(0);
    let new_total = if total >= refund_amount { total - refund_amount } else { 0 };
    env.storage()
      .instance()
      .set(&DataKey::TotalEscrowed, &new_total);

    env.events()
      .publish(("escrow", "refunded"), (project_id, sponsor, refund_amount));
  }

  /* ─── Read functions ─── */

  pub fn get_escrow(env: Env, project_id: u64) -> EscrowDeposit {
    env.storage()
      .instance()
      .get(&DataKey::Escrow(project_id))
      .unwrap()
  }

  pub fn get_total_escrowed(env: Env) -> i128 {
    env.storage()
      .instance()
      .get(&DataKey::TotalEscrowed)
      .unwrap_or(0)
  }
}

mod test;

