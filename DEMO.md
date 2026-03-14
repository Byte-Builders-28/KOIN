# ChainAgent — Autonomous On-Chain AI Agent 🤖

## Overview

**ChainAgent** is an autonomous AI agent that executes on-chain actions through natural language commands. It combines the power of the Groq LLM with the Facinet SDK to perform gasless cryptocurrency operations, smart contract interactions, and bounty management on the Avalanche Fuji testnet.

The agent uses tool-use capabilities to understand user intent and automatically execute the appropriate blockchain operations without manual intervention.

---

## Architecture

### Core Components

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLI Interface                            │
│                    (agent.js - readline)                         │
└─────────────────────────────────┬───────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                      ChainAgent LLM Loop                         │
│  (Groq SDK - llama-3.3-70b-versatile)                           │
│  - Processes natural language commands                           │
│  - Routes to appropriate tools                                   │
│  - Manages conversation history                                  │
└─────────────────────────────────┬───────────────────────────────┘
                                  │
                    ┌─────────────┴──────────────┐
                    ▼                            ▼
        ┌──────────────────┐      ┌──────────────────┐
        │   Tool Registry  │      │   Executor       │
        │   (tools.js)     │      │   (executor.js)  │
        │                  │      │                  │
        │ • wallet_balance │      │ • Ethers.js      │
        │ • send_usdc      │      │ • Facinet SDK    │
        │ • mint_nft       │      │ • Contract ABIs  │
        │ • deploy_contract│      │                  │
        │ • lock_bounty    │      │                  │
        │ • release_bounty │      │                  │
        │ • get_facilitators│     │                  │
        └──────────────────┘      └────────┬─────────┘
                                          │
                    ┌─────────────────────┴──────────────────┐
                    ▼                                          ▼
        ┌──────────────────────┐          ┌──────────────────────┐
        │   Facinet SDK        │          │   Blockchain         │
        │   (Gasless Payments) │          │   (Avalanche Fuji)   │
        │                      │          │                      │
        │ • USDC Transfers     │          │ • NFT Contract       │
        │ • Contract Execution │          │ • Escrow Contract    │
        │ • x402 Paywalls      │          │ • Facilitators       │
        └──────────────────────┘          └──────────────────────┘
```

### Data Flow

1. **User Input** → Natural language command via CLI
2. **LLM Processing** → Groq interprets intent and selects tools
3. **Tool Execution** → Executor runs the selected tool(s) with validated inputs
4. **Blockchain Interaction** → Facinet SDK or Ethers.js executes on-chain action
5. **Result Feedback** → Transaction hash and result returned to user

---

## Setup & Installation

### Prerequisites

- **Node.js** v16+ and npm
- **Groq API Key** (from https://console.groq.com)
- **RPC URL** for Avalanche Fuji testnet
- **Agent Private Key** (test wallet with AVAX/USDC balance)
- **Facinet SDK** credentials for gasless operations

### Environment Configuration

Create a `.env` file in the project root:

```env
# LLM Configuration
GROQ_API_KEY=your_groq_api_key_here

# Blockchain Configuration
NETWORK=avalanche-fuji
RPC_URL=https://api.avax-test.network/ext/bc/C/rpc
AGENT_PRIVATE_KEY=your_agent_wallet_private_key

# Smart Contract Addresses (testnet)
NFT_CONTRACT=0xYourNFTContract
ESCROW_CONTRACT=0xYourEscrowContract
TREASURY_WALLET=0xTreasuryWalletAddress

# Facinet SDK
FACINET_KEY=your_facinet_credentials
```

### Installation

```bash
cd chain-agent
npm install
npm start
```

This launches the interactive CLI where you can start issuing commands.

---

## Available Tools & Commands

### 1. **wallet_balance** — Check Balance

**Description:** Query USDC and AVAX balance for any address or the agent wallet.

**Usage:**
```
you > wallet balance
you > check balance of 0x742d35Cc6634C0532925a3b844Bc7e7595f...
```

**LLM Output Example:**
```
⚡ Executing: wallet_balance
   Input: { "address": "" }
   Result: {
     "address": "0x...",
     "avax": "5.8234",
     "usdc": "10.00",
     "network": "avalanche-fuji"
   }
```

---

### 2. **send_usdc** — Transfer USDC

**Description:** Send USDC to a recipient address gaslessly via Facinet facilitator.

**Usage:**
```
you > send 0.50 USDC to 0xAbc123...
you > transfer 5 USDC to alice for payment
you > pay 1.5 USDC to recipient 0x456...
```

**LLM Output Example:**
```
⚡ Executing: send_usdc
   Input: {
     "amount": "0.50",
     "recipient": "0xAbc123...",
     "memo": "Vibeathon Winner Prize"
   }
   Result: {
     "success": true,
     "txHash": "0x789def...",
     "amount": "0.50",
     "recipient": "0xAbc123...",
     "memo": "Vibeathon Winner Prize",
     "gasless": true
   }
