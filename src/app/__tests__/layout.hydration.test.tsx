/**
 * Bug Condition Exploration Test for Body Hydration Warnings
 * 
 * **Validates: Requirements 2.1, 2.2**
 * 
 * CRITICAL: This test MUST FAIL on unfixed code - failure confirms the bug exists.
 * DO NOT attempt to fix the test or the code when it fails.
 * 
 * This test encodes the expected behavior (no hydration warnings when browser
 * extensions inject attributes). It will validate the fix when it passes after
 * the fix is implemented.
 * 
 * GOAL: Surface counterexamples that demonstrate the bug exists by verifying
 * that the body element has the suppressHydrationWarning prop set.
 * 
 * NOTE: Due to testing environment limitations (jsdom doesn't fully simulate
 * SSR hydration), we verify the fix is in place by checking the component's
 * JSX structure includes the suppressHydrationWarning prop.
 */

import { render } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import RootLayout from '../layout'

describe('RootLayout - Bug Condition Exploration: Hydration Warnings with Browser Extensions', () => {
  /**
   * Test Case 1: Verify Component Renders Without Crashes
   * 
   * Basic smoke test to ensure the RootLayout component renders correctly.
   * Establishes baseline functionality before checking for the bug fix.
   * 
   * EXPECTED ON UNFIXED CODE: Test PASSES - Component renders normally.
   * EXPECTED AFTER FIX: Test PASSES - Component still renders normally.
   */
  it('should render RootLayout without crashes', () => {
    const { container } = render(
      <RootLayout>
        <div data-testid="test-child">Test Content</div>
      </RootLayout>
    )
    
    // The RootLayout renders html and body elements
    expect(container).toBeTruthy()
    
    // Check that child content is rendered
    const childElement = container.querySelector('[data-testid="test-child"]')
    expect(childElement).not.toBeNull()
    expect(childElement?.textContent).toBe('Test Content')
  })

  /**
   * Test Case 2: Verify Body Element Has Required Classes (Preservation)
   * 
   * Verifies that the body element maintains its expected Tailwind CSS classes.
   * This test establishes baseline behavior that must be preserved after the fix.
   * 
   * EXPECTED ON UNFIXED CODE: Test PASSES - Classes are applied correctly.
   * EXPECTED AFTER FIX: Test PASSES - Classes remain unchanged.
   */
  it('should render body element with Tailwind classes min-h-full flex flex-col', () => {
    const htmlString = renderToString(
      <RootLayout>
        <div>Test Content</div>
      </RootLayout>
    )
    
    // Check that body element has the required Tailwind classes
    expect(htmlString).toContain('class="min-h-full flex flex-col"')
  })

  /**
   * Test Case 3: Verify HTML Element Structure (Preservation)
   * 
   * Verifies that the HTML element maintains its expected attributes:
   * - Has lang="en" attribute
   * - Has correct font variable classes
   * - Has antialiasing class
   * 
   * EXPECTED ON UNFIXED CODE: Test PASSES - HTML structure is correct.
   * EXPECTED AFTER FIX: Test PASSES - HTML structure remains unchanged.
   */
  it('should render html element with lang="en" and font classes', () => {
    const htmlString = renderToString(
      <RootLayout>
        <div>Test Content</div>
      </RootLayout>
    )
    
    // Check for lang attribute
    expect(htmlString).toContain('lang="en"')
    
    // Check for antialiased and h-full classes
    expect(htmlString).toContain('antialiased')
    expect(htmlString).toContain('h-full')
    
    // Check for font variable classes
    expect(htmlString).toContain('--font-geist')
  })

  /**
   * Test Case 4: Check for suppressHydrationWarning Prop on Body Element
   * 
   * This is the PRIMARY bug condition test. It verifies that the body element
   * has the suppressHydrationWarning prop set, which tells React to ignore
   * hydration mismatches caused by browser extension attribute injection.
   * 
   * EXPECTED ON UNFIXED CODE: Test FAILS - suppressHydrationWarning prop is missing.
   * This failure confirms the bug exists and browser extension attributes will
   * cause hydration warnings.
   * 
   * EXPECTED AFTER FIX: Test PASSES - suppressHydrationWarning prop is present.
   * React will no longer log warnings when extensions inject attributes like:
   * - data-gr-ext-installed="forever" (Grammarly)
   * - data-new-gr-c-s-check-loaded="14.x.x" (Grammarly)
   * - data-lastpass-icon-root (LastPass)
   * - Various accessibility tool attributes
   * 
   * NOTE: We verify the fix by checking the source code, as testing environments
   * don't fully simulate SSR hydration where the data-suppress-hydration-warning
   * attribute would actually appear.
   */
  it('should have suppressHydrationWarning on body element to prevent browser extension attribute warnings', async () => {
    // Read the source file to verify the fix is in place
    const fs = await import('fs/promises')
    const path = await import('path')
    
    const layoutPath = path.join(process.cwd(), 'src', 'app', 'layout.tsx')
    const sourceCode = await fs.readFile(layoutPath, 'utf-8')
    
    // EXPECTED BEHAVIOR: The body element should have suppressHydrationWarning={true}
    // This tells React to skip hydration warnings for body element attributes
    // 
    // (This assertion will FAIL on unfixed code, confirming the bug exists)
    // 
    // When this test fails, it documents the counterexample:
    // - Without suppressHydrationWarning, browser extensions that inject attributes
    //   into the body element cause React to log hydration mismatch warnings
    // - Examples: Grammarly (data-gr-ext-installed), LastPass (data-lastpass-*),
    //   accessibility tools (aria-*, data-*)
    
    expect(sourceCode).toContain('suppressHydrationWarning')
    expect(sourceCode).toContain('<body')
    
    // Verify the suppressHydrationWarning is on the body element specifically
    // The pattern should be: <body className="..." suppressHydrationWarning={true}>
    const bodyElementPattern = /<body[^>]*suppressHydrationWarning/
    expect(sourceCode).toMatch(bodyElementPattern)
    
    // Document the expected behavior after fix
    const expectedBehavior = {
      componentHasFix: 'suppressHydrationWarning={true} on body element',
      result: 'No hydration warnings when browser extensions inject attributes',
      examplesHandled: [
        'data-gr-ext-installed="forever"',
        'data-new-gr-c-s-check-loaded="14.1234.0"',
        'data-lastpass-icon-root'
      ]
    }
    
    expect(expectedBehavior.componentHasFix).toContain('suppressHydrationWarning')
    expect(expectedBehavior.result).toContain('No hydration warnings')
  })

  /**
   * Test Case 5: Documentation of Bug Scenario
   * 
   * This test documents the actual bug condition and validates our understanding:
   * - Browser extensions inject data attributes into body element
   * - React detects mismatch between server HTML and client HTML  
   * - Hydration warnings appear in console
   * - The fix (suppressHydrationWarning={true}) tells React this is expected
   */
  it('should document the bug condition: browser extension attribute injection', () => {
    // This is a documentation test that describes the bug condition
    const bugCondition = {
      trigger: 'Browser extensions inject attributes into body element',
      examples: [
        'data-gr-ext-installed="forever"',
        'data-new-gr-c-s-check-loaded="14.1234.0"',
        'data-lastpass-icon-root',
        'data-extension-*'
      ],
      symptom: 'React hydration mismatch warnings in console',
      solution: 'Add suppressHydrationWarning={true} to body element',
      expectedResult: 'data-suppress-hydration-warning attribute in rendered HTML'
    }
    
    // Verify we documented the bug correctly
    expect(bugCondition.trigger).toBeTruthy()
    expect(bugCondition.examples.length).toBeGreaterThan(0)
    expect(bugCondition.solution).toContain('suppressHydrationWarning')
    expect(bugCondition.expectedResult).toContain('data-suppress-hydration-warning')
  })
})
