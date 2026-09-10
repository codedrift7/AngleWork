# Bugfix Requirements Document

## Introduction

When users complete the multi-step campaign creation form at `/campaign/new` and click "Create Campaign 🚀" on Step 4, they encounter a generic error message "Please correct the errors in the form" with no indication of what's wrong or how to fix it. The root cause is an architectural mismatch: the form at `page.tsx` only collects 15 required fields and displays Step 4 as a review screen, but the server action `createCampaignFromBrief` expects all fields (required + 8 optional fields) per the ProductBriefSchema. When the form submits without optional fields, FormData.get() returns `null` for missing fields, Zod validation fails expecting those fields to be present (even if empty string or undefined), and the user sees a generic error with no way to correct it because the optional fields aren't even in the UI.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN the user completes Steps 1-3 at `/campaign/new` THEN Step 4 displays a review screen with summary (not a form for optional fields)

1.2 WHEN the form state is initialized THEN it only includes 15 required fields and does NOT include the 8 optional fields (competitors, existingTagline, brandVoice, websiteURL, customerTestimonials, productDocs, brandGuidelines, existingCopy)

1.3 WHEN the user clicks "Create Campaign 🚀" THEN FormData is created from formData state and optional fields are omitted entirely (not sent to server)

1.4 WHEN the server action `createCampaignFromBrief` receives the FormData THEN FormData.get() returns `null` for all 8 missing optional fields

1.5 WHEN ProductBriefSchema validates the data with missing optional fields THEN validation fails because the schema expects optional fields to be present (as string | undefined), not absent

1.6 WHEN validation fails THEN the UI displays a generic error banner "Please correct the errors in the form" without indicating which fields are problematic

1.7 WHEN the user sees the generic error THEN they have no way to fix it because the optional fields don't exist in the UI at all

### Expected Behavior (Correct)

2.1 WHEN the user completes Steps 1-3 at `/campaign/new` THEN Step 4 SHALL include input fields for the 8 optional fields OR initialize them as empty strings in form state

2.2 WHEN the form is submitted with optional fields left empty THEN those fields SHALL be sent as empty strings (`""`) to the server action, not omitted from FormData

2.3 WHEN ProductBriefSchema validates data with optional fields as empty strings THEN validation SHALL pass successfully (treating empty strings as valid for optional fields)

2.4 WHEN all validation passes THEN the system SHALL successfully create the campaign and redirect to `/campaign/[id]`

2.5 WHEN validation fails due to genuinely invalid data THEN the system SHALL display specific field errors next to the corresponding fields

### Unchanged Behavior (Regression Prevention)

3.1 WHEN all 15 required fields are properly filled THEN the system SHALL CONTINUE TO proceed through Steps 1-3 successfully

3.2 WHEN the user navigates between form steps using Back/Continue buttons THEN the system SHALL CONTINUE TO preserve entered values

3.3 WHEN the user leaves required fields empty and clicks Continue THEN the system SHALL CONTINUE TO show validation errors and prevent navigation to the next step

3.4 WHEN a campaign is successfully created with all required fields THEN the system SHALL CONTINUE TO redirect users to `/campaign/[id]`

3.5 WHEN Step 4 displays the review summary THEN it SHALL CONTINUE TO show Product, Category, Target, and Goal information correctly

3.6 WHEN the form submission encounters a redirect (Next.js redirect() call) THEN the system SHALL CONTINUE TO handle it as expected behavior, not an error
