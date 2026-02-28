export const mockStudent = {
    id: "student-001",
    name: "Minh Anh",
    avatar: "🐱",
    class: "Phù thủy Tinh Vân",
    grade: 3,
    level: 12,
    xp: 2450,
    xpToNext: 3000,
    streak: 7,
    totalPlayHours: 24.5,
    planetsCompleted: 2,
    totalPlanets: 6,
};

export const mockDailyQuest = {
    title: "Cứu trạm Năng Lượng!",
    description: "Hoàn thành 3 phép tính nhân để sửa lò phản ứng",
    reward: "150 XP + Mảnh Mosaic Vàng",
    timeLeft: "4 giờ 23 phút",
    planet: "Làng Gióng",
};

export const mockWeeklyProgress = [
    { day: "T2", math: 85, viet: 70, eng: 60, hist: 45 },
    { day: "T3", math: 90, viet: 75, eng: 55, hist: 50 },
    { day: "T4", math: 70, viet: 80, eng: 65, hist: 55 },
    { day: "T5", math: 95, viet: 85, eng: 70, hist: 60 },
    { day: "T6", math: 80, viet: 90, eng: 75, hist: 65 },
    { day: "T7", math: 88, viet: 78, eng: 80, hist: 70 },
    { day: "CN", math: 92, viet: 82, eng: 85, hist: 75 },
];

export const mockSubjects = [
    { name: "Toán", icon: "🔢", color: "#60A5FA", progress: 78, planet: "Làng Gióng" },
    { name: "Tiếng Việt", icon: "📝", color: "#4ADE80", progress: 65, planet: "Cố đô Huế" },
    { name: "Tiếng Anh", icon: "🌍", color: "#FB923C", progress: 52, planet: "Vịnh Hạ Long" },
    { name: "Lịch sử", icon: "📜", color: "#A78BFA", progress: 40, planet: "Cố đô Huế" },
];

export const mockAIInsights = [
    {
        type: "strength" as const,
        message: "Minh Anh rất giỏi phép nhân! Điểm trung bình 92% trong tuần này.",
        icon: "💪",
    },
    {
        type: "improve" as const,
        message: "Con bạn hay nhầm dấu thanh, hôm nay thử chơi hành tinh Huế thêm nhé!",
        icon: "💡",
    },
    {
        type: "tip" as const,
        message: "Streak 7 ngày liên tiếp! Khuyến khích bé giữ streak để mở skin đặc biệt.",
        icon: "🔥",
    },
];

export const mockPlanets = [
    {
        id: "ha-long",
        name: "Vịnh Hạ Long",
        subjects: ["Tiếng Anh", "Địa lý"],
        color1: "#00F5FF",
        color2: "#0077B6",
        ringColor: "#00F5FF",
        progress: 52,
        totalLevels: 20,
        completedLevels: 10,
        description: "Khám phá vịnh kỳ diệu qua ngôn ngữ quốc tế!",
        emoji: "🏝️",
    },
    {
        id: "hue",
        name: "Cố đô Huế",
        subjects: ["Lịch sử", "Tiếng Việt"],
        color1: "#FF6BFF",
        color2: "#9D174D",
        ringColor: "#FF6BFF",
        progress: 65,
        totalLevels: 25,
        completedLevels: 16,
        description: "Du hành thời gian về kinh thành tráng lệ!",
        emoji: "🏯",
    },
    {
        id: "giong",
        name: "Làng Gióng",
        subjects: ["Toán", "Tin học"],
        color1: "#FFE066",
        color2: "#D97706",
        ringColor: "#FFE066",
        progress: 78,
        totalLevels: 20,
        completedLevels: 15,
        description: "Rèn luyện trí tuệ tại lò rèn vũ trụ!",
        emoji: "⚔️",
    },
    {
        id: "phong-nha",
        name: "Phong Nha",
        subjects: ["Khoa học", "Địa lý"],
        color1: "#7BFF7B",
        color2: "#065F46",
        ringColor: "#7BFF7B",
        progress: 20,
        totalLevels: 18,
        completedLevels: 4,
        description: "Khám phá hang động bí ẩn dưới lòng đất!",
        emoji: "🦇",
    },
    {
        id: "hoi-an",
        name: "Phố cổ Hội An",
        subjects: ["Mỹ thuật", "Tiếng Anh"],
        color1: "#FF8A4C",
        color2: "#C2410C",
        ringColor: "#FFDAB9",
        progress: 10,
        totalLevels: 15,
        completedLevels: 2,
        description: "Vẽ nên thế giới lung linh bằng ngôn ngữ!",
        emoji: "🏮",
    },
    {
        id: "sapa",
        name: "Ruộng bậc thang Sa Pa",
        subjects: ["Toán", "Khoa học"],
        color1: "#B07BFF",
        color2: "#5B21B6",
        ringColor: "#D4BFFF",
        progress: 0,
        totalLevels: 22,
        completedLevels: 0,
        description: "Giải mật mã ruộng bậc thang bằng Toán học!",
        emoji: "🌾",
    },
];

