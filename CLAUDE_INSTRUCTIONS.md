# CLAUDE_INSTRUCTIONS.md — Hướng dẫn AI Code cho CosmoMosaic
> Tài liệu này là **pháp luật** khi dùng AI (Claude, Cursor, Copilot) viết code cho CosmoMosaic.  
> Mọi output phải tuân thủ 100% trước khi commit.

---

## 0. Đọc trước khi làm bất cứ điều gì

```
CosmoMosaic phục vụ trẻ em 6–11 tuổi tại Việt Nam.
Sai lầm trong UX, safety, hoặc pedagogy có thể gây hại thật cho trẻ.
Khi nghi ngờ → hỏi lại, không tự quyết.
```

**3 nguyên tắc tối thượng:**
1. **Kid-First Safety** — Không có tính năng nào quan trọng hơn an toàn của trẻ
2. **Pedagogical Integrity** — Code phải phục vụ mục tiêu học tập, không chỉ engagement
3. **Parent Trust** — Phụ huynh có thể tin tưởng hoàn toàn vào hệ thống

---
## Workflow bắt buộc khi dùng AI agents
1. Antigravity: `/context PROJECT_CONTEXT.md CLAUDE_INSTRUCTIONS.md`
2. Claude Code: `claude --read PROJECT_CONTEXT.md CLAUDE_INSTRUCTIONS.md ...`
3. Claude.ai / Gemini: "Bạn đang làm việc trên CosmoMosaic. Đọc PROJECT_CONTEXT.md và CLAUDE_INSTRUCTIONS.md trước. Sau đó..."
4. Sau mỗi task lớn: "Review theo checklist phần 9 của CLAUDE_INSTRUCTIONS.md"
## 1. Kid-Friendly UX — Quy tắc Bắt buộc

### 1.1 Visual & Interaction

```typescript
// ✅ ĐÚNG — Button đủ lớn cho ngón tay trẻ em
<button className="min-h-[48px] min-w-[48px] text-lg px-6 py-3">
  Bắt đầu!
</button>

// ❌ SAI — Quá nhỏ
<button className="text-xs px-2 py-1">OK</button>
```

**Quy tắc kích thước:**
- Touch target tối thiểu: **48×48px** (WCAG 2.5.5)
- Font size tối thiểu: **16px** trong game, **18px** trong text hướng dẫn
- Spacing giữa interactive elements: tối thiểu **8px**
- Icon đơn độc phải có `aria-label` hoặc tooltip

### 1.2 Language & Tone

```typescript
// ✅ ĐÚNG — Khích lệ, không phán xét
const feedbackMessages = {
  correct: ["Xuất sắc! 🌟", "Bạn nhỏ thật thông minh!", "Tuyệt vời! +100 XP"],
  incorrect: ["Chưa đúng rồi, thử lại nhé! 💪", "Gần đúng rồi! Cú Mèo tin bạn làm được!"],
  timeout: ["Hết giờ! Lần sau nhanh hơn nhé 🦉"]
};

// ❌ SAI — Tiêu cực, so sánh
const badFeedback = ["Sai rồi!", "Tại sao lại chọn thế?", "Bạn kém hơn các bạn khác"];
```

**Nguyên tắc ngôn ngữ:**
- Xưng hô: "bạn nhỏ", "tân binh", "phi hành gia"
- Không bao giờ dùng từ "thất bại", "thua", "kém"
- Lỗi = cơ hội học, không phải hình phạt
- Câu phản hồi tối đa 15 chữ (trẻ đọc chậm)
- Ưu tiên emoji hơn text dài cho feedback nhanh

### 1.3 Calm Mode Implementation

```typescript
// lib/game-context.tsx
interface CalmModeConfig {
  saturationMultiplier: 0.3;    // CSS filter: saturate(0.3)
  animationMultiplier: 1.5;     // Framer Motion duration × 1.5
  glowOpacityMultiplier: 0.5;   // Neon glow opacity × 0.5
  particleCountMultiplier: 0.5; // Particle effects × 0.5
}

// Cách dùng trong component
function AnimatedElement({ children }) {
  const { calmMode } = useGame();
  
  return (
    <motion.div
      animate={{ y: [0, -10, 0] }}
      transition={{
        duration: calmMode ? 3 : 2,        // × 1.5 khi calm
        repeat: Infinity,
        ease: "easeInOut"
      }}
      style={{
        filter: calmMode ? "saturate(0.3)" : "saturate(1)"
      }}
    >
      {children}
    </motion.div>
  );
}
```

