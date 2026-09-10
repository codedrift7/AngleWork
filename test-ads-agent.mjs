/**
 * Quick Test Script for Ads Agent
 * 
 * This script provides a fast way to test the ads agent without running
 * the full test suite. It uses mocked data to verify the basic structure
 * and validation logic.
 * 
 * Usage: node test-ads-agent.mjs
 */

// Sample product brief data
const sampleProductBrief = {
  productName: "FreelanceBooks",
  description: "Automated bookkeeping assistant for freelancers earning $30k-$150k/year",
  category: "SaaS",
  productType: "subscription",
  targetCustomer: "Solo freelancers and consultants earning $30k-$150k annually",
  customerProblem: "Spending hours every week on manual bookkeeping instead of client work",
  customerSophistication: "aware",
  mainBenefit: "Know your real profit without becoming an accountant",
  keyDifferentiator: "Built specifically for freelancers, not generic accounting software",
  price: "$29/month",
  marketingGoal: "acquisition",
  launchType: "new",
  desiredCTA: "Start your 14-day free trial",
  primaryChannel: "linkedin",
  campaignDuration: "ongoing"
}

// Sample AIDA strategy
const sampleAidaStrategy = {
  attention: {
    stage: 'attention',
    objective: 'Hook the reader with the primary pain point of financial uncertainty',
    contentDirection: 'Lead with the gap between bank balance and actual available money',
    keyPoints: [
      'Your bank balance isn\'t the same as knowing how much money you have',
      'Manual bookkeeping creates blind spots in your finances',
      'Sunday nights spent sorting receipts instead of resting'
    ]
  },
  interest: {
    stage: 'interest',
    objective: 'Build credibility and explain why current solutions fail',
    contentDirection: 'Show the cost of the unsolved problem',
    keyPoints: [
      'Spreadsheets require constant maintenance',
      'Generic accounting software is built for accountants',
      'Guessing at your numbers leads to bad decisions'
    ]
  },
  desire: {
    stage: 'desire',
    objective: 'Paint the picture of the transformed state',
    contentDirection: 'Show the shift from uncertainty to clarity',
    keyPoints: [
      'Know your real profit after every project closes',
      'See proactive tax estimates before deadlines',
      'Make confident decisions based on actual numbers'
    ]
  },
  action: {
    stage: 'action',
    objective: 'Drive the primary CTA',
    contentDirection: 'Remove friction and reinforce the core promise',
    keyPoints: [
      'Start your 14-day free trial today',
      'No credit card required',
      'Know your real numbers without becoming an accountant'
    ]
  }
}

// Sample messaging angle
const sampleAngle = {
  type: 'pain-focused',
  tagline: 'Stop guessing. Start knowing.',
  coreMessage: 'Freelancers deserve to know their real profit without spending hours on bookkeeping',
  rationale: 'Speaks directly to the frustration of financial uncertainty'
}

// Mock ads output (what we expect from the agent)
const mockAdsOutput = [
  {
    channel: 'ads',
    stage: 'attention',
    assetType: 'ad',
    title: 'Pain-Based Ad',
    content: {
      angle: 'pain',
      headline: 'Still sorting receipts every Sunday?',
      primaryText: 'Every Sunday you spend 3 hours on bookkeeping is a Sunday you\'re not growing your business. Most freelancers waste 15+ hours per month just trying to understand their finances.',
      cta: 'See how it works',
      targetAudience: 'Freelancers earning $30k-$150k who manually track their finances',
      stage: 'attention',
      rationale: 'Opens with the specific pain of weekend bookkeeping sessions, a frustration many freelancers experience'
    }
  },
  {
    channel: 'ads',
    stage: 'desire',
    assetType: 'ad',
    title: 'Outcome-Based Ad',
    content: {
      angle: 'outcome',
      headline: 'Know your real profit in minutes',
      primaryText: 'Imagine knowing exactly what you can spend — without hiring an accountant. FreelanceBooks gives you instant clarity on your true financial position.',
      cta: 'Start your 14-day free trial',
      targetAudience: 'Freelancers who want financial clarity without accounting expertise',
      stage: 'desire',
      rationale: 'Paints the "after" state of having financial clarity, making the transformation feel achievable'
    }
  },
  {
    channel: 'ads',
    stage: 'action',
    assetType: 'ad',
    title: 'Identity-Based Ad',
    content: {
      angle: 'identity',
      headline: 'Built for freelancers who run businesses, not spreadsheets',
      primaryText: 'You started this business to do what you love. Let FreelanceBooks handle the bookkeeping so you can focus on what matters.',
      cta: 'Join freelancers like me',
      targetAudience: 'Ambitious freelancers who want to focus on their craft, not admin',
      stage: 'action',
      rationale: 'Speaks to the freelancer identity — someone who values their expertise over admin work'
    }
  }
]

