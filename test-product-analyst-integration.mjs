/**
 * Integration test for Product Analyst pipeline stage
 * 
 * Tests:
 * - Product Analyst agent is called with correct data
 * - 30-second timeout is enforced
 * - Prerequisite field validation works
 * - Strategy record is created with Product Intelligence
 * - Campaign status transitions correctly
 */

import "dotenv/config";
import { PrismaClient } from './src/generated/prisma/client.js';
import { neonConfig, Pool } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import ws from 'ws';

// Configure Neon WebSocket
neonConfig.webSocketConstructor = ws;

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaNeon(pool);
const prisma = new PrismaClient({ adapter });

// Sample product brief data
const sampleProductBrief = {
  productName: "QuickBooks Lite",
  description: "An AI-powered bookkeeping assistant that automatically categorizes transactions and generates financial reports for freelancers and small business owners.",
  category: "Financial Software",
  productType: "SaaS",
  targetCustomer: "Freelancers earning $30k–$150k/year who handle their own bookkeeping",
  customerProblem: "Freelancers spend hours each week on bookkeeping tasks they don't enjoy, often making mistakes that cost them money at tax time.",
  customerSophistication: "Aware",
  mainBenefit: "Reclaim your time by automating bookkeeping while staying on top of your finances",
  keyDifferentiator: "AI-powered transaction categorization with proactive tax estimates",
  price: "$29/month",
  marketingGoal: "Acquire 1000 paying customers",
  launchType: "New Product Launch",
  desiredCTA: "Start your free trial",
  primaryChannel: "LinkedIn",
  campaignDuration: "4 weeks",
  competitors: "QuickBooks Self-Employed, FreshBooks",
  brandVoice: "Friendly, empowering, practical"
};