**Khi nào bật Calm Mode mặc định:**
- Player.grade ≤ 2 (lớp 1–2, ~6–7 tuổi)
- Nếu phụ huynh bật trong dashboard
- Luôn có toggle ở Navbar

### 1.4 Error States cho Trẻ Em

```typescript
// ✅ ĐÚNG — Error state thân thiện
function KidFriendlyError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="glass-card text-center p-8">
      <div className="text-6xl mb-4">🚀💫</div>
      <h2 className="text-xl font-bold text-neon-cyan mb-2">
        Ối! Tàu vũ trụ bị trục trặc!
      </h2>
      <p className="text-white/70 mb-6">
        Đừng lo, Cú Mèo sẽ sửa ngay!
      </p>
      <NeonButton onClick={onRetry}>Thử lại 🔧</NeonButton>
    </div>
  );
}

// ❌ SAI — Error kỹ thuật hiển thị cho trẻ
<div>Error: Failed to fetch. Status 500</div>
```

---

## 2. Bloom Taxonomy — Quy tắc Triển khai

### 2.1 Tagging câu hỏi

Mọi câu hỏi PHẢI được tag trước khi thêm vào database:

```typescript
// ✅ ĐÚNG — Đầy đủ metadata
const question: Question = {
  id: "ha-long-eng-001",
  content: "What is the English name for Vịnh Hạ Long?",
  correctAnswer: "Ha Long Bay",
  wrongAnswers: ["Ha Noi Bay", "Da Nang Bay", "Mekong Bay"],
  subject: "english",
  grade: 3,
  bloomLevel: 1,                          // Remember
  planetId: "ha-long",
  curriculumRef: "SGK-TiengAnh3-Unit5",
  difficultyScore: 0.2,                   // Dễ
  reviewedByTeacher: true                 // PHẢI true
};

// ❌ SAI — Thiếu metadata
const badQuestion = {
  question: "Hạ Long ở đâu?",
  answer: "Quảng Ninh"
};
```

### 2.2 Progression theo Bloom

```typescript
// Khi xây dựng learning path cho một topic, tuân thủ thứ tự Bloom:
const bloomProgression = {
  beginner: [1, 2],        // Remember → Understand
  intermediate: [3, 4],   // Apply → Analyze
  advanced: [5, 6]         // Evaluate → Create
};

// Planet levels nên tăng dần Bloom level:
// Ha Long: Level 1–5 (bloom 1), Level 6–12 (bloom 2), Level 13–20 (bloom 3)
```

### 2.3 Hint System theo Bloom

```typescript
// AI mascot hint phải phù hợp Bloom level của câu:
function generateHint(question: Question): string {
  const hintStrategies = {
    1: "Nhớ lại những gì bạn đã học về {topic}...",    // Remember: recall
    2: "Hãy nghĩ xem {concept} có nghĩa là gì?",        // Understand: explain
    3: "Thử áp dụng công thức {formula} vào đây...",    // Apply: use
    4: "So sánh {A} và {B}, chúng khác nhau ở điểm nào?", // Analyze
    5: "Theo bạn, lựa chọn nào tốt hơn và tại sao?",   // Evaluate
    6: "Bạn có thể tạo ra {artifact} của riêng mình không?" // Create
  };
  return hintStrategies[question.bloomLevel];
}
```

---
2.4 Quy tắc Generate & Load Câu Hỏi (Phù hợp trình độ)
Khi generate câu hỏi mới (bằng AI):

PHẢI bám sát SGK lớp chính xác theo grade
Không được vượt quá chương trình lớp đó (ví dụ: lớp 3 không được hỏi phân số lớp 4)
Mỗi câu hỏi phải có grade, bloomLevel, difficultyScore (0.0=dễ, 0.5=trung bình, 1.0=khó)
reviewedByTeacher = true

Khi viết code load câu hỏi (Supabase query):

Luôn filter .eq("grade", player.grade)
Sort theo bloom_level ASC, difficultyScore ASC
Áp dụng adaptive:TypeScriptconst { data: questions } = await supabase
  .from("questions")
  .select("*")
  .eq("planet_id", planetId)
  .eq("grade", player.grade)           // BẮT BUỘC
  .eq("reviewed_by_teacher", true)
  .order("bloom_level", { ascending: true })
  .order("difficulty_score", { ascending: true });
