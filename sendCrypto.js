import { facinet } from "./facinetClient.js";

export async function sendCrypto(to, amount) {
  // Pay USDC gaslessly via Facinet facilitator
  const result = await facinet.pay({
    amount: amount.toString(), // e.g. "1.00"
    recipient: to,
  });
  
  return result.txHash;
}