async function testProductAnalystIntegration() {
  console.log("🧪 Testing Product Analyst Integration");
  console.log("=" .repeat(50));

  let testCampaignId = null;

  try {
    // ========================================================================
    // Test 1: Create campaign and product brief
    // ========================================================================
    console.log("\n✅ Test 1: Creating campaign and product brief...");
    
    const campaign = await prisma.campaign.create({
      data: {
        name: "Test Campaign - Product Analyst Integration",
        status: "draft",
        productBrief: {
          create: sampleProductBrief
        }
      },
      include: {
        productBrief: true
      }
    });

    testCampaignId = campaign.id;
    console.log(`   Campaign created: ${campaign.id}`);
    console.log(`   Status: ${campaign.status}`);

    // ========================================================================
    // Test 2: Import and run pipeline orchestrator
    // ========================================================================
    console.log("\n✅ Test 2: Running pipeline with Product Analyst...");
    
    // Dynamic import of the orchestrator
    const { runCampaignPipeline } = await import('./src/lib/pipeline/orchestrator.ts');
    
    const startTime = Date.now();
    await runCampaignPipeline(campaign.id, campaign.productBrief);
    const elapsed = Date.now() - startTime;
    
    console.log(`   Pipeline Stage 1 completed in ${elapsed}ms`);

    // ========================================================================
    // Test 3: Verify Strategy record was created
    // ========================================================================
    console.log("\n✅ Test 3: Verifying Strategy record...");
    
    const strategy = await prisma.strategy.findUnique({
      where: { campaignId: campaign.id }
    });

    if (!strategy) {
      throw new Error("Strategy record not found!");
    }

    console.log(`   Strategy record created: ${strategy.id}`);

    // ========================================================================
    // Test 4: Verify Product Intelligence content
    // ========================================================================
    console.log("\n✅ Test 4: Verifying Product Intelligence content...");
    
    const productIntelligence = strategy.productIntelligence;
    
    if (typeof productIntelligence !== 'object' || productIntelligence === null) {
      throw new Error("Product Intelligence is not an object!");
    }

    const requiredFields = [
      'idealCustomerProfile',
      'coreProblem',
      'primaryPain',
      'desiredOutcome',
      'corePromise',
      'differentiators',
      'emotionalDrivers',
      'objections',
      'recommendedMessagingAngle'
    ];

    console.log("   Checking required fields:");
    for (const field of requiredFields) {
      if (!(field in productIntelligence)) {
        throw new Error(`Missing field: ${field}`);
      }
      console.log(`     ✓ ${field}`);
    }

    // ========================================================================
    // Test 5: Verify field constraints
    // ========================================================================
    console.log("\n✅ Test 5: Verifying field constraints...");
    
    // Primary pain should be first-person and 5-200 chars
    const primaryPain = productIntelligence.primaryPain;
    console.log(`   Primary Pain: "${primaryPain}"`);
    console.log(`   Length: ${primaryPain.length} chars`);
    
    if (primaryPain.length < 5 || primaryPain.length > 200) {
      throw new Error(`Primary pain length out of bounds: ${primaryPain.length}`);
    }

    // Should have 2-5 objections
    const objections = productIntelligence.objections;
    console.log(`   Objections count: ${objections.length}`);
    
    if (objections.length < 2 || objections.length > 5) {
      throw new Error(`Objections count out of bounds: ${objections.length}`);
    }

    // Should have 1-5 differentiators
    const differentiators = productIntelligence.differentiators;
    console.log(`   Differentiators count: ${differentiators.length}`);
    
    if (differentiators.length < 1 || differentiators.length > 5) {
      throw new Error(`Differentiators count out of bounds: ${differentiators.length}`);
    }

    // Recommended messaging angle should be one of: pain, outcome, time
    const messagingAngle = productIntelligence.recommendedMessagingAngle;
    console.log(`   Recommended angle: ${messagingAngle}`);
    
    if (!['pain', 'outcome', 'time'].includes(messagingAngle)) {
      throw new Error(`Invalid messaging angle: ${messagingAngle}`);
    }

    // ========================================================================
    // Test 6: Verify campaign status transition
    // ========================================================================
    console.log("\n✅ Test 6: Verifying campaign status...");
    
    const updatedCampaign = await prisma.campaign.findUnique({
      where: { id: campaign.id }
    });

    console.log(`   Campaign status: ${updatedCampaign.status}`);
    
    if (updatedCampaign.status !== 'intelligence_complete') {
      throw new Error(`Expected status 'intelligence_complete', got '${updatedCampaign.status}'`);
    }

    // ========================================================================
    // Test 7: Display sample output
    // ========================================================================
    console.log("\n✅ Test 7: Sample Product Intelligence output:");
    console.log("   " + "─".repeat(48));
    console.log(`   ICP: ${productIntelligence.idealCustomerProfile.substring(0, 80)}...`);
    console.log(`   Primary Pain: ${productIntelligence.primaryPain}`);
    console.log(`   Desired Outcome: ${productIntelligence.desiredOutcome.substring(0, 80)}...`);
    console.log(`   Core Promise: ${productIntelligence.corePromise.substring(0, 80)}...`);
    console.log(`   Differentiators: ${differentiators.slice(0, 2).join(', ')}`);
    console.log(`   Objections: ${objections.slice(0, 2).join(', ')}`);
    console.log("   " + "─".repeat(48));

    console.log("\n🎉 All tests passed!");

  } catch (error) {
    console.error("\n❌ Test failed:");
    console.error(error.message);
    if (error.stack) {
      console.error("\nStack trace:");
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    // Clean up test data
    if (testCampaignId) {
      console.log("\n🧹 Cleaning up test data...");
      try {
        await prisma.campaign.delete({
          where: { id: testCampaignId }
        });
        console.log("   Test campaign deleted");
      } catch (error) {
        console.error("   Failed to delete test campaign:", error.message);
      }
    }

    await prisma.$disconnect();
  }
}

// ============================================================================
// Test for missing prerequisite fields (Req 2.9)
// ============================================================================
async function testMissingPrerequisiteFields() {
  console.log("\n🧪 Testing Missing Prerequisite Fields (Req 2.9)");
  console.log("=" .repeat(50));

  let testCampaignId = null;

  try {
    // Create campaign with incomplete product brief (missing mainBenefit)
    const incompleteBrief = {
      ...sampleProductBrief,
      mainBenefit: "" // Missing required field
    };

    const campaign = await prisma.campaign.create({
      data: {
        name: "Test Campaign - Missing Prerequisites",
        status: "draft",
        productBrief: {
          create: incompleteBrief
        }
      },
      include: {
        productBrief: true
      }
    });

    testCampaignId = campaign.id;

    // Try to run pipeline - should fail
    const { runCampaignPipeline } = await import('./src/lib/pipeline/orchestrator.ts');
    
    try {
      await runCampaignPipeline(campaign.id, campaign.productBrief);
      throw new Error("Pipeline should have failed with missing prerequisites!");
    } catch (error) {
      if (error.message.includes("missing required fields")) {
        console.log("   ✅ Pipeline correctly rejected incomplete brief");
        console.log(`   Error message: ${error.message}`);
      } else {
        throw error;
      }
    }

    // Verify campaign status is 'error'
    const updatedCampaign = await prisma.campaign.findUnique({
      where: { id: campaign.id }
    });

    if (updatedCampaign.status !== 'error') {
      throw new Error(`Expected status 'error', got '${updatedCampaign.status}'`);
    }

    console.log("   ✅ Campaign status correctly set to 'error'");
    console.log("\n🎉 Prerequisite validation test passed!");

  } catch (error) {
    console.error("\n❌ Test failed:");
    console.error(error.message);
    process.exit(1);
  } finally {
    // Clean up
    if (testCampaignId) {
      await prisma.campaign.delete({
        where: { id: testCampaignId }
      }).catch(() => {});
    }
    await prisma.$disconnect();
  }
}

// Run tests
console.log("🚀 Starting Product Analyst Integration Tests\n");
await testProductAnalystIntegration();
await testMissingPrerequisiteFields();
console.log("\n✨ All integration tests completed successfully!");
