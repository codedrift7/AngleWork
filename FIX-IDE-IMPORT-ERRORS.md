# How to Fix Import Path Errors in Your IDE

If you're seeing red squiggles on import statements like `import { something } from '@/lib/...'`, follow these steps:

## Quick Fix (Choose One)

### Option 1: Reload VS Code Window
1. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
2. Type "Reload Window"
3. Select "Developer: Reload Window"

### Option 2: Restart TypeScript Server
1. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
2. Type "Restart TS Server"
3. Select "TypeScript: Restart TS Server"

### Option 3: Close and Reopen Your IDE
1. Close all IDE windows
2. Reopen the project folder
3. Wait for TypeScript to initialize (check bottom right status bar)

---

## Verification

After reloading, open any test file (e.g., `src/lib/pipeline/agents/__tests__/aida-strategist.test.ts`) and verify:

✅ No red squiggles on imports like:
```typescript
import * as llmClient from '@/lib/ai/llm-client'
import type { ProductBriefData } from '@/lib/types/campaign'
```

---

## What Was Fixed

The issue was that TypeScript's path mapping needed proper configuration:

1. **Added `baseUrl: "."`** to `tsconfig.json` - required for path aliases to work
2. **Changed `moduleResolution`** from `"bundler"` to `"node"` for better IDE support
3. **Created `.vscode/settings.json`** to ensure IDE uses workspace TypeScript
4. **Excluded manual test files** that have intentional syntax issues

---

## If Errors Persist

1. **Check TypeScript version:**
   ```bash
   npx tsc --version
   ```
   Should show TypeScript 5.x

2. **Verify tsconfig is being used:**
   ```bash
   npx tsc --showConfig | grep "baseUrl"
   ```
   Should show `"baseUrl": "."`

3. **Check IDE is using workspace TypeScript:**
   - Look at bottom right of VS Code status bar
   - Should say "TypeScript 5.x.x" (not "TypeScript (Workspace)")
   - If not, click it and select "Use Workspace Version"

4. **Clear TypeScript cache:**
   - Close IDE
   - Delete `.next` folder
   - Delete `node_modules/.cache` if it exists
   - Reopen IDE

---

## Important Notes

- ✅ **Tests are passing** - The code works correctly
- ✅ **Path aliases are configured** - `@/*` maps to `./src/*`
- ✅ **Imports are valid** - No actual errors in the code
- ⚠️ **IDE just needs to refresh** - This is a TypeScript language server cache issue

The import errors you're seeing are **cosmetic IDE issues**, not actual code problems!
