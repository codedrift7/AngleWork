# Requirements Document

## Introduction

Anglework is an AI marketing strategist and campaign builder. It transforms product information into a complete, ready-to-execute marketing campaign by working through a structured pipeline: understanding the product, establishing positioning, building an AIDA-based persuasion strategy, generating channel-specific assets, critiquing the campaign for quality, and producing a day-by-day launch calendar.

This document covers the MVP scope: Product Onboarding, Product Intelligence, Positioning Strategy, AIDA Strategy, Campaign Builder, Campaign Critic, and Launch Calendar. Everything in scope is built on a single underlying strategy; channel assets are derived from that strategy, not generated independently.

AIDA (Attention, Interest, Desire, Action) is the internal persuasion framework Anglework uses to structure strategy and assets — it is not a label or brand surface visible as the product itself.

---

## Glossary

- **System**: The Anglework web application.
- **Product_Brief**: The structured set of user-supplied information about their product, customer, business, and campaign goals, collected through the onboarding form.
- **Product_Intelligence**: The AI-generated analysis of the Product_Brief, extracting the ideal customer profile, primary pain, desired outcome, value proposition, differentiators, objections, and emotional drivers.
- **Positioning_Strategy**: The AI-generated document defining the product's category, positioning statement, value proposition, and a set of candidate Messaging_Angles.
- **Messaging_Angle**: A single framing of the product's core value (e.g., pain-focused, outcome-focused, or time-focused) that anchors the language across all campaign assets.
- **AIDA_Strategy**: The AI-generated, product-specific persuasion strategy broken into four stages — Attention, Interest, Desire, and Action — each with a strategic objective and stage-specific content direction.
- **Campaign**: The top-level entity grouping a Product_Brief, Product_Intelligence, Positioning_Strategy, AIDA_Strategy, Campaign_Assets, Campaign_Critique, and Launch_Calendar for a single product.
- **Campaign_Asset**: A piece of channel-specific marketing content (LinkedIn post, email, landing page section, or ad) generated from the AIDA_Strategy.
- **Campaign_Critique**: The AI-generated quality assessment of all Campaign_Assets, including per-stage scores, overall score, identified weaknesses, and actionable recommendations.
- **Launch_Calendar**: The 7-day execution plan that sequences Campaign_Assets into daily actions.
- **AIDA_Stage**: One of the four persuasion stages — Attention, Interest, Desire, or Action.
- **Channel**: One of the four supported marketing channels — LinkedIn, Email, Landing_Page, or Ads.
- **ICP**: Ideal Customer Profile — the specific customer segment best suited to the product.
- **Placeholder**: Explicit inline text in generated content that marks where real customer data (testimonials, metrics, proof) should be inserted, e.g., `[Insert customer testimonial here]`.
- **User**: A person using Anglework to build a campaign for their product.
- **Fix_Campaign**: The action that applies a Campaign_Critique recommendation directly to the relevant Campaign_Asset.

---

## Requirements

### Requirement 1: Product Onboarding

**User Story:** As a founder or marketer, I want to fill out a structured product brief through a guided form, so that I can give Anglework the information it needs to build my campaign without having to write a freeform prompt.

#### Acceptance Criteria

