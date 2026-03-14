import express from 'express';
import { paywall } from 'facinet-sdk';

const app = express();
const PORT = 3000;

// This API endpoint requires the user/agent to pay 0.01 USDC to access
// Returns HTTP 402 if no payment header is provided and auto-verifies proof when it is!
app.get('/api/premium-mint-task', paywall({
  amount: '0.01',
  recipient: process.env.TREASURY_WALLET || '0xYourWalletAddress',
}), (req, res) => {
  // req.x402 contains payment proof, if it executed then payment succeeded
  res.json({ success: true, message: 'Payment confirmed. Agent can safely mint!' });
});

export function startApi() {
  app.listen(PORT, () => console.log(`x402 Paywalled API running on http://localhost:${PORT}`));
}