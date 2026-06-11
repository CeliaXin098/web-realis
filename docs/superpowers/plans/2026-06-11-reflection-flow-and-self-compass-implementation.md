# AI Reflection Flow And Self Compass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Merge the reflection preparation and conversation into one switching card, add a complete new-round reset, and make the compass self node open a dedicated long-term self profile.

**Architecture:** Keep the existing reflection and compass pages, but extract pure helpers for flow reset, MBTI normalization, and self-profile aggregation so behavior is testable without rendering. Extend `user_memory_profiles` for confirmed/inferred MBTI and aggregated Jungian functions, then pass that profile into `RelationshipBoard` as a separate self-detail data source.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS, Supabase/Postgres, Vitest, Playwright

---

### Task 1: Add MBTI And Self-Profile Helpers

**Files:**
- Create: `src/lib/relationship/self-profile.ts`
- Modify: `src/lib/memory/types.ts`
- Test: `tests/unit/self-profile.test.ts`

- [ ] Write failing tests for extracting one MBTI code from verbose AI text, formatting inferred versus confirmed labels, aggregating Jungian functions, and preserving confirmed MBTI.
- [ ] Run `npm run test:run -- tests/unit/self-profile.test.ts` and verify the new tests fail.
- [ ] Implement `extractMbtiType`, `formatMbtiLabel`, `aggregateSelfJungianFunctions`, and `mergeSelfProfileInsights`.
- [ ] Run the focused test and verify it passes.

### Task 2: Extend Long-Term Memory Persistence

**Files:**
- Create: `supabase/migrations/20260611210000_add_self_profile_insights.sql`
- Modify: `supabase/schema.sql`
- Modify: `src/lib/memory/persistence.ts`
- Modify: `src/lib/memory/server.ts`
- Modify: `src/app/api/records/route.ts`
- Test: `tests/unit/memory.test.ts`

- [ ] Write failing memory tests proving inferred MBTI is reduced to one type and confirmed MBTI is not overwritten.
- [ ] Add `mbti_type`, `mbti_source`, and `jungian_functions` columns with a source constraint.
- [ ] Merge reflection self-insights into `user_memory_profiles` during record save.
- [ ] Apply the migration to the connected Supabase project.
- [ ] Run memory tests and verify they pass.

### Task 3: Add Self-Profile API

**Files:**
- Create: `src/app/api/self-profile/route.ts`
- Modify: `src/app/compass/page.tsx`
- Test: `tests/unit/self-profile-api.test.ts`

- [ ] Write failing GET/PATCH tests for reading the current user's self profile and confirming a manually edited MBTI.
- [ ] Implement authenticated GET and PATCH handlers; PATCH accepts one valid four-letter MBTI and sets `mbti_source` to `confirmed`.
- [ ] Fetch the self profile on the compass server page and pass it separately to `RelationshipBoard`.
- [ ] Run focused API tests and verify they pass.

### Task 4: Make The Compass Self Node Selectable

**Files:**
- Modify: `src/components/relationship-board.tsx`
- Modify: `src/lib/relationship/self-profile.ts`
- Test: `tests/e2e/app.spec.ts`

- [ ] Add an E2E expectation that clicking “我自己” opens the self relationship detail.
- [ ] Give `SelfNode` a click/select action distinct from dragging.
- [ ] Render `SelfDetail` with MBTI, Jungian functions, outward presentation, inner needs, self-acceptance, inner/outer alignment, conflicts, and self-care advice.
- [ ] Keep normal `PersonDetail` and relationship archive behavior unchanged for other nodes.
- [ ] Verify manual self MBTI save removes “（推测）”.

### Task 5: Normalize Other-Person MBTI Display

**Files:**
- Modify: `src/components/relationship-board.tsx`
- Modify: `src/lib/relationship/self-profile.ts`
- Modify: `src/lib/ai/prompt.ts`
- Test: `tests/unit/prompt.test.ts`
- Test: `tests/e2e/app.spec.ts`

- [ ] Add tests requiring one MBTI code and inferred-label formatting.
- [ ] Tighten the AI prompt to return one most likely four-letter type only.
- [ ] Display normalized inferred values as `TYPE（推测）`; when the user edits and saves, persist `TYPE`.
- [ ] Verify long descriptions and multiple candidate types no longer appear in MBTI cards.

### Task 6: Merge Reflection Preparation And Conversation

**Files:**
- Modify: `src/app/reflect/page.tsx`
- Create: `src/lib/reflection/session.ts`
- Test: `tests/unit/reflection-session.test.ts`
- Test: `tests/e2e/app.spec.ts`

- [ ] Write failing tests for resetting all current-session fields while retaining historical records.
- [ ] Replace the separate left and middle cards with one `ReflectionWorkspace` card whose mode is `prepare`, `chat`, or `result`.
- [ ] In prepare mode, show the existing form and start button.
- [ ] In chat mode, use the entire workspace width, increase chat bubble text size, and add “返回补充信息”.
- [ ] In result mode, keep the internal-scrolling letter and display “开始新一轮觉察”.
- [ ] Preserve the independent insight sidebar.

### Task 7: Complete New-Round Behavior

**Files:**
- Modify: `src/app/reflect/page.tsx`
- Modify: `src/components/reflection-result.tsx`
- Test: `tests/e2e/app.spec.ts`

- [ ] Add E2E coverage that “开始新一轮觉察” appears after generation and after save.
- [ ] Reset event, emotions, intensity, person, chat input, messages, reflection, started/saved state, errors, and local draft.
- [ ] Ensure saved records and sidebar history remain visible.
- [ ] Verify the new round returns to prepare mode.

### Task 8: Full Verification

**Files:**
- Test: `tests/e2e/app.spec.ts`

- [ ] Run `npm run typecheck`.
- [ ] Run `npm run test:run`.
- [ ] Run `npm run e2e`.
- [ ] Run `git diff --check`.
- [ ] Verify the rendered reflection workspace at desktop and mobile widths.
- [ ] Verify the compass self node, inferred MBTI, confirmed MBTI, and ordinary-person detail.