```

**Parameters:**
- `amount` (required): USDC amount (e.g., "1.00")
- `recipient` (required): Wallet address (0x...)
- `memo` (optional): Reason or description for the transfer

---

### 3. **mint_nft** — Mint NFT

**Description:** Mint an NFT to a recipient address via smart contract (gasless through Facinet).

**Usage:**
```
you > mint nft "Vibeathon Winner" to 0xAbc...
you > create an nft called "My Achievement" for 0x456...
you > mint a certificate "Event Attendee" to alice's wallet
```

**LLM Output Example:**
```
⚡ Executing: mint_nft
   Input: {
     "name": "Vibeathon Winner",
     "recipient": "0xAbc123...",
     "metadata_uri": "ipfs://QmXxxx..."
   }
   Result: {
     "success": true,
     "txHash": "0xdef789...",
     "tokenId": "42",
     "name": "Vibeathon Winner",
     "recipient": "0xAbc123...",
     "metadataUri": "ipfs://QmXxxx...",
     "gasless": true
   }
```

**Parameters:**
- `name` (required): NFT name/title
- `recipient` (required): Wallet address to receive NFT
- `metadata_uri` (optional): IPFS or HTTP URI for metadata (auto-generated if omitted)

---

### 4. **lock_bounty** — Create Bounty

**Description:** Lock USDC into an escrow contract as a bounty for a task to be completed.

**Usage:**
```
you > lock bounty 1 USDC for "Complete the landing page"
you > create bounty 5 USDC task "Design new UI mockup" 72 hours
you > escrow 2.50 USDC for "Write documentation"
```

**LLM Output Example:**
```
⚡ Executing: lock_bounty
   Input: {
     "amount": "1.00",
     "task_description": "Complete the landing page",
     "deadline_hours": 24
   }
   Result: {
     "success": true,
     "bountyId": "0x123abc...",
     "txHash": "0xdef456...",
     "amount": "1.00 USDC",
     "task": "Complete the landing page",
     "expiresIn": "24 hours",
     "gasless": true
   }
```

**Parameters:**
- `amount` (required): USDC amount to lock
- `task_description` (required): Description of the task
- `deadline_hours` (optional): Hours until bounty expires (default: 24)

---

### 5. **release_bounty** — Pay Bounty

**Description:** Release escrowed USDC to a recipient who completed the bounty task.

**Usage:**
```
you > release bounty 0x123abc... to 0xDef456...
you > pay out bounty bountyId recipient 0xAbc...
you > transfer bounty funds to the task completer
```

**LLM Output Example:**
```
⚡ Executing: release_bounty
   Input: {
     "bounty_id": "0x123abc...",
     "recipient": "0xDef456..."
   }
   Result: {
     "success": true,
     "bountyId": "0x123abc...",
     "txHash": "0xabc789...",
     "recipient": "0xDef456...",
     "amountReleased": "1.00 USDC",
     "gasless": true
   }
```

**Parameters:**
- `bounty_id` (required): ID of the bounty to release
- `recipient` (required): Wallet address of task completer

---

### 6. **deploy_contract** — Deploy Smart Contract

**Description:** Deploy a smart contract (escrow, NFT, or bounty). Requires x402 payment (~0.10 USDC).

**Usage:**
```
you > deploy contract escrow owned by 0xAdmin...
you > deploy an nft contract owned by me
you > deploy bounty contract
```

**LLM Output Example:**
```
⚡ Executing: deploy_contract
   Input: {
     "contract_type": "escrow",
     "owner": "0xAdmin..."
   }
   Result: {
     "success": true,
     "contractType": "escrow",
     "contractAddress": "0x9876543...",
     "paymentTxHash": "0xpay123...",
     "deployCost": "0.10 USDC",
     "network": "avalanche-fuji"
   }
```

**Parameters:**
- `contract_type` (required): `escrow` | `nft` | `bounty`
- `owner` (optional): Owner wallet address

**Cost:** ~0.10 USDC (paid via x402)

---

### 7. **get_facilitators** — List Facilitators

**Description:** List active Facinet facilitators on the network with their reputation scores.

**Usage:**
```
you > list facilitators
you > show active facilitators
you > who are the available facilitators
```

**LLM Output Example:**
```
⚡ Executing: get_facilitators
   Input: { "limit": 10 }
   Result: {
     "facilitators": [
       {
         "address": "0xFac1...",
         "reputation": 9.8,
         "successRate": "99.2%"
       },
       {
         "address": "0xFac2...",
         "reputation": 9.5,
         "successRate": "98.7%"
       }
     ]
   }
```

**Parameters:**
- `limit` (optional): Max number of facilitators to return (default: unlimited)

---

## Example Workflows

### Workflow 1: Pay a Prize Winner

```bash
# User input
you > send 5 USDC to 0x742d35Cc6634C0532925a3b844Bc7e7595f for Vibeathon Winner Prize

