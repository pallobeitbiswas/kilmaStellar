$escrow_wasm = "contracts/escrow-contract/target/wasm32v1-none/release/escrow_contract.wasm"
$registry_wasm = "contracts/registry-contract/target/wasm32v1-none/release/project_contract.wasm"
$finance_wasm = "contracts/finance-contract/target/wasm32v1-none/release/finance_contract.wasm"

Write-Host "Deploying Escrow..."
$escrow_id = stellar contract deploy --wasm $escrow_wasm --source freighter_acc --network testnet
Write-Host "ESCROW_ID=$escrow_id"

Write-Host "Deploying Registry..."
$registry_id = stellar contract deploy --wasm $registry_wasm --source freighter_acc --network testnet
Write-Host "REGISTRY_ID=$registry_id"

Write-Host "Deploying Finance..."
$finance_id = stellar contract deploy --wasm $finance_wasm --source freighter_acc --network testnet
Write-Host "FINANCE_ID=$finance_id"

Write-Host "Initializing Registry..."
stellar contract invoke --id $registry_id --source freighter_acc --network testnet -- initialize --escrow_contract $escrow_id

Write-Host "Initializing Escrow..."
stellar contract invoke --id $escrow_id --source freighter_acc --network testnet -- initialize --registry_contract $registry_id

# Update .env
Set-Content -Path .env -Value "VITE_STELLAR_RPC_URL=https://soroban-testnet.stellar.org`nVITE_ESCROW_CONTRACT_ID=$escrow_id`nVITE_PROJECT_CONTRACT_ID=$registry_id`nVITE_FINANCE_CONTRACT_ID=$finance_id"

# Update .env.example
Set-Content -Path .env.example -Value "VITE_STELLAR_RPC_URL=https://soroban-testnet.stellar.org`nVITE_ESCROW_CONTRACT_ID=$escrow_id`nVITE_PROJECT_CONTRACT_ID=$registry_id`nVITE_FINANCE_CONTRACT_ID=$finance_id"

# Read README.md and replace placeholders
$readme = Get-Content -Raw README.md
# We know they are placeholder text in the markdown table
$readme = $readme -replace '\| \*\*Escrow Contract\*\* \| `<WILL_BE_UPDATED_AFTER_DEPLOY>` \|', "| **Escrow Contract** | `$escrow_id` |"
$readme = $readme -replace '\| \*\*Registry Contract\*\* \| `<WILL_BE_UPDATED_AFTER_DEPLOY>` \|', "| **Registry Contract** | `$registry_id` |"
$readme = $readme -replace '\| \*\*Finance Contract\*\* \| `<WILL_BE_UPDATED_AFTER_DEPLOY>` \|', "| **Finance Contract** | `$finance_id` |"
Set-Content -Path README.md -Value $readme

Write-Host "Deployment Complete. Env updated. README updated."


git add .
git commit -m "chore: prepare Level 4 submission - production ready MVP"
git push
