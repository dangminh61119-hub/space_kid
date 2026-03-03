/**
 * curriculum-map.ts — Planet → Subject → Grade → Bloom mapping
 *
 * Defines the educational structure of CosmoMosaic: which subjects
 * are taught on which planets, their grade ranges, and Bloom's taxonomy
 * progression for adaptive difficulty.
 *
 * Data Rules v3: Bloom max is determined by SUBJECT × GRADE, not planet.
 * Bloom 6 (Create) removed — not suitable for primary quiz format.
 */

/* ─── Bloom's Taxonomy Levels (5 levels — v3) ─── */
export const BLOOM_LEVELS = {
    1: { name: "Nhớ", nameEn: "Remember", icon: "🧠", description: "Nhận biết, nhớ lại kiến thức cơ bản" },
    2: { name: "Hiểu", nameEn: "Understand", icon: "💡", description: "Giải thích, diễn giải ý nghĩa" },
    3: { name: "Áp dụng", nameEn: "Apply", icon: "🔧", description: "Sử dụng kiến thức vào tình huống mới" },
    4: { name: "Phân tích", nameEn: "Analyze", icon: "🔍", description: "So sánh, phân loại, tìm mối liên hệ" },
    5: { name: "Tư duy bậc cao", nameEn: "Higher-order", icon: "⚖️", description: "Lập luận, chọn phương án tốt nhất" },
} as const;

export type BloomLevel = keyof typeof BLOOM_LEVELS;

/* ─── Bloom Max by Subject × Grade (v3) ─── */
const BLOOM_MAX_BY_SUBJECT: Record<string, Record<number, BloomLevel>> = {
    "Toán": { 1: 3, 2: 3, 3: 4, 4: 4, 5: 4 },
    "Tiếng Việt": { 1: 2, 2: 3, 3: 3, 4: 4, 5: 4 },
    "Tiếng Anh": { 1: 3, 2: 3, 3: 3, 4: 4, 5: 4 },
    "Khoa học": { 1: 2, 2: 3, 3: 4, 4: 4, 5: 5 },
    "Lịch sử": { 1: 2, 2: 3, 3: 3, 4: 5, 5: 5 },
    "Địa lý": { 1: 2, 2: 3, 3: 3, 4: 5, 5: 5 },
    "Mỹ thuật": { 1: 2, 2: 3, 3: 3, 4: 3, 5: 3 },
    "Tin học": { 1: 2, 2: 3, 3: 3, 4: 4, 5: 4 },
};

/**
 * Get max Bloom level for a subject at a given grade (v3 — subject-based)
 */
export function getMaxBloomForSubject(subject: string, grade: number): BloomLevel {
    const subjectMap = BLOOM_MAX_BY_SUBJECT[subject];
    if (!subjectMap) return 3 as BloomLevel;
    return (subjectMap[grade] ?? 3) as BloomLevel;
}

/* ─── Subject Definitions ─── */
export interface SubjectDef {
    id: string;
    name: string;
    nameShort: string;
    icon: string;
    color: string;
}

export const SUBJECTS: Record<string, SubjectDef> = {
    toan: { id: "toan", name: "Toán", nameShort: "Toán", icon: "🔢", color: "#60A5FA" },
    tiengViet: { id: "tiengViet", name: "Tiếng Việt", nameShort: "T.Việt", icon: "📝", color: "#4ADE80" },
    tiengAnh: { id: "tiengAnh", name: "Tiếng Anh", nameShort: "T.Anh", icon: "🌍", color: "#FB923C" },
    lichSu: { id: "lichSu", name: "Lịch sử", nameShort: "L.Sử", icon: "📜", color: "#A78BFA" },
    diaLy: { id: "diaLy", name: "Địa lý", nameShort: "Đ.Lý", icon: "🗺️", color: "#06B6D4" },
    khoaHoc: { id: "khoaHoc", name: "Khoa học", nameShort: "K.Học", icon: "🔬", color: "#10B981" },
    myThuat: { id: "myThuat", name: "Mỹ thuật", nameShort: "M.Thuật", icon: "🎨", color: "#F472B6" },
    tinHoc: { id: "tinHoc", name: "Tin học", nameShort: "T.Học", icon: "💻", color: "#8B5CF6" },
};