Nếu player.mastery[topic] ≥ 80% → cho phép bloom_level +1 (vẫn cùng grade)

## 3. State Management — Quy tắc Cứng

### 3.1 Sử dụng GameContext đúng cách

```typescript
// ✅ ĐÚNG — Đọc từ GameContext
function PlayerStats() {
  const { player } = useGame();
  return <div>Level {player.level} — {player.xp} XP</div>;
}

// ✅ ĐÚNG — Cộng XP qua addXP
function onCorrectAnswer() {
  const { addXP } = useGame();
  addXP(100);
}

// ❌ SAI — State riêng cho player data
const [playerXP, setPlayerXP] = useState(0); // KHÔNG làm thế này

// ❌ SAI — Set XP trực tiếp
updatePlayer({ xp: player.xp + 100 }); // KHÔNG, phải dùng addXP()

// ❌ SAI — State riêng cho features liên quan player
const [calmMode, setCalmMode] = useState(false); // KHÔNG, đã có trong GameContext
```

### 3.2 Thêm field vào PlayerData

```typescript
// Khi thêm field mới, PHẢI cập nhật cả 3 nơi:

// 1. Interface PlayerData
interface PlayerData {
  // ... existing fields
  newField: string;  // Thêm đây
}

// 2. DEFAULT_PLAYER
const DEFAULT_PLAYER: PlayerData = {
  // ... existing defaults
  newField: "default_value"  // Thêm đây
};

// 3. Persistence migration (nếu field không tồn tại trong localStorage cũ)
const savedPlayer = JSON.parse(localStorage.getItem("cosmomosaic_player") || "{}");
const migratedPlayer = {
  ...DEFAULT_PLAYER,
  ...savedPlayer,
  newField: savedPlayer.newField ?? "default_value"  // Migration
};
```

---

## 4. AI Mascot — Safety Rules

### 4.1 API Route Pattern

```typescript
// app/api/ai/route.ts — LUÔN dùng pattern này

import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `
Bạn là Cú Mèo – mascot giáo dục vui vẻ của CosmoMosaic.
NHIỆM VỤ DUY NHẤT:
1. Khích lệ tích cực khi trẻ trả lời (đúng hoặc sai)
2. Gợi ý hint phù hợp Bloom level của câu hỏi hiện tại
3. Giải thích lỗi nhẹ nhàng, không phán xét

TUYỆT ĐỐI KHÔNG:
- Chat tự do ngoài chủ đề học tập
- Hỏi thông tin cá nhân (tên thật, trường, địa chỉ)
- Đề cập nội dung bạo lực, đáng sợ
- Nói xấu hoặc so sánh tiêu cực
- Thảo luận nội dung ngoài SGK lớp 1–5

Ngôn ngữ: Tiếng Việt, vui vẻ, đơn giản (trình độ lớp 1–5)
`.trim();

export async function POST(req: NextRequest) {
  // Rate limit check (10 req/min/user)
  const userId = req.headers.get("x-user-id");
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const { questionContext, bloomLevel, wasCorrect } = await req.json();
  
  // Validate input — KHÔNG pass raw user input vào AI
  if (!questionContext || bloomLevel < 1 || bloomLevel > 6) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  
  const response = await callAIModel({
    system: SYSTEM_PROMPT,  // System prompt KHÔNG thể override từ client
    userMessage: `Câu hỏi: ${questionContext}\nBloom level: ${bloomLevel}\nTrả lời: ${wasCorrect ? "đúng" : "sai"}`
  });
  
  // Log để audit
  await logAIFeedback({ userId, questionContext, bloomLevel, wasCorrect, response });
  
  return NextResponse.json({ message: response });
}
```

### 4.2 Client-Side AI Request

```typescript
// ✅ ĐÚNG — Chỉ gửi structured context, không gửi raw user input
async function getMascotFeedback(question: Question, wasCorrect: boolean) {
  const response = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      questionContext: question.content,   // Nội dung câu hỏi từ DB
      bloomLevel: question.bloomLevel,     // Bloom level từ DB
      wasCorrect                           // Boolean từ game logic
    })
  });
  return response.json();
}

// ❌ SAI — Cho phép user input trực tiếp vào AI
const userMessage = chatInput.value; // KHÔNG bao giờ pass này vào AI
```

---

## 5. Game Mode Development — Checklist

