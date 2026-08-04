#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env};

#[contract]
struct DummyRegistryContract;

#[contractimpl]
impl DummyRegistryContract {
  pub fn mark_funded(_env: Env, _project_id: u64) {}
}

fn setup_env() -> (Env, Address, Address) {
  let env = Env::default();
  env.mock_all_auths();

  let contract_id = env.register(EscrowContract, ());
  let client = EscrowContractClient::new(&env, &contract_id);

  let dummy_registry = env.register(DummyRegistryContract, ());
  client.initialize(&dummy_registry);

  (env, contract_id, dummy_registry)
}

#[test]
fn test_deposit() {
  let (env, contract_id, _) = setup_env();
  let client = EscrowContractClient::new(&env, &contract_id);
  let sponsor = Address::generate(&env);

  client.deposit(&sponsor, &1, &1000_0000000);

  let deposit = client.get_escrow(&1);
  assert_eq!(deposit.amount, 1000_0000000);
  assert!(deposit.is_active);
  assert_eq!(client.get_total_escrowed(), 1000_0000000);
}

#[test]
fn test_multiple_deposits_accumulate_total() {
  let (env, contract_id, _) = setup_env();
  let client = EscrowContractClient::new(&env, &contract_id);

  let sponsor_a = Address::generate(&env);
  let sponsor_b = Address::generate(&env);

  client.deposit(&sponsor_a, &1, &500_0000000);
  client.deposit(&sponsor_b, &2, &300_0000000);

  assert_eq!(client.get_total_escrowed(), 800_0000000);
}

#[test]
#[should_panic(expected = "Deposit amount must be greater than zero")]
fn test_zero_amount_deposit_rejected() {
  let (env, contract_id, _) = setup_env();
  let client = EscrowContractClient::new(&env, &contract_id);
  let sponsor = Address::generate(&env);

  client.deposit(&sponsor, &1, &0);
}

#[test]
#[should_panic(expected = "Deposit amount must be greater than zero")]
fn test_negative_amount_deposit_rejected() {
  let (env, contract_id, _) = setup_env();
  let client = EscrowContractClient::new(&env, &contract_id);
  let sponsor = Address::generate(&env);

  client.deposit(&sponsor, &1, &-100_0000000);
}

#[test]
#[should_panic(expected = "Escrow is not active")]
fn test_double_release_rejected() {
  let (env, contract_id, _) = setup_env();
  let client = EscrowContractClient::new(&env, &contract_id);
  let sponsor = Address::generate(&env);
  let developer = Address::generate(&env);

  client.deposit(&sponsor, &1, &1000_0000000);
  client.release_payment(&1, &developer, &1000_0000000);
  // Second release must fail
  client.release_payment(&1, &developer, &1000_0000000);
}

#[test]
#[should_panic(expected = "Release amount exceeds escrowed balance")]
fn test_over_release_rejected() {
  let (env, contract_id, _) = setup_env();
  let client = EscrowContractClient::new(&env, &contract_id);
  let sponsor = Address::generate(&env);
  let developer = Address::generate(&env);

  client.deposit(&sponsor, &1, &500_0000000);
  client.release_payment(&1, &developer, &1000_0000000);
}

#[test]
fn test_refund_payment() {
  let (env, contract_id, _) = setup_env();
  let client = EscrowContractClient::new(&env, &contract_id);
  let sponsor = Address::generate(&env);

  client.deposit(&sponsor, &1, &750_0000000);
  assert_eq!(client.get_total_escrowed(), 750_0000000);

  client.refund_payment(&1, &sponsor);

  let deposit = client.get_escrow(&1);
  assert!(!deposit.is_active);
  assert_eq!(client.get_total_escrowed(), 0);
}
