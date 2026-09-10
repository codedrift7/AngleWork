/**
 * Verification script for Task 5.2: AIDA Strategist Integration
 * 
 * This script tests the integration of the AIDA Strategist agent
 * into the pipeline orchestrator's resumePipelineAfterAngleSelection function.
 * 
 * Tests:
 * 1. Fetching campaign with strategy data
 * 2. Calling AIDA Strategist agent
 * 3. Validating all 4 stages with non-empty fields (Req 4.9)
 * 4. Updating Strategy record with aidaStrategy JSON
 * 5. Updating campaign status to "aida_complete"
 */

import * as dotenv from 'dotenv'
import { PrismaClient } from './src/generated/prisma/index.js'
import { Pool, neonConfig } from '@neondatabase/serverless'
import { PrismaNeon } from '@prisma/adapter-neon'
import ws from 'ws'

// Load environment variables
dotenv.config({ path: '.env.local' })
dotenv.config()

// Debug: Check if DATABASE_URL is loaded
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set')
  console.error('   Please ensure .env.local or .env contains DATABASE_URL')
  process.exit(1)
}

console.log('✅ DATABASE_URL loaded from environment')

// Configure WebSocket for Neon
neonConfig.webSocketConstructor = ws

// Create Prisma client with Neon adapter
const connectionString = process.env.DATABASE_URL
const pool = new Pool({ connectionString })
const adapter = new PrismaNeon(pool)
const prisma = new PrismaClient({ adapter })

console.log('🔍 Verifying AIDA Strategist Integration (Task 5.2)\n')

async function verifyAidaIntegration() {
  try {
    // Find a campaign with positioning_complete status
    console.log('1️⃣ Looking for campaign with positioning_complete status...')
    const campaign = await prisma.campaign.findFirst({
      where: { status: 'positioning_complete' },
      include: {
        productBrief: true,
        strategy: true
      },
      orderBy: { createdAt: 'desc' }
    })

    if (!campaign) {
      console.log('⚠️  No campaign found with positioning_complete status')
      console.log('   Creating a test campaign with positioning data...')
      
      // Create a test campaign for verification
      const testCampaign = await createTestCampaign()
      if (testCampaign) {
        console.log(`✅ Created test campaign: ${testCampaign.id}`)
        await verifyPipelineResumption(testCampaign.id, 0)
      }
      return
    }

    console.log(`✅ Found campaign: ${campaign.id}`)
    console.log(`   Status: ${campaign.status}`)
    
    // Verify strategy has messaging angles
    const strategy = campaign.strategy
    if (!strategy) {
      console.log('❌ Campaign has no strategy record')
      return
    }

    const messagingAngles = strategy.messagingAngles
    if (!Array.isArray(messagingAngles) || messagingAngles.length !== 3) {
      console.log(`❌ Strategy has invalid messaging angles: ${messagingAngles?.length || 0} angles`)
      return
    }

    console.log(`✅ Strategy has ${messagingAngles.length} messaging angles`)
    console.log(`   Angle 0: ${messagingAngles[0].tagline}`)
    console.log(`   Angle 1: ${messagingAngles[1].tagline}`)
    console.log(`   Angle 2: ${messagingAngles[2].tagline}`)

    // Test resumePipelineAfterAngleSelection
    console.log('\n2️⃣ Testing resumePipelineAfterAngleSelection...')
    await verifyPipelineResumption(campaign.id, 0)

  } catch (error) {
    console.error('❌ Verification failed:', error.message)
    if (error.stack) {
      console.error(error.stack)
    }
  } finally {
    await prisma.$disconnect()
  }
}

async function createTestCampaign() {
  // This is a simplified version - in reality, would run full pipeline
  const testCampaign = await prisma.campaign.create({
    data: {
      name: 'Test Campaign - AIDA Integration',
      status: 'positioning_complete',
      productBrief: {
        create: {
          productName: 'AI Bookkeeper',
          description: 'Automated bookkeeping for freelancers',
          category: 'SaaS',
          productType: 'B2C',
          targetCustomer: 'Freelancers earning $30k-$150k/year',
          customerProblem: 'Spending too much time on bookkeeping',
          customerSophistication: 'Problem-Aware',
          mainBenefit: 'Automate bookkeeping in minutes',
          keyDifferentiator: 'AI-powered transaction categorization',
          price: '$29/month',
          marketingGoal: 'Acquire 1000 users',
          launchType: 'New Product',
          desiredCTA: 'Start 14-day free trial',
          primaryChannel: 'LinkedIn',
          campaignDuration: '7 days'
        }
      },
      strategy: {
        create: {
          productIntelligence: {
            idealCustomerProfile: 'Freelancers earning $30k-$150k/year',
            coreProblem: 'Uncertainty about real financial position',
            primaryPain: 'I don\'t know where my money is really going',
            desiredOutcome: 'Know my real numbers without becoming an accountant',
            corePromise: 'Clear financial visibility in minutes',
            differentiators: ['AI-powered categorization', 'Proactive tax estimates'],
            emotionalDrivers: ['Control', 'Confidence', 'Freedom'],
            objections: ['Can I trust the numbers?', 'Is my data secure?'],
            recommendedMessagingAngle: 'pain'
          },
          positioning: {
            category: 'AI-powered bookkeeping assistant',
            positioningStatement: 'AI bookkeeper for freelancers',
            valueProposition: 'Clear financial visibility without manual work',
            primaryPain: 'Financial uncertainty',
            desiredTransformation: 'From guessing to knowing'
          },
          messagingAngles: [
            {
              type: 'pain',
              tagline: 'Stop guessing where your money went',
              coreMessage: 'Your bank balance isn\'t the same as knowing how much money you have',
              rationale: 'Addresses primary pain of financial uncertainty'
            },
            {
              type: 'outcome',
              tagline: 'Know your real numbers without becoming an accountant',
              coreMessage: 'Get clear financial visibility in minutes',
              rationale: 'Focuses on desired outcome of effortless clarity'
            },
            {
              type: 'time',
              tagline: 'Take bookkeeping off your Sunday-night to-do list',
              coreMessage: 'Automate what used to take hours',
              rationale: 'Emphasizes time savings and freedom'
            }
          ]
        }
      }
    }
  })

  return testCampaign
}