// Validation function
function validateAdsOutput(ads) {
  const errors = []
  
  // Check we have exactly 3 ads
  if (ads.length !== 3) {
    errors.push(`Expected 3 ads but got ${ads.length}`)
  }
  
  const expectedAngles = ['pain', 'outcome', 'identity']
  const expectedStages = ['attention', 'desire', 'action']
  
  ads.forEach((ad, index) => {
    const prefix = `Ad ${index + 1}`
    
    // Check channel
    if (ad.channel !== 'ads') {
      errors.push(`${prefix}: incorrect channel "${ad.channel}", expected "ads"`)
    }
    
    // Check asset type
    if (ad.assetType !== 'ad') {
      errors.push(`${prefix}: incorrect assetType "${ad.assetType}", expected "ad"`)
    }
    
    // Check stage
    if (ad.stage !== expectedStages[index]) {
      errors.push(`${prefix}: incorrect stage "${ad.stage}", expected "${expectedStages[index]}"`)
    }
    
    const content = ad.content
    
    // Check angle
    if (content.angle !== expectedAngles[index]) {
      errors.push(`${prefix}: incorrect angle "${content.angle}", expected "${expectedAngles[index]}"`)
    }
    
    // Check required fields
    if (!content.headline || content.headline.length < 10 || content.headline.length > 100) {
      errors.push(`${prefix}: headline must be 10-100 characters (got ${content.headline?.length || 0})`)
    }
    
    if (!content.primaryText || content.primaryText.length < 50 || content.primaryText.length > 300) {
      errors.push(`${prefix}: primaryText must be 50-300 characters (got ${content.primaryText?.length || 0})`)
    }
    
    if (!content.cta || content.cta.length < 5 || content.cta.length > 50) {
      errors.push(`${prefix}: CTA must be 5-50 characters (got ${content.cta?.length || 0})`)
    }
    
    if (!content.targetAudience || content.targetAudience.length < 20 || content.targetAudience.length > 200) {
      errors.push(`${prefix}: targetAudience must be 20-200 characters (got ${content.targetAudience?.length || 0})`)
    }
    
    if (!content.rationale || content.rationale.length < 20 || content.rationale.length > 300) {
      errors.push(`${prefix}: rationale must be 20-300 characters (got ${content.rationale?.length || 0})`)
    }
  })
  
  return errors
}

// Run the test
console.log('🧪 Testing Ads Agent Output Structure\n')
console.log('Testing with sample product:', sampleProductBrief.productName)
console.log('Selected angle:', sampleAngle.tagline)
console.log('')

const errors = validateAdsOutput(mockAdsOutput)

if (errors.length === 0) {
  console.log('✅ All validation checks passed!\n')
  
  console.log('Generated Ads:')
  mockAdsOutput.forEach((ad, index) => {
    console.log(`\n${index + 1}. ${ad.title} (${ad.content.angle})`)
    console.log(`   Stage: ${ad.stage}`)
    console.log(`   Headline: "${ad.content.headline}" (${ad.content.headline.length} chars)`)
    console.log(`   Primary Text: "${ad.content.primaryText}" (${ad.content.primaryText.length} chars)`)
    console.log(`   CTA: "${ad.content.cta}"`)
    console.log(`   Target Audience: ${ad.content.targetAudience}`)
    console.log(`   Rationale: ${ad.content.rationale}`)
  })
  
  console.log('\n✨ Ads agent structure is correct!')
  console.log('\n📝 Next: Run verify-ads-agent.mjs to test with actual API call')
} else {
  console.log('❌ Validation errors found:\n')
  errors.forEach(error => console.log(`   - ${error}`))
  process.exit(1)
}
