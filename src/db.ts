import 'dotenv/config'
import { PrismaClient } from './generated/prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'

// Configure Neon adapter with extended connection timeout
// The connect_timeout parameter prevents "Unable to start a transaction" errors
// Increased to accommodate Product Analyst agent (120s execution time)
const connectionString = process.env.DATABASE_URL!
const connectionStringWithTimeout = connectionString.includes('?')
  ? `${connectionString}&connect_timeout=30`
  : `${connectionString}?connect_timeout=30`

const adapter = new PrismaNeon({ connectionString: connectionStringWithTimeout })

export const prisma = new PrismaClient({ 
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
})
