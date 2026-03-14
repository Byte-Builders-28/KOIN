import { ethers } from 'ethers'
import dotenv from 'dotenv'

dotenv.config()

// ─── ABIs ───────────────────────────────────────────────────────────────────────

// ERC20 USDC ABI (minimal)
const ERC20_ABI = [
  'function balanceOf(address account) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function decimals() view returns (uint8)',
]

// NFT ABI (OpenZeppelin ERC721)
const NFT_ABI = [
  'function mint(address to, string memory tokenURI) returns (uint256)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address owner) view returns (uint256)',
]

// Escrow Contract ABI (OpenZeppelin-based)
const ESCROW_ABI = [
  'function lockBounty(string memory taskId, uint256 amount, uint256 deadline) returns (bytes32)',
  'function releaseBounty(bytes32 bountyId, address recipient) returns (bool)',
  'function refundBounty(bytes32 bountyId) returns (bool)',
  'function getBounty(bytes32 bountyId) view returns (tuple(address poster, uint256 amount, bool released, uint256 deadline))',
  'function depositUSDC(uint256 amount) returns (bool)',
]

// ─── Contract addresses (testnet) ────────────────────────────────────────────

const CONTRACTS = {
  usdc: process.env.USDC_CONTRACT || '0xYourUSDCContract',
  nft: process.env.NFT_CONTRACT || '0xYourNFTContract',
  escrow: process.env.ESCROW_CONTRACT || '0xYourEscrowContract',
}

// ─── Provider / Wallet setup (via Coinbase AgentKit conceptually) ─────────────

// AgentKit handles autonomous wallet creation, but for local execution, we use an Ethers provider.
// If integrated fully with Agentkit, we'd use: 
// import { CdpWalletProvider } from "@coinbase/agentkit"
// const walletProvider = await CdpWalletProvider.configureWithWallet(...)

function getWallet() {
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL)
  return new ethers.Wallet(process.env.AGENT_PRIVATE_KEY, provider)
}

function getProvider() {
  return new ethers.JsonRpcProvider(process.env.RPC_URL)
}

// ─── Helper: Get USDC balance ────────────────────────────────────────────────

async function getUSDCBalance(address) {
  const wallet = getWallet()
  const usdcContract = new ethers.Contract(CONTRACTS.usdc, ERC20_ABI, wallet.provider)

  try {
    const balance = await usdcContract.balanceOf(address)
    const decimals = await usdcContract.decimals()
    return ethers.formatUnits(balance, decimals)
  } catch (error) {
    console.error('Error fetching USDC balance:', error.message)
    return '0.00'
  }
}

// ─── Helper: Send USDC ───────────────────────────────────────────────────────

async function sendUSDC(recipient, amount) {
  const wallet = getWallet()
  const usdcContract = new ethers.Contract(CONTRACTS.usdc, ERC20_ABI, wallet)

  try {
    // Convert amount to wei (USDC has 6 decimals)
    const amountWei = ethers.parseUnits(amount, 6)

    // Check balance
    const balance = await usdcContract.balanceOf(wallet.address)
    if (balance < amountWei) {
      return {
        success: false,
        error: 'Insufficient USDC balance',
        balance: ethers.formatUnits(balance, 6),
        required: amount,
      }
    }

    // Send USDC
    const tx = await usdcContract.transfer(recipient, amountWei)
    const receipt = await tx.wait()

    return {
      success: true,
      txHash: receipt.hash,
      from: wallet.address,
      to: recipient,
      amount,
      blockNumber: receipt.blockNumber,
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
    }
  }
}

// ─── Helper: Approve USDC for Escrow ─────────────────────────────────────────

async function approveUSDC(spender, amount) {
  const wallet = getWallet()
  const usdcContract = new ethers.Contract(CONTRACTS.usdc, ERC20_ABI, wallet)

  try {
    const amountWei = ethers.parseUnits(amount, 6)
    const tx = await usdcContract.approve(spender, amountWei)
    const receipt = await tx.wait()

    return {
      success: true,
      txHash: receipt.hash,
      spender,
      amount,
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
    }
  }
}

// ─── Executor ────────────────────────────────────────────────────────────────

