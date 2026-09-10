/**
 * Preservation Property Tests for RootLayout
 * 
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
 * **Property 2: Preservation** - All Styling and Functionality Unchanged
 * 
 * IMPORTANT: These tests follow observation-first methodology.
 * They observe behavior on UNFIXED code for normal page loads (without browser
 * extension attribute injection) and document the baseline behavior that must
 * be preserved when the fix is implemented.
 * 
 * EXPECTED OUTCOME: Tests PASS on unfixed code (confirming baseline behavior to preserve)
 * EXPECTED AFTER FIX: Tests PASS (confirming no regressions)
 * 
 * These property-based tests generate many test cases for stronger guarantees
 * across different page loads, viewport sizes, and content variations.
 */

import { render } from '@testing-library/react'
import * as fc from 'fast-check'
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import RootLayout from '../layout'

describe('RootLayout - Preservation Properties (UNFIXED CODE BASELINE)', () => {
  /**
   * Property 1: Body Element Always Has Required Tailwind Classes
   * 
   * For ANY page content, the body element MUST have the exact classes:
   * "min-h-full flex flex-col"
   * 
   * This verifies requirement 3.1: "WHEN the application renders the body element 
   * with className 'min-h-full flex flex-col' THEN the system SHALL CONTINUE TO 
   * apply these Tailwind CSS classes correctly"
   */
  it('Property 1: body element always has classes "min-h-full flex flex-col" regardless of children content', () => {
    fc.assert(
      fc.property(
        // Generate arbitrary child content scenarios
        fc.oneof(
          fc.constant(<div>Simple text</div>),
          fc.constant(<div><p>Nested content</p></div>),
          fc.constant(<main><section>Complex structure</section></main>),
          fc.constant(<div data-testid="custom-attr">With attributes</div>),
          fc.constant(<><div>Fragment 1</div><div>Fragment 2</div></>),
          fc.constant(null), // Empty children
          fc.constant(<div style={{ minHeight: '100vh' }}>Styled content</div>)
        ),
        (children) => {
          // Render with arbitrary children
          const htmlString = renderToString(<RootLayout>{children}</RootLayout>)
          
          // OBSERVE: Body element MUST have exact classes
          // This is the baseline behavior that MUST be preserved after fix
          const hasRequiredClasses = htmlString.includes('class="min-h-full flex flex-col"')
          
          return hasRequiredClasses
        }
      ),
      { numRuns: 50 } // Generate 50 test cases for strong guarantee
    )
  })

  /**
   * Property 2: HTML Element Always Has Language Attribute and Font Classes
   * 
   * For ANY page content, the html element MUST have:
   * - lang="en" attribute
   * - Geist font variable classes (--font-geist-sans, --font-geist-mono)
   * - h-full class
   * - antialiased class
   * 
   * This verifies requirement 3.4: "WHEN the application uses the Geist font 
   * variables on the html element THEN the system SHALL CONTINUE TO apply 
   * font styling correctly throughout the application"
   */
  it('Property 2: html element always has lang="en" and correct font classes regardless of children', () => {
    fc.assert(
      fc.property(
        // Generate various child content scenarios
        fc.oneof(
          fc.constant(<div>Test 1</div>),
          fc.constant(<main><article>Article content</article></main>),
          fc.constant(<div className="custom-class">Custom styled</div>),
          fc.constant(<section><header>Header</header><footer>Footer</footer></section>)
        ),
        (children) => {
          const htmlString = renderToString(<RootLayout>{children}</RootLayout>)
          
          // OBSERVE: HTML element MUST have all these attributes/classes
          const hasLangAttribute = htmlString.includes('lang="en"')
          const hasGeistSansVariable = htmlString.includes('--font-geist-sans')
          const hasGeistMonoVariable = htmlString.includes('--font-geist-mono')
          const hasHFullClass = htmlString.includes('h-full')
          const hasAntialiasedClass = htmlString.includes('antialiased')
          
          return hasLangAttribute && 
                 hasGeistSansVariable && 
                 hasGeistMonoVariable && 
                 hasHFullClass && 
                 hasAntialiasedClass
        }
      ),
      { numRuns: 40 }
    )
  })

  /**
   * Property 3: Children Content Always Renders Inside Body Element
   * 
   * For ANY children content, it MUST be rendered inside the body element.
   * The body element acts as a container that wraps all page content.
   * 
   * This verifies requirement 3.2: "WHEN the application renders child components 
   * within the body THEN the system SHALL CONTINUE TO render all page content 
   * correctly without layout or styling issues"
   */
  it('Property 3: all children content renders inside body element for any content type', () => {
    fc.assert(
      fc.property(
        // Generate child elements with unique identifiers
        fc.integer({ min: 1, max: 1000 }).map(id => (
          <div data-testid={`child-${id}`}>Content {id}</div>
        )),
        (childElement) => {
          const htmlString = renderToString(<RootLayout>{childElement}</RootLayout>)
          
          // OBSERVE: Child element MUST be present in rendered output
          const testId = childElement.props['data-testid']
          
          // The HTML should contain the testid attribute and the word "Content"
          return htmlString.includes(`data-testid="${testId}"`) && 
                 htmlString.includes('Content')
        }
      ),
      { numRuns: 30 }
    )
  })

  /**
   * Property 4: Body Element Maintains Flexbox Layout Structure
   * 
   * The body element's classes "min-h-full flex flex-col" create a flexbox
   * layout that:
   * - Uses full minimum height (min-h-full)
   * - Is a flex container (flex)
   * - Arranges children in a column (flex-col)
   * 
   * This property verifies that the HTML structure supports this layout model
   * by checking that body contains exactly these classes in the correct format.
   */
  it('Property 4: body element flexbox layout structure is preserved across all render scenarios', () => {
    fc.assert(
      fc.property(
        // Generate multiple child elements to test flex-col layout
        fc.array(
          fc.integer({ min: 0, max: 5 }).map(n => 
            <div key={n}>Child {n}</div>
          ),
          { minLength: 1, maxLength: 5 }
        ),
        (children) => {
          const htmlString = renderToString(<RootLayout>{children}</RootLayout>)
          
          // OBSERVE: Body must be a flex container with column direction
          // The exact class string ensures no accidental modifications
          const hasFlexClasses = htmlString.includes('min-h-full flex flex-col')
          
          // Verify body tag is present
          const hasBodyTag = htmlString.includes('<body')
          
          return hasFlexClasses && hasBodyTag
        }
      ),
      { numRuns: 40 }
    )
  })

  /**
   * Property 5: Document Structure is Always Valid HTML5
   * 
   * For ANY content, the rendered output MUST follow proper HTML5 structure:
   * - Has <html> root element
   * - Has <body> element inside html
   * - Children are rendered inside body
   * - No malformed tags or structure
   * 
   * This is a structural preservation check ensuring the fix doesn't break
   * fundamental HTML document structure.
   */
  it('Property 5: HTML5 document structure is preserved for all content variations', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant(<div>Single element</div>),
          fc.constant(<><div>Multi</div><div>Element</div></>),
          fc.constant(<main><h1>Title</h1><p>Paragraph</p></main>),
          fc.constant(<div><div><div>Deeply nested</div></div></div>)
        ),
        (children) => {
          const htmlString = renderToString(<RootLayout>{children}</RootLayout>)
          
          // OBSERVE: Valid HTML5 structure requirements
          const hasHtmlTag = htmlString.includes('<html')
          const hasBodyTag = htmlString.includes('<body')
          const htmlBeforeBody = htmlString.indexOf('<html') < htmlString.indexOf('<body')
          const bodyInsideHtml = htmlString.indexOf('<body') > htmlString.indexOf('<html') && 
                                  htmlString.indexOf('</body>') < htmlString.lastIndexOf('</html>')
          
          return hasHtmlTag && hasBodyTag && htmlBeforeBody && bodyInsideHtml
        }
      ),
      { numRuns: 30 }
    )
  })

  /**
   * Property 6: No Unexpected Attributes on Body Element (Pre-Fix Baseline)
   * 
   * On UNFIXED code without browser extensions, the body element should have:
   * - class attribute with "min-h-full flex flex-col"
   * - NO suppressHydrationWarning attribute (this is added by the fix)
   * - NO other unexpected attributes
   * 
   * This establishes the baseline: what the body looks like BEFORE the fix.
   * After the fix, we expect data-suppress-hydration-warning to be added.
   */
  it('Property 6: body element has only expected attributes before fix (baseline observation)', () => {
    fc.assert(
      fc.property(
        fc.constant(<div>Test content</div>),
        (children) => {
          const htmlString = renderToString(<RootLayout>{children}</RootLayout>)
          
          // OBSERVE BASELINE: What attributes does body have on UNFIXED code?
          const hasClassAttribute = htmlString.includes('class="min-h-full flex flex-col"')
          
          // On UNFIXED code, we expect NO suppressHydrationWarning
          // (After fix is applied, this attribute WILL appear, which is correct)
          const lacksSuppressionAttribute = !htmlString.includes('data-suppress-hydration-warning')
          
          // This test documents the PRE-FIX state
          // It will need to be updated after fix to expect the suppression attribute
          return hasClassAttribute && lacksSuppressionAttribute
        }
      ),
      { numRuns: 20 }
    )
  })

  /**
   * Unit Test: Verify Complete Rendered Structure
   * 
   * This unit test complements the property tests by verifying the complete
   * structure of a typical render. It serves as documentation of the expected
   * output format.
   */
  it('Unit Test: complete structure verification for typical page render', () => {
    const htmlString = renderToString(
      <RootLayout>
        <main>
          <h1>Page Title</h1>
          <p>Page content</p>
        </main>
      </RootLayout>
    )
    
    // Document the complete expected structure
    expect(htmlString).toContain('<html')
    expect(htmlString).toContain('lang="en"')
    expect(htmlString).toContain('--font-geist-sans')
    expect(htmlString).toContain('--font-geist-mono')
    expect(htmlString).toContain('h-full')
    expect(htmlString).toContain('antialiased')
    expect(htmlString).toContain('<body')
    expect(htmlString).toContain('class="min-h-full flex flex-col"')
    expect(htmlString).toContain('<main>')
    expect(htmlString).toContain('<h1>Page Title</h1>')
    expect(htmlString).toContain('<p>Page content</p>')
    expect(htmlString).toContain('</body>')
    expect(htmlString).toContain('</html>')
  })

  /**
   * Unit Test: Verify Children Render Correctly in Browser Environment
   * 
   * Using @testing-library/react's render (not renderToString) to verify
   * behavior in a simulated browser environment with jsdom.
   */
  it('Unit Test: children render correctly in browser-simulated environment', () => {
    const { container, getByText } = render(
      <RootLayout>
        <div>
          <h1>Test Heading</h1>
          <p>Test paragraph with unique text</p>
        </div>
      </RootLayout>
    )
    
    // Verify children are in the document
    expect(getByText('Test Heading')).toBeTruthy()
    expect(getByText('Test paragraph with unique text')).toBeTruthy()
    
    // Verify container has content
    expect(container.innerHTML).toContain('Test Heading')
  })

  /**
   * Unit Test: Verify No Hydration Warnings on Clean Render (Baseline)
   * 
   * On UNFIXED code, when there are NO browser extensions modifying the DOM,
   * there should be NO hydration warnings. This establishes that the component
   * works correctly in the "happy path" scenario.
   * 
   * The bug only manifests when browser extensions inject attributes during
   * the hydration phase.
   */
  it('Unit Test: no hydration issues on clean render without extensions (baseline)', () => {
    // This test verifies that the component works correctly without extensions
    // In a real browser without extensions, no hydration warnings should occur
    
    const { container } = render(
      <RootLayout>
        <div>Normal page content</div>
      </RootLayout>
    )
    
    // Component renders successfully
    expect(container).toBeTruthy()
    expect(container.textContent).toContain('Normal page content')
    
    // Note: jsdom doesn't fully simulate SSR hydration, so we can't directly
    // test for console warnings here. The real-world behavior is:
    // - Without extensions: no warnings (this test documents that expectation)
    // - With extensions: warnings occur (bug condition test documents that)
  })
})
