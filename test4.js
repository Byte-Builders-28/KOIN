import { executeTool } from './executor.js'; executeTool('lock_bounty', { amount: '1', deadline_hours: 24, task_description: 'Task' }).then(console.log).catch(console.error)
