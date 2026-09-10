# Implementation Plan

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - No Hydration Warnings with Extensions
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: For deterministic bugs, scope the property to the concrete failing case(s) to ensure reproducibility
  - Test that when browser extensions inject attributes into the body element during hydration (simulate by adding data attributes like `data-gr-ext-installed="forever"`), React logs hydration warnings to the console
  - The test assertions should verify that NO hydration warnings appear (this is the expected behavior after fix)
  - Run test on UNFIXED code in `src/app/layout.tsx`
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found: specific warning messages like "Warning: Prop `data-gr-ext-installed` did not match. Server: null Client: forever"
  - Test cases to include:
    - Grammarly simulation: inject `data-gr-ext-installed="forever"`
    - Multiple attributes: inject `data-extension-1`, `data-extension-2`
    - Timing variations: inject at different render cycle points
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 2.1, 2.2_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - All Styling and Functionality Unchanged
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for normal page loads (without browser extension attribute injection)
  - Write property-based tests capturing observed behavior patterns:
    - Body element has classes: `min-h-full flex flex-col`
    - HTML element has correct classes and font variables
    - All page styling renders correctly
    - Layout flexbox behavior works correctly
    - Children components render identically
    - No visual regressions
  - Property-based testing generates many test cases for stronger guarantees across different page loads and viewport sizes
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [x] 3. Fix for body hydration warnings

  - [x] 3.1 Implement the fix in src/app/layout.tsx
    - Add `suppressHydrationWarning={true}` prop to the `<body>` element
    - Keep existing className unchanged: `className="min-h-full flex flex-col"`
    - Keep all children rendering logic unchanged: `{children}`
    - Do not modify the `<html>` element or its classes
    - Do not modify the metadata export
    - _Bug_Condition: isBugCondition(input) returns true when input.hasBrowserExtensions == true AND input.extensionInjectsBodyAttributes == true AND input.hydrationPhase == "in_progress" AND hydrationWarningLogged(input.consoleOutput)_
    - _Expected_Behavior: For all inputs where isBugCondition returns true, the fixed RootLayout SHALL suppress hydration warnings (noHydrationWarnings(result.consoleOutput) == true) while still rendering the body element correctly_
    - _Preservation: For all inputs where isBugCondition returns false (normal page loads), the fixed RootLayout SHALL produce exactly the same visual output, layout behavior, and functionality as the original component, preserving all classes (min-h-full flex flex-col), styles, html element classes, and child component rendering_
    - _Requirements: 2.1, 2.2, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [x] 3.2 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - No Hydration Warnings with Extensions
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed - no hydration warnings appear when browser extensions inject attributes)
    - _Requirements: 2.1, 2.2_

  - [x] 3.3 Verify preservation tests still pass
    - **Property 2: Preservation** - All Styling and Functionality Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions - all styling, classes, and functionality remain unchanged)
    - Confirm all tests still pass after fix (no regressions)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [x] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
