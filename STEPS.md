# Step-by-Step Guide: Autonomous On-Chain AI Agent (Vibe-A-Thon)

This guide provides a minimal working prototype to build an on-chain AI agent with x402 payment gating using the Facinet SDK in ~4 hours. 

## Step 1: Project Architecture
The system consists of a simple CLI, an AI Agent, a Tools Layer (wallet, contract, mint), and the Facinet SDK for x402 paywalls connected to the blockchain.

## Step 2: Initialize the Project
Create a Node project and install dependencies:
```bash
mkdir chain-agent
cd chain-agent
npm init -y
npm install ethers facinet-sdk openai dotenv axios
```

## Step 3: Create Environment Variables
Create a `.env` file in the root of your project:
```env
OPENAI_API_KEY=your_key
PRIVATE_KEY=agent_wallet_key
RPC_URL=https://api.avax-test.network/ext/bc/C/rpc
FACINET_KEY=your_key
```

## Step 4: Connect Agent Wallet
Create `wallet.js` to initialize the wallet and check the balance:
```javascript
import { ethers } from "ethers";
import dotenv from "dotenv";

dotenv.config();

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

export const wallet = new ethers.Wallet(
  process.env.PRIVATE_KEY,
  provider
);

export async function getBalance() {
  const balance = await wallet.getBalance();
  return ethers.formatEther(balance);
}
```

## Step 5: Tool - Send Crypto
Create `sendCrypto.js` to allow the agent to transfer funds:
```javascript
import { wallet } from "./wallet.js";
import { ethers } from "ethers";

export async function sendCrypto(to, amount) {
  const tx = await wallet.sendTransaction({
    to,
    value: ethers.parseEther(amount)
  });
  await tx.wait();
  return tx.hash;
}
```

## Step 6: Tool - Smart Contract Interaction
Create `contractTool.js` to interact with custom contracts:
```javascript
import { ethers } from "ethers";
import { wallet } from "./wallet.js";

const contractAddress = "0xYourContract";
const abi = ["function store(uint256 value)"];

export async function storeValue(val) {
  const contract = new ethers.Contract(contractAddress, abi, wallet);
  const tx = await contract.store(val);
  await tx.wait();
  return tx.hash;
}
```

## Step 7: Tool - Mint NFT
Create `mintNFT.js` for on-chain NFT minting:
```javascript
import { ethers } from "ethers";
import { wallet } from "./wallet.js";

const contractAddress = "0xYourNFTContract";
const abi = ["function mint(address to,string memory uri)"];

export async function mintNFT(uri) {
 const contract = new ethers.Contract(contractAddress, abi, wallet);
 const tx = await contract.mint(wallet.address, uri);
 await tx.wait();
 return tx.hash;
}
```

## Step 8: Add Facinet x402 Paywall
Integrate the specific hackathon requirement using the Facinet SDK to gate expensive on-chain actions:
```javascript
import { paywall } from "facinet-sdk";

export async function paidAction() {
  const payment = await paywall({
    price: "0.01",
    currency: "USDC"
  });

  if (!payment.success) {
    return "402 Payment Required";
  }
  return "Payment confirmed";
}
```

## Step 9: Build the AI Agent CLI
Create `agent.js` to process input and route to the appropriate tools:
```javascript
import readline from "readline";
import { getBalance } from "./wallet.js";
import { sendCrypto } from "./sendCrypto.js";

const rl = readline.createInterface({
 input: process.stdin,
 output: process.stdout
});

rl.on("line", async (input) => {
 if (input === "balance") {
   const b = await getBalance();
   console.log("Balance:", b);
 }
 if (input.startsWith("send")) {
   const parts = input.split(" ");
   const hash = await sendCrypto(parts[1], parts[2]);
   console.log("TX:", hash);
 }
});
```

## Step 10: Demo Scenario Prep
Ensure you can demonstrate:
1. Agent returning a wallet balance (`> balance`)
2. Hitting the 402 Paywall BEFORE minting an NFT 
3. Successful mint / sending crypto transaction signatures

**Tip**: Focus mostly on `balance`, `send crypto`, and the `Facinet paywall` for the strongest demo in a 4-hour window!