async function verifyPipelineResumption(campaignId, selectedAngleIndex) {
  try {
    // Import the resumePipelineAfterAngleSelection function
    const { resumePipelineAfterAngleSelection } = await import('./src/lib/pipeline/orchestrator.ts')

    console.log(`\n3️⃣ Resuming pipeline for campaign ${campaignId}...`)
    console.log(`   Selected angle index: ${selectedAngleIndex}`)

    await resumePipelineAfterAngleSelection(campaignId, selectedAngleIndex)

    // Verify the results
    console.log('\n4️⃣ Verifying results...')
    const updatedCampaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: { strategy: true }
    })

    if (!updatedCampaign) {
      console.log('❌ Campaign not found after pipeline resumption')
      return
    }

    console.log(`✅ Campaign status: ${updatedCampaign.status}`)

    if (updatedCampaign.status !== 'aida_complete' && updatedCampaign.status !== 'complete') {
      console.log(`⚠️  Expected status 'aida_complete' or 'complete', got '${updatedCampaign.status}'`)
    }

    const strategy = updatedCampaign.strategy
    if (!strategy) {
      console.log('❌ Strategy not found')
      return
    }

    const aidaStrategy = strategy.aidaStrategy
    if (!aidaStrategy) {
      console.log('❌ AIDA strategy not found in Strategy record')
      return
    }

    console.log('\n5️⃣ Validating AIDA Strategy structure (Req 4.9)...')

    // Validate all 4 stages present
    const stages = ['attention', 'interest', 'desire', 'action']
    let allStagesValid = true

    for (const stageName of stages) {
      const stage = aidaStrategy[stageName]
      
      if (!stage) {
        console.log(`❌ Stage '${stageName}' is missing`)
        allStagesValid = false
        continue
      }

      // Validate non-empty fields
      const validations = [
        { field: 'stage', value: stage.stage, expected: stageName },
        { field: 'objective', value: stage.objective, minLength: 20 },
        { field: 'contentDirection', value: stage.contentDirection, minLength: 50 },
        { field: 'keyPoints', value: stage.keyPoints, minItems: 2 }
      ]

      for (const validation of validations) {
        if (validation.expected) {
          if (validation.value !== validation.expected) {
            console.log(`❌ ${stageName}.${validation.field}: expected '${validation.expected}', got '${validation.value}'`)
            allStagesValid = false
          }
        } else if (validation.minLength) {
          if (!validation.value || validation.value.trim().length < validation.minLength) {
            console.log(`❌ ${stageName}.${validation.field}: too short (min ${validation.minLength} chars)`)
            allStagesValid = false
          }
        } else if (validation.minItems) {
          if (!Array.isArray(validation.value) || validation.value.length < validation.minItems) {
            console.log(`❌ ${stageName}.${validation.field}: too few items (min ${validation.minItems})`)
            allStagesValid = false
          }
        }
      }

      if (stage.objective && stage.contentDirection && stage.keyPoints?.length >= 2) {
        console.log(`✅ Stage '${stageName}' is valid`)
        console.log(`   Objective: ${stage.objective.substring(0, 60)}...`)
        console.log(`   Content direction: ${stage.contentDirection.substring(0, 60)}...`)
        console.log(`   Key points: ${stage.keyPoints.length} points`)
        if (stage.proofRequirements && stage.proofRequirements.length > 0) {
          console.log(`   Proof requirements: ${stage.proofRequirements.join(', ')}`)
        }
      }
    }

    if (allStagesValid) {
      console.log('\n✅ All validation checks passed!')
      console.log('✅ Task 5.2 implementation verified successfully')
    } else {
      console.log('\n⚠️  Some validation checks failed')
    }

  } catch (error) {
    console.error('❌ Pipeline resumption failed:', error.message)
    if (error.stack) {
      console.error(error.stack)
    }
  }
}

// Run verification
verifyAidaIntegration()
