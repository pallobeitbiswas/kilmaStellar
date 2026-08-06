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
#[should_panic(expected = "Project amount must be greater than zero")]
fn test_zero_amount_project_rejected() {
  let (env, contract_id, _) = setup_env();
  let client = RegistryContractClient::new(&env, &contract_id);

  let sponsor = Address::generate(&env);
  let developer = Address::generate(&env);
  let auditor = Address::generate(&env);
  let certifier = Address::generate(&env);

  client.create_project(&sponsor, &developer, &auditor, &certifier, &0);
}

#[test]
#[should_panic(expected = "Project amount must be greater than zero")]
fn test_negative_amount_project_rejected() {
  let (env, contract_id, _) = setup_env();
  let client = RegistryContractClient::new(&env, &contract_id);

  let sponsor = Address::generate(&env);
  let developer = Address::generate(&env);
  let auditor = Address::generate(&env);
  let certifier = Address::generate(&env);

  client.create_project(&sponsor, &developer, &auditor, &certifier, &-500_0000000);
}

#[test]
fn test_project_lifecycle() {
  let (env, contract_id, _escrow_contract) = setup_env();
  let client = RegistryContractClient::new(&env, &contract_id);

  let sponsor = Address::generate(&env);
  let developer = Address::generate(&env);
  let auditor = Address::generate(&env);
  let certifier = Address::generate(&env);

  let project_id = client.create_project(&sponsor, &developer, &auditor, &certifier, &500_0000000);

  client.mark_funded(&project_id);
  assert_eq!(client.get_project(&1).status, ProjectStatus::Funded);

  client.submit_audit(&auditor, &project_id);
  assert_eq!(client.get_project(&1).status, ProjectStatus::AuditSubmitted);

  client.verify_impact(&auditor, &project_id);
  assert_eq!(client.get_project(&1).status, ProjectStatus::Verified);

  client.certify_impact(&certifier, &project_id, &true);
  assert_eq!(client.get_project(&1).status, ProjectStatus::Certified);
}

#[test]
fn test_project_lifecycle_rejected_and_refunded() {
  let (env, contract_id, _) = setup_env();
  let client = RegistryContractClient::new(&env, &contract_id);

  let sponsor = Address::generate(&env);
  let developer = Address::generate(&env);
  let auditor = Address::generate(&env);
  let certifier = Address::generate(&env);

  let project_id = client.create_project(&sponsor, &developer, &auditor, &certifier, &200_0000000);

  client.mark_funded(&project_id);
  client.submit_audit(&auditor, &project_id);
  client.verify_impact(&auditor, &project_id);

  // Certifier rejects
  client.certify_impact(&certifier, &project_id, &false);
  assert_eq!(client.get_project(&1).status, ProjectStatus::Rejected);

  // Sponsor requests refund
  client.refund_project(&sponsor, &project_id);
  assert_eq!(client.get_project(&1).status, ProjectStatus::Refunded);
}

#[test]
#[should_panic(expected = "Project cannot be funded in this state")]
fn test_double_funding_rejected() {
  let (env, contract_id, _) = setup_env();
  let client = RegistryContractClient::new(&env, &contract_id);

  let sponsor = Address::generate(&env);
  let developer = Address::generate(&env);
  let auditor = Address::generate(&env);
  let certifier = Address::generate(&env);

  let project_id = client.create_project(&sponsor, &developer, &auditor, &certifier, &100_0000000);
  client.mark_funded(&project_id);
  // Try to fund again — must fail
  client.mark_funded(&project_id);
}

#[test]
#[should_panic(expected = "Not authorized auditor")]
fn test_wrong_auditor_rejected() {
  let (env, contract_id, _) = setup_env();
  let client = RegistryContractClient::new(&env, &contract_id);

  let sponsor = Address::generate(&env);
  let developer = Address::generate(&env);
  let auditor = Address::generate(&env);
  let certifier = Address::generate(&env);
  let impostor = Address::generate(&env);

  let project_id = client.create_project(&sponsor, &developer, &auditor, &certifier, &100_0000000);
  client.mark_funded(&project_id);
  client.submit_audit(&impostor, &project_id);
}
