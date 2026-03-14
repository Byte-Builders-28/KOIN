# Smart Contract Deployment Guide

## Overview

This guide explains how to deploy the OpenZeppelin-based smart contracts for the ChainAgent on Avalanche Fuji testnet.

---

## Prerequisites

### Tools
- **Hardhat** or **Foundry** (for deployment)
- **Node.js** v16+ and npm
- **MetaMask** or other Web3 wallet
- **Avalanche Fuji testnet** RPC access

### Accounts
- Agent wallet with AVAX (for gas)
- Treasury wallet for receiving deployment fees
- USDC testnet tokens (request from faucet)

### Dependencies
```bash
npm install --save-dev hardhat @nomiclabs/hardhat-ethers ethers
npm install --save @openzeppelin/contracts
```

---

## Setup Hardhat Project

### Step 1: Initialize Hardhat
```bash
npx hardhat
# Choose "Create a basic sample project"
# Follow prompts for project structure
```

### Step 2: Create Hardhat Config

**hardhat.config.js:**
```javascript
require("@nomiclabs/hardhat-ethers");
const dotenv = require("dotenv");

dotenv.config();

module.exports = {
  solidity: "0.8.20",
  networks: {
    avalancheFuji: {
      url: process.env.RPC_URL,
      accounts: [process.env.AGENT_PRIVATE_KEY],
      chainId: 43113,
    },
  },
};
```

### Step 3: Create .env for Hardhat
```bash
# Add to your .env file
HARDHAT_NETWORK=avalancheFuji
```

---

## Deploy BountyEscrow Contract

### Step 1: Add Contract File

Copy `contracts/BountyEscrow.sol` to your Hardhat `contracts/` directory.

### Step 2: Create Deployment Script

**scripts/deploy.js:**
```javascript
const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying ChainAgent contracts...\n");

  // Get deployer wallet
  const [deployer] = await hre.ethers.getSigners();
  console.log(`📍 Deploying from: ${deployer.address}\n`);

  // USDC token address on Avalanche Fuji testnet
  // You can use the official test USDC or deploy your own mock
  const USDC_ADDRESS = process.env.USDC_CONTRACT || "0x5425890298f0406eF6753149EF6c0bA0D44B3806";

  console.log(`📦 Deploying BountyEscrow...\n`);
  const BountyEscrow = await hre.ethers.getContractFactory("BountyEscrow");
  const escrow = await BountyEscrow.deploy(USDC_ADDRESS);
  await escrow.deploymentTransaction().wait();

  console.log(`✅ BountyEscrow deployed at: ${escrow.target}`);
  console.log(`   Transaction: ${escrow.deploymentTransaction().hash}\n`);

  // Save contract addresses
  const fs = require("fs");
  const addressesFile = ".deployed.json";
  const addresses = {
    usdc: USDC_ADDRESS,
    escrow: escrow.target,
    deployer: deployer.address,
    network: "avalancheFuji",
    timestamp: new Date().toISOString(),
  };

  fs.writeFileSync(addressesFile, JSON.stringify(addresses, null, 2));
  console.log(`💾 Contract addresses saved to ${addressesFile}\n`);

  // Update .env file
  const envContent = fs.readFileSync(".env", "utf-8");
  const updatedEnv = envContent
    .split("\n")
    .map(line => {
      if (line.startsWith("USDC_CONTRACT=")) return `USDC_CONTRACT=${USDC_ADDRESS}`;
      if (line.startsWith("ESCROW_CONTRACT=")) return `ESCROW_CONTRACT=${escrow.target}`;
      return line;
    })
    .join("\n");

  fs.writeFileSync(".env", updatedEnv);
  console.log(`✏️  Updated .env with contract addresses\n`);

  console.log("🎉 Deployment complete!");
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
```

### Step 3: Deploy

```bash
npx hardhat run scripts/deploy.js --network avalancheFuji
```

**Expected Output:**
```
🚀 Deploying ChainAgent contracts...

📍 Deploying from: 0x...

📦 Deploying BountyEscrow...

✅ BountyEscrow deployed at: 0x...
   Transaction: 0x...

💾 Contract addresses saved to .deployed.json

✏️  Updated .env with contract addresses

🎉 Deployment complete!
```

---

## Deploy NFT Contract

### Step 1: Create ERC721 Contract

**contracts/ChainAgentNFT.sol:**
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ChainAgentNFT is ERC721, Ownable {
    uint256 private tokenIdCounter;

    constructor() ERC721("ChainAgent", "CAGNT") {
        tokenIdCounter = 1;
    }

    function mint(address to, string memory uri) public onlyOwner returns (uint256) {
        uint256 tokenId = tokenIdCounter;
        tokenIdCounter++;
        
        _safeMint(to, tokenId);
        return tokenId;
    }

    function _baseURI() internal view override returns (string memory) {
        return "ipfs://";
    }
}
```

### Step 2: Update Deploy Script

Add to **scripts/deploy.js:**
```javascript
// ... previous code ...