Khi tạo game mode mới, implement **đúng thứ tự** sau:

### Step 1: Props Interface

```typescript
interface NewGameProps {
  levels: NewGameLevel[];
  playerClass?: "warrior" | "wizard" | "hunter" | null;
  onGameComplete?: (finalScore: number, levelsCompleted: number) => void;
  onExit?: () => void;
}
```

### Step 2: Game States

```typescript
type GameState = "ready" | "playing" | "levelComplete" | "win" | "gameOver";
// Không được bỏ qua state nào, flow phải tuân thủ thứ tự này
```

### Step 3: Class Abilities

```typescript
// Implement ĐẦY ĐỦ 3 class abilities — không được skip
function applyClassAbility(
  class: PlayerClass,
  event: "onWrongAnswer" | "onTimeUp" | "onNewQuestion"
) {
  switch (class) {
    case "warrior":
      // Shield: miễn 1 lần sai/level — không trừ HP lần đầu sai
      if (event === "onWrongAnswer" && !warriorShieldUsed) {
        setWarriorShieldUsed(true);
        return; // Không trừ HP
      }
      break;
    case "wizard":
      // Slow/Time: giảm tốc hoặc thêm thời gian
      if (event === "onNewQuestion") {
        setTimeLimit(prev => prev + 5); // +5 giây
      }
      break;
    case "hunter":
      // Eliminate: loại 1 đáp án sai khi bắt đầu câu
      if (event === "onNewQuestion") {
        eliminateOneWrongAnswer();
      }
      break;
  }
}
```

### Step 4: onGameComplete Callback

```typescript
// Phải gọi khi win HOẶC gameOver
function handleGameEnd(won: boolean) {
  onGameComplete?.(score, levelsCompleted);
  // GameContext sẽ tự động: addXP + updatePlanetProgress
}
```

### Step 5: Calm Mode Support

```typescript
// Mọi animation trong game mode mới phải check calmMode
const { calmMode } = useGame();

<motion.div
  animate={gameAnimation}
  transition={{
    duration: calmMode ? baseDuration * 1.5 : baseDuration
  }}
/>
```

### Step 6: LevelIntro Integration

```typescript
// Thêm storyIntro cho game mode mới trong LevelIntro.tsx
const storyIntros: Record<string, string> = {
  // ... existing
  "new-planet": "Cú Mèo thông báo: Hành tinh {name} đang chờ đội ta! 🦉",
};
```

---

## 6. Supabase & Data — Safety Rules

### 6.1 Row Level Security (RLS)

```sql
-- PHẢI có RLS trên mọi bảng liên quan user data

-- Ví dụ cho bảng quiz_attempt:
ALTER TABLE quiz_attempt ENABLE ROW LEVEL SECURITY;

-- Student chỉ đọc được của mình
CREATE POLICY "students_own_data" ON quiz_attempt
  FOR SELECT USING (auth.uid() = student_id);

-- Parent đọc được data của con đã liên kết
CREATE POLICY "parents_read_child_data" ON quiz_attempt
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM parent_child_links
      WHERE parent_id = auth.uid() AND child_id = quiz_attempt.student_id
    )
  );
```

### 6.2 Data Minimization

```typescript
// ✅ ĐÚNG — Chỉ lưu những gì cần thiết
const learningEvent = {
  student_id: player.id,
  planet_id: planetId,
  question_id: question.id,
  bloom_level: question.bloomLevel,
  was_correct: wasCorrect,
  time_spent_ms: timeSpent,
  timestamp: new Date().toISOString()
};
// KHÔNG lưu: tên thật, IP address, device fingerprint, location

// ❌ SAI — Thu thập quá nhiều
const badEvent = {
  ...learningEvent,
  ip_address: req.ip,           // KHÔNG
  user_agent: req.userAgent,    // KHÔNG
  location: userLocation        // KHÔNG
};
```

### 6.3 Question Review Gate

```typescript
// KHÔNG bao giờ query câu hỏi chưa review
const { data: questions } = await supabase
  .from("questions")
  .select("*")
  .eq("planet_id", planetId)
  .eq("grade", player.grade)
  .eq("reviewed_by_teacher", true)  // BẮT BUỘC filter này
  .order("bloom_level", { ascending: true });
```

---

## 7. Accessibility — Không Negotiate

### 7.1 Contrast & Visual

