FACINET
EST. 2025
[Home](/)
[API](/api)
[Facilitator](/facilitator)
[Explorer](/explorer)
[Chain](/chain)
[Institution](/institution)
[Docs](/docs)
CONNECT WALLET
NET: ACTIVE
TPS: 0

# Facinet SDK

Add gasless USDC payments to any app in minutes. Paywall APIs, process payments, and let facilitators handle the gas.

`npm install facinet-sdk`
v0.2.3
[Starter Kit](https://facinet-starter-kit.vercel.app/)

## Quick Start

Install

```
npm install facinet-sdk
```

Basic Payment

```
import { Facinet } from 'facinet-sdk'

const facinet = new Facinet({ network: 'avalanche-fuji' })

// Pay USDC — facilitator pays gas
const result = await facinet.pay({
  amount: '1.00',
  recipient: '0xRecipient...',
})

console.log('TX:', result.txHash)
```

## Paywall Middleware

Charge USDC for API access with one line of code. Returns HTTP 402 Payment Required when no payment is provided, automatically verifies payments when included.

Express.js

```
import { paywall } from 'facinet-sdk'

// Charge 0.10 USDC per request
app.get('/api/premium', paywall({
  amount: '0.10',
  recipient: '0xYourWallet...',
}), (req, res) => {
  // req.x402 contains payment proof
  res.json({ data: 'premium content' })
})
```

Next.js

```
import { paywallNextjs } from 'facinet-sdk'

export const GET = paywallNextjs({
  amount: '0.10',
  recipient: '0xYourWallet...',
})(async (req) => {
  return Response.json({ data: 'premium content' })
})
```

## Gasless API

Make any on-chain transaction gasless with a single API call. Your users never pay gas — Facinet facilitators handle it. Each API key includes 1,000 calls.

Usage — Single API Call

```
curl -X POST https://facinet.vercel.app/api/v1/execute \
  -H "Content-Type: application/json" \
  -H "X-API-Key: fk_your_api_key_here" \
  -d '{
    "network": "avalanche-fuji",
    "contractAddress": "0xYourContract...",
    "functionName": "mint",
    "abi": [{"inputs":[...],"name":"mint","outputs":[],"type":"function"}],
    "functionArgs": ["0xRecipient", 1]
  }'
```

Response

```
{
  "success": true,
  "txHash": "0xabc123...",
  "network": "avalanche-fuji",
  "contractAddress": "0xYourContract...",
  "functionName": "mint",
  "gasUsed": "52341",
  "callsUsed": 1,
  "callsRemaining": 999
}
```

### Connect Wallet

Connect to purchase an API key or view your existing keys

Connect Wallet

## How x402 Protocol Works

01

### Client Requests API

Client calls your paywalled endpoint. No payment header? Server returns HTTP 402 with payment requirements (amount, recipient, network).

02

### User Signs Authorization

Client signs an ERC-3009 authorization off-chain (no gas). This gives permission to transfer USDC — user never sends a transaction themselves.

03

### Facilitator Settles

A Facinet facilitator executes the USDC transfer on-chain, paying gas. Client retries the API with payment proof. Server verifies and responds.

## SDK Reference

`new Facinet({ network })`
Initialize SDK for a specific chain
`facinet.pay({ amount, recipient })`
Gasless USDC payment via facilitator
`facinet.executeContract({ contractAddress, functionName, abi, functionArgs })`
Execute any contract call through facilitator
`facinet.getFacilitators()`
List active facilitators on the network
`facinet.selectRandomFacilitator()`
Pick a random active facilitator
`paywall({ amount, recipient })`
Express middleware — returns 402, verifies payments
`paywallNextjs({ amount, recipient })`
Next.js wrapper — same as paywall for API routes

## CLI Commands

CLI Commands

```
# Install globally
npm install -g facinet-sdk

# Make a payment
facinet pay --amount 1.00 --to 0xRecipient...

# List facilitators
facinet facilitator list

# Check facilitator status
facinet facilitator status
```

## Supported Networks

Avalanche Fuji
Chain
43113
Settlement Chain
Ethereum Sepolia
Chain
11155111
Base Sepolia
Chain
84532
Polygon Amoy
Chain
80002
Arbitrum Sepolia
Chain
421614
Optimism Sepolia
Chain
11155420
Monad Testnet
Chain
10143

## Run a Facilitator

Facilitators are the backbone of Facinet. They execute on-chain transactions and pay gas fees on behalf of users, earning fees for every payment they process.

→
Register with 1 USDC on Avalanche Fuji
→
Fund wallet with at least 1 AVAX for gas
→
Earn fees on every payment you process
→
On-chain identity via ERC-8004 NFT

## Core Standards

### x402 Protocol

HTTP 402 Payment Required standard. APIs return payment requirements, clients pay, facilitators settle on-chain.

### ERC-3009

Gasless USDC transfers via off-chain signatures. Users sign authorizations, facilitators execute TransferWithAuthorization.

### ERC-8004

On-chain facilitator identity as ERC-721 NFTs. Decentralized reputation with feedback scores 0-100.

### AES-256-GCM

Dual-layer encryption for facilitator keys. User password + system master key, PBKDF2 with 100k iterations.

## API Endpoints

POST
`/api/x402/verify`
Verify a payment authorization
POST
`/api/x402/settle`
Settle a verified payment on-chain
POST
`/api/x402/execute-contract`
Execute arbitrary contract call
GET
`/api/facilitator/list`
List all facilitators
POST
`/api/facilitator/create`
Register a new facilitator
GET
`/api/stats/network`
Get real-time network statistics
GET
`/api/explorer/logs`
Get recent transaction logs
GET
`/api/demo/weather`
Demo paywalled endpoint (returns 402)
FACINET
V0.2.3
RENDERING
FRAME: INF