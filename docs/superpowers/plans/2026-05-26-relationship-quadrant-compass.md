# Relationship Quadrant Compass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current simple relationship board with a relationship-quality quadrant map using health, joy, Tier, MBTI, Jungian functions, relationship mode tags, and interaction history.

**Architecture:** Add a small pure domain module for relationship scoring, quadrant classification, Tier mapping, and relation mode tag inference. Keep Supabase data backward-compatible by adding optional TypeScript fields plus a migration with defaults. Replace the current board UI with a focused quadrant map component and a detail panel while preserving the existing MBTI PATCH flow.

**Tech Stack:** Next.js App Router, React client components, TypeScript, Tailwind CSS, Supabase/Postgres migrations, Vitest.

---

## File Structure

- Create `src/lib/relationship/compass.ts`: pure functions and exported types for quadrant, Tier, score normalization, fallback inference, display labels, and mode tags.
- Create `tests/unit/relationship-compass.test.ts`: unit tests for the pure relationship compass logic.
- Create `supabase/migrations/20260526090000_add_relationship_quadrant_fields.sql`: add `health_score`, `joy_score`, `tier`, and `relation_mode_tags` to `person_profiles`.
- Modify `src/lib/records/types.ts`: add optional relationship compass fields to `CompassUpdate`.
- Modify `src/components/relationship-board.tsx`: replace card-grid implementation with a quadrant map plus detail panel, preserve MBTI editing.
- Modify `src/app/compass/page.tsx`: fix garbled Chinese text, pass new fields from E2E and Supabase data, keep login/setup states.
- Modify `tests/e2e/app.spec.ts` if selectors/text expectations need the new "关系象限" UI wording.

---

### Task 1: Relationship Compass Domain Logic

**Files:**
- Create: `src/lib/relationship/compass.ts`
- Create: `tests/unit/relationship-compass.test.ts`
- Modify: `src/lib/records/types.ts`

- [ ] **Step 1: Write the failing unit tests**

Create `tests/unit/relationship-compass.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  classifyQuadrant,
  getQuadrantCopy,
  inferRelationModeTags,
  mapClosenessToTier,
  normalizeCompassProfile,
  normalizeScore,
} from "@/lib/relationship/compass";

describe("relationship compass logic", () => {
  it("normalizes score values into the 1-5 range", () => {
    expect(normalizeScore(undefined, 4)).toBe(4);
    expect(normalizeScore(0, 3)).toBe(1);
    expect(normalizeScore(6, 3)).toBe(5);
    expect(normalizeScore(4, 3)).toBe(4);
  });

  it("classifies the four health and joy quadrants", () => {
    expect(classifyQuadrant(4, 4)).toBe("q1");
    expect(classifyQuadrant(4, 2)).toBe("q2");
    expect(classifyQuadrant(2, 4)).toBe("q3");
    expect(classifyQuadrant(2, 2)).toBe("q4");
    expect(getQuadrantCopy("q1").title).toBe("滋养关系");
  });

  it("maps closeness score to Tier with closer people getting smaller Tier numbers", () => {
    expect(mapClosenessToTier(5)).toBe(1);
    expect(mapClosenessToTier(4)).toBe(2);
    expect(mapClosenessToTier(3)).toBe(3);
    expect(mapClosenessToTier(1)).toBe(4);
  });

  it("infers relationship mode tags from profile and event text", () => {
    expect(
      inferRelationModeTags({
        relationship_type: "朋友",
        relationship_pattern_summary: "我们经常很开心，但也会互相比较，偶尔有隐性竞争",
        common_triggers: ["被忽视", "比较"],
        eventsText: "每次聚会都很热闹，但结束后我会感觉自己在表演",
      }),
    ).toEqual(expect.arrayContaining(["表演型关系", "亦敌亦友型"]));
  });

  it("normalizes a partial profile into renderable compass values", () => {
    const normalized = normalizeCompassProfile({
      id: "p1",
      relationship_type: "朋友",
      nickname: "小林",
      related_record_count: 2,
      common_triggers: ["被忽视"],
      relationship_pattern_summary: "很支持我，但最近联系变少",
      mbti_tendency: "",
      closeness_score: 4,
      interaction_guide: "下次直接说需求",
    });

    expect(normalized.healthScore).toBeGreaterThanOrEqual(1);
    expect(normalized.joyScore).toBeGreaterThanOrEqual(1);
    expect(normalized.tier).toBe(2);
    expect(normalized.quadrant).toMatch(/^q[1-4]$/);
  });
});
```

