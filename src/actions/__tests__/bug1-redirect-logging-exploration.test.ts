/**
 * Bug Condition Exploration Test for Bug #1: NEXT_REDIRECT Error Logging
 * 
 * **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
 * **DO NOT attempt to fix the test or the code when it fails**
 * **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
 * 
 * **GOAL**: Surface counterexamples that demonstrate NEXT_REDIRECT is incorrectly logged as an error
 * 
 * Bug: When redirect() is called successfully at line 211, console.error at line 213 logs
 * "NEXT_REDIRECT" as an error even though it represents expected Next.js framework behavior
 * 
 * Expected counterexamples on UNFIXED code:
 * - Console shows "createCampaignFromBrief error: Error: NEXT_REDIRECT" on successful redirect
 * - NEXT_REDIRECT appears in error logs even when redirect executes successfully
 * - Developers see false error signals that obscure genuine errors
 * 
 * **Validates: Requirements 1.1, 1.2**
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

describe('Bug #1 Exploration: NEXT_REDIRECT Logged as Error', () => {
  /**
   * Property 1.1: Bug Condition - NEXT_REDIRECT Detection Before Logging
   * 
   * This test verifies the CODE STRUCTURE to detect if NEXT_REDIRECT detection
   * happens BEFORE console.error logging (correct) or AFTER (buggy).
   * 
   * **EXPECTED OUTCOME ON UNFIXED CODE**: Test FAILS
   * - console.error at line 213 is called BEFORE NEXT_REDIRECT check
   * - NEXT_REDIRECT check happens at line 234, AFTER logging
   * - This creates false error signals
   * 
   * **EXPECTED OUTCOME AFTER FIX**: Test PASSES
   * - NEXT_REDIRECT check happens BEFORE console.error
   * - Early return/re-throw prevents logging
   * 
   * **Validates: Requirements 1.1, 1.2, 2.1, 2.2**
   */
  it('Property 1.1: NEXT_REDIRECT detection must occur BEFORE console.error', () => {
    // Read the source file
    const campaignFilePath = join(process.cwd(), 'src', 'actions', 'campaign.ts')
    const sourceCode = readFileSync(campaignFilePath, 'utf-8')
    const lines = sourceCode.split('\n')

    // Find the catch block that starts around line 212
    let catchBlockStart = -1
    let consoleErrorLine = -1
    let nextRedirectCheckLine = -1

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      
      // Find catch block
      if (line.includes('} catch (error)')) {
        catchBlockStart = i
      }
      
      // Find console.error for createCampaignFromBrief
      if (line.includes('console.error') && 
          line.includes('createCampaignFromBrief error')) {
        consoleErrorLine = i
      }
      
      // Find NEXT_REDIRECT check (looking for digest property check)
      if (line.includes("'digest' in error") || 
          line.includes('"digest" in error')) {
        nextRedirectCheckLine = i
      }
    }

    // Verify we found all the relevant lines
    expect(catchBlockStart).toBeGreaterThan(0)
    expect(consoleErrorLine).toBeGreaterThan(0)
    expect(nextRedirectCheckLine).toBeGreaterThan(0)

    console.log('\n=== BUG #1 CODE STRUCTURE ANALYSIS ===')
    console.log(`\nCatch block starts at line: ${catchBlockStart + 1}`)
    console.log(`console.error at line: ${consoleErrorLine + 1}`)
    console.log(`NEXT_REDIRECT check at line: ${nextRedirectCheckLine + 1}`)
    
    // Calculate order
    const errorBeforeCheck = consoleErrorLine < nextRedirectCheckLine
    
    console.log(`\nOrder Analysis:`)
    console.log(`  console.error comes before NEXT_REDIRECT check: ${errorBeforeCheck}`)
    console.log(`  Expected (after fix): false (check should come first)`)
    console.log(`  Actual (unfixed): ${errorBeforeCheck}`)
    
    if (errorBeforeCheck) {
      console.log(`\n⚠️  BUG CONFIRMED: console.error happens at line ${consoleErrorLine + 1}`)
      console.log(`   NEXT_REDIRECT check happens at line ${nextRedirectCheckLine + 1}`)
      console.log(`   This means NEXT_REDIRECT gets logged before being identified`)
    } else {
      console.log(`\n✅ BUG FIXED: NEXT_REDIRECT check happens before logging`)
    }
    
    console.log('\n=== END CODE STRUCTURE ANALYSIS ===\n')

    // CRITICAL ASSERTION: NEXT_REDIRECT check must come BEFORE console.error
    // This encodes the EXPECTED BEHAVIOR from requirements 2.1, 2.2
    //
    // ON UNFIXED CODE: This will FAIL because console.error is at line 213
    //                  and NEXT_REDIRECT check is at line 234
    // AFTER FIX: This will PASS because NEXT_REDIRECT check comes first
    expect(nextRedirectCheckLine).toBeLessThan(consoleErrorLine)
  })

  /**
   * Property 1.1 (Variant): Early exit pattern after NEXT_REDIRECT detection
   * 
   * After detecting NEXT_REDIRECT, the code should immediately re-throw
   * without executing any error logging logic.
   */
  it('Property 1.1 (Variant): NEXT_REDIRECT detection includes immediate re-throw', () => {
    const campaignFilePath = join(process.cwd(), 'src', 'actions', 'campaign.ts')
    const sourceCode = readFileSync(campaignFilePath, 'utf-8')
    const lines = sourceCode.split('\n')

    // Find the NEXT_REDIRECT check block
    let nextRedirectCheckLine = -1
    let hasImmediateThrow = false

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      
      // Find NEXT_REDIRECT check
      if (line.includes("'digest' in error") || line.includes('"digest" in error')) {
        nextRedirectCheckLine = i
        
        // Check the next few lines for immediate throw
        for (let j = i; j < Math.min(i + 10, lines.length); j++) {
          const nextLine = lines[j].trim()
          if (nextLine === 'throw error' || nextLine === 'throw error;') {
            // Check that this throw is within the same if block (before any console.error)
            let foundConsoleError = false
            for (let k = i; k < j; k++) {
              if (lines[k].includes('console.error')) {
                foundConsoleError = true
                break
              }
            }
            if (!foundConsoleError) {
              hasImmediateThrow = true
              break
            }
          }
        }
        break
      }
    }

    console.log('\n=== BUG #1 EARLY EXIT PATTERN ANALYSIS ===')
    console.log(`\nNEXT_REDIRECT check found at line: ${nextRedirectCheckLine + 1}`)
    console.log(`Immediate throw (without console.error): ${hasImmediateThrow}`)
    console.log(`Expected (after fix): true`)
    console.log(`Actual: ${hasImmediateThrow}`)
    
    if (!hasImmediateThrow) {
      console.log(`\n⚠️  BUG: NEXT_REDIRECT check does not include immediate re-throw before logging`)
    } else {
      console.log(`\n✅ CORRECT: NEXT_REDIRECT is immediately re-thrown without logging`)
    }
    
    console.log('\n=== END EARLY EXIT PATTERN ANALYSIS ===\n')

    // EXPECTED: After detecting NEXT_REDIRECT, code should immediately throw
    // This will FAIL on unfixed code where logging happens first
    expect(hasImmediateThrow).toBe(true)
  })

  /**
   * Counterexample Documentation: Show exact line numbers and code structure
   */
  it('Bug Condition: Documents exact code structure of error logging vs NEXT_REDIRECT check', () => {
    const campaignFilePath = join(process.cwd(), 'src', 'actions', 'campaign.ts')
    const sourceCode = readFileSync(campaignFilePath, 'utf-8')
    const lines = sourceCode.split('\n')

    // Extract relevant code sections
    let catchBlockStart = -1
    let consoleErrorLine = -1
    let nextRedirectCheckLine = -1

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      
      if (line.includes('} catch (error)')) catchBlockStart = i
      if (line.includes('console.error') && line.includes('createCampaignFromBrief error')) {
        consoleErrorLine = i
      }
      if (line.includes("'digest' in error") || line.includes('"digest" in error')) {
        nextRedirectCheckLine = i
      }
    }

    console.log('\n=== BUG #1 DETAILED COUNTEREXAMPLE ===')
    console.log(`\nCatch Block (line ${catchBlockStart + 1}):`)
    console.log(`  ${lines[catchBlockStart]}`)
    
    if (consoleErrorLine > 0) {
      console.log(`\nconsole.error (line ${consoleErrorLine + 1}):`)
      console.log(`  ${lines[consoleErrorLine]}`)
    }
    
    if (nextRedirectCheckLine > 0) {
      console.log(`\nNEXT_REDIRECT check (line ${nextRedirectCheckLine + 1}):`)
      console.log(`  ${lines[nextRedirectCheckLine]}`)
      // Show a few surrounding lines for context
      for (let i = nextRedirectCheckLine; i < Math.min(nextRedirectCheckLine + 3, lines.length); i++) {
        if (lines[i].trim()) {
          console.log(`  ${lines[i]}`)
        }
      }
    }

    console.log(`\nLine Number Comparison:`)
    console.log(`  console.error: line ${consoleErrorLine + 1}`)
    console.log(`  NEXT_REDIRECT check: line ${nextRedirectCheckLine + 1}`)
    console.log(`  Difference: ${nextRedirectCheckLine - consoleErrorLine} lines`)
    
    if (consoleErrorLine < nextRedirectCheckLine) {
      console.log(`\n⚠️  BUG CONFIRMED: Error is logged ${nextRedirectCheckLine - consoleErrorLine} lines before NEXT_REDIRECT is detected`)
      console.log(`   This means EVERY redirect will appear in error logs`)
      console.log(`   False error signals obscure genuine errors`)
    }
    
    console.log('\n=== END DETAILED COUNTEREXAMPLE ===\n')

    // Document for the spec - this should pass after fix
    expect(nextRedirectCheckLine).toBeLessThan(consoleErrorLine)
  })
})
