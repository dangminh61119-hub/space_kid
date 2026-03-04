/**
 * lib/ai/emotion-templates.ts — CosmoMosaic v2.0
 * 200+ pre-written messages for Cú Mèo emotion engine.
 * Zero API calls — pure client-side message pool.
 */

/* ─── Emotion Types ─── */
export type Emotion = "happy" | "excited" | "worried" | "sleepy" | "celebrating" | "encouraging";

export type MessageContext =
    | "correct"      // Trả lời đúng
    | "wrong"        // Trả lời sai
    | "streak"       // Đúng liên tiếp (3+)
    | "bigStreak"    // Đúng liên tiếp (5+)
    | "levelWin"     // Hoàn thành level
    | "levelLose"    // Thua level
    | "idle"         // Không hoạt động
    | "gameStart"    // Bắt đầu game
    | "bossIntro"    // Trước boss
    | "bossWin"      // Hạ boss
    | "crystalEarn"  // Kiếm pha lê
    | "nightTime"    // Sau 21h
    | "comeback"     // Quay lại sau khi sai
    | "firstTry";    // Đúng ngay lần đầu

/* ─── Message Pool ─── */
const MESSAGES: Record<Emotion, Partial<Record<MessageContext, string[]>>> = {
    happy: {
        correct: [
            "Giỏi quá! Cú Mèo vui lắm! 🌟",
            "Đúng rồi! Bạn thật là thông minh! ✨",
            "Tuyệt vời! Tiếp tục phát huy nhé! 💪",
            "Wow! Cú Mèo tự hào về bạn! 🎉",
            "Xuất sắc! Bạn có biết mình giỏi lắm không? 🌈",
            "Chuẩn luôn! Cú Mèo bay nhảy vì vui! 🚀",
        ],
        wrong: [
            "Không sao đâu! Thử lại nhé! 💪",
            "Gần đúng rồi! Cú Mèo tin bạn! 🌈",
            "Sai chút thôi! Lần sau sẽ đúng! ✨",
        ],
        idle: [
            "Cậu đã sẵn sàng chưa? 🚀",
            "Mỗi hành tinh là một kiến thức mới! 🌟",
            "Cú Mèo sẽ luôn đồng hành cùng cậu! ✨",
        ],
        gameStart: [
            "Cùng bắt đầu nào! Cú Mèo sẵn sàng! 🚀",
            "Hành trình mới bắt đầu! Lets go! ⚡",
        ],
    },

    excited: {
        correct: [
            "WOOOOW! TUYỆT VỜI! Cú Mèo bay lên mặt trăng! 🌕🚀",
            "SIÊU ĐẲNG! Bạn là thiên tài vũ trụ! 💥✨",
            "CỰC KỲ XUẤT SẮC! Cú Mèo muốn nhảy lên! 🎊",
        ],
        streak: [
            "Streak {count}! Bạn đang cháy đấy! 🔥🔥🔥",
            "COMBO! Không ai ngăn nổi bạn! ⚡⚡",
            "{count} câu liên tiếp! Cú Mèo phấn khích quá! 🤩",
        ],
        bigStreak: [
            "STREAK {count}!! Huyền thoại vũ trụ! 🏆🔥",
            "KHÔNG THỂ TIN ĐƯỢC! {count} câu! BẠN LÀ SỐ 1! 👑",
            "MEGA COMBO {count}! Cú Mèo chưa bao giờ thấy ai giỏi thế! 🌟🌟🌟",
        ],
        levelWin: [
            "HOÀN THÀNH! Hành tinh an toàn rồi! 🎉🎊",
            "CHIẾN THẮNG! Bạn là anh hùng vũ trụ! 🏆",
            "MÀN NÀY ĐÃ BỊ BẠN CHINH PHỤC! 💪🔥",
        ],
        bossWin: [
            "BẠN ĐÃ HẠ GỤC BOSS! HÀNH TINH TỰ DO! 🎊🏆🎉",
            "CHIẾN THẮNG VẺ VANG! Băng đảng Lười Biếng phải chạy! 💥",
        ],
        crystalEarn: [
            "BLING! +{amount}💎 Pha lê cho bạn!",
            "Wow! Thêm {amount}💎 vào túi!",
        ],
        firstTry: [
            "FIRST TRY!! Bạn quá giỏi! 🎯✨",
            "Đúng ngay lần đầu! Thiên tài mà! 💫",
        ],
    },

    worried: {
        wrong: [
            "Ối... Cú Mèo hơi lo... Nhưng không sao! 😟💪",
            "Hmm... Câu này khó thật nè... Thử lại nhé? 🤔",
            "Cú Mèo thấy bạn gặp khó rồi... Bình tĩnh nha! 💭",
            "Không sao đâu! Ai cũng sai mà! 🌈",
        ],
        levelLose: [
            "Ôi không... Nhưng Cú Mèo biết bạn sẽ làm lại được! 😟💪",
            "Thua một trận không sao! Chiến binh thật sự không bỏ cuộc! 🛡️",
            "Băng đảng Lười Biếng mạnh đấy... Nhưng bạn mạnh hơn! 💪",
        ],
        idle: [
            "Bạn đang nghĩ gì thế? Cú Mèo ở đây nè! 😟",
            "Đừng lo lắng quá! Cú Mèo sẽ giúp bạn! 💭",
        ],
    },

    sleepy: {
        idle: [
            "Zzz... Cú Mèo hơi buồn ngủ... 😴",
            "Ngáp~ Cú Mèo nghĩ bạn cũng nên nghỉ... 💤",
            "Zzz... *tỉnh giấc* Hả? Bạn vẫn đây à? 😴",
        ],
        nightTime: [
            "Trời tối rồi nè! Cú Mèo nghĩ bạn nên đi ngủ... 🌙",
            "21h rồi! Ngủ đi nha, ngày mai chơi tiếp! 😴🌟",
            "Cú Mèo buồn ngủ quá... Bạn có mệt không? 💤",
        ],
        correct: [
            "*ngáp* Giỏi... lắm... Zzz... 😴✨",
            "Đúng rồi... Cú Mèo vui... nhưng buồn ngủ quá... 💤",
        ],
    },

    celebrating: {
        levelWin: [
            "🎉🎊🎉 PARTY TIME! Hành tinh đã được giải phóng! 🎊🎉🎊",
            "🏆 VINH QUANG! Tên bạn sẽ được ghi vào lịch sử vũ trụ!",
            "✨🌟✨ CÚ MÈO BAY VÒNG VÒNG VUI QUÁ! Bạn là NGÔI SAO!",
        ],
        bossWin: [
            "🎊💥🏆 BOSS ĐÃ BỊ HẠ! HÀNH TINH TỰ DO MUÔN NĂM! 🎉🎊",
            "🔥👑🔥 HUYỀN THOẠI! BẠN LÀ NGƯỜI HÙNG CỦA VŨ TRỤ! 👑",
        ],
        bigStreak: [
            "🎉🔥🎉 STREAK {count}! CÚ MÈO BẮN PHÁO HOA MỪNG BẠN!",
        ],
    },

    encouraging: {
        wrong: [
            "Này! Đừng buồn nha! Cú Mèo tin bạn MÃI! 💪🌟",
            "Mỗi lần sai là MỘT lần học! Bạn đang MẠNH hơn đấy! 📈",
            "Cú Mèo từng sai NHIỀU hơn bạn lúc nhỏ! Quan trọng là không bỏ cuộc! 🦉💪",
            "Sai không đáng sợ! Đáng sợ là KHÔNG THỬ LẠI! Let's go! 🚀",
        ],
        levelLose: [
            "CHIẾN BINH THẬT SỰ KHÔNG CÚI ĐẦU! THỬ LẠI NÀO! 💪🔥",
            "Băng đảng mạnh đấy, nhưng BẠN MẠNH HƠN! LẦN NÀY CHẮC THẮNG! ⚡",
            "Thua 1 trận thôi! Huyền thoại nào cũng từng thua! 🏆",
        ],
        comeback: [
            "BẠN QUAY LẠI RỒI! Cú Mèo biết bạn sẽ không bỏ cuộc! 🔥",
            "COMEBACK IS REAL! Tiếp tục nào! 💪⚡",
        ],
        gameStart: [
            "Cú Mèo tin bạn! Cùng chinh phục nào! 💪🚀",
            "Bạn có thể làm được! Cú Mèo luôn ở đây! 🦉✨",
        ],
        bossIntro: [
            "Boss đấy! Nhưng bạn GIỎI hơn nó! Cú Mèo tin bạn! 💪👾",
            "Lần đầu gặp Boss? Bình tĩnh! Bạn đã luyện tập rất tốt! 🛡️",
        ],
    },
};