- [ ] **Step 2: Run the failing test**

Run:

```bash
npm run test:run -- tests/unit/relationship-compass.test.ts
```

Expected: fail because `src/lib/relationship/compass.ts` does not exist.

- [ ] **Step 3: Add the domain module**

Create `src/lib/relationship/compass.ts`:

```ts
import type { JungianFunctionInsight } from "@/lib/records/types";

export type RelationType = "朋友" | "同事" | "伴侣" | "家人" | "熟人" | "其他";
export type QuadrantId = "q1" | "q2" | "q3" | "q4";
export type RelationModeTag =
  | "不主动提问型"
  | "无法单独相处型"
  | "表演型关系"
  | "双重义务型"
  | "半伴侣型"
  | "历史型关系"
  | "非平行人生型"
  | "亦敌亦友型"
  | "社媒名人型"
  | "不平衡型";

export type RawCompassProfile = {
  id: string;
  relationship_type: string;
  nickname: string;
  related_record_count: number;
  common_triggers: string[];
  relationship_pattern_summary: string;
  mbti_tendency: string;
  jungian_functions?: JungianFunctionInsight[];
  closeness_score?: number;
  health_score?: number | null;
  joy_score?: number | null;
  tier?: number | null;
  relation_mode_tags?: string[] | null;
  interaction_guide: string;
};

export type NormalizedCompassProfile = RawCompassProfile & {
  relationType: RelationType;
  healthScore: number;
  joyScore: number;
  tier: 1 | 2 | 3 | 4;
  quadrant: QuadrantId;
  relationModeTags: RelationModeTag[];
};

export function normalizeScore(value: number | null | undefined, fallback: number) {
  const next = Number.isFinite(value) ? Number(value) : fallback;
  return Math.min(5, Math.max(1, Math.round(next)));
}

export function classifyQuadrant(healthScore: number, joyScore: number): QuadrantId {
  if (healthScore >= 3 && joyScore >= 3) return "q1";
  if (healthScore >= 3 && joyScore < 3) return "q2";
  if (healthScore < 3 && joyScore >= 3) return "q3";
  return "q4";
}

export function getQuadrantCopy(id: QuadrantId) {
  const copy = {
    q1: { title: "滋养关系", description: "健康且愉悦，适合继续投入与珍惜。" },
    q2: { title: "稳固但费力", description: "关系基础健康，但相处需要更多松弛感。" },
    q3: { title: "上头但消耗", description: "相处有吸引力，也需要留意边界和代价。" },
    q4: { title: "需要边界", description: "当前既不滋养也不轻松，适合降频或重设边界。" },
  } satisfies Record<QuadrantId, { title: string; description: string }>;
  return copy[id];
}

export function mapClosenessToTier(closenessScore: number | null | undefined): 1 | 2 | 3 | 4 {
  const score = normalizeScore(closenessScore, 3);
  if (score >= 5) return 1;
  if (score >= 4) return 2;
  if (score >= 3) return 3;
  return 4;
}

export function normalizeRelationType(value: string): RelationType {
  if (/朋友|友人|闺蜜|兄弟|姐妹/.test(value)) return "朋友";
  if (/同事|工作|上司|下属|客户/.test(value)) return "同事";
  if (/伴侣|恋人|夫妻|爱人/.test(value)) return "伴侣";
  if (/父|母|家人|亲人|孩子|姐姐|妹妹|哥哥|弟弟/.test(value)) return "家人";
  if (/熟人|邻居|同学|普通/.test(value)) return "熟人";
  return "其他";
}

export function inferRelationModeTags(input: {
  relationship_type: string;
  relationship_pattern_summary: string;
  common_triggers: string[];
  eventsText?: string;
}): RelationModeTag[] {
  const text = `${input.relationship_type} ${input.relationship_pattern_summary} ${input.common_triggers.join(" ")} ${input.eventsText || ""}`;
  const tags: RelationModeTag[] = [];
  if (/不问|不主动|总是我问|没有回应/.test(text)) tags.push("不主动提问型");
  if (/不能单独|必须很多人|尴尬|冷场/.test(text)) tags.push("无法单独相处型");
  if (/表演|热闹|人设|装作|维持气氛/.test(text)) tags.push("表演型关系");
  if (/应该|不得不|义务|责任|人情/.test(text)) tags.push("双重义务型");
  if (/像伴侣|依赖|占有|暧昧|边界模糊/.test(text)) tags.push("半伴侣型");
  if (/以前|多年|老朋友|历史|从小/.test(text)) tags.push("历史型关系");
  if (/不同阶段|不同城市|道路不同|节奏不同/.test(text)) tags.push("非平行人生型");
  if (/竞争|比较|嫉妒|塑料|互相刺痛/.test(text)) tags.push("亦敌亦友型");
  if (/社媒|朋友圈|关注|点赞|网上/.test(text)) tags.push("社媒名人型");
  if (/总是我|单方面|不平衡|付出更多/.test(text)) tags.push("不平衡型");
  return tags.slice(0, 3);
}

function inferHealth(profile: RawCompassProfile) {
  const text = `${profile.relationship_pattern_summary} ${profile.common_triggers.join(" ")}`;
  if (/支持|尊重|清楚|稳定|安全/.test(text)) return 4;
  if (/消耗|比较|忽视|控制|压力|冲突/.test(text)) return 2;
  return normalizeScore(profile.closeness_score, 3);
}

function inferJoy(profile: RawCompassProfile) {
  const text = `${profile.relationship_pattern_summary} ${profile.common_triggers.join(" ")}`;
  if (/开心|轻松|有趣|温暖|自在/.test(text)) return 4;
  if (/无聊|别扭|紧张|焦虑|疲惫|尴尬/.test(text)) return 2;
  return 3;
}

export function normalizeCompassProfile(profile: RawCompassProfile, eventsText = ""): NormalizedCompassProfile {
  const healthScore = normalizeScore(profile.health_score, inferHealth(profile));
  const joyScore = normalizeScore(profile.joy_score, inferJoy(profile));
  const relationModeTags = (
    profile.relation_mode_tags?.length
      ? profile.relation_mode_tags
      : inferRelationModeTags({ ...profile, eventsText })
  ).filter((tag): tag is RelationModeTag =>
    [
      "不主动提问型",
      "无法单独相处型",
      "表演型关系",
      "双重义务型",
      "半伴侣型",
      "历史型关系",
      "非平行人生型",
      "亦敌亦友型",
      "社媒名人型",
      "不平衡型",
    ].includes(tag),
  );

  return {
    ...profile,
    relationType: normalizeRelationType(profile.relationship_type),
    healthScore,
    joyScore,
    tier: normalizeScore(profile.tier, mapClosenessToTier(profile.closeness_score)) as 1 | 2 | 3 | 4,
    quadrant: classifyQuadrant(healthScore, joyScore),
    relationModeTags,
  };
}
```

