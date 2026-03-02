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
        gradeRange: [1, 3] as [number, number],
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
        gradeRange: [2, 4] as [number, number],
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
        gradeRange: [3, 5] as [number, number],
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
        gradeRange: [1, 3] as [number, number],
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
        gradeRange: [1, 2] as [number, number],
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
        gradeRange: [3, 5] as [number, number],
    },
    {
        id: "hanoi",
        name: "Hà Nội",
        subjects: ["Lịch sử", "Địa lý"],
        color1: "#FF8C00",
        color2: "#C2410C",
        ringColor: "#FFDAB9",
        progress: 0,
        totalLevels: 20,
        completedLevels: 0,
        description: "Khám phá thủ đô ngàn năm văn hiến!",
        emoji: "🌆",
        gradeRange: [1, 5] as [number, number],
    },
    {
        id: "mekong",
        name: "Đồng bằng Mê Kông",
        subjects: ["Khoa học", "Địa lý"],
        color1: "#00FF88",
        color2: "#065F46",
        ringColor: "#00FF8866",
        progress: 0,
        totalLevels: 18,
        completedLevels: 0,
        description: "Bí ẩn vùng sông nước phương Nam!",
        emoji: "🌊",
        gradeRange: [1, 5] as [number, number],
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
        planet: "Cố đô Huế",
        subject: "Lịch sử",
        title: "Các triều đại Việt Nam",
        speed: 1.0,
        questions: [
            { question: "Triều đại nào dài nhất VN?", correctWord: "Nhà Lý", wrongWords: ["Nhà Lê", "Nhà Trần", "Nhà Nguyễn"] },
            { question: "Ai dời đô về Thăng Long?", correctWord: "Lý Thái Tổ", wrongWords: ["Trần Thái Tông", "Lê Lợi", "Ngô Quyền"] },
            { question: "Nhà Trần nổi tiếng với?", correctWord: "Chống Mông Nguyên", wrongWords: ["Chống Minh", "Chống Thanh", "Chống Tống"] },
            { question: "Triều Nguyễn đặt kinh đô ở?", correctWord: "Huế", wrongWords: ["Hà Nội", "Sài Gòn", "Đà Nẵng"] },
            { question: "Ngô Quyền đánh thắng trận?", correctWord: "Bạch Đằng", wrongWords: ["Chi Lăng", "Đống Đa", "Rạch Gầm"] },
        ],
    },
    {
        level: 4,
        planet: "Cố đô Huế",
        subject: "Lịch sử",
        title: "Di sản Cố đô Huế",
        speed: 1.2,
        questions: [
            { question: "Cung điện chính ở Huế?", correctWord: "Đại Nội", wrongWords: ["Cố Cung", "Dinh Độc Lập", "Hoàng Thành"] },
            { question: "Sông nào chảy qua Huế?", correctWord: "Sông Hương", wrongWords: ["Sông Hồng", "Sông Mê Kông", "Sông Đà"] },
            { question: "Cầu nổi tiếng ở Huế?", correctWord: "Cầu Trường Tiền", wrongWords: ["Cầu Long Biên", "Cầu Thê Húc", "Cầu Rồng"] },
            { question: "Huế là di sản UNESCO năm?", correctWord: "1993", wrongWords: ["1999", "2003", "1987"] },
            { question: "Áo dài Huế có màu gì đặc trưng?", correctWord: "Tím", wrongWords: ["Đỏ", "Trắng", "Xanh"] },
        ],
    },
    {
        level: 5,
        planet: "Cố đô Huế",
        subject: "Tiếng Việt",
        title: "Thành ngữ, tục ngữ",
        speed: 1.5,
        questions: [
            { question: "'Có công mài sắt...'?", correctWord: "có ngày nên kim", wrongWords: ["có ngày nên vàng", "có ngày thành công", "sắt cũng mòn"] },
            { question: "'Uống nước...'?", correctWord: "nhớ nguồn", wrongWords: ["nhớ sông", "nhớ suối", "nhớ mưa"] },
            { question: "'Tốt gỗ hơn...'?", correctWord: "tốt nước sơn", wrongWords: ["tốt màu sắc", "tốt hình dáng", "tốt bề ngoài"] },
            { question: "'Đi một ngày đàng...'?", correctWord: "học một sàng khôn", wrongWords: ["mỏi một đôi chân", "biết một điều hay", "thêm một người bạn"] },
            { question: "'Gần mực thì...'?", correctWord: "đen", wrongWords: ["tối", "bẩn", "xấu"] },
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
    {
        level: 4,
        planet: "Làng Gióng",
        subject: "Toán",
        title: "Phân số cơ bản",
        timePerQuestion: 20,
        questions: [
            { equation: "1/2 + 1/2 = _", answer: 1, options: [1, 2, 0, 3] },
            { equation: "1/4 + _ /4 = 3/4", answer: 2, options: [1, 2, 3, 4] },
            { equation: "3/5 - _/5 = 1/5", answer: 2, options: [1, 2, 3, 4] },
            { equation: "_/3 + 1/3 = 2/3", answer: 1, options: [1, 2, 3, 0] },
            { equation: "5/6 - 2/6 = _/6", answer: 3, options: [2, 3, 4, 1] },
        ],
    },
    {
        level: 5,
        planet: "Làng Gióng",
        subject: "Toán",
        title: "Dãy số & quy luật",
        timePerQuestion: 18,
        questions: [
            { equation: "2, 4, 6, 8, _", answer: 10, options: [9, 10, 11, 12] },
            { equation: "1, 3, 5, 7, _", answer: 9, options: [8, 9, 10, 11] },
            { equation: "5, 10, 15, 20, _", answer: 25, options: [22, 24, 25, 30] },
            { equation: "3, 6, 9, _, 15", answer: 12, options: [10, 11, 12, 13] },
            { equation: "1, 4, 9, 16, _", answer: 25, options: [20, 24, 25, 36] },
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

/* === Game levels per planet === */

export const mockHaLongLevels = [
    {
        level: 1,
        planet: "Vịnh Hạ Long",
        subject: "Tiếng Anh",
        title: "Colors of the Bay",
        speed: 1,
        questions: [
            { question: "'Blue' nghĩa là gì?", correctWord: "Xanh dương", wrongWords: ["Xanh lá", "Đỏ", "Vàng"] },
            { question: "'Beautiful' nghĩa là gì?", correctWord: "Đẹp", wrongWords: ["Xấu", "Cao", "Nhỏ"] },
            { question: "'Island' nghĩa là gì?", correctWord: "Hòn đảo", wrongWords: ["Biển", "Sông", "Núi"] },
            { question: "'Water' nghĩa là gì?", correctWord: "Nước", wrongWords: ["Lửa", "Đất", "Gió"] },
            { question: "'Fish' nghĩa là gì?", correctWord: "Cá", wrongWords: ["Chim", "Mèo", "Chó"] },
        ],
    },
    {
        level: 2,
        planet: "Vịnh Hạ Long",
        subject: "Tiếng Anh",
        title: "Nature Vocabulary",
        speed: 1.3,
        questions: [
            { question: "'Cave' nghĩa là gì?", correctWord: "Hang động", wrongWords: ["Biển", "Đồi", "Cánh đồng"] },
            { question: "'Rock' nghĩa là gì?", correctWord: "Đá", wrongWords: ["Cây", "Hoa", "Cỏ"] },
            { question: "'Boat' nghĩa là gì?", correctWord: "Thuyền", wrongWords: ["Xe", "Máy bay", "Tàu hỏa"] },
            { question: "'Bird' nghĩa là gì?", correctWord: "Chim", wrongWords: ["Cá", "Rắn", "Gấu"] },
            { question: "'Sunset' nghĩa là gì?", correctWord: "Hoàng hôn", wrongWords: ["Bình minh", "Trưa", "Đêm"] },
        ],
    },
    {
        level: 3,
        planet: "Vịnh Hạ Long",
        subject: "Địa lý",
        title: "Địa lý Việt Nam",
        speed: 1.0,
        questions: [
            { question: "Việt Nam có bao nhiêu tỉnh/TP?", correctWord: "63", wrongWords: ["54", "58", "72"] },
            { question: "Đỉnh núi cao nhất VN?", correctWord: "Fansipan", wrongWords: ["Bà Đen", "Bạch Mã", "Ngọc Linh"] },
            { question: "Sông dài nhất VN?", correctWord: "Sông Mê Kông", wrongWords: ["Sông Hồng", "Sông Đà", "Sông Đồng Nai"] },
            { question: "VN giáp biển gì?", correctWord: "Biển Đông", wrongWords: ["Biển Tây", "Thái Bình Dương", "Ấn Độ Dương"] },
            { question: "Hạ Long thuộc tỉnh?", correctWord: "Quảng Ninh", wrongWords: ["Hải Phòng", "Thanh Hóa", "Thái Bình"] },
        ],
    },
    {
        level: 4,
        planet: "Vịnh Hạ Long",
        subject: "Tiếng Anh",
        title: "Sea Animals",
        speed: 1.3,
        questions: [
            { question: "'Dolphin' nghĩa là gì?", correctWord: "Cá heo", wrongWords: ["Cá voi", "Cá mập", "Cá ngựa"] },
            { question: "'Turtle' nghĩa là gì?", correctWord: "Rùa biển", wrongWords: ["Sứa", "Ốc", "Tôm"] },
            { question: "'Jellyfish' nghĩa là gì?", correctWord: "Sứa", wrongWords: ["Bạch tuộc", "San hô", "Cá"] },
            { question: "'Crab' nghĩa là gì?", correctWord: "Cua", wrongWords: ["Tôm", "Ốc", "Sò"] },
            { question: "'Whale' nghĩa là gì?", correctWord: "Cá voi", wrongWords: ["Cá heo", "Cá mập", "Cá chép"] },
        ],
    },
    {
        level: 5,
        planet: "Vịnh Hạ Long",
        subject: "Tiếng Anh",
        title: "Weather & Seasons",
        speed: 1.5,
        questions: [
            { question: "'Sunny' nghĩa là gì?", correctWord: "Nắng", wrongWords: ["Mưa", "Gió", "Tuyết"] },
            { question: "'Rainy' nghĩa là gì?", correctWord: "Mưa", wrongWords: ["Nắng", "Lạnh", "Nóng"] },
            { question: "'Spring' (mùa) nghĩa là gì?", correctWord: "Mùa xuân", wrongWords: ["Mùa hè", "Mùa thu", "Mùa đông"] },
            { question: "'Winter' nghĩa là gì?", correctWord: "Mùa đông", wrongWords: ["Mùa xuân", "Mùa hè", "Mùa thu"] },
            { question: "'Cloud' nghĩa là gì?", correctWord: "Đám mây", wrongWords: ["Ngôi sao", "Mặt trời", "Cầu vồng"] },
        ],
    },
];

export const mockPhongNhaLevels = [
    {
        level: 1,
        planet: "Phong Nha",
        subject: "Khoa học",
        title: "Sinh vật trong hang",
        speed: 1,
        questions: [
            { question: "Động vật nào sống trong hang?", correctWord: "Dơi", wrongWords: ["Cá heo", "Sư tử", "Voi"] },
            { question: "Đá trong hang gọi là?", correctWord: "Thạch nhũ", wrongWords: ["Cát", "Sỏi", "Đất sét"] },
            { question: "Nước trong hang thường?", correctWord: "Trong vắt", wrongWords: ["Đục ngầu", "Nóng sôi", "Có sóng"] },
            { question: "Ánh sáng trong hang?", correctWord: "Tối", wrongWords: ["Sáng", "Rực rỡ", "Chói"] },
            { question: "Nhiệt độ trong hang?", correctWord: "Mát mẻ", wrongWords: ["Nóng bức", "Lạnh cóng", "Thay đổi"] },
        ],
    },
    {
        level: 2,
        planet: "Phong Nha",
        subject: "Khoa học",
        title: "Chuỗi thức ăn",
        speed: 1.2,
        questions: [
            { question: "Cỏ → Thỏ → ?", correctWord: "Cáo", wrongWords: ["Gà", "Bò", "Chuột"] },
            { question: "Sinh vật tự tạo thức ăn?", correctWord: "Thực vật", wrongWords: ["Động vật", "Nấm", "Vi khuẩn"] },
            { question: "Đầu chuỗi thức ăn luôn là?", correctWord: "Mặt trời", wrongWords: ["Nước", "Đất", "Không khí"] },
            { question: "Động vật ăn cỏ gọi là?", correctWord: "Động vật ăn thực vật", wrongWords: ["Động vật ăn thịt", "Động vật ăn tạp", "Ký sinh"] },
            { question: "Con nào là động vật ăn thịt?", correctWord: "Hổ", wrongWords: ["Voi", "Bò", "Ngựa"] },
        ],
    },
    {
        level: 3,
        planet: "Phong Nha",
        subject: "Địa lý",
        title: "Địa hình Việt Nam",
        speed: 1.3,
        questions: [
            { question: "VN có dạng chữ gì?", correctWord: "Chữ S", wrongWords: ["Chữ V", "Chữ L", "Chữ C"] },
            { question: "Đồng bằng lớn nhất miền Bắc?", correctWord: "Đồng bằng sông Hồng", wrongWords: ["Đồng bằng sông Cửu Long", "Tây Nguyên", "Đồng bằng Thanh Hóa"] },
            { question: "Phong Nha thuộc tỉnh?", correctWord: "Quảng Bình", wrongWords: ["Quảng Trị", "Nghệ An", "Hà Tĩnh"] },
            { question: "Cao nguyên lớn nhất VN?", correctWord: "Tây Nguyên", wrongWords: ["Tây Bắc", "Đông Bắc", "Đồng Nai"] },
            { question: "Bờ biển VN dài bao nhiêu km?", correctWord: "3.260 km", wrongWords: ["1.500 km", "5.000 km", "2.100 km"] },
        ],
    },
];

export const mockHoiAnLevels = [
    {
        level: 1,
        planet: "Phố cổ Hội An",
        subject: "Tiếng Anh",
        title: "Festival Words",
        speed: 1,
        questions: [
            { question: "'Lantern' nghĩa là gì?", correctWord: "Đèn lồng", wrongWords: ["Nến", "Đèn pin", "Ngọn lửa"] },
            { question: "'Bridge' nghĩa là gì?", correctWord: "Cầu", wrongWords: ["Đường", "Nhà", "Cổng"] },
            { question: "'Market' nghĩa là gì?", correctWord: "Chợ", wrongWords: ["Trường", "Bệnh viện", "Công viên"] },
            { question: "'Color' nghĩa là gì?", correctWord: "Màu sắc", wrongWords: ["Hình dạng", "Kích cỡ", "Âm thanh"] },
            { question: "'River' nghĩa là gì?", correctWord: "Sông", wrongWords: ["Biển", "Hồ", "Suối"] },
        ],
    },
    {
        level: 2,
        planet: "Phố cổ Hội An",
        subject: "Tiếng Anh",
        title: "Food & Drink",
        speed: 1.2,
        questions: [
            { question: "'Rice' nghĩa là gì?", correctWord: "Cơm", wrongWords: ["Mì", "Bánh", "Phở"] },
            { question: "'Tea' nghĩa là gì?", correctWord: "Trà", wrongWords: ["Cà phê", "Nước ép", "Sữa"] },
            { question: "'Noodle' nghĩa là gì?", correctWord: "Mì", wrongWords: ["Cơm", "Bánh", "Xôi"] },
            { question: "'Fruit' nghĩa là gì?", correctWord: "Trái cây", wrongWords: ["Rau", "Thịt", "Cá"] },
            { question: "'Soup' nghĩa là gì?", correctWord: "Canh", wrongWords: ["Gỏi", "Xào", "Nướng"] },
        ],
    },
    {
        level: 3,
        planet: "Phố cổ Hội An",
        subject: "Mỹ thuật",
        title: "Màu sắc & Hình dạng",
        speed: 1.3,
        questions: [
            { question: "Trộn Đỏ + Vàng thành?", correctWord: "Cam", wrongWords: ["Tím", "Xanh", "Nâu"] },
            { question: "Trộn Xanh + Vàng thành?", correctWord: "Xanh lá", wrongWords: ["Cam", "Tím", "Nâu"] },
            { question: "Trộn Đỏ + Xanh thành?", correctWord: "Tím", wrongWords: ["Cam", "Xanh lá", "Nâu"] },
            { question: "Màu nào KHÔNG phải màu cơ bản?", correctWord: "Cam", wrongWords: ["Đỏ", "Vàng", "Xanh dương"] },
            { question: "Hình có 3 cạnh gọi là?", correctWord: "Tam giác", wrongWords: ["Hình vuông", "Hình tròn", "Hình thoi"] },
        ],
    },
];

export const mockSapaLevels = [
    {
        level: 1,
        planet: "Ruộng bậc thang Sa Pa",
        subject: "Toán",
        title: "Hình học cơ bản",
        timePerQuestion: 15,
        questions: [
            { equation: "Hình vuông có _ cạnh", answer: 4, options: [3, 4, 5, 6] },
            { equation: "Tam giác có _ góc", answer: 3, options: [2, 3, 4, 5] },
            { equation: "Hình chữ nhật có _ cạnh", answer: 4, options: [3, 4, 5, 6] },
            { equation: "Đường tròn có _ cạnh", answer: 0, options: [0, 1, 2, 4] },
            { equation: "Hình thoi có _ cạnh bằng nhau", answer: 4, options: [2, 3, 4, 6] },
        ],
    },
    {
        level: 2,
        planet: "Ruộng bậc thang Sa Pa",
        subject: "Toán",
        title: "Đo lường",
        timePerQuestion: 18,
        questions: [
            { equation: "1 mét = _ cm", answer: 100, options: [10, 100, 1000, 50] },
            { equation: "1 kg = _ gam", answer: 1000, options: [100, 500, 1000, 10000] },
            { equation: "1 giờ = _ phút", answer: 60, options: [30, 60, 100, 120] },
            { equation: "1 ngày = _ giờ", answer: 24, options: [12, 24, 36, 48] },
            { equation: "1 tuần = _ ngày", answer: 7, options: [5, 6, 7, 10] },
        ],
    },
    {
        level: 3,
        planet: "Ruộng bậc thang Sa Pa",
        subject: "Khoa học",
        title: "Thực vật & Thời tiết",
        timePerQuestion: 15,
        questions: [
            { equation: "Cây cần _ để quang hợp", answer: 3, options: [1, 2, 3, 4] },
            { equation: "Nước đóng băng ở _ °C", answer: 0, options: [0, 10, 100, -10] },
            { equation: "Nước sôi ở _ °C", answer: 100, options: [50, 80, 100, 120] },
            { equation: "1 năm có _ mùa ở VN", answer: 4, options: [2, 3, 4, 5] },
            { equation: "Lá cây có màu xanh nhờ chất _", answer: 1, options: [1, 2, 3, 4] },
        ],
    },
    {
        level: 4,
        planet: "Ruộng bậc thang Sa Pa",
        subject: "Toán",
        title: "Bảng cửu chương nâng cao",
        timePerQuestion: 15,
        questions: [
            { equation: "_ × 9 = 72", answer: 8, options: [6, 7, 8, 9] },
            { equation: "_ × 6 = 54", answer: 9, options: [7, 8, 9, 10] },
            { equation: "_ × 7 = 63", answer: 9, options: [7, 8, 9, 10] },
            { equation: "_ × 8 = 96", answer: 12, options: [10, 11, 12, 13] },
            { equation: "_ × 11 = 132", answer: 12, options: [11, 12, 13, 14] },
        ],
    },
];

// ─── Star Hunter: Hà Nội ──────────────────────────────
export const mockHanoiLevels = [
    {
        level: 1, planet: "Hà Nội", subject: "Địa lý", title: "Thủ đô Hà Nội", speed: 1.0,
        questions: [
            { question: "Thủ đô nước Việt Nam?", correctWord: "Hà Nội", wrongWords: ["Hồ Chí Minh", "Đà Nẵng", "Huế", "Cần Thơ"] },
            { question: "Hồ nổi tiếng nhất Hà Nội?", correctWord: "Hồ Hoàn Kiếm", wrongWords: ["Hồ Tây", "Hồ Ba Mẫu", "Hồ Đống Đa"] },
            { question: "Chùa nổi tiếng ở Hà Nội?", correctWord: "Chùa Một Cột", wrongWords: ["Chùa Bái Đính", "Chùa Hương", "Chùa Thầy"] },
            { question: "Cầu nào cổ nhất qua sông Hồng?", correctWord: "Cầu Long Biên", wrongWords: ["Cầu Nhật Tân", "Cầu Chương Dương", "Cầu Thăng Long"] },
            { question: "Hà Nội có biệt danh là?", correctWord: "Thành phố vì hòa bình", wrongWords: ["Thành phố hoa phượng", "Thành phố sông Hàn", "Phố biển"] },
        ],
    },
    {
        level: 2, planet: "Hà Nội", subject: "Lịch sử", title: "Lịch sử Hà Nội", speed: 1.2,
        questions: [
            { question: "Hà Nội được dời đô vào năm?", correctWord: "1010", wrongWords: ["1045", "899", "1225", "1100"] },
            { question: "Vua nào dời đô về Thăng Long?", correctWord: "Lý Thái Tổ", wrongWords: ["Trần Thái Tông", "Lê Lợi", "Đinh Tiên Hoàng"] },
            { question: "Hà Nội còn được gọi là?", correctWord: "Thăng Long", wrongWords: ["Đại Việt", "Việt Trì", "Đông Đô Cổ"] },
            { question: "Văn Miếu Quốc Tử Giám thờ ai?", correctWord: "Khổng Tử", wrongWords: ["Phật Thích Ca", "Hùng Vương", "Nguyễn Trãi"] },
            { question: "Kỷ niệm 1000 năm Thăng Long năm?", correctWord: "2010", wrongWords: ["2000", "2015", "1998"] },
        ],
    },
    {
        level: 3, planet: "Hà Nội", subject: "Lịch sử", title: "Danh nhân Hà Nội", speed: 1.4,
        questions: [
            { question: "Ai viết 'Bình Ngô Đại Cáo'?", correctWord: "Nguyễn Trãi", wrongWords: ["Lê Lợi", "Nguyễn Du", "Trần Hưng Đạo"] },
            { question: "Thánh Gióng quê ở đâu?", correctWord: "Phù Đổng", wrongWords: ["Hà Nội", "Bắc Ninh", "Sóc Sơn"] },
            { question: "Nguyễn Du sinh ở đâu?", correctWord: "Hà Tĩnh", wrongWords: ["Hà Nội", "Nam Định", "Nghệ An"] },
            { question: "Ai xây dựng Văn Miếu?", correctWord: "Lý Thánh Tông", wrongWords: ["Lý Thái Tổ", "Lê Thánh Tông", "Trần Nhân Tông"] },
            { question: "Phố bán sách cũ nổi tiếng HN?", correctWord: "Đinh Lễ", wrongWords: ["Hàng Bài", "Tràng Tiền", "Lý Thường Kiệt"] },
        ],
    },
];

// ─── Star Hunter: Mê Kông ─────────────────────────────
export const mockMekongLevels = [
    {
        level: 1, planet: "Đồng bằng Mê Kông", subject: "Địa lý", title: "Sông ngòi Mê Kông", speed: 1.0,
        questions: [
            { question: "ĐBSCL thuộc miền nào?", correctWord: "Miền Nam", wrongWords: ["Miền Bắc", "Miền Trung", "Tây Nguyên"] },
            { question: "Sông Cửu Long đổ vào đâu?", correctWord: "Biển Đông", wrongWords: ["Biển Tây", "Vịnh Thái Lan", "Ấn Độ Dương"] },
            { question: "Đặc sản nổi tiếng Cần Thơ?", correctWord: "Bánh xèo", wrongWords: ["Bún bò", "Phở", "Bánh mì"] },
            { question: "Mê Kông bắt nguồn từ đâu?", correctWord: "Trung Quốc", wrongWords: ["Lào", "Myanmar", "Ấn Độ"] },
            { question: "Tỉnh có nhiều xoài nhất?", correctWord: "Tiền Giang", wrongWords: ["Cần Thơ", "An Giang", "Đồng Tháp"] },
        ],
    },
    {
        level: 2, planet: "Đồng bằng Mê Kông", subject: "Khoa học", title: "Hệ sinh thái sông nước", speed: 1.2,
        questions: [
            { question: "Rừng ngập mặn ĐBSCL chủ yếu là?", correctWord: "Cây đước", wrongWords: ["Cây tràm", "Cây bần", "Cây dừa nước"] },
            { question: "Cá nước ngọt đặc trưng Mê Kông?", correctWord: "Cá tra", wrongWords: ["Cá hồi", "Cá thu", "Cá ngừ"] },
            { question: "Rừng U Minh chủ yếu có cây?", correctWord: "Tràm", wrongWords: ["Đước", "Sú", "Vẹt"] },
            { question: "Cá sấu Mê Kông thuộc loại?", correctWord: "Động vật bò sát", wrongWords: ["Tôm cua", "Côn trùng", "Chim"] },
            { question: "Vùng nào nổi tiếng nuôi tôm?", correctWord: "Cà Mau", wrongWords: ["Tiền Giang", "Vĩnh Long", "Đồng Tháp"] },
        ],
    },
    {
        level: 3, planet: "Đồng bằng Mê Kông", subject: "Khoa học", title: "Trái cây phương Nam", speed: 1.3,
        questions: [
            { question: "Trái cây nào có mùi nồng nhất?", correctWord: "Sầu riêng", wrongWords: ["Mít", "Dứa", "Ổi"] },
            { question: "Màu quả xoài chín?", correctWord: "Vàng", wrongWords: ["Đỏ", "Xanh", "Tím"] },
            { question: "Cây nào cho dừa?", correctWord: "Cọ dừa", wrongWords: ["Cọ cảnh", "Cây chà là", "Cây cọ dầu"] },
            { question: "Thanh long có màu gì phổ biến?", correctWord: "Đỏ và trắng", wrongWords: ["Vàng và xanh", "Tím và cam", "Đen và trắng"] },
            { question: "Mít chín có màu gì bên trong?", correctWord: "Vàng", wrongWords: ["Trắng", "Đỏ", "Xanh"] },
        ],
    },
];