# Agent flow
1. ✅ Parses intent to send USDC
2. ✅ Validates recipient address
3. ✅ Executes send_usdc via Facinet (gasless)
4. ✅ Returns transaction hash

# Output
⚡ Executing: send_usdc
   Result: {
     "success": true,
     "txHash": "0x789def...",
     "amount": "5.00",
     ...
   }
```

### Workflow 2: Mint Achievement Certificate

```bash
you > mint nft "Vibeathon Completion Certificate" to 0x742d35Cc6634C0532925a3b844Bc7e7595f

# Agent flow
1. ✅ Interprets as NFT mint request
2. ✅ Sets recipient and NFT name
3. ✅ Calls mint_nft via Facinet
4. ✅ Returns token ID and transaction hash

# Output
⚡ Executing: mint_nft
   Result: {
     "success": true,
     "txHash": "0xdef789...",
     "tokenId": "42",
     ...
   }
```

### Workflow 3: Create & Release Bounty

```bash
# Step 1: Create bounty
you > lock bounty 10 USDC for "Design new landing page" 72 hours

# Agent locks funds
⚡ Executing: lock_bounty
   Result: {
     "bountyId": "0x123abc...",
     "txHash": "0xbounty1...",
     ...
   }

# Step 2: Someone completes the task
you > release bounty 0x123abc... to 0xDesigner123...

# Agent releases funds
⚡ Executing: release_bounty
   Result: {
     "txHash": "0xpayout1...",
     "amountReleased": "10.00 USDC",
     ...
   }
```

---

## Key Features

### 🤖 AI-Powered Interpretation
- Natural language processing via Groq LLM
- Automatic tool selection and parameter extraction
- Context-aware decision making

### ⚡ Gasless Operations
- All transactions powered by Facinet SDK
- No gas fees for USDC transfers and NFT minting
- x402 payment model for contract deployment

### 🔗 On-Chain Integration
- Direct blockchain interaction via Ethers.js
- Smart contract execution (NFT, Escrow, Bounty)
- Real-time balance and transaction tracking

### 📋 Tool-Based Architecture
- Modular, extensible tool system
- Easy to add new capabilities
- Clear input/output schemas

### 🔐 Secure Operation
- Private key handled securely via environment variables
- Input validation for all parameters
- Transaction confirmation before execution

---

## System Prompt & Agent Behavior

The agent operates under the following system prompt:

```
You are ChainAgent — an autonomous AI agent that executes on-chain actions.

Rules:
- Always plan your steps before executing
- Show the user each step as you go
- For actions that cost money, confirm with the user first
- If an action returns a txHash, always show it
- Be concise. You are a terminal agent, not a chatbot.
```

This ensures the agent:
1. Explains its reasoning
2. Confirms expensive operations
3. Provides clear transaction feedback
4. Maintains a terminal-like brevity

---

## Troubleshooting

### Common Issues

**Issue:** "402 Payment Required"
- **Cause:** Not enough USDC to cover x402 payment for contract deployment
- **Solution:** Ensure agent wallet has sufficient USDC balance

**Issue:** "Invalid address format"
- **Cause:** Malformed Ethereum address provided
- **Solution:** Use full 40-char addresses (0x...)

**Issue:** "Network mismatch"
- **Cause:** Wrong RPC URL or network configuration
- **Solution:** Verify `RPC_URL` and `NETWORK` in `.env`

**Issue:** "Facilitator unavailable"
- **Cause:** No active Facinet facilitators on network
- **Solution:** Check network status or wait for facilitators to come online

---

## Dependencies

```json
{
  "groq-sdk": "^0.9.0",        // LLM API client
  "facinet-sdk": "^1.0.0",      // Gasless operations & x402
  "ethers": "^6.16.0",          // Blockchain interaction
  "dotenv": "^17.3.1",          // Environment variables
  "axios": "^1.13.6",           // HTTP client
  "readline": "built-in"        // CLI interface
}
```

---

## Getting Started (Quick Start)

1. **Clone or create the project**
   ```bash
   npm init -y
   npm install groq-sdk facinet-sdk ethers dotenv
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

3. **Start the agent**
   ```bash
   npm start
   # or
   node agent.js
   ```

4. **Try your first command**
   ```
   you > wallet balance
   you > send 0.5 USDC to 0x...
   you > mint nft "My NFT" to 0x...
   ```

---

## Next Steps

- Deploy contracts to mainnet
- Integrate with Discord/Telegram bots
- Add more tool types (staking, swaps, governance)
- Implement advanced scheduling and automation
- Create a web UI dashboard

---

**ChainAgent** turns your blockchain into a conversational interface. Just describe what you want to do, and the agent makes it happen. 🚀
