# Architecture Migration: Facinet → Standard Web3 Stack

## Overview

The ChainAgent has been migrated from a Facinet-SDK based architecture to a standard Web3 stack using ethers.js, OpenZeppelin contracts, and direct smart contract interactions.

## Why This Change?

### Facinet Architecture Issues
- ❌ Vendor lock-in specific to Facinet ecosystem
- ❌ Limited to x402 payment abstraction layer
- ❌ Opaque facilitator management and reputation system
- ❌ Not compatible with standard Web3 development tools
- ❌ Facinet SDK documentation and support deprecated

### Standard Web3 Stack Benefits
- ✅ Industry-standard tools used across Web3
- ✅ Full transparency and control over smart contracts
- ✅ OpenZeppelin battle-tested contract libraries
- ✅ Ethers.js widely supported with excellent documentation
- ✅ Easy to audit, verify, and deploy contracts
- ✅ Chainlink Functions for automated verification (optional future enhancement)

---

## Feature Replacement Mapping

| **Facinet Feature** | **Replace With** | **Implementation** |
|---|---|---|
| `facinet.pay()` | ethers.js `transfer()` | Direct ERC20 USDC transfer |
| `facinet.executeContract()` | ethers.js contract calls | Standard ethers Contract ABI calls |
| x402 payment abstraction | Smart contract escrow | ERC20 approval + transfer pattern |
| Facilitator network | Direct wallet transactions | Agent wallet handles all operations |
| Gasless operations | Smart contract-based | Traditional gas fees (can optimize later) |
| AI arbitration via x402 | LLM + smart contract logic | Agent makes decisions, contracts enforce |

---

## Key Files Changed

### 1. **package.json** ✏️
**Removed:**
```json
"facinet-sdk": "^1.0.0"
```

**Added:**
```json
"@openzeppelin/contracts": "^5.0.0"
```

---

### 2. **agent.js** ✏️

**Before:**
```javascript
import { Facinet } from 'facinet-sdk'
const facinet = new Facinet({ network: 'avalanche-fuji' })
await executeTool(toolName, toolInput, facinet)
```

**After:**
```javascript
// No Facinet import needed
await executeTool(toolName, toolInput) // No facinet param
```

**System Prompt Update:**
```diff
- send_usdc: send USDC to an address via Facinet (gasless)
- deploy_contract: deploy a contract (requires x402 payment via Facinet)
- get_facilitators: list active Facinet facilitators

+ send_usdc: send USDC to an address via direct smart contract transfer
+ deploy_contract: deploy escrow/NFT contract (requires USDC payment)
```

---

### 3. **executor.js** ✏️ (MAJOR REWRITE)

#### `wallet_balance`
**Before (Facinet):**
```javascript
// Mocked USDC balance
return { usdc: '10.00' }
```

**After (ethers.js):**
```javascript
const usdcContract = new ethers.Contract(CONTRACTS.usdc, ERC20_ABI, wallet.provider)
const balance = await usdcContract.balanceOf(address)
return { usdc: ethers.formatUnits(balance, 6) }
```

#### `send_usdc`
**Before (Facinet):**
```javascript
const result = await facinet.pay({
  amount: input.amount,
  recipient: input.recipient,
})
```

**After (ethers.js):**
```javascript
async function sendUSDC(recipient, amount) {
  const usdcContract = new ethers.Contract(CONTRACTS.usdc, ERC20_ABI, wallet)
  const amountWei = ethers.parseUnits(amount, 6)
  const tx = await usdcContract.transfer(recipient, amountWei)
  const receipt = await tx.wait()
  return { txHash: receipt.hash, success: true }
}
```

#### `mint_nft`
**Before (Facinet):**
```javascript
const result = await facinet.executeContract({
  contractAddress: CONTRACTS.nft,
  functionName: 'mint',
  abi: NFT_ABI,
  functionArgs: [input.recipient, metadataUri],
})
```

**After (ethers.js):**
```javascript
const nftContract = new ethers.Contract(CONTRACTS.nft, NFT_ABI, wallet)
const tx = await nftContract.mint(input.recipient, metadataUri)
const receipt = await tx.wait()
return { txHash: receipt.hash, success: true }
```

#### `deploy_contract`
**Before (Facinet):**
```javascript
const payment = await facinet.pay({
  amount: '0.10',
  recipient: process.env.TREASURY_WALLET,
})
```

**After (Standard Web3 - Payment + Deploy):**
```javascript
// Step 1: Check USDC balance
const balance = await getUSDCBalance(wallet.address)

// Step 2: Send payment via direct transfer
const paymentResult = await sendUSDC(treasuryWallet, DEPLOY_COST)

// Step 3: Deploy contract (stub - uses ethers.ContractFactory in production)
const factory = new ethers.ContractFactory(abi, bytecode, wallet)
const contract = await factory.deploy()
```

#### `lock_bounty`
**Before (Facinet):**
```javascript
const result = await facinet.executeContract({
  contractAddress: CONTRACTS.escrow,
  functionName: 'lockBounty',
  ...
})
```

**After (ethers.js with Approval):**
```javascript
// Step 1: Approve escrow contract to spend USDC
const approveResult = await approveUSDC(CONTRACTS.escrow, input.amount)

// Step 2: Call lockBounty with approval
const escrowContract = new ethers.Contract(CONTRACTS.escrow, ESCROW_ABI, wallet)
const tx = await escrowContract.lockBounty(taskId, amountWei, deadlineTs)
```

#### `release_bounty`
**Before (Facinet):**
```javascript
const result = await facinet.executeContract({
  contractAddress: CONTRACTS.escrow,
  functionName: 'releaseBounty',
  ...
})
```

