// Tool definitions for Claude's tool-use API
// Each tool maps to a real Facinet SDK call or contract interaction

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
    name: 'send_usdc',
    description: 'Send USDC to a recipient address gaslessly via Facinet facilitator',
    input_schema: {
      type: 'object',
      properties: {
        amount: {
          type: 'string',
          description: 'Amount of USDC to send e.g. "1.00"',
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
    description: 'Mint an NFT to a recipient address via smart contract, gaslessly through Facinet',
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
    description: 'Deploy a smart contract. Requires x402 payment via Facinet before proceeding.',
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

  {
    name: 'get_facilitators',
    description: 'List active Facinet facilitators on the network with their reputation scores',
    input_schema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Max number of facilitators to return',
        },
      },
      required: [],
    },
  },
]
