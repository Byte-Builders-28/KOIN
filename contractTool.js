import { facinet } from "./facinetClient.js";

const contractAddress = process.env.CUSTOM_CONTRACT || "0xYourContract";
const abi = [{
  "inputs": [
    {"name": "value", "type": "uint256"}
  ],
  "name": "store",
  "outputs": [],
  "type": "function"
}];

export async function storeValue(val) {
  // Execute generic contract call gaslessly
  const result = await facinet.executeContract({
    contractAddress,
    functionName: "store",
    abi,
    functionArgs: [val]
  });

  return result.txHash;
}