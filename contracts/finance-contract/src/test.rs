#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env};

fn setup_env() -> (Env, Address) {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(FinanceContract, ());
    let client = FinanceContractClient::new(&env, &contract_id);
    client.initialize(&10000_0000000);

    (env, contract_id)
}

#[test]
fn test_loan_request() {
    let (env, contract_id) = setup_env();
    let client = FinanceContractClient::new(&env, &contract_id);

    let supplier = Address::generate(&env);
    let order_id = 42u64;
    let loan_amount = 1000_0000000;

    let loan_id = client.request_loan(&supplier, &order_id, &loan_amount);

    assert_eq!(loan_id, 1);
    assert_eq!(client.get_loan_count(), 1);

    let loan = client.get_loan(&loan_id);
    assert_eq!(loan.borrower, supplier);
    assert_eq!(loan.order_id, order_id);
    assert_eq!(loan.principal, loan_amount);
    assert_eq!(loan.interest, 50_0000000); // 5% of 1000
    assert!(!loan.repaid);

    assert_eq!(client.get_pool_balance(), 9000_0000000);
}

#[test]
fn test_loan_repayment() {
    let (env, contract_id) = setup_env();
    let client = FinanceContractClient::new(&env, &contract_id);

    let supplier = Address::generate(&env);
    let loan_id = client.request_loan(&supplier, &42u64, &1000_0000000);

    client.repay_loan(&supplier, &loan_id);

    let loan = client.get_loan(&loan_id);
    assert!(loan.repaid);

    // 10k - 1k loan + 1.05k repayment = 10.05k
    assert_eq!(client.get_pool_balance(), 10050_0000000);
}

#[test]
#[should_panic(expected = "Insufficient pool liquidity")]
fn test_insufficient_liquidity() {
    let (env, contract_id) = setup_env();
    let client = FinanceContractClient::new(&env, &contract_id);

    let supplier = Address::generate(&env);
    client.request_loan(&supplier, &1u64, &20000_0000000);
}

#[test]
#[should_panic(expected = "Loan already repaid")]
fn test_double_repay_rejected() {
    let (env, contract_id) = setup_env();
    let client = FinanceContractClient::new(&env, &contract_id);

    let supplier = Address::generate(&env);
    let loan_id = client.request_loan(&supplier, &1u64, &500_0000000);
    client.repay_loan(&supplier, &loan_id);
    // Second repay must fail
    client.repay_loan(&supplier, &loan_id);
}

#[test]
#[should_panic(expected = "Not authorized borrower")]
fn test_wrong_borrower_repay_rejected() {
    let (env, contract_id) = setup_env();
    let client = FinanceContractClient::new(&env, &contract_id);

    let borrower = Address::generate(&env);
    let impostor = Address::generate(&env);
    let loan_id = client.request_loan(&borrower, &1u64, &500_0000000);
    client.repay_loan(&impostor, &loan_id);
}

#[test]
fn test_get_finance_stats() {
    let (env, contract_id) = setup_env();
    let client = FinanceContractClient::new(&env, &contract_id);

    // Before any loans
    let stats = client.get_finance_stats();
    assert_eq!(stats.loan_count, 0);
    assert_eq!(stats.pool_balance, 10000_0000000);
    assert_eq!(stats.active_principal, 0);

    let supplier = Address::generate(&env);
    client.request_loan(&supplier, &1u64, &2000_0000000);
    client.request_loan(&supplier, &2u64, &1000_0000000);

    let stats2 = client.get_finance_stats();
    assert_eq!(stats2.loan_count, 2);
    assert_eq!(stats2.pool_balance, 7000_0000000);
    assert_eq!(stats2.active_principal, 3000_0000000);

    // Repay one loan — active_principal should drop
    client.repay_loan(&supplier, &1);
    let stats3 = client.get_finance_stats();
    assert_eq!(stats3.active_principal, 1000_0000000);
}

#[test]
fn test_multiple_loans_pool_drain() {
    let (env, contract_id) = setup_env();
    let client = FinanceContractClient::new(&env, &contract_id);

    let s1 = Address::generate(&env);
    let s2 = Address::generate(&env);
    let s3 = Address::generate(&env);

    client.request_loan(&s1, &1u64, &3000_0000000);
    client.request_loan(&s2, &2u64, &4000_0000000);
    client.request_loan(&s3, &3u64, &2000_0000000);

    // 10k - 9k = 1k remaining
    assert_eq!(client.get_pool_balance(), 1000_0000000);
    assert_eq!(client.get_loan_count(), 3);
}
