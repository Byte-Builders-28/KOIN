import { ethers } from "ethers";
import dotenv from "dotenv";

// Import Coinbase AgentKit for agent wallet automation
// import { AgentKit, CdpWalletProvider } from "@coinbase/agentkit";

dotenv.config();

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

/**
 * Normal Ethers.js Wallet (for direct Web3 interaction)
 */
export const wallet = new ethers.Wallet(
  process.env.PRIVATE_KEY,
  provider
);

/**
 * Coinbase AgentKit Automated Wallet setup
 * This allows the agent to spin up a wallet securely using CDP MPC
 * bypassing the need to manage local plaintext private keys.
 */
export async function initializeAgentWallet() {
  /*
  const walletProvider = await CdpWalletProvider.configureWithWallet({
    apiKeyName: process.env.CDP_API_KEY_NAME,
    apiKeyPrivateKey: process.env.CDP_API_KEY_PRIVATE_KEY,
    networkId: process.env.NETWORK_ID || "base-sepolia",
  });
  
  const agentkit = await AgentKit.from({
    walletProvider,
    actionProviders: [],
  });

  return { agentkit, walletProvider };
  */
  console.log("Mock Coinbase AgentKit integration initialized.");
}

export async function getBalance() {
  const balance = await provider.getBalance(wallet.address);
  return ethers.formatEther(balance);
}