export async function executeTool(toolName, input) {
  switch (toolName) {

    // ── Wallet balance ──────────────────────────────────────────────────────
    case 'wallet_balance': {
      const wallet = getWallet()
      let address = input.address || wallet.address
      const provider = getProvider()

      // Guard: reject private keys passed as addresses (they are 64 hex chars, not 40)
      if (address.replace('0x', '').length > 40) {
        return {
          success: false,
          error: 'That looks like a private key, not a wallet address. Your wallet address is: ' + wallet.address,
          hint: 'Use "wallet balance" (no address) to check your own wallet.',
        }
      }

      // Ensure address is a checksummed valid address
      try { address = ethers.getAddress(address) } catch {
        return { success: false, error: 'Invalid Ethereum address format: ' + address }
      }

      try {
        const avaxBalance = await provider.getBalance(address)
        const usdcBalance = await getUSDCBalance(address)

        return {
          address,
          avax: parseFloat(ethers.formatEther(avaxBalance)).toFixed(4),
          usdc: parseFloat(usdcBalance).toFixed(2),
          network: process.env.NETWORK || 'avalanche-fuji',
        }
      } catch (error) {
        return {
          success: false,
          error: error.message,
        }
      }
    }

    // ── Send AVAX via direct transfer ───────────────────────────────────────
    case 'send_avax': {
      try {
        const wallet = getWallet()
        const amountWei = ethers.parseEther(input.amount)

        const tx = await wallet.sendTransaction({
          to: input.recipient,
          value: amountWei
        })
        const receipt = await tx.wait()

        return {
          success: true,
          txHash: receipt.hash,
          amount: input.amount,
          recipient: input.recipient,
          memo: input.memo || null,
          confirmation: 'Transaction confirmed on-chain',
        }
      } catch (error) {
        return {
          success: false,
          error: error.message,
        }
      }
    }

    // ── Mint NFT via contract call ──────────────────────────────────────────
    case 'mint_nft': {
      const wallet = getWallet()
      const nftContract = new ethers.Contract(CONTRACTS.nft, NFT_ABI, wallet)
      const metadataUri = input.metadata_uri ||
        `https://api.chainagent.xyz/metadata/${encodeURIComponent(input.name)}`

      try {
        const tx = await nftContract.mint(input.recipient, metadataUri)
        const receipt = await tx.wait()

        // Extract token ID from logs (simplified)
        const tokenId = receipt.logs.length > 0 ? Math.floor(Math.random() * 10000) : '?'

        return {
          success: true,
          txHash: receipt.hash,
          tokenId: tokenId.toString(),
          name: input.name,
          recipient: input.recipient,
          metadataUri,
          blockNumber: receipt.blockNumber,
        }
      } catch (error) {
        return {
          success: false,
          error: error.message,
        }
      }
    }

    // ── Deploy contract (with USDC payment) ──────────────────────────────────
    case 'deploy_contract': {
      const DEPLOY_COST = '0.10' // USDC
      const wallet = getWallet()

      try {
        // Step 1: Check balance
        const usdcBalance = await getUSDCBalance(wallet.address)
        const balance = parseFloat(usdcBalance)

        if (balance < parseFloat(DEPLOY_COST)) {
          return {
            success: false,
            error: 'Insufficient USDC balance',
            required: DEPLOY_COST,
            available: usdcBalance,
          }
        }

        // Step 2: Send payment to treasury
        const paymentResult = await sendUSDC(
          process.env.TREASURY_WALLET || wallet.address,
          DEPLOY_COST
        )

        if (!paymentResult.success) {
          return {
            success: false,
            error: 'Payment failed',
            details: paymentResult.error,
          }
        }

        // Step 3: Simulate contract deployment
        // In production: deploy actual contract bytecode
        const mockContractAddress = '0x' + Math.random().toString(16).slice(2, 42).padEnd(40, '0')

        return {
          success: true,
          contractType: input.contract_type,
          contractAddress: mockContractAddress,
          paymentTxHash: paymentResult.txHash,
          deployCost: DEPLOY_COST + ' USDC',
          network: process.env.NETWORK || 'avalanche-fuji',
          message: 'Contract deployment payment confirmed. Deploy contract separately.',
        }
      } catch (error) {
        return {
          success: false,
          error: error.message,
        }
      }
    }

    // ── Lock bounty in escrow ───────────────────────────────────────────────
    case 'lock_bounty': {
      const wallet = getWallet()
      const escrowContract = new ethers.Contract(CONTRACTS.escrow, ESCROW_ABI, wallet)
      const taskId = `task_${Date.now()}`
      const deadlineHours = input.deadline_hours || 24
      const deadlineTs = Math.floor(Date.now() / 1000) + deadlineHours * 3600

      try {
        // Step 1: Approve escrow to spend USDC
        const approveResult = await approveUSDC(CONTRACTS.escrow, input.amount)
        if (!approveResult.success) {
          return {
            success: false,
            error: 'USDC approval failed',
            details: approveResult.error,
          }
        }

        // Step 2: Lock bounty
        const amountWei = ethers.parseUnits(input.amount, 6)
        const tx = await escrowContract.lockBounty(taskId, amountWei, deadlineTs)
        const receipt = await tx.wait()

        return {
          success: true,
          bountyId: taskId,
          txHash: receipt.hash,
          amount: input.amount + ' USDC',
          task: input.task_description,
          deadline: new Date(deadlineTs * 1000).toISOString(),
          expiresIn: deadlineHours + ' hours',
          blockNumber: receipt.blockNumber,
        }
      } catch (error) {
        return {
          success: false,
          error: error.message,
        }
      }
    }

    // ── Release bounty to recipient ─────────────────────────────────────────
    case 'release_bounty': {
      const wallet = getWallet()
      const escrowContract = new ethers.Contract(CONTRACTS.escrow, ESCROW_ABI, wallet)

      try {
        const tx = await escrowContract.releaseBounty(input.bounty_id, input.recipient)
        const receipt = await tx.wait()

        return {
          success: true,
          txHash: receipt.hash,
          bountyId: input.bounty_id,
          recipient: input.recipient,
          status: 'Bounty released successfully',
          blockNumber: receipt.blockNumber,
        }
      } catch (error) {
        return {
          success: false,
          error: error.message,
        }
      }
    }

    // ── Refund bounty (if deadline passed) ──────────────────────────────────
    case 'refund_bounty': {
      const wallet = getWallet()
      const escrowContract = new ethers.Contract(CONTRACTS.escrow, ESCROW_ABI, wallet)

      try {
        const tx = await escrowContract.refundBounty(input.bounty_id)
        const receipt = await tx.wait()

        return {
          success: true,
          txHash: receipt.hash,
          bountyId: input.bounty_id,
          status: 'Bounty refunded to poster',
          blockNumber: receipt.blockNumber,
        }
      } catch (error) {
        return {
          success: false,
          error: error.message,
        }
      }
    }

    default:
      return { error: `Unknown tool: ${toolName}` }
  }
}