console.log(`📦 Deploying ChainAgentNFT...\n`);
const ChainAgentNFT = await hre.ethers.getContractFactory("ChainAgentNFT");
const nft = await ChainAgentNFT.deploy();
await nft.deploymentTransaction().wait();

console.log(`✅ ChainAgentNFT deployed at: ${nft.target}`);
console.log(`   Transaction: ${nft.deploymentTransaction().hash}\n`);

// Update addresses
addresses.nft = nft.target;

// Update NFT in .env
updatedEnv = updatedEnv.replace(
  /NFT_CONTRACT=.*/,
  `NFT_CONTRACT=${nft.target}`
);
```

---

## Verify Contracts on Snowtrace

### Step 1: Get Snowtrace API Key
1. Visit https://snowtrace.io/apis
2. Sign up and create API key

### Step 2: Verify with Hardhat

**hardhat.config.js:**
```javascript
module.exports = {
  // ... other config ...
  etherscan: {
    apiKey: {
      avalancheFuji: process.env.SNOWTRACE_API_KEY,
    },
  },
};
```

### Step 3: Run Verification
```bash
npx hardhat verify --network avalancheFuji <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>

# Example for BountyEscrow:
npx hardhat verify --network avalancheFuji 0xYourAddress 0xUSDCAddress
```

---

## Interact with Deployed Contracts

### Step 1: Create Interaction Script

**scripts/interact.js:**
```javascript
const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  
  // Load deployed addresses
  const deployed = require("../.deployed.json");
  
  // Get contracts
  const escrow = await hre.ethers.getContractAt("BountyEscrow", deployed.escrow);
  const nft = await hre.ethers.getContractAt("ChainAgentNFT", deployed.nft);
  const usdc = await hre.ethers.getContractAt(
    "IERC20",
    deployed.usdc
  );

  console.log("📊 Testing deployed contracts...\n");

  // Check USDC balance
  const balance = await usdc.balanceOf(deployer.address);
  console.log(`💰 USDC Balance: ${hre.ethers.formatUnits(balance, 6)}`);

  // Test locking bounty (if you have USDC)
  if (balance > hre.ethers.parseUnits("1", 6)) {
    // Approve escrow
    const approveTx = await usdc.approve(
      deployed.escrow,
      hre.ethers.parseUnits("1", 6)
    );
    await approveTx.wait();
    console.log("✅ Approved escrow to spend USDC");

    // Lock bounty
    const deadline = Math.floor(Date.now() / 1000) + 86400; // 24 hours
    const lockTx = await escrow.lockBounty(
      "test_task_001",
      hre.ethers.parseUnits("1", 6),
      deadline
    );
    const receipt = await lockTx.wait();
    console.log(`✅ Bounty locked: ${receipt.transactionHash}`);
  }

  // Test NFT mint
  const mintTx = await nft.mint(deployer.address, "ipfs://QmTest...");
  const mintReceipt = await mintTx.wait();
  console.log(`✅ NFT minted: ${mintReceipt.transactionHash}`);

  console.log("\n🎉 All tests passed!");
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
```

### Step 2: Run Interaction Script
```bash
npx hardhat run scripts/interact.js --network avalancheFuji
```

---

## Testnet Faucets

### Get AVAX for Gas
- **Avalanche Testnet Faucet**: https://faucet.avax.network/
- Request 2-10 AVAX for gas

### Get USDC Tokens
- **Fuji Testnet USDC**: Pre-deployed at `0x...`
- Or deploy your own mock USDC for testing

---

## Troubleshooting Deployments

### Error: "Insufficient funds for gas"
```bash
# Get more AVAX from faucet
# https://faucet.avax.network/
```

### Error: "Contract not found"
```bash
# Make sure RPC_URL is correct in .env
# Verify network is avalancheFuji (chainId: 43113)
```

### Error: "Transaction reverted"
```bash
# Check contract constructor parameters
# Verify contract address is valid
# Check USDC address exists on chosen network
```

### Contract Not Verifying on Snowtrace
```bash
# Make sure solidity version matches in hardhat.config.js
# Include all constructor arguments in verify command
# Check Snowtrace API key is valid
```

---

## Next Steps

1. ✅ Deploy BountyEscrow contract
2. ✅ Deploy NFT contract
3. ✅ Verify on Snowtrace
4. ✅ Update `.env` with contract addresses
5. ✅ Test with ChainAgent
6. ⬜ Deploy to mainnet (after thorough testing)

---

## Production Checklist

Before deploying to mainnet:

- [ ] All contracts audited
- [ ] Test coverage > 80%
- [ ] All edge cases tested on testnet
- [ ] Contracts verified on Snowtrace
- [ ] Private key stored securely (use hardware wallet)
- [ ] Treasury wallet configured
- [ ] Emergency pause mechanisms implemented
- [ ] Gas optimization complete
- [ ] Rate limiting implemented
- [ ] Event logging comprehensive

---

## References

- **Hardhat Docs**: https://hardhat.org/getting-started/
- **OpenZeppelin Docs**: https://docs.openzeppelin.com/
- **Avalanche Fuji**: https://docs.avax.network/
- **Snowtrace**: https://snowtrace.io/
