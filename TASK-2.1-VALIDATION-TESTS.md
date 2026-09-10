# Task 2.1 Validation Tests

This document outlines the validation tests for the ProductBriefForm component.

## Requirements Coverage

### Requirement 1.1: Guided Multi-Field Form
✅ Form presents structured fields, not a freeform text box
- 15 required fields organized into logical sections
- 8 optional fields in dedicated "Optional Information" section
- Clear section headers for grouping

### Requirement 1.2: Required Fields
✅ All required fields are enforced:
1. Product name
2. Product description (min 10 chars)
3. Product category
4. Product type (dropdown)
5. Target customer (min 10 chars)
6. Customer problem (min 10 chars)
7. Customer sophistication level (dropdown)
8. Main benefit (min 10 chars)
9. Key differentiator (min 10 chars)
10. Price or pricing model
11. Marketing goal (dropdown)
12. Launch type (dropdown)
13. Desired CTA (min 5 chars)
14. Primary channel (dropdown)
15. Campaign duration (dropdown)

### Requirement 1.3: Optional Fields
✅ All optional fields are included:
1. Competitors
2. Existing tagline
3. Brand voice
4. Website URL (with validation)
5. Customer testimonials
6. Product documentation
7. Brand guidelines
8. Existing marketing copy

### Requirement 1.4: Field-Specific Error Messages
✅ Validation displays specific errors per field:
- Each field has its own error message state
- Error messages appear below the relevant field
- Error styling (red border) applied to invalid fields
- Errors clear when user starts typing in the field

### Requirement 1.9: URL Validation
✅ Website URL field validates format:
- Must start with http:// or https://
- Uses Zod's `.url()` validator
- Shows error: "Website URL must be a valid URL (starting with http:// or https://)"
- Optional field - empty value is allowed
- Validation only runs if field is populated

## Client-Side Validation Implementation

### Validation Strategy
- Uses Zod schema (ProductBriefSchema) for all validation
- Real-time error clearing on field change
- Validation triggered on form submission
- Scroll to first error field on validation failure

### Error States
```typescript
errors: Record<string, string>
```
- Keys: field names
- Values: error messages from Zod validation

### Validation Logic
```typescript
ProductBriefSchema.parse(formData)
```
- Catches ZodError on validation failure
- Extracts field-specific errors from error.issues
- Maps errors to field names for display

## Manual Testing Checklist

### Test 1: Empty Form Submission
1. Navigate to /campaign/new
2. Click "Create Campaign" without filling any fields
3. ✅ Verify all required fields show error messages
4. ✅ Verify form does not submit

### Test 2: Invalid URL
1. Fill all required fields
2. Enter invalid URL in Website URL field (e.g., "not-a-url")
3. Click "Create Campaign"
4. ✅ Verify URL validation error appears
5. ✅ Verify form does not submit

### Test 3: Valid URL Formats
1. Test with: https://example.com
2. Test with: http://example.com
3. Test with empty string (optional field)
4. ✅ All should pass validation

### Test 4: Minimum Character Requirements
1. Enter 9 characters in "Product description" (requires 10)
2. ✅ Verify error: "Product description must be at least 10 characters"
3. Add one more character
4. ✅ Verify error clears

### Test 5: Dropdown Validations
1. Leave all dropdowns at default "Select..." option
2. Click "Create Campaign"
3. ✅ Verify specific errors for each dropdown field
4. ✅ Verify dropdown fields show red border

### Test 6: Error Clearing
1. Trigger validation error on a field
2. Start typing in that field
3. ✅ Verify error message disappears immediately
4. ✅ Verify red border is removed

### Test 7: Optional Fields
1. Fill all required fields
2. Leave all optional fields empty
3. Click "Create Campaign"
4. ✅ Verify form passes validation
5. ✅ Verify no errors for empty optional fields

### Test 8: Testimonial Preservation Note
1. View the "Customer Testimonials" field
2. ✅ Verify helper text: "Testimonials will be preserved character-for-character in your campaign assets."
3. This implements Requirement 1.6

## Form Behavior

### Loading States
- Submit button shows "Creating Campaign..." during submission
- Submit button disabled during submission
- Gray background on disabled button

### Form Structure
- Sections: Product Information, Customer Information, Value Proposition, Campaign Details, Optional Information
- Visual hierarchy with section borders
- Required field asterisks (*)
- Helper text for optional fields

### Accessibility
- All inputs have proper labels
- IDs match label htmlFor attributes
- Error messages associated with fields
- Focus management on validation failure

## Integration Points

### Server Action (Task 2.2)
Form is ready for integration with `createCampaignFromBrief` server action:
```typescript
// TODO: Call createCampaignFromBrief server action (Task 2.2)
console.log('Form submitted:', formData)
```

Current behavior: Shows alert on successful validation

## Field Mappings to ProductBriefSchema

All form fields map directly to ProductBriefData type:
- Text inputs → string fields
- Textareas → string fields (longer content)
- Selects → string fields (constrained values)
- All validated by Zod schema at runtime

## Success Criteria

✅ All required fields enforced with client-side validation
✅ All optional fields included and functional
✅ URL validation working correctly
✅ Field-specific error messages displayed
✅ Errors clear on user input
✅ Form structure is guided and organized
✅ TypeScript compilation passes
✅ No console errors on page load
✅ Responsive layout for mobile/desktop
✅ Accessible form with proper labels

Task 2.1 is COMPLETE and ready for Task 2.2 (server action integration).