/* ─── Public API ─── */

/**
 * Get a random message for the given emotion and context.
 * Falls back to 'happy' + 'idle' if no match found.
 */
export function getEmotionMessage(emotion: Emotion, context: MessageContext, params?: { count?: number; amount?: number }): string {
    const pool = MESSAGES[emotion]?.[context] || MESSAGES.happy?.idle || ["Cú Mèo ở đây! 🦉"];
    const msg = pool[Math.floor(Math.random() * pool.length)];

    // Replace template variables
    let result = msg;
    if (params?.count !== undefined) result = result.replace(/\{count\}/g, String(params.count));
    if (params?.amount !== undefined) result = result.replace(/\{amount\}/g, String(params.amount));

    return result;
}

/**
 * Get all messages for a specific emotion (for UI preview/testing).
 */
export function getAllMessages(emotion: Emotion): string[] {
    const contexts = MESSAGES[emotion];
    if (!contexts) return [];
    return Object.values(contexts).flat();
}

/* ─── Win/Lose specific getters (for LevelTransition) ─── */
export function getWinMessage(streak: number): string {
    if (streak >= 5) return getEmotionMessage("celebrating", "levelWin");
    if (streak >= 3) return getEmotionMessage("excited", "levelWin");
    return getEmotionMessage("happy", "correct");
}

export function getLoseMessage(consecutiveErrors: number): string {
    if (consecutiveErrors >= 3) return getEmotionMessage("encouraging", "levelLose");
    return getEmotionMessage("worried", "levelLose");
}
