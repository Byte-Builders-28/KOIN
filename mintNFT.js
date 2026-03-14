import { facinet } from "./facinetClient.js";

const contractAddress = process.env.NFT_CONTRACT || "0xYourNFTContract";
const abi = [{
  "inputs": [
    {"name": "to", "type": "address"},
    {"name": "uri", "type": "string"}
  ],
  "name": "mint",
  "outputs": [],
  "type": "function"
}];

export async function mintNFT(recipient, uri) {
  // Execute mint contract call through Facinet facilitator (gasless!)
  const result = await facinet.executeContract({
    contractAddress,
    functionName: "mint",
    abi,
    functionArgs: [recipient, uri]
  });

  return result.txHash;
}