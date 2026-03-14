# ChainAgent - Autonomous On-Chain AI Agent 🤖⛓️

ChainAgent is an intelligent, conversational CLI agent and web application powered by the **Facinet SDK** and **Groq**. It enables users to execute blockchain actions via natural language, abstracting away complex smart contract interactions, gas payments, and transaction signing through intelligent tooling.

---

## 🚀 Features

- **Natural Language to On-Chain Actions**: Just type what you want to do! The AI interprets your command and executes the corresponding smart contract call.
- **Gasless Transactions**: Powered by the Facinet SDK, the agent routing goes through facilitators to offer gasless interactions.
- **Terminal CLI & Web DashboardUI**: Interact through a sleek hacker-style command-line interface or the futuristic Next.js Web Dashboard.
- **Built-in Tools**: Wallet management, token transfers, NFT minting, smart contract deployment (Escrow, NFT, Bounty), and more.

---

## 🛠️ Architecture Setup

The project is split into two parts:

### 1. Agent Backend (Node.js)
Powered by `Groq` API (`llama-3.3-70b-versatile`), `ethers.js`, and `facinet-sdk`. It handles natural language processing and interacts directly with the Avalanche Fuji testnet blockchain.

### 2. Frontend Dashboard (Next.js)
A futuristic React portal built with Tailwind CSS. It connects to the agent and provides a cyber-punk multi-panel UI (Wallet, Console, Blockchain Log) for executing commands visually.

---

## 💻 Installation & Usage

First, clone the repository and add your environment variables to `.env`:
```bash
GROQ_API_KEY=your_groq_api_key_here
NETWORK=avalanche-fuji
```

### Running the Backend AI Agent
```bash
npm install
npm start
```
*Tip: `npm run dev` starts the agent with a file watcher.*

### Running the Web Frontend UI
```bash
cd frontend
npm install
npm run dev
```
Provides the application at `http://localhost:3000`.

---

## ⚡ Agent Commands & Example Outputs

The AI supports conversational inputs. Here is a list of commands it understands, complete with outputs you will see in the terminal:

### 1. Check Wallet Balance
**Command:** `wallet balance` or `how much USDC do I have?`

```text
you > wallet balance

🤖 ChainAgent thinking...

⚡ Executing: wallet_balance
   Input: {}
   Result: {
  "AVAX": "4.20",
  "USDC": "150.00"
}

Your current wallet balance is 4.20 AVAX and 150.00 USDC.
```

### 2. Send USDC Gaslessly
**Command:** `send 5 USDC to 0x1234...`

```text
you > send 5 USDC to 0x1234567890123456789012345678901234567890

🤖 ChainAgent thinking...

⚡ Executing: send_usdc
   Input: {
  "amount": "5",
  "recipient": "0x1234...7890"
}
   Result: {
  "status": "success",
  "txHash": "0xe2aabc1234...",
  "feePaid": "0.01 USDC"
}

Successfully sent 5 USDC to 0x1234...7890 via Facinet! Transaction Hash: 0xe2aabc...
```

### 3. Mint an NFT
**Command:** `mint nft "Vibeathon Winner" to 0xAbc...`

```text
you > mint nft "Vibeathon Winner" to 0xAbcDef123...

🤖 ChainAgent thinking...

⚡ Executing: mint_nft
   Input: {
  "name": "Vibeathon Winner",
  "recipient": "0xAbcDef..."
}
   Result: {
  "status": "success",
  "tokenId": "42",
  "txHash": "0x99fded..."
}

I've successfully minted the "Vibeathon Winner" NFT (Token ID: 42) to 0xAbc...
```

### 4. Deploy Smart Contracts
**Command:** `deploy a bounty contract`

```text
you > deploy bounty contract

🤖 ChainAgent thinking...

⚡ Executing: deploy_contract
   Input: {
  "contract_type": "bounty"
}
   Result: {
  "status": "success",
  "contractAddress": "0x777...888",
  "x402_paid": true
}

Bounty contract successfully deployed at 0x777...888. A x402 Facinet payment was automatically handled for the deployment.
```

### 5. Escrow and Bounties
**Command:** `lock bounty 50 USDC for "Design Logo"`

```text
you > lock bounty 50 USDC for "Design Logo"

🤖 ChainAgent thinking...

⚡ Executing: lock_bounty
   Input: {
  "amount": "50",
  "task_description": "Design Logo"
}
   Result: {
  "status": "success",
  "bounty_id": "8",
  "escrow_address": "0xABC..."
}

Locked 50 USDC in escrow for task: "Design Logo". The Bounty ID is 8.
```

### 6. List Facinet Facilitators
**Command:** `list active facilitators`

```text
you > list active facilitators

🤖 ChainAgent thinking...

⚡ Executing: get_facilitators
   Input: {}
   Result: {
  "facilitators": [
    { "id": "node-1", "reputation": 99.8 },
    { "id": "node-2", "reputation": 98.5 }
  ]
}

Here are the active facilitators on the network: node-1 (99.8% rep) and node-2 (98.5% rep).
```

---

## 🔒 Security & Rules
- The agent **always plans its steps** before execution.
- It will explicitly require **user confirmation** for any action involving significant funds.
- All on-chain mutations return and log a verifiable `txHash`.

> *Built for VIBE-A-THON* 🚀
