import readline from "readline";
import axios from "axios";
import { getBalance } from "./wallet.js";
import { sendCrypto } from "./sendCrypto.js";
import { mintNFT } from "./mintNFT.js";
import { startApi } from "./paywall.js";

// Start minimal express server for the x402 payment gating demo
startApi();

const rl = readline.createInterface({
 input: process.stdin,
 output: process.stdout
});

console.log('╔══════════════════════════════════════╗');
console.log('║  Autonomous AI Agent (Facinet x402)  ║');
console.log('╚══════════════════════════════════════╝\n');

rl.on("line", async (input) => {
  try {
    if (input === "balance") {
      const b = await getBalance();
      console.log("Balance:", b, "AVAX");
    } 
    else if (input.startsWith("send")) {
      // e.g. "send 0xabc... 0.01"
      const parts = input.split(" ");
      console.log("Routing gasless USDC transaction via Facinet...");
      const hash = await sendCrypto(parts[1], parts[2]);
      console.log("Gasless TX:", hash);
    }
    else if (input.startsWith("mint nft")) {
      // e.g. "mint nft 0xabc... Vibeathon"
      const parts = input.split(" ");
      const recipient = parts[2];
      const uri = parts.slice(3).join(" ");
      
      console.log("Checking API requirements...");
      try {
        // Try accessing premium endpoint normally
        await axios.get('http://localhost:3000/api/premium-mint-task');
      } catch (err) {
        if (err.response && err.response.status === 402) {
          console.log("402 Payment Required", err.response.data);
          // In a fully autonomous setup, the agent would now sign the ERC-3009 auth 
          // and retry the request WITH the payment header here.
          console.log("Simulating SDK payment resolution...");
          // We then do the actual gasless mint logic
          console.log(`Minting NFT "${uri}" to ${recipient} via Facinet gaslessly...`);
          const hash = await mintNFT(recipient, uri);
          console.log("Mint Gasless TX:", hash);
        } else {
          console.error("API Error", err.message);
        }
      }
    }
  } catch (err) {
    console.error("Error executing task:", err.message);
  }
});
