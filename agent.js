import Groq from 'groq-sdk'
import { Facinet } from 'facinet-sdk'
import { tools } from './tools.js'
import { executeTool } from './executor.js'
import readline from 'readline'

// ─── Init ─────────────────────────────────────────────────────────────────────

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
const facinet = new Facinet({ network: process.env.NETWORK || 'avalanche-fuji' })

const MODEL = 'llama-3.3-70b-versatile'

const SYSTEM = `You are ChainAgent — an autonomous AI agent that executes on-chain actions.

You have access to these tools:
- wallet_balance: check USDC/AVAX balance
- send_usdc: send USDC to an address via Facinet (gasless)
- mint_nft: mint an NFT to an address via smart contract
- deploy_contract: deploy a contract (requires x402 payment via Facinet)
- lock_bounty: lock USDC into escrow contract
- release_bounty: release escrowed USDC to a recipient
- get_facilitators: list active Facinet facilitators

Rules:
- Always plan your steps before executing
- Show the user each step as you go
- For actions that cost money, confirm with the user first
- If an action returns a txHash, always show it
- Be concise. You are a terminal agent, not a chatbot.`

// ─── Convert Anthropic tool schema → Groq/OpenAI tool schema ─────────────────

function toGroqTools(tools) {
  return tools.map(t => ({
    type: 'function',
    function: {
      name: t.name,
      description: t.description,
      parameters: t.input_schema,
    },
  }))
}

// ─── Agent loop ───────────────────────────────────────────────────────────────

async function runAgent(userMessage) {
  const messages = [
    { role: 'system', content: SYSTEM },
    { role: 'user', content: userMessage },
  ]

  console.log('\n🤖 ChainAgent thinking...\n')

  while (true) {
    const response = await groq.chat.completions.create({
      model: MODEL,
      max_tokens: 4096,
      tools: toGroqTools(tools),
      tool_choice: 'auto',
      messages,
    })

    const msg = response.choices[0].message
    const finishReason = response.choices[0].finish_reason

    // Print any text the agent says
    if (msg.content) {
      console.log(msg.content)
    }

    // If agent is done, break
    if (finishReason === 'stop') break

    // If agent wants to use tools
    if (finishReason === 'tool_calls' && msg.tool_calls?.length) {
      // Add assistant message with tool calls to history
      messages.push(msg)

      for (const toolCall of msg.tool_calls) {
        const toolName = toolCall.function.name
        const toolInput = JSON.parse(toolCall.function.arguments)

        console.log(`\n⚡ Executing: ${toolName}`)
        console.log(`   Input: ${JSON.stringify(toolInput, null, 2)}`)

        const result = await executeTool(toolName, toolInput, facinet)

        console.log(`   Result: ${JSON.stringify(result, null, 2)}\n`)

        // Feed each tool result back
        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(result),
        })
      }
    }
  }
}

// ─── CLI ──────────────────────────────────────────────────────────────────────

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

console.log('╔══════════════════════════════════════╗')
console.log('║     ChainAgent — On-Chain AI Agent   ║')
console.log('║     Network: avalanche-fuji          ║')
console.log('║     Powered by Facinet SDK           ║')
console.log('╚══════════════════════════════════════╝')
console.log('\nCommands you can try:')
console.log('  → wallet balance')
console.log('  → send 0.50 USDC to 0xAbc...')
console.log('  → mint nft "Vibeathon Winner" to 0xAbc...')
console.log('  → lock bounty 1 USDC')
console.log('  → list facilitators')
console.log('  → deploy contract\n')

function prompt() {
  rl.question('you > ', async (input) => {
    if (input.trim().toLowerCase() === 'exit') {
      console.log('Goodbye.')
      rl.close()
      return
    }
    if (input.trim()) {
      await runAgent(input.trim())
    }
    prompt()
  })
}

prompt()
