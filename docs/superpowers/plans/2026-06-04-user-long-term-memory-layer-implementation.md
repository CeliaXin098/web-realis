# User Long-Term Memory Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a first-version per-user long-term memory layer so AI reflection can save stable user patterns and reference relevant memories in future conversations.

**Architecture:** Keep `reflection_records` as the raw source of truth, add `user_memory_profiles` for stable aggregate memory and `user_memory_events` for individual memory facts. The reflect API retrieves relevant memory before model calls and the records API updates memory after a saved reflection. First version uses structured keyword relevance to keep implementation stable; pgvector can be added later.

**Tech Stack:** Next.js route handlers, Supabase Postgres with RLS, OpenAI chat completions, Vitest.

---

### Task 1: Database Schema

**Files:**
- Modify: `supabase/schema.sql`
- Create: `supabase/migrations/20260604150000_user_long_term_memory.sql`

- [ ] Add `user_memory_profiles` with one row per user.
- [ ] Add `user_memory_events` with source record links, memory type, title, content, tags, related person, confidence, and timestamps.
- [ ] Enable RLS and own-user CRUD policies for both tables.
- [ ] Add indexes for user/date/type lookup.

### Task 2: Memory Library

**Files:**
- Create: `src/lib/memory/types.ts`
- Create: `src/lib/memory/relevance.ts`
- Create: `src/lib/memory/context.ts`
- Create: `tests/unit/memory.test.ts`

- [ ] Test that relevant memories rank above unrelated memories.
- [ ] Test that memory context is gentle, non-diagnostic, and empty-safe.
- [ ] Implement memory type definitions, relevance scoring, and prompt context formatting.

### Task 3: Memory Persistence

**Files:**
- Create: `src/lib/memory/persistence.ts`
- Modify: `src/app/api/records/route.ts`
- Test: `tests/unit/memory.test.ts`

- [ ] Build memory events from saved reflection fields without making personality diagnoses.
- [ ] Upsert aggregate user memory profile by merging needs, triggers, and patterns.
- [ ] Call memory persistence after `reflection_records` is saved.

### Task 4: Memory Injection

**Files:**
- Modify: `src/lib/ai/prompt.ts`
- Modify: `src/app/api/reflect/route.ts`
- Test: `tests/unit/prompt.test.ts`

- [ ] Add optional `memoryContext` to reflection prompt input.
- [ ] Fetch user memory profile/events before chat and final reflection calls.
- [ ] Inject relevant memory with soft language: “可参考，但不要机械复述，也不要把一次事件上升为人格判断。”

### Task 5: Verification

**Commands:**
- `npm run typecheck`
- `npm run test:run`
- `npm run e2e`