- [ ] **Step 4: Add optional fields to record types**

Modify `src/lib/records/types.ts`:

```ts
export type CompassUpdate = {
  relationship_type: string;
  nickname: string;
  closeness_score?: number;
  health_score?: number | null;
  joy_score?: number | null;
  tier?: number | null;
  relation_mode_tags?: string[] | null;
  common_triggers: string[];
  relationship_pattern_summary: string;
  mbti_tendency: string;
  jungian_functions?: JungianFunctionInsight[];
  interaction_guide: string;
};
```

- [ ] **Step 5: Verify the unit test passes**

Run:

```bash
npm run test:run -- tests/unit/relationship-compass.test.ts
```

Expected: all tests pass.

---

### Task 2: Supabase Migration

**Files:**
- Create: `supabase/migrations/20260526090000_add_relationship_quadrant_fields.sql`

- [ ] **Step 1: Add the migration file**

Create `supabase/migrations/20260526090000_add_relationship_quadrant_fields.sql`:

```sql
alter table public.person_profiles
add column if not exists health_score integer not null default 3 check (health_score between 1 and 5),
add column if not exists joy_score integer not null default 3 check (joy_score between 1 and 5),
add column if not exists tier integer not null default 3 check (tier between 1 and 4),
add column if not exists relation_mode_tags text[] not null default '{}'::text[];
```

- [ ] **Step 2: Verify the migration file is included**

Run:

```bash
rg "health_score|joy_score|relation_mode_tags" supabase/migrations
```

Expected: the new migration contains all four fields.