export const mockGameLevels = [
    {
        level: 1,
        planet: "Cố đô Huế",
        subject: "Tiếng Việt",
        title: "Chính tả cơ bản",
        speed: 1,
        questions: [
            { question: "Từ nào viết ĐÚNG?", correctWord: "kỹ năng", wrongWords: ["kỉ năng", "kĩ năg", "ky năng"] },
            { question: "Từ nào viết ĐÚNG?", correctWord: "giữ gìn", wrongWords: ["giử gìn", "giữ gìng", "dữ gìn"] },
            { question: "Từ nào viết ĐÚNG?", correctWord: "sáng tạo", wrongWords: ["xáng tạo", "sáng tạu", "xáng tạu"] },
            { question: "Từ nào viết ĐÚNG?", correctWord: "nghiên cứu", wrongWords: ["nghiên cửu", "ngiên cứu", "nghiên cừu"] },
            { question: "Từ nào viết ĐÚNG?", correctWord: "trường học", wrongWords: ["chường học", "trườn học", "trường hộc"] },
        ],
    },
    {
        level: 2,
        planet: "Cố đô Huế",
        subject: "Tiếng Việt",
        title: "Dấu thanh nâng cao",
        speed: 1.3,
        questions: [
            { question: "Từ nào viết ĐÚNG?", correctWord: "vẻ đẹp", wrongWords: ["vẽ đẹp", "vẻ đep", "vẽ đep"] },
            { question: "Từ nào viết ĐÚNG?", correctWord: "dữ liệu", wrongWords: ["giữ liệu", "dử liệu", "giử liệu"] },
            { question: "Từ nào viết ĐÚNG?", correctWord: "khuyến khích", wrongWords: ["khuyến kích", "khuyến khic", "khuyến kic"] },
            { question: "Từ nào viết ĐÚNG?", correctWord: "hạnh phúc", wrongWords: ["hạn phúc", "hạnh phuc", "hạn phuc"] },
            { question: "Từ nào viết ĐÚNG?", correctWord: "phát triển", wrongWords: ["phác triển", "phát chiển", "phác chiển"] },
        ],
    },
    {
        level: 3,
        planet: "Vịnh Hạ Long",
        subject: "Tiếng Anh",
        title: "English Vocabulary",
        speed: 1.5,
        questions: [
            { question: "'Planet' nghĩa là gì?", correctWord: "Hành tinh", wrongWords: ["Ngôi sao", "Mặt trăng", "Bầu trời"] },
            { question: "'Ocean' nghĩa là gì?", correctWord: "Đại dương", wrongWords: ["Sông", "Hồ", "Suối"] },
            { question: "'Mountain' nghĩa là gì?", correctWord: "Núi", wrongWords: ["Đồi", "Thung lũng", "Đồng bằng"] },
            { question: "'Knowledge' nghĩa là gì?", correctWord: "Kiến thức", wrongWords: ["Sức mạnh", "Tốc độ", "Âm nhạc"] },
            { question: "'Adventure' nghĩa là gì?", correctWord: "Phiêu lưu", wrongWords: ["Mạo hiểm", "Nguy hiểm", "Tai nạn"] },
        ],
    },
];

export const mockMathLevels = [
    {
        level: 1,
        planet: "Làng Gióng",
        subject: "Toán",
        title: "Phép cộng & trừ",
        timePerQuestion: 15,
        questions: [
            { equation: "_ + 3 = 7", answer: 4, options: [2, 3, 4, 5] },
            { equation: "9 - _ = 4", answer: 5, options: [3, 4, 5, 6] },
            { equation: "_ + 6 = 10", answer: 4, options: [3, 4, 5, 6] },
            { equation: "12 - _ = 7", answer: 5, options: [4, 5, 6, 7] },
            { equation: "_ + 8 = 15", answer: 7, options: [5, 6, 7, 8] },
        ],
    },
    {
        level: 2,
        planet: "Làng Gióng",
        subject: "Toán",
        title: "Phép nhân & chia",
        timePerQuestion: 18,
        questions: [
            { equation: "_ × 4 = 20", answer: 5, options: [3, 4, 5, 6] },
            { equation: "24 ÷ _ = 6", answer: 4, options: [3, 4, 6, 8] },
            { equation: "_ × 7 = 42", answer: 6, options: [5, 6, 7, 8] },
            { equation: "36 ÷ _ = 9", answer: 4, options: [3, 4, 6, 9] },
            { equation: "_ × 8 = 56", answer: 7, options: [6, 7, 8, 9] },
        ],
    },
    {
        level: 3,
        planet: "Làng Gióng",
        subject: "Toán",
        title: "Biểu thức hỗn hợp",
        timePerQuestion: 20,
        questions: [
            { equation: "(3 + _) × 2 = 14", answer: 4, options: [3, 4, 5, 6] },
            { equation: "(_ - 2) × 3 = 15", answer: 7, options: [5, 6, 7, 8] },
            { equation: "20 ÷ (10 - _) = 4", answer: 5, options: [4, 5, 6, 7] },
            { equation: "(_ + 5) × 2 = 22", answer: 6, options: [5, 6, 7, 8] },
            { equation: "(12 - _) × 3 = 21", answer: 5, options: [4, 5, 6, 7] },
        ],
    },
];

export const mockOnboardingQuestions = [
    {
        question: "Hệ thống khởi động! 5 + 3 bằng bao nhiêu?",
        options: ["6", "7", "8", "9"],
        correct: 2,
        subject: "Toán",
    },
    {
        question: "Kích hoạt ngôn ngữ! 'Hello' nghĩa là gì?",
        options: ["Tạm biệt", "Xin chào", "Cảm ơn", "Xin lỗi"],
        correct: 1,
        subject: "Tiếng Anh",
    },
    {
        question: "Quét dữ liệu! Thủ đô Việt Nam là?",
        options: ["TP. Hồ Chí Minh", "Đà Nẵng", "Hà Nội", "Huế"],
        correct: 2,
        subject: "Địa lý",
    },
    {
        question: "Nạp năng lượng! Chữ nào viết đúng?",
        options: ["giành giật", "dành dật", "giành dật", "dành giật"],
        correct: 0,
        subject: "Tiếng Việt",
    },
];