/* ─── Planet → Curriculum Map ─── */
export interface PlanetCurriculum {
    planetId: string;
    name: string;
    emoji: string;
    gradeRange: [number, number];
    subjects: string[];
    /** Max Bloom level available per grade on this planet */
    bloomByGrade: Record<number, BloomLevel>;
    /** Game type used on this planet */
    gameType: "space-shooter" | "math-forge" | "star-hunter";
}

export const CURRICULUM_MAP: PlanetCurriculum[] = [
    {
        planetId: "ha-long",
        name: "Vịnh Hạ Long",
        emoji: "🌊",
        gradeRange: [1, 3],
        subjects: ["Tiếng Việt", "Toán"],
        bloomByGrade: { 1: 2, 2: 3, 3: 3 },
        gameType: "space-shooter",
    },
    {
        planetId: "hue",
        name: "Cố đô Huế",
        emoji: "🏯",
        gradeRange: [2, 4],
        subjects: ["Lịch sử", "Tiếng Việt"],
        bloomByGrade: { 2: 2, 3: 3, 4: 4 },
        gameType: "star-hunter",
    },
    {
        planetId: "giong",
        name: "Làng Gióng",
        emoji: "⚔️",
        gradeRange: [1, 3],
        subjects: ["Lịch sử", "Tiếng Việt"],
        bloomByGrade: { 1: 1, 2: 2, 3: 3 },
        gameType: "space-shooter",
    },
    {
        planetId: "phong-nha",
        name: "Phong Nha",
        emoji: "🦇",
        gradeRange: [3, 5],
        subjects: ["Khoa học", "Địa lý"],
        bloomByGrade: { 3: 2, 4: 3, 5: 4 },
        gameType: "star-hunter",
    },
    {
        planetId: "hoi-an",
        name: "Phố cổ Hội An",
        emoji: "🏮",
        gradeRange: [2, 5],
        subjects: ["Tiếng Anh", "Lịch sử"],
        bloomByGrade: { 2: 2, 3: 3, 4: 4, 5: 4 },
        gameType: "space-shooter",
    },
    {
        planetId: "sapa",
        name: "Sa Pa",
        emoji: "🏔️",
        gradeRange: [3, 5],
        subjects: ["Địa lý", "Khoa học"],
        bloomByGrade: { 3: 2, 4: 3, 5: 4 },
        gameType: "math-forge",
    },
    {
        planetId: "hanoi",
        name: "Hà Nội",
        emoji: "🎋",
        gradeRange: [1, 5],
        subjects: ["Toán", "Tiếng Việt"],
        bloomByGrade: { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5 },
        gameType: "math-forge",
    },
    {
        planetId: "mekong",
        name: "Đồng bằng Mê Kông",
        emoji: "🐟",
        gradeRange: [1, 5],
        subjects: ["Khoa học", "Địa lý"],
        bloomByGrade: { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5 },
        gameType: "star-hunter",
    },
];

/* ─── Lookup Helpers ─── */

/**
 * Get curriculum data for a specific planet
 */
export function getPlanetCurriculum(planetId: string): PlanetCurriculum | undefined {
    return CURRICULUM_MAP.find(p => p.planetId === planetId);
}

/**
 * Get max Bloom level for a player's grade on a planet
 * Falls back to subject-based lookup (v3)
 */
export function getMaxBloomLevel(planetId: string, grade: number): BloomLevel {
    const planet = getPlanetCurriculum(planetId);
    if (!planet) return 1;
    // Try planet-specific first, then fall back to subject-based
    if (planet.bloomByGrade[grade]) return planet.bloomByGrade[grade];
    // Use first subject of the planet for subject-based lookup
    if (planet.subjects.length > 0) {
        return getMaxBloomForSubject(planet.subjects[0], grade);
    }
    return 1;
}

/**
 * Get all planets available for a specific grade
 */
export function getPlanetsForGrade(grade: number): PlanetCurriculum[] {
    return CURRICULUM_MAP.filter(
        p => grade >= p.gradeRange[0] && grade <= p.gradeRange[1]
    );
}

/**
 * Get next Bloom level (for progression) — v3: uses subject-based max
 */
export function getNextBloomLevel(
    currentBloom: BloomLevel,
    planetId: string,
    grade: number
): BloomLevel {
    const maxBloom = getMaxBloomLevel(planetId, grade);
    return Math.min(currentBloom + 1, maxBloom) as BloomLevel;
}