---

### Task 3: Compass Page Data Compatibility

**Files:**
- Modify: `src/app/compass/page.tsx`
- Modify: `src/components/relationship-board.tsx`

- [ ] **Step 1: Extend profile typing in the board component**

In `src/components/relationship-board.tsx`, extend `RelationshipProfile`:

```ts
export type RelationshipProfile = {
  id: string;
  relationship_type: string;
  nickname: string;
  related_record_count: number;
  common_triggers: string[];
  relationship_pattern_summary: string;
  mbti_tendency: string;
  jungian_functions?: JungianFunctionInsight[];
  closeness_score?: number;
  health_score?: number | null;
  joy_score?: number | null;
  tier?: number | null;
  relation_mode_tags?: string[] | null;
  interaction_guide: string;
};
```

- [ ] **Step 2: Pass new fields through E2E mock profiles**

In `src/app/compass/page.tsx`, update the E2E profile mapping:

```ts
const profiles = records.flatMap((record) =>
  record.compass_updates.map((update, index) => ({
    id: `${record.id}-${index}`,
    relationship_type: update.relationship_type,
    nickname: update.nickname,
    related_record_count: 1,
    common_triggers: update.common_triggers,
    relationship_pattern_summary: update.relationship_pattern_summary,
    mbti_tendency: update.mbti_tendency,
    jungian_functions: update.jungian_functions,
    closeness_score: update.closeness_score,
    health_score: update.health_score,
    joy_score: update.joy_score,
    tier: update.tier,
    relation_mode_tags: update.relation_mode_tags,
    interaction_guide: update.interaction_guide,
  })),
);
```

- [ ] **Step 3: Replace garbled Chinese copy in `CompassPage`**

Use these page-level strings:

```tsx
<Badge>Relationship Compass</Badge>
<h1 className="text-balance mt-5 max-w-3xl text-4xl font-semibold leading-tight text-ink sm:text-5xl">
  人际罗盘
</h1>
<p className="mt-5 max-w-2xl text-lg leading-8 text-muted">
  把重要关系放进象限图里，看见谁滋养你、谁消耗你，以及下一次如何相处。
</p>
<p className="font-sans-soft mt-5 inline-flex rounded-full border border-line bg-white/58 px-4 py-2 text-sm text-muted">
  MBTI 与荣格八维只用于自我理解，不用于诊断或固定任何人。
</p>
```

Use these metric labels:

```tsx
<Metric icon={UsersRound} label="关系人数" value={profiles.length.toString()} />
<Metric icon={MessagesSquare} label="关联事件" value={events.length.toString()} />
<Metric icon={ShieldCheck} label="相处建议" value={profiles.length > 0 ? "已生成" : "等待中"} />
```

- [ ] **Step 4: Verify typecheck**

Run:

```bash
npm run typecheck
```

Expected: no TypeScript errors.

---

### Task 4: Quadrant Map UI

**Files:**
- Modify: `src/components/relationship-board.tsx`

- [ ] **Step 1: Import the compass domain functions**

Add:

```ts
import {
  getQuadrantCopy,
  normalizeCompassProfile,
  type NormalizedCompassProfile,
} from "@/lib/relationship/compass";
```

- [ ] **Step 2: Normalize profiles with related event text**

Inside `RelationshipBoard`, derive normalized profiles:

```ts
const relationshipProfiles = useMemo(() => localProfiles.filter((profile) => !isSelfProfile(profile)), [localProfiles]);

const normalizedProfiles = useMemo(
  () =>
    relationshipProfiles.map((profile) => {
      const eventsText = events
        .filter((event) => matchesProfile(event, profile))
        .map((event) => `${event.title} ${event.event_text} ${event.emotion_tags.join(" ")}`)
        .join(" ");
      return normalizeCompassProfile(profile, eventsText);
    }),
  [events, relationshipProfiles],
);

const selected = normalizedProfiles.find((profile) => profile.id === selectedId) || normalizedProfiles[0];
```

Add helper:

```ts
function matchesProfile(event: RelationshipEvent, profile: RelationshipProfile) {
  const plainMatch =
    event.related_person === profile.nickname ||
    event.related_person === profile.relationship_type ||
    profile.nickname.includes(event.related_person || "__missing__");
  const compassMatch = event.compass_updates.some(
    (update) => update.nickname === profile.nickname || update.relationship_type === profile.relationship_type,
  );
  return plainMatch || compassMatch;
}
```

