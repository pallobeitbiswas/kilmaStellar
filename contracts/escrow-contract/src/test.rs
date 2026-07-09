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

  let registry_contract = Address::generate(&env);
  client.initialize(&registry_contract);

  (env, contract_id, registry_contract)
}

#[test]
fn test_deposit() {
  let (env, contract_id, _registry_contract) = setup_env();
  let client = EscrowContractClient::new(&env, &contract_id);
  let sponsor = Address::generate(&env);

  let real_dummy_id = env.register(DummyRegistryContract, ());
  // Re-initialize client with the real mock contract ID to prevent invoke errors
  client.initialize(&real_dummy_id);

  client.deposit(&sponsor, &1, &1000_0000000);

  let deposit = client.get_escrow(&1);
  assert_eq!(deposit.amount, 1000_0000000);
  assert!(deposit.is_active);
  assert_eq!(client.get_total_escrowed(), 1000_0000000);
}

