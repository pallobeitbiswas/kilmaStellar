#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env};

#[contract]
struct DummyEscrowContract;

#[contractimpl]
impl DummyEscrowContract {
  pub fn release_payment(_env: Env, _project_id: u64, _developer: Address, _amount: i128) {}
  pub fn refund_payment(_env: Env, _project_id: u64, _sponsor: Address) {}
}

fn setup_env() -> (Env, Address, Address) {
  let env = Env::default();
  env.mock_all_auths();

  let contract_id = env.register(RegistryContract, ());
  let client = RegistryContractClient::new(&env, &contract_id);

  let escrow_contract = env.register(DummyEscrowContract, ());
  client.initialize(&escrow_contract);

  (env, contract_id, escrow_contract)
}

#[test]
fn test_create_project() {
  let (env, contract_id, _) = setup_env();
  let client = RegistryContractClient::new(&env, &contract_id);

  let sponsor = Address::generate(&env);
  let developer = Address::generate(&env);
  let auditor = Address::generate(&env);
  let certifier = Address::generate(&env);

  let project_id = client.create_project(&sponsor, &developer, &auditor, &certifier, &1000_0000000);
  assert_eq!(project_id, 1);
  assert_eq!(client.get_project_count(), 1);

  let project = client.get_project(&1);
  assert_eq!(project.amount, 1000_0000000);
  assert_eq!(project.status, ProjectStatus::Proposed);
}

#[test]
fn test_project_lifecycle() {
  let (env, contract_id, escrow_contract) = setup_env();
  let client = RegistryContractClient::new(&env, &contract_id);

  let sponsor = Address::generate(&env);
  let developer = Address::generate(&env);
  let auditor = Address::generate(&env);
  let certifier = Address::generate(&env);

  let project_id = client.create_project(&sponsor, &developer, &auditor, &certifier, &500_0000000);

  // Escrow contract marks project as funded
  // Since we set up mock_all_auths, we can make the call acting as escrow_contract
  client.mark_funded(&project_id);
  assert_eq!(client.get_project(&1).status, ProjectStatus::Funded);

  // Submit Audit
  client.submit_audit(&auditor, &project_id);
  assert_eq!(client.get_project(&1).status, ProjectStatus::AuditSubmitted);

  // Verify Impact
  client.verify_impact(&auditor, &project_id);
  assert_eq!(client.get_project(&1).status, ProjectStatus::Verified);

  // Certify Impact - Passed
  client.certify_impact(&certifier, &project_id, &true);
  assert_eq!(client.get_project(&1).status, ProjectStatus::Certified);
}
