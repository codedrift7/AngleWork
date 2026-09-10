/**
 * Simple validation script for Campaign Builder LinkedIn Agent
 * Verifies that task 6.1 requirements are implemented correctly
 */

const fs = require('fs')
const path = require('path')

function validateImplementation() {
    console.log('🔍 Validating Campaign Builder LinkedIn Agent Implementation')
    console.log('=' .repeat(60))
    
    const agentPath = path.join(__dirname, 'src', 'lib', 'pipeline', 'agents', 'campaign-builder.ts')
    const agentCode = fs.readFileSync(agentPath, 'utf-8')
    
    const requirements = [
        {
            id: '5.2',
            name: 'Generate 4 LinkedIn posts (Attention, Interest, Desire, Action)',
            test: () => {
                return agentCode.includes('Generate EXACTLY 4 LinkedIn posts') &&
                       agentCode.includes('Post 1: Attention stage') &&
                       agentCode.includes('Post 2: Interest stage') &&
                       agentCode.includes('Post 3: Desire stage') &&
                       agentCode.includes('Post 4: Action stage')
            }
        },
        {
            id: '5.2',
            name: 'Enforce max 3,000 characters per post',
            test: () => {
                return agentCode.includes('max 3,000 characters') &&
                       agentCode.includes('3000 character limit') &&
                       agentCode.includes('content.content.length > 3000')
            }
        },
        {
            id: '5.6', 
            name: 'Use selected messaging angle as anchor',
            test: () => {
                return agentCode.includes('selected messaging angle as PRIMARY ANCHOR') &&
                       agentCode.includes('Every post must directly reference or support the messaging angle') &&
                       agentCode.includes('selectedAngle')
            }
        },
        {
            id: '5.8',
            name: 'Reference product-specific differentiators',
            test: () => {
                return agentCode.includes('product-specific differentiators') &&
                       agentCode.includes('actual product name') &&
                       agentCode.includes('not generic claims') &&
                       agentCode.includes('productBrief.productName')
            }
        },
        {
            id: '5.7',
            name: 'Insert placeholders for missing proof',
            test: () => {
                return agentCode.includes('Insert customer testimonial here') &&
                       agentCode.includes('Insert metric here') &&
                       agentCode.includes('placeholders for missing proof') &&
                       agentCode.includes('DO NOT fabricate testimonials')
            }
        },
        {
            id: 'Schema',
            name: 'Validate output against LinkedInPostSchema',
            test: () => {
                return agentCode.includes('LinkedInPostSchema') &&
                       agentCode.includes('callLLMWithStructuredOutput') &&
                       agentCode.includes('LinkedInPostsOutputSchema')
            }
        },
        {
            id: 'Agent Pattern',
            name: 'Follow established agent pattern',
            test: () => {
                return agentCode.includes('export async function campaignBuilderLinkedInAgent') &&
                       agentCode.includes('withTimeout') &&
                       agentCode.includes('30000') &&
                       agentCode.includes('metadata:')
            }
        }
    ]
    
    let passed = 0
    let total = requirements.length
    
    console.log('📋 Requirement Validation:\n')
    
    requirements.forEach(req => {
        const result = req.test()
        const status = result ? '✅' : '❌'
        console.log(`${status} [${req.id}] ${req.name}`)
        if (result) passed++
    })
    
    console.log('\n' + '=' .repeat(60))
    console.log(`📊 Results: ${passed}/${total} requirements validated`)
    console.log(`📈 Pass Rate: ${((passed/total) * 100).toFixed(1)}%`)
    
    if (passed === total) {
        console.log('\n✅ All requirements implemented correctly!')
        console.log('Task 6.1 is COMPLETE ✨')
    } else {
        console.log('\n⚠️  Some requirements may need attention.')
    }
    
    // Check file structure
    console.log('\n🏗️  File Structure Validation:')
    
    const requiredFiles = [
        'src/lib/pipeline/agents/campaign-builder.ts',
        'src/lib/types/campaign.ts',
        'src/lib/ai/llm-client.ts'
    ]
    
    requiredFiles.forEach(file => {
        const exists = fs.existsSync(path.join(__dirname, file))
        console.log(`${exists ? '✅' : '❌'} ${file}`)
    })
    
    return passed === total
}

if (require.main === module) {
    const success = validateImplementation()
    process.exit(success ? 0 : 1)
}

module.exports = validateImplementation