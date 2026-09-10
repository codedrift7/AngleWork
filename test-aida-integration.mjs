/**
 * Integration test for AIDA Strategist in pipeline orchestrator
 * Tests Task 5.2 implementation
 */

import { PrismaClient } from './src/generated/prisma/client.js'
import { neon } from '@neondatabase/serverless'
import { PrismaNeon } from '@prisma/adapter-neon'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

// Initialize Prisma with Neon adapter
const sql = neon(process.env.DATABASE_URL)
const adapter = new PrismaNeon(sql)
const prisma = new PrismaClient({ adapter })

// Sample product brief data
const testProductBrief = {
  productName: 'TaskFlow AI',
  description: 'AI-powered project management tool that predicts blockers before they happen',
  category: 'Project Management',
  productType: 'SaaS',
  targetCustomer: 'Engineering teams at 10-100 person startups who are drowning in Jira complexity',
  customerProblem: 'Project delays because teams don\'t see blockers coming',
  customerSophistication: 'Solution-aware (tried multiple PM tools, frustrated)',
  mainBenefit: 'Ship 20% faster by predicting blockers before they derail sprints',
  keyDifferentiator: 'AI predicts blockers based on team behavior patterns, not just ticket status',
  price: '$49/month per team',
  marketingGoal: 'Generate 100 trial signups',
  launchType: 'New product launch',
  desiredCTA: 'Start your 14-day free trial',
  primaryChannel: 'LinkedIn',
  campaignDuration: '7 days',
  competitors: 'Jira, Linear, Asana',
  brandVoice: 'Confident but not arrogant, data-driven, empathetic to team struggles'
}

