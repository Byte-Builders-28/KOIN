import { ethers } from "ethers";
import dotenv from "dotenv";

dotenv.config();

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

export const wallet = new ethers.Wallet(
  process.env.PRIVATE_KEY,
  provider
);

export async function getBalance() {
  const balance = await provider.getBalance(wallet.address);
  return ethers.formatEther(balance);
}
