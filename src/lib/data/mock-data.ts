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
    reward: "150 ✦ + Mảnh Mosaic Vàng",
    timeLeft: "4 giờ 23 phút",
    planet: "Vịnh Hạ Long",
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
    { name: "Toán", icon: "🔢", color: "#60A5FA", progress: 78, planet: "Vịnh Hạ Long" },
    { name: "Tiếng Việt", icon: "📝", color: "#4ADE80", progress: 65, planet: "Kinh thành Huế" },
    { name: "Tiếng Anh", icon: "🌍", color: "#FB923C", progress: 52, planet: "Phố cổ Hội An" },
    { name: "Lịch sử", icon: "📜", color: "#A78BFA", progress: 40, planet: "Kinh thành Huế" },
];

export const mockAIInsights = [
    {
        type: "strength" as const,
        message: "Minh Anh rất giỏi phép nhân! Điểm trung bình 92% trong tuần này.",
        icon: "💪",
    },
    {
        type: "improve" as const,
        message: "Con bạn hay nhầm dấu thanh, hôm nay thử chơi hành trình Gióng thêm nhé!",
        icon: "💡",
    },
    {
        type: "tip" as const,
        message: "Streak 7 ngày liên tiếp! Khuyến khích bé giữ streak để mở skin đặc biệt.",
        icon: "🔥",
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