```typescript
// Luôn check contrast với tool trước khi dùng màu mới
// neon-cyan (#00F5FF) trên space-deep (#0A0E27) = 12.5:1 ✅
// Trắng (#FFFFFF) trên space-mid (#131842) = 15.3:1 ✅

// Không dùng màu làm signal duy nhất — luôn kèm icon/text
// ❌ SAI — Chỉ dùng màu
<div style={{ color: isCorrect ? "green" : "red" }}>Kết quả</div>

// ✅ ĐÚNG — Màu + icon + text
<div className={isCorrect ? "text-neon-green" : "text-red-400"}>
  {isCorrect ? "✅ Đúng rồi!" : "❌ Chưa đúng"}
</div>
```

### 7.2 Keyboard & Screen Reader

```typescript
// Game elements phải accessible
<button
  aria-label={`Chọn đáp án: ${option}`}
  aria-pressed={selectedOption === option}
  onKeyDown={(e) => e.key === "Enter" && handleSelect(option)}
>
  {option}
</button>

// Canvas game: cung cấp text alternative
<canvas aria-label="Màn chơi Space Shooter — dùng mũi tên để di chuyển, Space để bắn" />
<div role="status" aria-live="polite">{gameStatusMessage}</div>
```

---

## 8. Performance — Quy tắc cho Game

### 8.1 Canvas Game Loop

```typescript
// ✅ ĐÚNG — Dùng requestAnimationFrame, cleanup khi unmount
useEffect(() => {
  let animationId: number;
  
  const gameLoop = (timestamp: number) => {
    update(timestamp);
    render();
    animationId = requestAnimationFrame(gameLoop);
  };
  
  animationId = requestAnimationFrame(gameLoop);
  
  return () => {
    cancelAnimationFrame(animationId); // PHẢI cleanup
  };
}, []);
```

### 8.2 Lazy Loading

```typescript
// Game components nặng → lazy load
const SpaceShooterGame = dynamic(
  () => import("@/components/SpaceShooterGame"),
  { 
    loading: () => <LoadingRocket />,
    ssr: false  // Canvas không SSR
  }
);
```

---

## 9. Code Review Checklist (AI phải tự check)

Trước khi output code, AI phải tự hỏi:

**Safety:**
- [ ] Có element nào scary/violent/inappropriate cho trẻ 6–11 tuổi không?
- [ ] Có text nào tiêu cực, phán xét, hay so sánh không?
- [ ] AI input có đi qua guardrail system prompt không?
- [ ] Có thu thập PII của trẻ không?

**Pedagogy:**
- [ ] Câu hỏi có Bloom level tag không?
- [ ] `reviewedByTeacher: true` filter có trong query không?
- [ ] Feedback có khích lệ không, có giải thích lỗi nhẹ nhàng không?
- [ ] Learning path có follow Bloom progression không?

**Technical:**
- [ ] Player data qua GameContext, không phải local state?
- [ ] XP cộng qua `addXP()` không?
- [ ] 3 class abilities đều implemented?
- [ ] Calm Mode toggle ảnh hưởng đúng không?
- [ ] RLS policy có cho bảng mới không?
- [ ] Touch targets ≥ 48×48px?
- [ ] Contrast ratio ≥ 4.5:1?
- [ ] Animation cleanup khi component unmount?

**Nếu bất kỳ câu nào trả lời "không" → sửa trước khi output.**

---

## 10. Ví dụ Tốt vs Xấu — Quick Reference

| Situation | ❌ ĐỪNG | ✅ LÀM |
|---|---|---|
| Trẻ trả lời sai | "Sai rồi!" | "Gần đúng rồi! Thử lại nhé 💪" |
| Lỗi kỹ thuật | Show stack trace | Show rocket crash animation + retry |
| XP update | `player.xp += 100` | `addXP(100)` |
| Câu hỏi DB | Query không filter `reviewedByTeacher` | `.eq("reviewed_by_teacher", true)` |
| AI input | Pass raw chat input | Pass structured `{questionContext, bloomLevel}` |
| Animation | Fixed duration | `duration: calmMode ? base * 1.5 : base` |
| Touch button | `padding: 4px` | `min-height: 48px, min-width: 48px` |
| Error boundary | Không có | Wrap game in `<KidFriendlyErrorBoundary>` |
| New player field | `useState` | Thêm vào `PlayerData` + `DEFAULT_PLAYER` |
| Planet routing | Hard-code path | Dùng routing logic trong `portal/page.tsx` |
