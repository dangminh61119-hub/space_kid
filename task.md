# CosmoMosaic v2.0 Feature Development Tasks

## Phase 1: Core Infrastructure
- [x] Portal: Lọc hành tinh theo `grade_range` (db.ts + portal/page.tsx + mock-data.ts)
- [x] Dashboard: Đọc real player data thay vì mockStudent
- [x] Dashboard sub-components: props thay mock (StatsCards, ProgressChart, SubjectBreakdown, AIInsights)

## Phase 2: Safety & Compliance
- [x] Migration 007: bảng `parent_consent` + `audit_log` + RLS
- [x] ParentConsentModal component + tích hợp vào profile flow
- [x] Migration 008: bảng `learning_event` + `quiz_attempt` + `ai_feedback` + RLS
- [x] [analytics.ts](file:///Users/looking/space_kit_local2/space_kid/src/lib/analytics.ts): recordLearningEvent, recordQuizAttempt, logAIFeedback

## Phase 3: AI & Gameplay
- [/] AI Mascot API route `/api/ai/route.ts` (guardrailed system prompt)
- [/] MascotAI.tsx: tích hợp AI backend
- [/] Calm Mode audit: verify calmMode in all 3 game components
- [/] `curriculum-map.ts`: planet → subject → grade → bloom mapping

## Phase 4: Polish (Later)
- [ ] PDF Export cho Dashboard
- [ ] Heritage Puzzle mini-game
- [ ] PWA support
