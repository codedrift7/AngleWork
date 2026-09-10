# ORCHESTRATOR.TS TIMEOUT FIX - MANUAL GUIDE

## Problem
Automated regex replacement corrupted the `withTimeout()` calls by removing the agent function
parameter. The file needs manual editing.

## Required Changes

### Change 1: Positioning Strategist (Line ~260)

**Current (BROKEN):**
```typescript
const positioningResult = await withTimeout(
  120000, // 120 seconds
  'Positioning Strategist agent exceeded 120 second timeout'
)
```

**Fixed:**
```typescript
const positioningResult = await withTimeout(
  positioningStrategistAgent({
    data: { 
      productBrief, 
      productIntelligence: productIntelligenceResult.result 
    },
    campaignId
  }),
  120000, // 120 seconds
  'Positioning Strategist agent exceeded 120 second timeout'
)
```

### Change 2: AIDA Strategist (Line ~390)

**Current (BROKEN):**
```typescript
const aidaStrategyResult = await withTimeout(
  120000, // 120 seconds
  'AIDA Strategist agent exceeded 120 second timeout'
)
```

**Fixed:**
```typescript
const aidaStrategyResult = await withTimeout(
  aidaStrategistAgent({
    data: {
      productBrief,
      productIntelligence,
      positioning,
      selectedAngle
    },
    campaignId
  }),
  120000, // 120 seconds
  'AIDA Strategist agent exceeded 120 second timeout'
)
```

### Change 3: Campaign Critic (Line ~515)

**Current (BROKEN):**
```typescript
const critiqueResult = await withTimeout(
  120000, // 120 seconds
  'Campaign Critic agent exceeded 120 second timeout'
)
```

**Fixed:**
```typescript
const critiqueResult = await withTimeout(
  campaignCriticAgent({
    data: {
      campaign: {
        id: strategy.campaign.id,
        name: strategy.campaign.name,
        productBrief
      },
      aidaStrategy,
      assets: assetOutputs,
      productIntelligence
    },
    campaignId
  }),
  120000, // 120 seconds
  'Campaign Critic agent exceeded 120 second timeout'
)
```

### Change 4: Launch Calendar (Line ~595)

**Current (BROKEN):**
```typescript
const launchCalendarResult = await withTimeout(
  120000, // 120 seconds
  'Launch Calendar agent exceeded 120 second timeout'
)
```

**Fixed:**
```typescript
const launchCalendarResult = await withTimeout(
  launchCalendarAgent({
    data: {
      assets: campaignAssets,
      aidaStrategy
    },
    campaignId
  }),
  120000, // 120 seconds
  'Launch Calendar agent exceeded 120 second timeout'
)
```

## Steps to Fix

1. Open `src/lib/pipeline/orchestrator.ts` in your editor
2. Search for each broken `withTimeout` call (search for "120000, // 120 seconds")
3. Add the agent function call as the first parameter
4. Keep the 120000 timeout and error message
5. Save the file
6. Clear Next.js cache: `Remove-Item -Recurse -Force .next`
7. Restart dev server: `npm run dev`

## Alternative: Restore from Git

If you have a clean version in git history:
```powershell
git log --oneline -- src/lib/pipeline/orchestrator.ts
# Find a commit before corruption
git checkout [commit-hash] -- src/lib/pipeline/orchestrator.ts
# Then manually change just the timeout values from 30000 to 120000
```