**After (ethers.js):**
```javascript
const escrowContract = new ethers.Contract(CONTRACTS.escrow, ESCROW_ABI, wallet)
const tx = await escrowContract.releaseBounty(input.bounty_id, input.recipient)
```

#### `get_facilitators` ❌ REMOVED
- **Reason:** Facinet-specific feature no longer needed
- **Alternative:** Use Chainlink Functions for automated verification (optional, future enhancement)

---

### 4. **tools.js** ✏️

**Updated descriptions:**
```javascript
// send_usdc
description: 'Send USDC to a recipient address via direct smart contract transfer'

// mint_nft
description: 'Mint an NFT to a recipient address via smart contract (ERC721)'

// deploy_contract
description: 'Deploy a smart contract (escrow, nft, or bounty). Requires USDC payment for deployment.'
```

**Removed:**
```javascript
// get_facilitators tool - Facinet-specific, no longer needed
```

---

### 5. **New File: `contracts/BountyEscrow.sol`** 🆕

A reference OpenZeppelin-based escrow contract that includes:
- ERC20 USDC token integration
- Reentrancy guard protection
- Task-based bounty locking
- Deadline-based refunds
- Event logging

---

## Environment Configuration Updates

### New `.env` Variables Required

```env
# Before (Facinet)
FACINET_KEY=...

# After (Standard Web3)
USDC_CONTRACT=0xYourUSDCTokenAddressOnTestnet
NFT_CONTRACT=0xYourNFTContractAddress
ESCROW_CONTRACT=0xYourEscrowContractAddress
```

### Deprecated `.env` Variables

```env
# No longer used
FACINET_KEY=...   # ❌ Remove
```

---

## Smart Contract ABI Changes

### New ERC20 ABI (for USDC)
```javascript
const ERC20_ABI = [
  'function balanceOf(address account) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function decimals() view returns (uint8)',
]
```

### New Escrow ABI (OpenZeppelin-compatible)
```javascript
const ESCROW_ABI = [
  'function lockBounty(string memory taskId, uint256 amount, uint256 deadline) returns (bytes32)',
  'function releaseBounty(bytes32 bountyId, address recipient) returns (bool)',
  'function refundBounty(bytes32 bountyId) returns (bool)',
  'function getBounty(bytes32 bountyId) view returns (tuple(address poster, uint256 amount, bool released, uint256 deadline))',
]
```

---

## Payment Model Changes

### Old Model (Facinet x402)
```
User Request
    ↓
Agent decides action
    ↓
Facinet x402 Gateway (abstracted payment)
    ↓
Blockchain Transaction
```

### New Model (Direct USDC)
```
User Request
    ↓
Agent decides action
    ↓
Agent approves USDC (if needed)
    ↓
Direct ethers.js transaction
    ↓
Blockchain Transaction (with gas fees)
```

**Note:** Gas fees now apply. For production, consider:
- Account abstraction (ERC-4337)
- Meta-transactions via relayers
- Layer 2 solutions (Polygon, Optimism, etc.)

---

## Testing Checklist

Before deploying to production:

- [ ] Deploy `BountyEscrow.sol` contract to testnet
- [ ] Deploy NFT contract (ERC721) to testnet
- [ ] Update contract addresses in `.env`
- [ ] Test `wallet_balance` tool
- [ ] Test `send_usdc` transfer
- [ ] Test `mint_nft` functionality
- [ ] Test `lock_bounty` with approval
- [ ] Test `release_bounty` to recipient
- [ ] Test `deploy_contract` payment flow
- [ ] Verify transaction hashes and events on block explorer

---

## Future Enhancements

### 1. **Chainlink Functions Integration** (Optional)
- Use Chainlink Functions for automated task verification
- Replace AI arbitration with hybrid AI + oracles

### 2. **Account Abstraction (ERC-4337)**
- Implement account abstraction for better UX
- Gasless transactions via bundlers
- Sponsored transactions via paymasters

### 3. **Gas Optimization**
- Deploy to Layer 2 (cheaper gas)
- Batch operations to reduce transaction count
- Use Diamond proxy patterns for upgradeable contracts

### 4. **Coinbase AgentKit Integration**
- Leverage Coinbase's agent infrastructure
- Improved key management
- Better testnet faucet integration

---

## Migration Steps for Developers

### 1. Install New Dependencies
```bash
npm install
# Make sure @openzeppelin/contracts is installed
```

### 2. Deploy Smart Contracts
```bash
# Using Hardhat or Foundry
npx hardhat run scripts/deploy.js --network avalancheFuji
```

### 3. Update Environment Variables
```bash
cp .env.example .env
# Update USDC_CONTRACT, NFT_CONTRACT, ESCROW_CONTRACT
```

### 4. Test Agent
```bash
npm start
you > wallet balance
you > send 0.5 USDC to 0x...
```

### 5. Verify on Blockscout
- Check transactions on Avalanche Fuji testnet
- Verify contract ABIs match deployed contracts

---

## Troubleshooting

### "Contract not found at address"
- Verify contract address in `.env`
- Check contract is deployed on correct network

### "Insufficient allowance"
- Make sure `approve()` is called before `transfer()` for escrow
- Check USDC balance is sufficient

### "Transaction reverted"
- Check revert reason in block explorer
- Verify contract ABIs match implementation
- Check gas limits and function parameters

---

## References

- **ethers.js**: https://docs.ethers.org/v6/
- **OpenZeppelin Contracts**: https://docs.openzeppelin.com/contracts/5.x/
- **Avalanche Fuji Testnet**: https://testnet.snowtrace.io/
- **Chainlink Functions**: https://docs.chain.link/chainlink-functions/

---

**Migration completed on March 14, 2026** ✅

All code now uses standard Web3 tools and patterns. The agent is vendor-independent and fully auditable.
