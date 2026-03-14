// Tool definitions for Groq LLM tool-use API
// Each tool maps to ethers.js smart contract calls or wallet operations

export const tools = [
  {
    name: 'wallet_balance',
    description: 'Check the current USDC and AVAX balance of the agent wallet or any address',
    input_schema: {
      type: 'object',
      properties: {
        address: {
          type: 'string',
          description: 'Wallet address to check. Leave empty to check agent wallet.',
        },
      },
      required: [],
    },
  },

  {
    name: 'send_avax',
    description: 'Send native AVAX token to a recipient address via direct transfer',
    input_schema: {
      type: 'object',
      properties: {
        amount: {
          type: 'string',
          description: 'Amount of AVAX to send e.g. "0.01"',
        },
        recipient: {
          type: 'string',
          description: 'Recipient wallet address 0x...',
        },
        memo: {
          type: 'string',
          description: 'Optional memo or reason for payment',
        },
      },
      required: ['amount', 'recipient'],
    },
  },

  {
    name: 'mint_nft',
    description: 'Mint an NFT to a recipient address via smart contract (ERC721)',
    input_schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Name of the NFT to mint',
        },
        recipient: {
          type: 'string',
          description: 'Wallet address to receive the NFT',
        },
        metadata_uri: {
          type: 'string',
          description: 'Optional IPFS or HTTP URI for NFT metadata',
        },
      },
      required: ['name', 'recipient'],
    },
  },

  {
    name: 'deploy_contract',
    description: 'Deploy a smart contract (escrow, nft, or bounty). Requires USDC payment for deployment.',
    input_schema: {
      type: 'object',
      properties: {
        contract_type: {
          type: 'string',
          enum: ['escrow', 'nft', 'bounty'],
          description: 'Type of contract to deploy',
        },
        owner: {
          type: 'string',
          description: 'Owner address for the deployed contract',
        },
      },
      required: ['contract_type'],
    },
  },

  {
    name: 'lock_bounty',
    description: 'Lock USDC into an escrow contract as a bounty for a task',
    input_schema: {
      type: 'object',
      properties: {
        amount: {
          type: 'string',
          description: 'Amount of USDC to lock as bounty',
        },
        task_description: {
          type: 'string',
          description: 'Description of the task to be completed',
        },
        deadline_hours: {
          type: 'number',
          description: 'Hours until bounty expires and funds return to poster',
        },
      },
      required: ['amount', 'task_description'],
    },
  },

  {
    name: 'release_bounty',
    description: 'Release escrowed USDC bounty to a recipient who completed the task',
    input_schema: {
      type: 'object',
      properties: {
        bounty_id: {
          type: 'string',
          description: 'ID of the bounty to release',
        },
        recipient: {
          type: 'string',
          description: 'Wallet address of the task completer',
        },
      },
      required: ['bounty_id', 'recipient'],
    },
  },
]
