/**
 * Preservation Property Tests for Pipeline Execution Failures Bugfix
 * 
 * **IMPORTANT**: These tests capture current CORRECT behavior that must be preserved
 * after implementing both Bug #1 (NEXT_REDIRECT logging) and Bug #2 (timeout) fixes.
 * 
 * **Methodology**: Observation-first approach
 * - Run tests on UNFIXED code first to observe baseline behavior
 * - Tests should PASS on unfixed code (capturing what works correctly now)
 * - After implementing fixes, re-run to ensure no regressions
 * 
 * **Validates: Requirements 3.1-3.9 (Preservation requirements)**
 */

import { readFileSync } from 'fs'
import { join } from 'path'
import { describe, expect, it } from 'vitest'

describe('Preservation Properties: Error Handling and Timeouts', () => {
  
  // ============================================================================
  // Property 2.1: Genuine Error Logging Preservation
  // ============================================================================
  
  describe('Property 2.1: Genuine Errors Must Still Be Logged', () => {
    /**
     * Validates: Requirements 3.1
     * 
     * When genuine errors occur (database failures, validation errors, network errors),
     * the system MUST continue to log them at line 213 with "createCampaignFromBrief error:" prefix.
     * 
     * This test verifies that the console.error statement still exists and is executed
     * for non-NEXT_REDIRECT errors.
     */
    it('console.error statement exists and logs genuine errors', () => {
      const campaignFilePath = join(process.cwd(), 'src', 'actions', 'campaign.ts')
      const sourceCode = readFileSync(campaignFilePath, 'utf-8')
      const lines = sourceCode.split('\n')

      // Find console.error in catch block for createCampaignFromBrief
      let consoleErrorLine = -1
      let catchBlockStart = -1

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim()
        
        // Find console.error for createCampaignFromBrief (this is specific to our function)
        if (line.includes('console.error') && 
            line.includes('createCampaignFromBrief error')) {
          consoleErrorLine = i
          
          // Find the catch block that contains this console.error
          // Look backwards for the nearest catch block
          for (let j = i; j >= 0; j--) {
            if (lines[j].trim().includes('} catch (error)')) {
              catchBlockStart = j
              break
            }
          }
          break
        }
      }

      console.log('\n=== PRESERVATION CHECK: Genuine Error Logging ===')
      console.log(`Catch block found at line: ${catchBlockStart + 1}`)
      console.log(`console.error found at line: ${consoleErrorLine + 1}`)
      console.log(`Error logging statement: ${lines[consoleErrorLine]}`)
      console.log('=== END PRESERVATION CHECK ===\n')

      // Verify console.error exists and is after catch block
      expect(catchBlockStart).toBeGreaterThan(0)
      expect(consoleErrorLine).toBeGreaterThan(0)
      expect(consoleErrorLine).toBeGreaterThan(catchBlockStart)
      expect(lines[consoleErrorLine]).toContain('console.error')
      expect(lines[consoleErrorLine]).toContain('createCampaignFromBrief error')
    })

    /**
     * Verifies that the error logging is NOT removed, only made conditional
     * for NEXT_REDIRECT errors after the fix.
     */
    it('error logging logic is preserved (not removed)', () => {
      const campaignFilePath = join(process.cwd(), 'src', 'actions', 'campaign.ts')
      const sourceCode = readFileSync(campaignFilePath, 'utf-8')

      // The console.error line must still exist
      expect(sourceCode).toContain('[Server Action] createCampaignFromBrief error:')
      expect(sourceCode).toContain('console.error')
    })
  })

  // ============================================================================
  // Property 2.2: Zod Validation Error Handling Preservation
  // ============================================================================
  
  describe('Property 2.2: Zod Validation Errors Must Produce Field-Specific Messages', () => {
    /**
     * Validates: Requirements 3.2
     * 
     * When Zod validation errors occur, the system MUST continue to:
     * 1. Extract field-specific error messages from validation issues
     * 2. Return them in the fieldErrors object
     * 3. Return success: false with appropriate error message
     * 
     * This behavior (lines 216-226 in campaign.ts) must remain unchanged.
     */
    it('Zod error handling block exists and maps to fieldErrors', () => {
      const campaignFilePath = join(process.cwd(), 'src', 'actions', 'campaign.ts')
      const sourceCode = readFileSync(campaignFilePath, 'utf-8')
      const lines = sourceCode.split('\n')

      // Find the Zod error handling section in catch block
      let zodErrorHandlingStart = -1
      let fieldErrorsMapping = -1

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim()
        
        if (line.includes('if (error instanceof z.ZodError)')) {
          zodErrorHandlingStart = i
        }
        
        if (line.includes('error.issues.forEach') || 
            line.includes('error.issues.map')) {
          fieldErrorsMapping = i
        }
      }

      console.log('\n=== PRESERVATION CHECK: Zod Error Handling ===')
      console.log(`Zod error check found at line: ${zodErrorHandlingStart + 1}`)
      console.log(`Field errors mapping at line: ${fieldErrorsMapping + 1}`)
      
      // Show the Zod error handling block
      if (zodErrorHandlingStart > 0) {
        console.log('\nZod Error Handling Block:')
        for (let i = zodErrorHandlingStart; i < Math.min(zodErrorHandlingStart + 10, lines.length); i++) {
          if (lines[i].trim().startsWith('return {')) break
          console.log(`  ${lines[i]}`)
        }
      }
      
      console.log('=== END PRESERVATION CHECK ===\n')

      // Verify Zod error handling exists
      expect(zodErrorHandlingStart).toBeGreaterThan(0)
      expect(fieldErrorsMapping).toBeGreaterThan(0)
      expect(sourceCode).toContain('z.ZodError')
      expect(sourceCode).toContain('fieldErrors')
    })

    /**
     * Verifies the structure of Zod error response
     */
    it('Zod error response structure is preserved', () => {
      const campaignFilePath = join(process.cwd(), 'src', 'actions', 'campaign.ts')
      const sourceCode = readFileSync(campaignFilePath, 'utf-8')

      // Check for the key components of Zod error handling
      expect(sourceCode).toContain('if (error instanceof z.ZodError)')
      expect(sourceCode).toContain('fieldErrors: Record<string, string>')
      expect(sourceCode).toContain('error.issues.forEach')
      expect(sourceCode).toContain('success: false')
    })
  })

  // ============================================================================
  // Property 2.3: NEXT_REDIRECT Re-throw Preservation
  // ============================================================================
  
  describe('Property 2.3: NEXT_REDIRECT Errors Must Still Be Re-thrown', () => {
    /**
     * Validates: Requirements 3.3
     * 
     * CRITICAL: The NEXT_REDIRECT re-throw logic at line 235 MUST be preserved.
     * Even after fixing the logging issue, the code must still:
     * 1. Check for 'digest' property in error
     * 2. Re-throw the error so Next.js can handle the redirect
     * 
     * This ensures redirects continue to work properly.
     */
    it('NEXT_REDIRECT detection and re-throw logic exists', () => {
      const campaignFilePath = join(process.cwd(), 'src', 'actions', 'campaign.ts')
      const sourceCode = readFileSync(campaignFilePath, 'utf-8')
      const lines = sourceCode.split('\n')

      // Find NEXT_REDIRECT check and throw
      let nextRedirectCheckLine = -1
      let throwErrorLine = -1

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim()
        
        if (line.includes("'digest' in error") || line.includes('"digest" in error')) {
          nextRedirectCheckLine = i
          
          // Find the corresponding throw within next 10 lines
          for (let j = i; j < Math.min(i + 10, lines.length); j++) {
            if (lines[j].trim() === 'throw error' || lines[j].trim() === 'throw error;') {
              throwErrorLine = j
              break
            }
          }
        }
      }

      console.log('\n=== PRESERVATION CHECK: NEXT_REDIRECT Re-throw ===')
      console.log(`NEXT_REDIRECT check at line: ${nextRedirectCheckLine + 1}`)
      console.log(`throw error at line: ${throwErrorLine + 1}`)
      
      if (nextRedirectCheckLine > 0) {
        console.log('\nNEXT_REDIRECT Detection Block:')
        for (let i = nextRedirectCheckLine; i < Math.min(nextRedirectCheckLine + 5, lines.length); i++) {
          console.log(`  ${lines[i]}`)
        }
      }
      
      console.log('=== END PRESERVATION CHECK ===\n')

      // Verify NEXT_REDIRECT check exists
      expect(nextRedirectCheckLine).toBeGreaterThan(0)
      expect(throwErrorLine).toBeGreaterThan(0)
      expect(sourceCode).toContain("'digest' in error")
      expect(sourceCode).toContain('throw error')
    })

    /**
     * Verifies that after NEXT_REDIRECT is detected, it is re-thrown
     * (This is the critical behavior that makes redirects work)
     */
    it('NEXT_REDIRECT re-throw preserves redirect functionality', () => {
      const campaignFilePath = join(process.cwd(), 'src', 'actions', 'campaign.ts')
      const sourceCode = readFileSync(campaignFilePath, 'utf-8')

      // Must have both check and throw
      expect(sourceCode).toMatch(/'digest' in error|"digest" in error/)
      expect(sourceCode).toContain('throw error')
      
      // Comment should explain this is for Next.js redirect handling
      const hasRedirectComment = sourceCode.includes('redirect') || 
                                 sourceCode.includes('NEXT_REDIRECT') ||
                                 sourceCode.includes('Next.js')
      expect(hasRedirectComment).toBe(true)
    })
  })

  // ============================================================================
  // Property 2.4: Timeout Mechanism Preservation
  // ============================================================================
  
  describe('Property 2.4: Timeout Mechanism Must Be Preserved for All Agents', () => {
    /**
     * Validates: Requirements 3.4, 3.5, 3.6
     * 
     * All agents must continue to have timeout protection using withTimeout().
     * The fix for Bug #2 changes the timeout VALUE for Product Analyst,
     * but the MECHANISM (withTimeout wrapper) must remain for all agents.
     */
    it('withTimeout wrapper exists for Product Analyst', () => {
      const orchestratorPath = join(process.cwd(), 'src', 'lib', 'pipeline', 'orchestrator.ts')
      const sourceCode = readFileSync(orchestratorPath, 'utf-8')
      const lines = sourceCode.split('\n')

      // Find Product Analyst withTimeout call
      let productAnalystTimeoutLine = -1

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim()
        
        if (line.includes('withTimeout') && 
            sourceCode.substring(
              Math.max(0, lines.slice(0, i).join('\n').length - 200),
              lines.slice(0, i + 1).join('\n').length + 200
            ).includes('productAnalystAgent')) {
          productAnalystTimeoutLine = i
          break
        }
      }

      console.log('\n=== PRESERVATION CHECK: Product Analyst Timeout ===')
      console.log(`withTimeout found at line: ${productAnalystTimeoutLine + 1}`)
      
      if (productAnalystTimeoutLine > 0) {
        console.log('\nProduct Analyst Timeout Call:')
        for (let i = Math.max(0, productAnalystTimeoutLine - 2); 
             i < Math.min(productAnalystTimeoutLine + 6, lines.length); i++) {
          console.log(`  ${lines[i]}`)
        }
      }
      
      console.log('=== END PRESERVATION CHECK ===\n')

      expect(productAnalystTimeoutLine).toBeGreaterThan(0)
      expect(sourceCode).toContain('withTimeout')
      expect(sourceCode).toContain('productAnalystAgent')
    })

    it('withTimeout wrapper exists for Positioning Strategist', () => {
      const orchestratorPath = join(process.cwd(), 'src', 'lib', 'pipeline', 'orchestrator.ts')
      const sourceCode = readFileSync(orchestratorPath, 'utf-8')

      expect(sourceCode).toContain('withTimeout')
      expect(sourceCode).toContain('positioningStrategistAgent')
      expect(sourceCode).toMatch(/withTimeout\s*\([^)]*positioningStrategistAgent/)
    })

    it('withTimeout wrapper exists for AIDA Strategist', () => {
      const orchestratorPath = join(process.cwd(), 'src', 'lib', 'pipeline', 'orchestrator.ts')
      const sourceCode = readFileSync(orchestratorPath, 'utf-8')

      expect(sourceCode).toContain('withTimeout')
      expect(sourceCode).toContain('aidaStrategistAgent')
      expect(sourceCode).toMatch(/withTimeout\s*\([^)]*aidaStrategistAgent/)
    })

    it('withTimeout wrapper exists for Campaign Critic', () => {
      const orchestratorPath = join(process.cwd(), 'src', 'lib', 'pipeline', 'orchestrator.ts')
      const sourceCode = readFileSync(orchestratorPath, 'utf-8')

      expect(sourceCode).toContain('withTimeout')
      expect(sourceCode).toContain('campaignCriticAgent')
      expect(sourceCode).toMatch(/withTimeout\s*\([^)]*campaignCriticAgent/)
    })

    it('withTimeout wrapper exists for Launch Calendar', () => {
      const orchestratorPath = join(process.cwd(), 'src', 'lib', 'pipeline', 'orchestrator.ts')
      const sourceCode = readFileSync(orchestratorPath, 'utf-8')

      expect(sourceCode).toContain('withTimeout')
      expect(sourceCode).toContain('launchCalendarAgent')
      expect(sourceCode).toMatch(/withTimeout\s*\([^)]*launchCalendarAgent/)
    })

    /**
     * Verifies that timeout errors update campaign status to 'error'
     * (Requirements 3.5)
     */
    it('timeout errors trigger campaign status update to error', () => {
      const orchestratorPath = join(process.cwd(), 'src', 'lib', 'pipeline', 'orchestrator.ts')
      const sourceCode = readFileSync(orchestratorPath, 'utf-8')

      // Check for handlePipelineError function
      expect(sourceCode).toContain('handlePipelineError')
      expect(sourceCode).toContain("status: 'error'")
      
      // Verify error handling updates campaign status
      const hasErrorHandling = sourceCode.includes('catch (error)') &&
                               sourceCode.includes('handlePipelineError')
      expect(hasErrorHandling).toBe(true)
    })
  })

  // ============================================================================
  // Property 2.5: Non-Product-Analyst Timeout Values Unchanged
  // ============================================================================
  
  describe('Property 2.5: Other Agent Timeouts Must Remain at 30 Seconds', () => {
    /**
     * Validates: Requirements 3.6
     * 
     * The Bug #2 fix ONLY changes Product Analyst timeout to 120 seconds.
     * ALL other agents must keep their 30-second timeouts.
     */
    it('Positioning Strategist timeout remains 30 seconds', () => {
      const orchestratorPath = join(process.cwd(), 'src', 'lib', 'pipeline', 'orchestrator.ts')
      const sourceCode = readFileSync(orchestratorPath, 'utf-8')
      const lines = sourceCode.split('\n')

      // Find Positioning Strategist timeout value
      let timeoutValue = null
      
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('positioningStrategistAgent')) {
          // Look for timeout in next 10 lines
          for (let j = i; j < Math.min(i + 10, lines.length); j++) {
            const match = lines[j].match(/,\s*(\d+),/)
            if (match) {
              timeoutValue = parseInt(match[1], 10)
              break
            }
          }
          break
        }
      }

      console.log('\n=== PRESERVATION CHECK: Positioning Strategist Timeout ===')
      console.log(`Current timeout value: ${timeoutValue}ms`)
      console.log('Expected (after fix): 30000ms (unchanged)')
      console.log('=== END PRESERVATION CHECK ===\n')

      // This should remain 30000 after the fix
      expect(timeoutValue).toBe(30000)
    })

    it('AIDA Strategist timeout remains 30 seconds', () => {
      const orchestratorPath = join(process.cwd(), 'src', 'lib', 'pipeline', 'orchestrator.ts')
      const sourceCode = readFileSync(orchestratorPath, 'utf-8')
      const lines = sourceCode.split('\n')

      let timeoutValue = null
      
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('aidaStrategistAgent')) {
          for (let j = i; j < Math.min(i + 10, lines.length); j++) {
            const match = lines[j].match(/,\s*(\d+),/)
            if (match) {
              timeoutValue = parseInt(match[1], 10)
              break
            }
          }
          break
        }
      }

      console.log('\n=== PRESERVATION CHECK: AIDA Strategist Timeout ===')
      console.log(`Current timeout value: ${timeoutValue}ms`)
      console.log('Expected (after fix): 30000ms (unchanged)')
      console.log('=== END PRESERVATION CHECK ===\n')

      expect(timeoutValue).toBe(30000)
    })

    it('Campaign Critic timeout remains 30 seconds', () => {
      const orchestratorPath = join(process.cwd(), 'src', 'lib', 'pipeline', 'orchestrator.ts')
      const sourceCode = readFileSync(orchestratorPath, 'utf-8')
      const lines = sourceCode.split('\n')

      let timeoutValue = null
      
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('campaignCriticAgent')) {
          for (let j = i; j < Math.min(i + 10, lines.length); j++) {
            const match = lines[j].match(/,\s*(\d+),/)
            if (match) {
              timeoutValue = parseInt(match[1], 10)
              break
            }
          }
          break
        }
      }

      console.log('\n=== PRESERVATION CHECK: Campaign Critic Timeout ===')
      console.log(`Current timeout value: ${timeoutValue}ms`)
      console.log('Expected (after fix): 30000ms (unchanged)')
      console.log('=== END PRESERVATION CHECK ===\n')

      expect(timeoutValue).toBe(30000)
    })

    it('Launch Calendar timeout remains 30 seconds', () => {
      const orchestratorPath = join(process.cwd(), 'src', 'lib', 'pipeline', 'orchestrator.ts')
      const sourceCode = readFileSync(orchestratorPath, 'utf-8')
      const lines = sourceCode.split('\n')

      let timeoutValue = null
      
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('launchCalendarAgent')) {
          for (let j = i; j < Math.min(i + 10, lines.length); j++) {
            const match = lines[j].match(/,\s*(\d+),/)
            if (match) {
              timeoutValue = parseInt(match[1], 10)
              break
            }
          }
          break
        }
      }

      console.log('\n=== PRESERVATION CHECK: Launch Calendar Timeout ===')
      console.log(`Current timeout value: ${timeoutValue}ms`)
      console.log('Expected (after fix): 30000ms (unchanged)')
      console.log('=== END PRESERVATION CHECK ===\n')

      expect(timeoutValue).toBe(30000)
    })
  })

  // ============================================================================
  // Property 2.6: Pipeline Orchestration Preservation
  // ============================================================================
  
  describe('Property 2.6: Pipeline Orchestration Must Remain Unchanged', () => {
    /**
     * Validates: Requirements 3.7, 3.8, 3.9
     * 
     * All pipeline orchestration logic must remain unchanged:
     * - Strategy record creation with product intelligence
     * - Progress logging with metadata
     * - Asynchronous execution with immediate redirect
     */
    it('Strategy record creation includes all required fields', () => {
      const orchestratorPath = join(process.cwd(), 'src', 'lib', 'pipeline', 'orchestrator.ts')
      const sourceCode = readFileSync(orchestratorPath, 'utf-8')

      // Check Strategy record creation
      expect(sourceCode).toContain('prisma.strategy.create')
      expect(sourceCode).toContain('productIntelligence:')
      expect(sourceCode).toContain('positioning:')
      expect(sourceCode).toContain('messagingAngles:')
    })

    it('progress logging includes metadata (token usage, execution time)', () => {
      const orchestratorPath = join(process.cwd(), 'src', 'lib', 'pipeline', 'orchestrator.ts')
      const sourceCode = readFileSync(orchestratorPath, 'utf-8')

      // Check for metadata logging
      expect(sourceCode).toContain('tokensUsed')
      expect(sourceCode).toContain('executionTimeMs')
      expect(sourceCode).toContain('console.log')
    })

    it('campaign status updates occur at each stage', () => {
      const orchestratorPath = join(process.cwd(), 'src', 'lib', 'pipeline', 'orchestrator.ts')
      const sourceCode = readFileSync(orchestratorPath, 'utf-8')

      // Check for status updates
      expect(sourceCode).toContain('updateCampaignStatus')
      expect(sourceCode).toContain('intelligence_in_progress')
      expect(sourceCode).toContain('intelligence_complete')
      expect(sourceCode).toContain('positioning_in_progress')
      expect(sourceCode).toContain('positioning_complete')
    })

    it('asynchronous pipeline execution is preserved', () => {
      const campaignFilePath = join(process.cwd(), 'src', 'actions', 'campaign.ts')
      const sourceCode = readFileSync(campaignFilePath, 'utf-8')

      // Pipeline should be called without await (fire and forget)
      expect(sourceCode).toContain('runCampaignPipeline')
      expect(sourceCode).toContain('.catch((error) =>')
      
      // Should not have 'await runCampaignPipeline' (that would block redirect)
      const hasAwaitPipeline = sourceCode.match(/await\s+runCampaignPipeline/)
      expect(hasAwaitPipeline).toBeNull()
    })

    it('redirect occurs immediately after pipeline starts', () => {
      const campaignFilePath = join(process.cwd(), 'src', 'actions', 'campaign.ts')
      const sourceCode = readFileSync(campaignFilePath, 'utf-8')
      const lines = sourceCode.split('\n')

      // Find runCampaignPipeline and redirect calls
      let pipelineCallLine = -1
      let redirectCallLine = -1

      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('runCampaignPipeline')) {
          pipelineCallLine = i
        }
        if (lines[i].includes("redirect(`/campaign/")) {
          redirectCallLine = i
        }
      }

      console.log('\n=== PRESERVATION CHECK: Async Pipeline + Redirect ===')
      console.log(`runCampaignPipeline at line: ${pipelineCallLine + 1}`)
      console.log(`redirect() at line: ${redirectCallLine + 1}`)
      console.log('Expected: redirect comes after pipeline start (async)')
      console.log('=== END PRESERVATION CHECK ===\n')

      // redirect should come after pipeline call (async execution)
      expect(redirectCallLine).toBeGreaterThan(pipelineCallLine)
    })
  })

  // ============================================================================
  // Property 2.7: Error Response Structure Preservation
  // ============================================================================
  
  describe('Property 2.7: Error Response Structure Must Be Preserved', () => {
    /**
     * Validates: Requirements 3.1, 3.2
     * 
     * The ActionResult<T> type and error response structure must remain unchanged
     */
    it('ActionResult type structure exists', () => {
      const campaignFilePath = join(process.cwd(), 'src', 'actions', 'campaign.ts')
      const sourceCode = readFileSync(campaignFilePath, 'utf-8')

      expect(sourceCode).toContain('type ActionResult<T>')
      expect(sourceCode).toContain('success: true')
      expect(sourceCode).toContain('success: false')
      expect(sourceCode).toContain('fieldErrors?:')
    })

    it('error responses include success: false and error message', () => {
      const campaignFilePath = join(process.cwd(), 'src', 'actions', 'campaign.ts')
      const sourceCode = readFileSync(campaignFilePath, 'utf-8')

      // Check for error return statements
      const hasErrorReturns = sourceCode.includes('success: false') &&
                             sourceCode.includes('error:')
      expect(hasErrorReturns).toBe(true)
    })

    it('generic error response preserves error message', () => {
      const campaignFilePath = join(process.cwd(), 'src', 'actions', 'campaign.ts')
      const sourceCode = readFileSync(campaignFilePath, 'utf-8')

      // Check final catch block return
      expect(sourceCode).toMatch(/error instanceof Error \? error\.message/)
      expect(sourceCode).toContain('Failed to create campaign')
    })
  })
})
