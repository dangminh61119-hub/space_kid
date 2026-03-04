/**
 * lib/data/planet-spells.ts — CosmoMosaic v2.0
 * Spell incantations and animation configs for each planet.
 * Used by the Summon System when players activate Cú Mèo help.
 */

export interface PlanetSpell {
    /** Spell text the player must say (Web Speech API match) */
    spellText: string;
    /** Alternative spellings/pronunciations for fuzzy matching */
    aliases: string[];
    /** Animation theme when spell activates */
    animationTheme: "water" | "gate" | "light" | "cave" | "lantern" | "mist" | "turtle" | "river";
    /** Emoji for visual effect */
    effectEmoji: string;
    /** Color theme for glow effect */
    glowColor: string;
    /** Hint prefix from Cú Mèo during this planet's summon */
    hintPrefix: string;
}

export const PLANET_SPELLS: Record<string, PlanetSpell> = {
    "ha-long": {
        spellText: "Sóng biển dẫn lối",
        aliases: ["sóng biển", "dẫn lối", "song bien dan loi"],
        animationTheme: "water",
        effectEmoji: "🌊",
        glowColor: "#00b4d8",
        hintPrefix: "Hmmm... Cú Mèo nhìn thấy qua làn sóng...",
    },
    "hue": {
        spellText: "Cung đình khai sáng",
        aliases: ["cung đình", "khai sáng", "cung dinh khai sang"],
        animationTheme: "gate",
        effectEmoji: "🏯",
        glowColor: "#ffd700",
        hintPrefix: "Cú Mèo tìm thấy manh mối trong cung điện...",
    },
    "giong": {
        spellText: "Roi sắt chiếu sáng",
        aliases: ["roi sắt", "chiếu sáng", "roi sat chieu sang"],
        animationTheme: "light",
        effectEmoji: "⚔️",
        glowColor: "#ef4444",
        hintPrefix: "Roi sắt chỉ cho Cú Mèo thấy rằng...",
    },
    "phong-nha": {
        spellText: "Hang động hé lời",
        aliases: ["hang động", "hé lời", "hang dong he loi"],
        animationTheme: "cave",
        effectEmoji: "🦇",
        glowColor: "#8b5cf6",
        hintPrefix: "Tiếng vọng từ hang sâu mách bảo...",
    },
    "hoi-an": {
        spellText: "Đèn lồng soi đường",
        aliases: ["đèn lồng", "soi đường", "den long soi duong"],
        animationTheme: "lantern",
        effectEmoji: "🏮",
        glowColor: "#f97316",
        hintPrefix: "Ánh đèn lồng soi sáng manh mối...",
    },
    "sapa": {
        spellText: "Sương mù tan đi",
        aliases: ["sương mù", "tan đi", "suong mu tan di"],
        animationTheme: "mist",
        effectEmoji: "🌫️",
        glowColor: "#06b6d4",
        hintPrefix: "Khi sương tan, Cú Mèo nhìn thấy...",
    },
    "hanoi": {
        spellText: "Rùa vàng hiện thân",
        aliases: ["rùa vàng", "hiện thân", "rua vang hien than"],
        animationTheme: "turtle",
        effectEmoji: "🐢",
        glowColor: "#eab308",
        hintPrefix: "Rùa vàng mang đến thông điệp...",
    },
    "mekong": {
        spellText: "Dòng sông chỉ lối",
        aliases: ["dòng sông", "chỉ lối", "dong song chi loi"],
        animationTheme: "river",
        effectEmoji: "🌊",
        glowColor: "#22c55e",
        hintPrefix: "Dòng Mê Kông thì thầm rằng...",
    },
};

/**
 * Fuzzy match a spoken phrase against planet spells.
 * Returns the matching planet ID or null.
 */
export function matchSpell(spoken: string, planetId?: string): string | null {
    const normalized = spoken.toLowerCase().trim()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // strip diacritics
        .replace(/đ/g, "d").replace(/Đ/g, "D");

    // If planetId given, only check that planet
    if (planetId) {
        const spell = PLANET_SPELLS[planetId];
        if (!spell) return null;
        const targets = [spell.spellText, ...spell.aliases];
        for (const target of targets) {
            const normalizedTarget = target.toLowerCase().trim()
                .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                .replace(/đ/g, "d").replace(/Đ/g, "D");
            if (normalized.includes(normalizedTarget) || normalizedTarget.includes(normalized)) {
                return planetId;
            }
        }
        return null;
    }

    // Otherwise check all planets
    for (const [id, spell] of Object.entries(PLANET_SPELLS)) {
        const targets = [spell.spellText, ...spell.aliases];
        for (const target of targets) {
            const normalizedTarget = target.toLowerCase().trim()
                .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                .replace(/đ/g, "d").replace(/Đ/g, "D");
            if (normalized.includes(normalizedTarget)) {
                return id;
            }
        }
    }
    return null;
}

/* ─── Crystal costs for each summon method ─── */
export const SUMMON_COSTS = {
    spell: 2,           // 🪄 Thần Chú
    rune: 3,            // ✍️ Phù Chú
    constellation: 1,   // 🌌 Chòm Sao
    lens: 2,            // 🔮 Kính Thần
    timeWarp: 4,        // ⏳ Cỗ máy Thời gian
    fiftyFifty: 5,      // 💥 50/50
} as const;

export type SummonMethod = keyof typeof SUMMON_COSTS;