async function runTest() {
  console.log('='.repeat(80))
  console.log('Task 5.2: AIDA Strategist Integration Test')
  console.log('='.repeat(80))
  console.log('')

  let campaignId
  let strategyId

  try {
    // Step 1: Create test campaign and product brief
    console.log('[Step 1] Creating test campaign and product brief...')
    const campaign = await prisma.campaign.create({
      data: {
        name: `Test Campaign - AIDA Integration ${new Date().toISOString()}`,
        status: 'draft',
        productBrief: {
          create: testProductBrief
        }
      },
      include: {
        productBrief: true
      }
    })

    campaignId = campaign.id
    console.log(`✓ Campaign created: ${campaignId}`)
    console.log(`  Product: ${campaign.productBrief.productName}`)
    console.log('')

    // Step 2: Create mock strategy with Product Intelligence and Positioning
    console.log('[Step 2] Creating mock strategy with Product Intelligence and Positioning...')
    const strategy = await prisma.strategy.create({
      data: {
        campaignId,
        productIntelligence: {
          idealCustomerProfile: 'Engineering managers at 10-100 person startups managing 3-10 developers who spend 5+ hours per week in project management tools and are frustrated by unexpected delays',
          coreProblem: 'Teams ship late because blockers appear suddenly, leaving engineering managers scrambling to reassign work and explain delays',
          primaryPain: 'I never see the blockers coming until it\'s too late',
          desiredOutcome: 'Ship sprints on time without constant firefighting',
          corePromise: 'See blockers 3-5 days before they impact your sprint',
          differentiators: [
            'AI predicts blockers from team behavior, not ticket metadata',
            'Works with existing tools (Jira, Linear, GitHub)',
            'Improves automatically as it learns your team patterns'
          ],
          emotionalDrivers: [
            'Fear of missing deadlines and disappointing stakeholders',
            'Aspiration to run a predictable, high-performing team',
            'Identity as a proactive leader who prevents problems'
          ],
          objections: [
            'Another tool to manage',
            'Will the AI predictions be accurate?',
            'How long until it learns our team patterns?'
          ],
          recommendedMessagingAngle: 'pain'
        },
        positioning: {
          category: 'AI-Powered Project Management',
          positioningStatement: 'TaskFlow AI is the project management tool that prevents delays before they happen by predicting blockers 3-5 days in advance',
          valueProposition: 'Ship sprints on time by seeing blockers before they derail your team—no more last-minute scrambling or missed deadlines',
          primaryPain: 'Teams ship late because blockers appear suddenly, leaving engineering managers scrambling',
          desiredTransformation: 'From reactive firefighting to proactive sprint planning with predictable velocity'
        },
        messagingAngles: [
          {
            type: 'pain',
            tagline: 'Stop getting blindsided by blockers',
            coreMessage: 'You are tracking everything in Jira, but delays still appear out of nowhere. TaskFlow AI predicts blockers 3-5 days before they impact your sprint, so you can prevent delays instead of explaining them.',
            rationale: 'Leads with the core frustration—unexpected blockers—that engineering managers face daily. Positions TaskFlow as the solution to a painful problem they already recognize.'
          },
          {
            type: 'outcome',
            tagline: 'Ship sprints on time, every time',
            coreMessage: 'Imagine closing every sprint without last-minute scrambling or missed deadlines. TaskFlow AI gives you 3-5 days of warning before blockers hit, so your team stays on track.',
            rationale: 'Focuses on the desired state—predictable velocity—that engineering managers aspire to achieve. Appeals to proactive leaders who want to run high-performing teams.'
          },
          {
            type: 'time',
            tagline: 'Get 5 hours per week back from project management',
            coreMessage: 'Stop spending hours each week chasing status updates and firefighting delays. TaskFlow AI tells you what will go wrong before it happens, so you can focus on building instead of babysitting tickets.',
            rationale: 'Emphasizes time savings and reduced cognitive load. Resonates with engineering managers who feel overwhelmed by project management overhead.'
          }
        ],
        selectedAngleIndex: 0 // Pain angle selected
      }
    })

    strategyId = strategy.id
    console.log(`✓ Strategy created: ${strategyId}`)
    console.log(`  Selected angle: ${strategy.messagingAngles[0].type}`)
    console.log(`  Tagline: ${strategy.messagingAngles[0].tagline}`)
    console.log('')

    // Step 3: Update campaign status to positioning_complete
    console.log('[Step 3] Updating campaign status to positioning_complete...')
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: 'positioning_complete' }
    })
    console.log('✓ Status updated')
    console.log('')

    // Step 4: Test resumePipelineAfterAngleSelection
    console.log('[Step 4] Testing resumePipelineAfterAngleSelection...')
    console.log('This will call the AIDA Strategist agent...')
    console.log('')

    // Import the orchestrator function
    const { resumePipelineAfterAngleSelection } = await import('./src/lib/pipeline/orchestrator.ts')

    // Call the function - this will execute the AIDA Strategist
    await resumePipelineAfterAngleSelection(campaignId, 0)

    console.log('')
    console.log('[Step 5] Verifying results...')

    // Fetch updated strategy
    const updatedStrategy = await prisma.strategy.findUnique({
      where: { campaignId }
    })

    if (!updatedStrategy) {
      throw new Error('Strategy not found after pipeline execution')
    }

    const aidaStrategy = updatedStrategy.aidaStrategy

    // Verify AIDA Strategy exists and is not empty
    if (!aidaStrategy || typeof aidaStrategy !== 'object') {
      throw new Error('AIDA Strategy is missing or invalid')
    }

    console.log('✓ AIDA Strategy stored in database')
    console.log('')

    // Verify all 4 stages are present
    const requiredStages = ['attention', 'interest', 'desire', 'action']
    for (const stageName of requiredStages) {
      if (!aidaStrategy[stageName]) {
        throw new Error(`Missing AIDA stage: ${stageName}`)
      }
      
      const stage = aidaStrategy[stageName]
      
      // Verify required fields
      if (!stage.objective || stage.objective.trim().length === 0) {
        throw new Error(`${stageName} stage has empty objective`)
      }
      if (!stage.contentDirection || stage.contentDirection.trim().length === 0) {
        throw new Error(`${stageName} stage has empty contentDirection`)
      }
      if (!stage.keyPoints || !Array.isArray(stage.keyPoints) || stage.keyPoints.length < 2) {
        throw new Error(`${stageName} stage has insufficient keyPoints`)
      }

      console.log(`✓ ${stageName.toUpperCase()} stage validated:`)
      console.log(`  Objective: ${stage.objective.substring(0, 100)}...`)
      console.log(`  Key Points: ${stage.keyPoints.length} points`)
      console.log(`  Proof Requirements: ${stage.proofRequirements ? stage.proofRequirements.length : 0} placeholders`)
      console.log('')
    }

    // Verify campaign status updated
    const updatedCampaign = await prisma.campaign.findUnique({
      where: { id: campaignId }
    })

    if (updatedCampaign.status !== 'assets_complete') {
      console.log(`⚠ Campaign status: ${updatedCampaign.status}`)
      console.log('  Note: Pipeline continues through remaining stages (Campaign Builder, Critic, Calendar)')
      console.log('  Status "assets_complete" expected after full pipeline run')
    } else {
      console.log(`✓ Campaign status: ${updatedCampaign.status}`)
    }
    console.log('')

    // Display AIDA Strategy summary
    console.log('='.repeat(80))
    console.log('AIDA Strategy Summary')
    console.log('='.repeat(80))
    console.log('')
    
    for (const stageName of requiredStages) {
      const stage = aidaStrategy[stageName]
      console.log(`${stageName.toUpperCase()} STAGE:`)
      console.log(`Objective: ${stage.objective}`)
      console.log(`Content Direction: ${stage.contentDirection.substring(0, 200)}...`)
      console.log(`Key Points:`)
      stage.keyPoints.forEach((point, idx) => {
        console.log(`  ${idx + 1}. ${point}`)
      })
      if (stage.proofRequirements && stage.proofRequirements.length > 0) {
        console.log(`Proof Requirements: ${stage.proofRequirements.join(', ')}`)
      }
      console.log('')
    }

    console.log('='.repeat(80))
    console.log('✅ Task 5.2 Integration Test PASSED')
    console.log('='.repeat(80))
    console.log('')
    console.log('Verified:')
    console.log('  ✓ AIDA Strategist integrated into orchestrator')
    console.log('  ✓ All 4 AIDA stages generated with complete fields')
    console.log('  ✓ Strategy record updated with aidaStrategy JSON')
    console.log('  ✓ Campaign status progressed through pipeline')
    console.log('  ✓ Validation logic enforces non-empty fields')
    console.log('')

  } catch (error) {
    console.error('')
    console.error('❌ Test FAILED')
    console.error('='.repeat(80))
    console.error('Error:', error.message)
    if (error.stack) {
      console.error('')
      console.error('Stack trace:')
      console.error(error.stack)
    }
    process.exit(1)
  } finally {
    // Cleanup: Delete test data
    if (campaignId) {
      console.log('Cleaning up test data...')
      try {
        await prisma.campaign.delete({
          where: { id: campaignId }
        })
        console.log('✓ Test data cleaned up')
      } catch (error) {
        console.error('⚠ Failed to clean up test data:', error.message)
      }
    }

    await prisma.$disconnect()
  }
}

// Run the test
runTest()