- [ ] **Step 3: Replace the old card grid with the quadrant layout**

Use this top-level structure in `RelationshipBoard`:

```tsx
return (
  <section className="mt-10 space-y-6">
    <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr] xl:items-start">
      <RelationshipQuadrantMap
        profiles={normalizedProfiles}
        selectedId={selected?.id}
        onSelect={setSelectedId}
      />
      {selected ? (
        <PersonDetail
          events={relatedEvents}
          onMbtiSaved={(mbti) => updateMbti(selected.id, mbti)}
          profile={selected}
        />
      ) : (
        <EmptyQuadrantMap />
      )}
    </div>
    {selected ? <RelationshipArchive events={relatedEvents} profile={selected} /> : null}
  </section>
);
```

- [ ] **Step 4: Add `RelationshipQuadrantMap`**

Add a component that renders the four quadrants, center axes, axis labels, and relationship points:

```tsx
function RelationshipQuadrantMap({
  onSelect,
  profiles,
  selectedId,
}: {
  profiles: NormalizedCompassProfile[];
  selectedId?: string;
  onSelect: (id: string) => void;
}) {
  return (
    <Card className="relative min-h-[720px] overflow-hidden bg-[#f5efe2] p-6 sm:p-8">
      <div className="flex items-start justify-between gap-5">
        <div>
          <Badge>Relationship Quadrant</Badge>
          <h2 className="mt-4 text-4xl font-semibold text-ink">关系象限</h2>
          <p className="mt-3 max-w-xl text-sm leading-7 text-muted">
            横轴是关系健康度，纵轴是相处愉悦度。圆点越大，代表关系层级越亲近。
          </p>
        </div>
        <div className="font-sans-soft rounded-full border border-line bg-white/62 px-4 py-2 text-xs text-muted">
          {profiles.length} 个关系点位
        </div>
      </div>

      <div className="relative mt-8 h-[560px] rounded-[34px] border border-[#d8c9b3] bg-[#fbf7ed] shadow-inner">
        <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 overflow-hidden rounded-[34px]">
          <QuadrantZone id="q3" />
          <QuadrantZone id="q1" />
          <QuadrantZone id="q4" />
          <QuadrantZone id="q2" />
        </div>
        <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-clay/45" />
        <div className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-clay/45" />
        <span className="font-sans-soft absolute -left-2 top-1/2 -translate-y-1/2 -rotate-90 text-xs tracking-[0.26em] text-clay">
          相处愉悦度
        </span>
        <span className="font-sans-soft absolute bottom-3 left-1/2 -translate-x-1/2 text-xs tracking-[0.26em] text-clay">
          关系健康度
        </span>
        {profiles.map((profile) => (
          <RelationshipPoint
            key={profile.id}
            onSelect={() => onSelect(profile.id)}
            profile={profile}
            selected={profile.id === selectedId}
          />
        ))}
      </div>
    </Card>
  );
}
```

- [ ] **Step 5: Add point placement and tones**

Add helpers:

```ts
function getPointStyle(profile: NormalizedCompassProfile) {
  const left = 10 + ((profile.healthScore - 1) / 4) * 80;
  const top = 90 - ((profile.joyScore - 1) / 4) * 80;
  const size = { 1: 108, 2: 88, 3: 70, 4: 56 }[profile.tier];
  return { left: `${left}%`, top: `${top}%`, width: size, height: size };
}

function getRelationTone(type: NormalizedCompassProfile["relationType"]) {
  const tones = {
    朋友: "bg-sage text-moss border-sage/40",
    同事: "bg-gold text-[#6f5521] border-gold/45",
    伴侣: "bg-clay text-[#743f2c] border-clay/45",
    家人: "bg-[#d9e0cd] text-[#596951] border-[#7f8f74]/35",
    熟人: "bg-[#ece5d8] text-muted border-line",
    其他: "bg-white text-muted border-line",
  };
  return tones[type];
}
```

- [ ] **Step 6: Verify visually and by build**

Run:

```bash
npm run typecheck
npm run build
```

Expected: both commands pass, and `/compass` renders the quadrant map instead of the old relation cards.

---

### Task 5: Detail Panel, Empty State, and Verification

