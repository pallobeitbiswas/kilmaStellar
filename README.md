# KlimaStellar - Level 4 Green Belt Submission

<div align="center">

**A Decentralized Carbon Credit Financing and Certification Platform on Stellar Soroban**

*Trustless milestone payments secured by Stellar Soroban smart contracts*

[Live Demo](https://kilmastellar.netlify.app/) | [GitHub Repository](https://github.com/pallobeitbiswas/kilmaStellar) | [Stellar Testnet](https://stellar.expert/explorer/testnet)

</div>

---

## Level 4 Submission Details

This repository represents the **Level 4 - Green Belt Submission** for KlimaStellar. We have transitioned from a prototype to a fully functioning Production-Ready MVP, featuring real-world user onboarding, telemetry analytics, comprehensive security, and an optimized mobile-responsive UI.

### Submission Links & Resources

* **Public GitHub repository:** [pallobeitbiswas/kilmaStellar](https://github.com/pallobeitbiswas/kilmaStellar)
* **Live Demo:** [kilmastellar.netlify.app](https://kilmastellar.netlify.app/)
* **Demo Video Link:** [KlimaStellar Walkthrough Video](https://drive.google.com/file/d/1E25MJktSx6k1TUxYrS5G2Mlyz5zYGK38/view?usp=sharing)
* **User Feedback Form:** [Google Form](https://forms.gle/ycjbHLoHtDEbCPae7)
* **User Feedback Summary:** [Feedback Spreadsheet](https://docs.google.com/spreadsheets/d/1pa6eI2xtrHb18iaxO_5Y8OsgNyvc3G3H8Df7_Wh9CA4/edit?usp=sharing)

### Submission Screenshots

| Product UI | Mobile Responsive Design | Project & Wallet UI | CI/CD Pipeline |
|------------|--------------------------|---------------------|----------------|
| <img src="assets/ui1.png" width="200" /> | <img src="assets/mobile-ui.png" width="200" /> | <img src="assets/ui2.png" width="200" /> | <img src="assets/ci-pipeline.png" width="200" /> |

---

## Table of Contents

1. [Problem Statement](#problem-statement)
2. [Why Stellar?](#why-stellar)
3. [Contract Addresses and Transactions](#contract-addresses-and-transactions)
4. [Architecture](#architecture)
5. [Smart Contracts](#smart-contracts)
6. [Tech Stack](#tech-stack)
7. [Project Structure](#project-structure)
8. [Testing](#testing)
9. [CI/CD Pipeline](#cicd-pipeline)
10. [Local Development](#local-development)
11. [Roadmap](#roadmap)
12. [Author](#author)

---

## Problem Statement

The **$2 trillion voluntary carbon market** is plagued by opacity, fraud, and settlement friction that systematically undermines climate action.

| Issue | Impact |
|-------|--------|
| **Verification Fraud** | Carbon credits are routinely sold without independent environmental verification, inflating offsets. |
| **Payment Risk** | Developers in emerging markets receive payment months after project delivery with no contractual guarantee. |
| **Opaque Certification** | Certification bodies operate off-chain with no auditable trail, enabling double-counting of credits. |
| **Intermediary Costs** | Brokers and registrars extract 15-30% of project value, directly reducing capital available for climate work. |

**KlimaStellar** eliminates the intermediary layer entirely by encoding the full carbon credit lifecycle - proposal, funding, audit, verification, and certification - into programmable, auditable Soroban smart contracts. Sponsors deposit funds into an on-chain escrow vault before work begins; funds are automatically released to the developer only after the on-chain certification process completes - no brokers, no payment delays, no trust required.

---

## Why Stellar?

KlimaStellar is not a generic blockchain application. It is a protocol that specifically requires Stellar's unique network architecture:

| Stellar Property | KlimaStellar Benefit |
|-----------------|---------------------|
| **~5 second finality** | Developers receive payouts immediately after certification is confirmed on-chain. |
| **Sub-cent fees ($0.00001)** | Enables micro-project financing for small-scale community climate initiatives economically unviable on Ethereum. |
| **Soroban Inter-Contract Calls** | The Registry Contract securely commands the Escrow Contract atomically on-chain - no frontend can manipulate funds independently. |
| **SEP Anchor Integrations** | Future fiat on/off-ramp support allows non-crypto-native developers in emerging markets to receive local currency. |
| **Transparent Ledger** | Every status transition - funded, audited, verified, certified - is permanently recorded and publicly auditable. |

---

## Contract Addresses and Transactions

All contracts are deployed and cross-initialized on the **Stellar Testnet** using the `klimastellar` developer identity.

### Deployed Contract IDs

| Contract | Address |
|----------|---------|
| **Escrow Contract** | [`CCZF...RWJR`](https://stellar.expert/explorer/testnet/contract/CCZF6MULITDHTGCHHD7MP66HHWTWTK7YC2F425NYHNWDTHHGIAF6RWJR) |
| **Registry Contract** | [`CCHZ...YGL7`](https://stellar.expert/explorer/testnet/contract/CCHZI3R7KCYM7EM4R26Y6VHMDPOIDEUI75DCOBK4GYC53XUGSLOOYGL7) |
| **Finance Contract** | [`CDJ3...7P5G`](https://stellar.expert/explorer/testnet/contract/CDJ3P4RSHWJOKRGIYCE37FJTFHTEMXD3PX3URFRMPNQWMNGETBRL7P5G) |

### On-Chain Transactions

| Action | Transaction Hash |
|--------|-----------------|
| **Registry Contract - Create Project** | [`e82244c9...8f16b4`](https://stellar.expert/explorer/testnet/tx/e82244c948d6f6216eff5ba3d8fd2f09a87cabaccbd4bb51675f284a998f16b4) |
| **Finance Contract - Request Loan** | [`92864210...e5218f`](https://stellar.expert/explorer/testnet/tx/928642103a45a39b8b2d1283708d7f6180ca7fbb0b5cf6429a78fc24b3e5218f) |

---

## Architecture

KlimaStellar is composed of three isolated Soroban smart contracts communicating via secure Inter-Contract Calls (ICC), and a React/Vite frontend that builds and submits signed transactions.

```
+---------------------------------------------------------------------+
|                        React + Vite Frontend                        |
|                                                                     |
|  Dashboard  |  Analytics  |  Sponsor  |  Developer  |  Financing    |
|                      StellarWalletsKit                              |
+------------------+----------------------------+---------------------+
                   |  TypeScript Contract Clients  |
          +--------v-----------+       +----------v---------+
          |  Registry Contract |--ICC->|  Escrow Contract   |
          |  (Project Lifecycle)|      |  (Payment Vault)   |
          +--------------------+       +--------------------+
          |  Finance Contract  |       (Inter-Contract Comm)
          |  (Loan Pool/Stats) |
          +--------------------+
                            Stellar Testnet
```

### Inter-Contract Communication (ICC) Flow

The ICC design is the architectural centrepiece of KlimaStellar. All escrow state changes are triggered atomically by the Registry Contract - there is no way for the frontend to manipulate escrow funds directly.

```
Step 1:  Sponsor calls create_project()     -> Project created, status: Proposed
Step 2:  Sponsor calls deposit() on Escrow  -> Escrow locks funds
                                               Escrow ICCs -> Registry mark_funded()
                                               Project status: Funded (atomic)
Step 3:  Auditor calls submit_audit()       -> Project status: AuditSubmitted
Step 4:  Auditor calls verify_impact()      -> Project status: Verified
Step 5a: Certifier calls certify_impact()   -> (passed = true)
         [PASS]                                Registry ICCs -> Escrow release_payment()
                                               Developer receives funds instantly
                                               Project status: Certified
Step 5b: Certifier calls certify_impact()   -> (passed = false)
         [FAIL]                                Project status: Rejected
Step 6:  Sponsor calls refund_project()     -> Registry ICCs -> Escrow refund_payment()
         (only if Rejected)                    Sponsor receives full refund
```

---

## Smart Contracts

### Registry Contract

Manages the full lifecycle of every carbon credit project on-chain - from proposal to certification.

| Function | Access | Description |
|----------|--------|-------------|
| `initialize()` | Admin (once) | Set the cross-linked Escrow Contract address |
| `create_project()` | Sponsor | Register a new carbon project with developer, auditor, certifier, and target amount |
| `mark_funded()` | Escrow Contract only | Atomically marks project as Funded - auth-restricted ICC endpoint |
| `submit_audit()` | Designated Auditor | Log submission of the environmental audit report |
| `verify_impact()` | Designated Auditor | Confirm environmental impact after review |
| `certify_impact()` | Designated Certifier | Issue final pass/fail certification; pass triggers ICC payment release |
| `refund_project()` | Sponsor | Claim refund for rejected projects - triggers ICC refund from Escrow |
| `get_project()` | Public (read) | Query full project state by ID |
| `get_project_count()` | Public (read) | Query total number of registered projects |

### Escrow Contract

Holds sponsor funds in a secure vault and releases them only on instruction from the Registry Contract.

| Function | Access | Description |
|----------|--------|-------------|
| `initialize()` | Admin (once) | Set the cross-linked Registry Contract address |
| `deposit()` | Sponsor | Lock funds for a project and ICC-notify the Registry to mark it funded |
| `release_payment()` | Registry Contract only | Transfer escrowed amount to the developer wallet |
| `refund_payment()` | Registry Contract only | Return locked funds to the sponsor on project rejection |
| `get_escrow()` | Public (read) | Query the current escrow state for a project |
| `get_total_escrowed()` | Public (read) | Query the total funds currently held in the vault |

### Finance Contract

Provides micro-financing options and liquidity pools for verified projects.

| Function | Access | Description |
|----------|--------|-------------|
| `request_loan()` | Developer | Request a micro-loan backed by a verified project |
| `repay_loan()` | Developer | Repay the micro-loan and accrued interest |
| `get_finance_stats()` | Public (read) | Query aggregate liquidity and loan analytics |

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend Framework** | React 18 + Vite | Fast builds, hot module replacement, production bundling |
| **Language** | TypeScript | Full type safety across frontend and contract clients |
| **Styling** | Tailwind CSS | Utility-first CSS with dark mode support |
| **Animations** | Framer Motion | Micro-interactions and page transitions |
| **Smart Contracts** | Soroban (Rust) | On-chain registry and escrow logic |
| **Blockchain SDK** | @stellar/stellar-sdk | Transaction building, XDR encoding, RPC calls |
| **Wallet Integration** | StellarWalletsKit | Freighter, xBull, and Albedo multi-wallet support |
| **Frontend Testing** | Vitest + Testing Library | Unit and component tests |
| **Contract Testing** | soroban-sdk testutils | Rust contract simulation and mock ICC |
| **CI/CD** | GitHub Actions | Automated WASM build verification and frontend pipeline |
| **Hosting** | Netlify | Frontend production deployment |

---

## Project Structure

```
KlimaStellar/
+-- .github/
|   +-- workflows/
|       +-- ci.yml                    # WASM build check + Frontend lint, test, and build
+-- __tests__/                        # Frontend test suite (Vitest)
+-- assets/                           # Submission screenshots
|   +-- ui1.png                       # Main dashboard UI
|   +-- ui2.png                       # Project and wallet UI
|   +-- ui3.png                       # Additional UI screen
|   +-- mobile-ui.png                 # Mobile responsive view
|   +-- ci-pipeline.png               # CI/CD pipeline running
|   +-- analytics.png                 # Telemetry and analytics dashboard
+-- contracts/
|   +-- escrow-contract/
|   |   +-- src/
|   |       +-- lib.rs                # Escrow vault contract
|   |       +-- test.rs               # Escrow unit tests
|   +-- registry-contract/
|   |   +-- src/
|   |       +-- lib.rs                # Carbon credit lifecycle contract
|   |       +-- test.rs               # Registry unit tests
|   +-- finance-contract/
|       +-- src/
|           +-- lib.rs                # Micro-financing pool contract
|           +-- test.rs               # Finance unit tests
+-- src/
|   +-- components/
|   |   +-- layout/
|   |   |   +-- Navbar.tsx            # Glassmorphism nav with wallet connect
|   |   |   +-- Footer.tsx            # Site footer
|   |   +-- ui/                       # Shared UI components
|   +-- hooks/                        # React hooks for Stellar integration
|   +-- lib/
|   |   +-- constants.ts              # Contract IDs, RPC URL, network passphrase
|   |   +-- stellar.ts                # StellarHelper - wallet, transactions, events
|   +-- pages/                        # Application routes and views
+-- .env.example                      # Environment variable template
+-- vite.config.ts                    # Vite build configuration
+-- tailwind.config.js                # Tailwind CSS configuration
```

---

## Testing

### Test Summary

| Suite | Tests | Status |
|-------|-------|--------|
| Escrow Contract (Rust) | 1 test | Passing |
| Registry Contract (Rust) | 2 tests | Passing |
| Finance Contract (Rust) | 2 tests | Passing |
| Frontend (Vitest) | 3+ tests | Passing |
| **Total** | **8+ tests** | **All Passing** |

### Contract Tests (Rust)

```bash
# Registry Contract
cd contracts/registry-contract
cargo test

# Escrow Contract
cd contracts/escrow-contract
cargo test

# Finance Contract
cd contracts/finance-contract
cargo test
```

### Frontend Tests (Vitest)

```bash
npm run test
```

---

## CI/CD Pipeline

Triggered automatically on every push and pull request to `main`.

```
Push to main
     |
     +-- Frontend Job
     |     +-- npm install
     |     +-- npm run test       <- Vitest frontend tests
     |     +-- npm run build      <- Vite production build
     |
     +-- Contract Job
           +-- cargo build --target wasm32-unknown-unknown --release (escrow)
           +-- cargo build --target wasm32-unknown-unknown --release (registry)
           +-- cargo build --target wasm32-unknown-unknown --release (finance)
```

The contract job uses `cargo build` targeting WASM rather than `cargo test` to ensure complete compilation verification - producing the exact artifact that gets deployed to the network.

---

## Local Development

### Prerequisites

- Node.js 22+
- Rust (stable toolchain)
- Stellar CLI - `cargo install stellar-cli --locked`
- Freighter Wallet browser extension

### Installation

```bash
# Clone the repository
git clone https://github.com/pallobeitbiswas/kilmaStellar.git
cd kilmaStellar

# Install frontend dependencies
npm install

# Configure environment variables
cp .env.example .env.local
```

Edit `.env.local` with your contract IDs:

```env
VITE_STELLAR_RPC_URL=https://soroban-testnet.stellar.org
VITE_ESCROW_CONTRACT_ID=CCZF6MULITDHTGCHHD7MP66HHWTWTK7YC2F425NYHNWDTHHGIAF6RWJR
VITE_PROJECT_CONTRACT_ID=CCHZI3R7KCYM7EM4R26Y6VHMDPOIDEUI75DCOBK4GYC53XUGSLOOYGL7
VITE_FINANCE_CONTRACT_ID=CDJ3P4RSHWJOKRGIYCE37FJTFHTEMXD3PX3URFRMPNQWMNGETBRL7P5G
```

```bash
# Start development server
npm run dev
# -> http://localhost:5173
```

---

## Roadmap

### Level 2 - Yellow Belt (Complete)
- Soroban smart contract structure with custom DAO governance logic
- Wallet connection via StellarWalletsKit
- Deployed contract IDs on Stellar Testnet

### Level 3 - Orange Belt (Complete)
- Dual Soroban smart contracts with Inter-Contract Communication
- React 18 + Vite frontend with multi-wallet support
- Full carbon credit lifecycle on-chain: proposal, funding, audit, verification, certification
- Real-time contract event handling and state synchronization

### Level 4 - Green Belt (Complete)
- Contract security hardening - initialization guards, typed error enums, TTL extension
- Finance contract introduced for micro-loan tracking
- Telemetry analytics pipeline built into frontend
- Frontend production quality - error boundaries, loading skeletons, confirmation modals
- User onboarding with real Testnet wallet interactions and feedback collection

### Level 5 - Mainnet (Planned)
- On-chain Reputation Contract for sponsors and developers
- Third-party security audit of all Soroban contracts
- Mainnet deployment of hardened contracts
- SEP-24/SEP-31 fiat on/off-ramp integration for non-crypto-native users in emerging markets
- Public launch

---

## Author

**Pallob Eitbiswas** - [@pallobeitbiswas](https://github.com/pallobeitbiswas)

*Built for the [RiseIn Stellar dApp Development Program](https://www.risein.com/)*