1. THE System SHALL present the Product_Brief form as a guided, multi-field interface — not a single freeform text box.
2. THE System SHALL require the following fields before a campaign can be submitted: product name, product description, product category, product type, target customer, customer problem, customer sophistication level, main benefit, key differentiator, price or pricing model, marketing goal, launch type, desired CTA, primary channel, and campaign duration.
3. THE System SHALL accept the following optional fields: competitors, existing tagline, brand voice, website URL, customer testimonials, product documentation, brand guidelines, and existing marketing copy.
4. WHEN the User submits the Product_Brief form with one or more required fields left blank, THE System SHALL identify each missing field by name in an explicit error message and SHALL NOT create a campaign record or advance any pipeline stage until all required fields are completed.
5. WHEN the User submits the Product_Brief form with all required fields populated, THE System SHALL save the Product_Brief and begin the Product Intelligence phase before generating any copy or strategy.
6. WHEN the User supplies a customer testimonial in the optional fields (e.g., "I went from spending 3 hours on bookkeeping to 10 minutes"), THE System SHALL carry that testimonial through to relevant Campaign_Assets with character-for-character fidelity — preserving all punctuation, capitalization, and line breaks — without alteration.
7. WHEN the User does not supply a testimonial or performance metric, THE System SHALL insert an explicit Placeholder in every Campaign_Asset section that would normally contain customer proof — for example, `[Insert customer testimonial here]` — and SHALL NOT generate or infer any testimonial content.
8. WHEN a User provides a product brief for an AI bookkeeping assistant for freelancers with the target customer set to "Freelancers earning $30k–$150k/year," THE System SHALL propagate that exact target customer definition, character-for-character, through Product Intelligence, Positioning_Strategy, AIDA_Strategy, and all Campaign_Assets without substituting a different customer segment.
9. WHEN the User enters a value in the optional website URL field, THE System SHALL validate that the value is a well-formed URL (beginning with http:// or https://); IF the value is not a well-formed URL, THEN THE System SHALL display an inline validation error identifying the field and SHALL prevent form submission until the field is corrected or cleared.

---

### Requirement 2: Product Intelligence

**User Story:** As a User, I want Anglework to analyze my product brief and surface a clear picture of my ideal customer, their pain, and my product's core promise, so that I understand how Anglework has interpreted my product before any strategy or copy is written.

#### Acceptance Criteria

1. WHEN the Product_Brief is submitted, THE System SHALL generate Product_Intelligence before generating any positioning, strategy, or Campaign_Assets.
2. THE System SHALL derive the following fields from the Product_Brief and present them as a Product Intelligence Card: ideal customer profile, core problem, primary pain expressed in customer language, desired customer outcome, core promise, differentiators, emotional drivers, likely objections, and recommended messaging angle. Each field SHALL contain at least 1 and no more than 5 entries, except recommended messaging angle which SHALL contain exactly 1 entry.
3. WHEN generating the primary pain field, THE System SHALL express it in the customer's own words rather than in product-feature terms (e.g., "I don't know where my money is really going" rather than "lack of financial visibility"), using a first-person statement between 5 and 30 words in length.
4. THE System SHALL derive at least 2 and no more than 5 likely objections directly from the product category and differentiators provided in the Product_Brief (e.g., for an AI bookkeeping assistant: "Can I trust the numbers?", "Is my financial data secure?").
5. WHEN Product_Intelligence has been generated, THE System SHALL display the Product Intelligence Card to the User before proceeding to positioning.
6. WHEN the Product_Intelligence references customer outcomes, testimonials, or performance statistics that were not supplied in the Product_Brief, THE System SHALL insert a Placeholder in the format `[PLACEHOLDER: description of missing data]` rather than fabricating data.
7. WHILE Product_Intelligence is being generated, THE System SHALL display a progress indicator to the User that updates at least once every 5 seconds until generation is complete.
8. IF the AI pipeline fails to return a valid Product_Intelligence response within 30 seconds, THEN THE System SHALL display an error message indicating the failure and allow the User to retry without losing the Product_Brief data.
9. IF the Product_Brief is missing any of the following fields required to derive Product_Intelligence — product name, target audience, or core value proposition — THEN THE System SHALL display an error message identifying the missing fields and SHALL NOT proceed to generate Product_Intelligence until the User supplies the missing data.

---

### Requirement 3: Positioning Strategy

**User Story:** As a User, I want Anglework to generate a positioning strategy with multiple messaging angles and let me choose the one that fits my brand, so that my entire campaign is built on a deliberate, coherent position rather than a generic one.

#### Acceptance Criteria

1. WHEN Product_Intelligence has been generated, THE System SHALL generate a Positioning_Strategy that includes: product category, positioning statement (no more than 50 words), core value proposition, primary pain addressed, desired customer transformation, and exactly three Messaging_Angles.
2. THE System SHALL generate exactly three Messaging_Angles, each belonging to a distinct category — one focused on customer pain, one focused on desired outcome, and one focused on time or effort saving — with no two angles sharing the same central claim (e.g., for the bookkeeping assistant: pain — "Stop guessing where your money went"; outcome — "Know your real numbers without becoming an accountant"; time — "Take bookkeeping off your Sunday-night to-do list").
3. WHEN the Positioning_Strategy has been generated, THE System SHALL present the three Messaging_Angles to the User and SHALL NOT generate any Campaign_Assets until the User has selected exactly one Messaging_Angle.
4. THE System SHALL display, alongside each Messaging_Angle, an explanation (no more than 75 words) of why that angle was recommended, referencing the specific product, customer segment, and primary pain from the Product_Intelligence.
5. WHEN the User selects exactly one Messaging_Angle, THE System SHALL record that selection and use it as the sole anchor for all subsequent Campaign_Asset copy.
6. WHEN the Positioning_Strategy references competitive comparisons, market share figures, or performance benchmarks not supplied in the Product_Brief, THE System SHALL insert a Placeholder for each such value rather than fabricating data.
7. IF the AI pipeline fails to return a valid Positioning_Strategy within 30 seconds, or returns a response missing any required field, THEN THE System SHALL display an error message and allow the User to retry from the Positioning_Strategy step without losing Product_Intelligence results.

---

### Requirement 4: AIDA Strategy

**User Story:** As a User, I want Anglework to build a product-specific AIDA persuasion strategy before writing any campaign copy, so that every asset is grounded in a coherent argument rather than being a collection of independent AI-generated paragraphs.

#### Acceptance Criteria

1. WHEN the User has selected a Messaging_Angle, THE System SHALL generate an AIDA_Strategy before generating any Campaign_Assets.
2. THE AIDA_Strategy SHALL contain four stages — Attention, Interest, Desire, and Action — each comprising a non-empty strategic objective and a non-empty content direction, both derived from the Product_Intelligence and selected Messaging_Angle.
3. THE System SHALL ground the Attention stage in the product's primary customer pain point or a hook tied to the selected Messaging_Angle, and SHALL NOT open with a list of product features (e.g., for the bookkeeping assistant: "Lead with financial uncertainty — 'Your bank balance isn't the same as knowing how much money you have.'").
4. THE System SHALL ground the Interest stage in the cost or consequence of the customer's unsolved problem, drawing on differentiators and objections present in the Product_Intelligence.
5. THE System SHALL ground the Desire stage in the customer outcome — the shift from the current painful state to the result the customer wants — and SHALL NOT express it as a list of product features.
6. IF the Product_Brief contains a non-empty secondary CTA field, THEN THE System SHALL include both the primary CTA and the secondary CTA in the Action stage; otherwise THE System SHALL include only the primary CTA sourced from the Product_Brief.
7. WHEN the AIDA_Strategy has been generated, THE System SHALL display it to the User before generating Campaign_Assets.
8. WHEN the AIDA_Strategy references social proof, testimonials, case studies, or performance statistics not supplied by the User in the Product_Brief or Product_Intelligence, THE System SHALL render each such reference as a bracketed placeholder (e.g., `[TESTIMONIAL]`, `[STAT]`, `[CASE_STUDY]`) rather than fabricating specific data.
9. IF the AI pipeline returns a response in which one or more of the four AIDA stages is absent or contains an empty strategic objective or empty content direction, THEN THE System SHALL display an error message indicating the strategy could not be completed and SHALL allow the User to retry generation from the AIDA_Strategy step without discarding the Positioning_Strategy results.

---

### Requirement 5: Campaign Builder

**User Story:** As a User, I want Anglework to generate a complete set of channel-specific marketing assets — LinkedIn posts, emails, landing page copy, and ads — all derived from the same AIDA strategy, so that my campaign presents a consistent message across every channel.

#### Acceptance Criteria

1. WHEN the AIDA_Strategy has been generated and the User triggers campaign building, THE System SHALL generate Campaign_Assets for all four channels: LinkedIn, Email, Landing_Page, and Ads.
2. THE System SHALL generate exactly four LinkedIn posts, one per AIDA_Stage, each labelled with its stage: (1) Attention — hook-driven, (2) Interest — educational, (3) Desire — transformation-focused, (4) Action — product and CTA. Each LinkedIn post SHALL be no more than 3,000 characters.
3. THE System SHALL generate exactly four emails, one per AIDA_Stage, each containing: subject line (no more than 60 characters), preview text (no more than 90 characters), body (no more than 500 words), CTA, AIDA_Stage label, and strategic purpose statement.
4. THE System SHALL generate landing page copy structured as: headline, subheadline, primary CTA, problem section, why-current-solutions-fail section, product solution section, benefits section, how-it-works section, objection handling section, social proof section, FAQ section, and final CTA section.
5. THE System SHALL generate at least three ad concepts, each containing: headline, primary text, CTA, target audience, AIDA_Stage, and a stated rationale for why this angle could work. The three ad angles SHALL be meaningfully distinct — at minimum one pain-based, one outcome-based, and one identity-based (e.g., pain: "Still sorting receipts every Sunday?"; outcome: "Know your real profit in minutes"; identity: "Built for freelancers who'd rather run their business than their spreadsheets").
6. WHEN generating Campaign_Assets, THE System SHALL use the selected Messaging_Angle as the primary message anchor — every asset SHALL directly include or explicitly support the Messaging_Angle's core claim — and SHALL NOT contradict the selected angle with messaging from a different Messaging_Angle.
7. WHEN a Campaign_Asset section calls for customer testimonials, case study results, conversion rates, revenue figures, awards, or other social proof not supplied by the User, THE System SHALL insert an explicit Placeholder (e.g., `[Insert customer proof here]`) rather than inventing data.
8. WHEN the product-specific differentiator from the AIDA_Strategy (e.g., "automated transaction categorization plus proactive tax estimates") is relevant to a Campaign_Asset across LinkedIn posts, emails, landing page copy, and ads, THE System SHALL reference that differentiator rather than substituting a generic differentiator.
9. WHEN all Campaign_Assets have been generated, THE System SHALL present them to the User organized by channel, with each asset's channel name and AIDA_Stage displayed as a visible section heading.
10. IF the AI pipeline fails to return any Campaign_Asset for a given channel within 30 seconds or returns an error, THEN THE System SHALL identify which channel(s) failed, display an error message, and allow the User to retry the failed channel(s) up to 3 times without regenerating successfully generated channels.

---

### Requirement 6: Campaign Critic

**User Story:** As a User, I want Anglework to score and critique the campaign it generated, identify the weakest stage, and offer a concrete recommendation I can apply in one click, so that I can improve the campaign quality before I launch.

#### Acceptance Criteria

1. WHEN all Campaign_Assets have been generated, THE System SHALL generate a Campaign_Critique automatically.
2. THE Campaign_Critique SHALL include an integer score from 1 to 10 for each AIDA_Stage (Attention, Interest, Desire, Action), a message consistency score (1–10), an audience fit score (1–10), and an overall score computed as the arithmetic mean of all six component scores, rounded to one decimal place.
3. THE Campaign_Critique SHALL identify the AIDA_Stage with the lowest component score as the critical finding; IF two or more stages share the lowest score, THE System SHALL select the stage that appears earliest in the Attention → Interest → Desire → Action sequence. THE System SHALL state why the identified stage scored low and provide a specific recommendation referencing the actual product and customer (e.g., "Your Desire stage is too feature-focused. Replace 'Automated expense categorization' with 'Stop spending Sunday nights sorting receipts.'").
4. WHEN the Campaign_Critique has been generated, THE System SHALL display it to the User alongside the Campaign_Assets in the Campaign Dashboard.
5. WHEN the User triggers the Fix_Campaign action, THE System SHALL apply the primary Campaign_Critique recommendation by replacing the content of the identified Campaign_Asset(s) in place and re-displaying the updated asset(s) within the Campaign Dashboard.
6. WHEN the Fix_Campaign action is applied, THE System SHALL update only the Campaign_Asset(s) identified in the recommendation — it SHALL NOT regenerate Campaign_Assets that were not identified as needing improvement.
7. WHEN the Campaign_Critique references benchmarks, industry averages, conversion rates, or competitive performance data not supplied by the User, THE System SHALL insert a Placeholder in the format `[BENCHMARK: description]` rather than fabricating figures.
8. IF the AI pipeline fails to generate a Campaign_Critique, THEN THE System SHALL display an error message and allow the User to retry without losing any Campaign_Asset data.

---

### Requirement 7: Launch Calendar

**User Story:** As a User, I want a 7-day, day-by-day execution plan that sequences my campaign assets into concrete daily actions, so that I know exactly what to do on each day of my launch week.

#### Acceptance Criteria

1. WHEN Campaign_Assets and a Campaign_Critique are available, THE System SHALL generate a Launch_Calendar covering exactly 7 days.
2. THE Launch_Calendar SHALL assign Campaign_Assets to days according to the following stage windows: Attention-stage assets on Day 1 or Day 2, Interest-stage assets on Day 3 or Day 4, Desire-stage assets on Day 5 or Day 6, and Action-stage assets on Day 7; IF a given AIDA_Stage has no Campaign_Assets, THE System SHALL leave that stage's window empty and shift remaining stages to fill the gap without exceeding 7 days.
3. EACH day in the Launch_Calendar SHALL contain at least one concrete action, expressed as an imperative (e.g., "Publish Attention LinkedIn post", "Send Interest email", "Launch pain-focused ad"); IF the total number of Campaign_Assets is fewer than 7, THE System SHALL compress the calendar by combining lighter action days rather than creating empty days.
4. THE Launch_Calendar SHALL distribute assets across the 7 days such that no single day has more than three separate actions; IF the total number of Campaign_Assets exceeds 21, THE System SHALL schedule the first 21 actions in AIDA stage order and display a warning listing any unscheduled assets.
5. IF the Landing_Page Campaign_Asset exists, THEN THE System SHALL schedule a "Finalize landing page copy" action on Day 1 as the first action of that day, before any social posts or email sends.
6. WHEN the Launch_Calendar has been generated, THE System SHALL display it as an ordered, day-labelled list within the Campaign Dashboard.
7. WHEN the Launch_Calendar references timing, THE System SHALL express all timing as relative days (Day 1, Day 2, etc.) and SHALL NOT fabricate specific calendar dates, channel posting times, or platform-specific scheduling windows unless the User has supplied them in the Product_Brief.
8. IF the AI pipeline fails to generate a Launch_Calendar, THEN THE System SHALL display an error message and allow the User to retry without losing any Campaign_Asset or Campaign_Critique data.

---

### Requirement 8: Campaign Dashboard

**User Story:** As a User, I want a single-screen Campaign Dashboard that surfaces my strategy, assets, critique score, and launch calendar in one place, so that I can review and act on my campaign without navigating across multiple disconnected pages.

#### Acceptance Criteria

1. THE System SHALL provide a Campaign Dashboard view that displays, on a single screen: campaign name, campaign status, strategy summary (ICP, positioning statement, core promise, selected Messaging_Angle), AIDA_Strategy breakdown, generated Campaign_Assets organized by channel, Campaign_Critique scores and primary recommendation, Launch_Calendar, and overall campaign score.
2. WHEN a campaign pipeline stage has not yet been completed, THE System SHALL display a distinct visual indicator (e.g., a status badge or icon) that differentiates incomplete stages from complete stages for all pipeline stages: Product Intelligence, Positioning Strategy, AIDA Strategy, Campaign Builder, Campaign Critic, and Launch Calendar.
3. THE System SHALL make all generated Campaign_Assets editable by the User directly in the Campaign Dashboard; WHEN the User saves an edit, THE System SHALL persist the change within 2 seconds, and the saved content SHALL NOT be overwritten by subsequent AI operations unless the User explicitly selects that asset for regeneration.
4. WHEN a User edits a Campaign_Asset, THE System SHALL preserve the User's edit, mark the asset with a visible "manually modified" indicator, and exclude the asset from any AI batch regeneration operation unless the User explicitly selects it.
5. THE System SHALL provide a navigation path from the landing page to campaign creation to the Campaign Dashboard, ensuring a User can complete the full flow from Product_Brief submission through Launch_Calendar without dead ends; IF any navigation transition fails to load within 5 seconds, THEN THE System SHALL display an error message indicating which step failed to load.