**Files:**
- Modify: `src/components/relationship-board.tsx`
- Modify: `src/app/compass/page.tsx`
- Modify: `tests/e2e/app.spec.ts` if needed

- [ ] **Step 1: Update `PersonDetail` to use normalized profile data**

Change `PersonDetail` prop type:

```ts
function PersonDetail({
  events,
  onMbtiSaved,
  profile,
}: {
  events: RelationshipEvent[];
  onMbtiSaved: (mbti: string) => void;
  profile: NormalizedCompassProfile;
}) {
```

Add a quadrant summary near the title:

```tsx
const quadrant = getQuadrantCopy(profile.quadrant);

<div className="mt-5 flex flex-wrap gap-2">
  <span className="font-sans-soft rounded-full bg-sage/12 px-3 py-1 text-xs font-medium text-moss">
    Tier {profile.tier}
  </span>
  <span className="font-sans-soft rounded-full bg-gold/14 px-3 py-1 text-xs font-medium text-[#7b6330]">
    {quadrant.title}
  </span>
  <span className="font-sans-soft rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-muted">
    健康 {profile.healthScore}/5 · 愉悦 {profile.joyScore}/5
  </span>
</div>
```

- [ ] **Step 2: Add relation mode tags to the detail panel**

Add below the trigger/pattern blocks:

```tsx
<section className="mt-4 rounded-[26px] border border-line/70 bg-paper/70 p-4">
  <h3 className="font-sans-soft text-sm font-medium text-moss">关系模式标签</h3>
  <div className="mt-3 flex flex-wrap gap-2">
    {profile.relationModeTags.length > 0 ? (
      profile.relationModeTags.map((tag) => (
        <span className="font-sans-soft rounded-full bg-white/70 px-3 py-1 text-xs text-muted" key={tag}>
          {tag}
        </span>
      ))
    ) : (
      <span className="text-sm leading-6 text-muted">还在观察中</span>
    )}
  </div>
</section>
```

- [ ] **Step 3: Replace garbled strings in detail and archive UI**

Use these strings:

```tsx
<span>关系画像</span>
<label>MBTI 手填</label>
placeholder="例如 INFJ / ENTP / 暂不确定"
{saved ? "已保存" : "保存 MBTI"}
<InsightBlock icon={Fingerprint} title="常见触发点">
<InsightBlock icon={Layers3} title="关系模式">
<h3>荣格八维</h3>
<InsightBlock icon={ScrollText} title="下一次可以这样相处">
<Badge>Shared Moments</Badge>
<h3>与我发生过的事</h3>
<p>从具体事件里整理这段关系反复出现的触发、反应与需要。</p>
```

- [ ] **Step 4: Add an empty quadrant state**

Replace old empty-state graphic with copy that matches the quadrant model:

```tsx
function EmptyQuadrantMap() {
  return (
    <Card className="p-8 sm:p-10">
      <Badge>Empty Compass</Badge>
      <h2 className="mt-5 text-3xl font-semibold text-ink">还没有关系点位</h2>
      <p className="mt-4 leading-8 text-muted">
        保存一条带有相关人物的 AI 觉察后，这里会开始生成关系健康度、相处愉悦度、Tier 和相处建议。
      </p>
      <ButtonLink className="mt-7" href="/reflect">
        去完成一次觉察
        <ArrowRight className="size-4" />
      </ButtonLink>
    </Card>
  );
}
```

- [ ] **Step 5: Run the full verification set**

Run:

```bash
npm run test:run
npm run typecheck
npm run build
```

Expected: all commands pass.

- [ ] **Step 6: Manual UI check**

Start local dev server:

```bash
npm run dev
```

Open `/compass` and check:

- Logged-out users still see the login-required card.
- E2E or seeded data users see the relationship quadrant map.
- Clicking a relationship point updates the right detail panel.
- MBTI save still calls `PATCH /api/person-profiles`.
- Mobile width stacks the map above the detail panel without overlapping text.

---

## Plan Self-Review

- Spec coverage: the plan covers coordinate axes, four quadrants, Tier visual expression, five relation types, relationship mode tags, Supabase fields, fallback inference, empty state, and verification.
- Placeholder scan: no placeholder markers or unspecified implementation steps remain.
- Type consistency: `health_score`, `joy_score`, `tier`, and `relation_mode_tags` are consistently optional in TypeScript and concrete defaults in Postgres.
