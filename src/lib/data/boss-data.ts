/**
 * lib/data/boss-data.ts — CosmoMosaic v2.0
 * 8 Boss characters — one per planet.
 * Pre-defined dialogue (template-based, 0 API during battle).
 */

export interface Boss {
    id: string;
    name: string;
    emoji: string;
    planet: string;
    personality: string;
    color: string;
    /** Max HP (questions to defeat) */
    maxHp: number;
    /** Intro dialogue */
    introLines: string[];
    /** Said when player answers correctly (boss loses HP) */
    hitLines: string[];
    /** Said when player answers wrong */
    tauntLines: string[];
    /** Said when player has a streak */
    fearLines: string[];
    /** Said when boss is defeated */
    defeatLines: string[];
}

export const BOSSES: Record<string, Boss> = {
    "ha-long": {
        id: "ha-long-boss",
        name: "Bạch Tuộc Mê Ngủ",
        emoji: "🦑",
        planet: "ha-long",
        personality: "Ngáp ngủ, lười biếng, nói chậm",
        color: "#6366f1",
        maxHp: 3,
        introLines: [
            "Zzz... *ngáp* Ai dám đánh thức ta?",
            "Ta là Bạch Tuộc Mê Ngủ... ta đã phong ấn Vịnh Hạ Long...",
            "Zzz... trả lời gì cũng được... ta quá buồn ngủ... zzz...",
        ],
        hitLines: [
            "*giật mình* H-hả?! Ngươi đúng á?! 😱",
            "Zzz... ối! Đau quá! Ai bảo trả lời đúng chi! 😤",
            "*rên rỉ* Ta buồn ngủ quá mà ngươi cứ chọc... 😫",
        ],
        tauntLines: [
            "Zzz... sai rồi... lười học nên thế... zzz... 😴",
            "*ngáp* Cũng... lười... như ta... hehe... 😴",
            "Zzz... dễ mà... cũng... sai... zzz... 🥱",
        ],
        fearLines: [
            "K-không! Đừng! Ta muốn ngủ tiếp mà! 😱😱",
            "NGOOO! Sức mạnh tri thức! Ta chịu không nổi! 🌊",
        ],
        defeatLines: [
            "Zzz... thua rồi... ta đi ngủ đây... Vịnh Hạ Long... tự do rồi... zzz... 😴💤",
            "*biến mất trong làn sóng* Goodbye... zzz...",
        ],
    },
    "hue": {
        id: "hue-boss",
        name: "Quan Lười Biếng",
        emoji: "🎭",
        planet: "hue",
        personality: "Kiêu ngạo, coi thường, nghĩ mình giỏi nhất",
        color: "#eab308",
        maxHp: 3,
        introLines: [
            "Hmph! Ngươi dám bước vào Kinh thành TA?!",
            "Ta là Quan Lười Biếng, kẻ phong ấn cung điện!",
            "Ngươi không đủ giỏi để đánh bại ta đâu! Hohoho!",
        ],
        hitLines: [
            "G-gì?! Ngươi... ngươi đúng?! Không thể! 😤",
            "Hmph! May mắn thôi! Lần sau không đúng đâu! 😡",
            "*lùi lại* T-ta chỉ nhường ngươi thôi! 🥊",
        ],
        tauntLines: [
            "HOHOHO! Ta đã nói rồi! Ngươi quá yếu! 👑",
            "Hmph! Đúng là kẻ lười học! Không xứng đấu với ta! 😏",
        ],
        fearLines: [
            "S-sao ngươi giỏi thế?! T-ta không sợ đâu! 😱",
            "KHÔNG! Vương miện ta! Sức mạnh ta! 👑💥",
        ],
        defeatLines: [
            "KHÔNGGG! Cung điện... đã mở cửa... Ngươi thắng rồi... 😫",
            "*biến mất trong ánh vàng* Ta sẽ... quay lại... 💨",
        ],
    },
    "giong": {
        id: "giong-boss",
        name: "Rồng Uể Oải",
        emoji: "🐉",
        planet: "giong",
        personality: "Hung hãn nhưng dốt, hay nói sai",
        color: "#ef4444",
        maxHp: 3,
        introLines: [
            "ROAAARRR! Ta là Rồng Uể Oải!",
            "Ta đã nuốt hết sách vở ở Làng Gióng!",
            "Không ai học được gì nữa! ROAR! 🔥",
        ],
        hitLines: [
            "ROAR! Đ-đau! Tri thức... nóng quá! 🔥😱",
            "GRRR! Ngươi... ngươi BIẾT câu trả lời?! 😡",
            "*phun lửa loạn* AAAHH sách vở trả thù ta! 🔥📚",
        ],
        tauntLines: [
            "HAHAHA! Sai rồi! Ta bảo mà! Học làm gì! 🐉😆",
            "ROAR! Ngươi cũng dốt như ta! Hehe! 🔥",
        ],
        fearLines: [
            "K-KHÔNG! Sách vở... đang thoát khỏi bụng ta! 📚💥",
            "GRRR... ngươi... ngươi là Thánh Gióng thật sao?! 😱",
        ],
        defeatLines: [
            "ROAAARRR... *thu nhỏ lại*... ối... ta thua rồi... 🐉→🦎",
            "Sách vở... tự do rồi... Làng Gióng an toàn... 📚✨",
        ],
    },
    "phong-nha": {
        id: "phong-nha-boss",
        name: "Dơi Bóng Tối",
        emoji: "🦇",
        planet: "phong-nha",
        personality: "Sợ ánh sáng, lén lút, thích bóng tối",
        color: "#8b5cf6",
        maxHp: 3,
        introLines: [
            "Ssshhh... ai vào hang ta thế...?",
            "Ta là Dơi Bóng Tối... tri thức nên giấu trong bóng tối...",
            "Ngươi sẽ không bao giờ tìm thấy ánh sáng! 🦇",
        ],
        hitLines: [
            "AAAH! Ánh sáng! Đau quá! 😵",
            "*che mắt* Tri thức... chói quá... 🫣",
        ],
        tauntLines: [
            "Hehehe... sai rồi... bóng tối nuốt chửng ngươi... 🦇",
            "Sssh... về đi... hang động này không dành cho kẻ dốt... 🕳️",
        ],
        fearLines: [
            "KHÔNG! Ánh sáng... tri thức... nó quá mạnh! 💡😱",
        ],
        defeatLines: [
            "*tan biến trong ánh sáng* Hang Phong Nha... rực rỡ rồi... 🦇→✨",
        ],
    },
    "hoi-an": {
        id: "hoi-an-boss",
        name: "Chú Hề Lười",
        emoji: "🎪",
        planet: "hoi-an",
        personality: "Hài hước, đánh lạc hướng, nghịch ngợm",
        color: "#f97316",
        maxHp: 3,
        introLines: [
            "Hahaha! Chào mừng đến show diễn của ta!",
            "Ta là Chú Hề Lười! Học làm gì? CHƠI cho vui! 🎪",
            "Nếu ngươi trả lời đúng, ta sẽ... à mà thôi! Hehe!",
        ],
        hitLines: [
            "*vấp ngã* Ối! Đ-đúng rồi á?! Haha... không vui... 😅",
            "Hey hey! Đó là... trùng hợp thôi! 🤡",
        ],
        tauntLines: [
            "HAHAHA! Sai bét! Vui không? Ta vui lắm! 🤣",
            "Hehe! Xem này! *ném bóng* Quên câu hỏi đi! 🎈",
        ],
        fearLines: [
            "H-hết vui rồi... ngươi giỏi thật... 😰",
        ],
        defeatLines: [
            "Ầy... show diễn kết thúc... Đèn lồng Hội An sáng lại rồi... 🏮✨",
        ],
    },
    "sapa": {
        id: "sapa-boss",
        name: "Yeti Đóng Băng",
        emoji: "❄️",
        planet: "sapa",
        personality: "Chậm chạp, lạnh lùng, phá hoại bằng băng",
        color: "#06b6d4",
        maxHp: 3,
        introLines: [
            "Brrrrr... ta là Yeti Đóng Băng...",
            "Ta đã đóng băng hết ruộng bậc thang...",
            "Tri thức... cũng sẽ đông cứng... như băng... ❄️",
        ],
        hitLines: [
            "*rùng mình* Ấm... ấm quá! Tri thức nóng quá! 🥵",
            "Brrr... băng... đang tan... 💧",
        ],
        tauntLines: [
            "Heheh... sai rồi... để ta đóng băng thêm... ❄️",
            "Brrr... ngươi cũng lạnh cóng như ta... 🥶",
        ],
        fearLines: [
            "KHÔNG! Băng đang tan! Ruộng bậc thang... hồi sinh! 🌱😱",
        ],
        defeatLines: [
            "*tan chảy* Brrr... ta đi... về... Bắc Cực... Sa Pa... ấm áp rồi... ❄️→☀️",
        ],
    },
    "hanoi": {
        id: "hanoi-boss",
        name: "Tướng Xảo Quyệt",
        emoji: "🏰",
        planet: "hanoi",
        personality: "Thông minh, xảo quyệt, dùng mẹo",
        color: "#dc2626",
        maxHp: 3,
        introLines: [
            "Ngươi... đã đến Hoàng thành ta!",
            "Ta là Tướng Xảo Quyệt! Kẻ chiếm giữ Thăng Long!",
            "Tri thức là SỨC MẠNH — và ta giữ hết cho mình! ⚔️",
        ],
        hitLines: [
            "Hmm... Ngươi giỏi đấy... nhưng chưa đủ! 😤",
            "*lùi lại* Tốt! Nhưng ta còn nhiều chiêu! ⚔️",
        ],
        tauntLines: [
            "Hmph! Yếu! Ta đoán ngươi sẽ sai! 😏",
            "Chiến thuật tồi! Quay về học lại đi! 📖",
        ],
        fearLines: [
            "K-KHÔNG THỂ! Ngươi... thông minh hơn ta?! 😱😱",
            "HOÀNG THÀNH ĐANG RUNG CHUYỂN! 🏰💥",
        ],
        defeatLines: [
            "NGƯƠI... ĐÃ THẮNG! Thăng Long... nghìn năm... tự do... 🏰✨",
            "*biến mất* Ta... sẽ phải đi học lại... 📚",
        ],
    },
    "mekong": {
        id: "mekong-boss",
        name: "Cá Sấu Phục Kích",
        emoji: "🐊",
        planet: "mekong",
        personality: "Bất ngờ, ẩn nấp, tấn công lén",
        color: "#22c55e",
        maxHp: 3,
        introLines: [
            "*SNAP* Ngươi không thấy ta ẩn dưới nước à?!",
            "Ta là Cá Sấu Phục Kích! Chủ nhân dòng Mê Kông!",
            "Ngươi sẽ không bao giờ qua được sông tri thức! 🐊",
        ],
        hitLines: [
            "*SNAP SNAP* Ối! Ngươi... cắn lại ta?! 😱",
            "*lặn xuống nước* Đ-đau! Ta chịu không thấy! 🌊",
        ],
        tauntLines: [
            "SNAP! Sai rồi! *vẫy đuôi hài lòng* 🐊😎",
            "Hehehe... dòng sông cuốn đi câu trả lời... 🌊",
        ],
        fearLines: [
            "*hoảng sợ* SNAP SNAP! Ngươi... quá giỏi! 😰🐊",
        ],
        defeatLines: [
            "*chìm xuống nước* Dòng Mê Kông... chảy tự do rồi... 🐊→💧",
            "Snap... ta thua... hẹn gặp lại... 🌊",
        ],
    },
};

/**
 * Get boss for a specific planet.
 */
export function getBoss(planetId: string): Boss | null {
    return BOSSES[planetId] || null;
}

/**
 * Get a random dialogue line based on context.
 */
export function getBossDialogue(
    boss: Boss,
    context: "intro" | "hit" | "taunt" | "fear" | "defeat",
    index?: number
): string {
    const pool = {
        intro: boss.introLines,
        hit: boss.hitLines,
        taunt: boss.tauntLines,
        fear: boss.fearLines,
        defeat: boss.defeatLines,
    }[context];

    if (index !== undefined && index < pool.length) return pool[index];
    return pool[Math.floor(Math.random() * pool.length)];
}
