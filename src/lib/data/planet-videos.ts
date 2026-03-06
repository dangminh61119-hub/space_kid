/* Planet video intro mapping
 * Place your video clips in /public/videos/planets/{key}.mp4
 */
export const PLANET_VIDEOS: Record<string, string> = {
    "Cố đô Huế": "/videos/planets/hue.mp4",
    "Vịnh Hạ Long": "/videos/planets/halong.mp4",
    "Làng Gióng": "/videos/planets/giong.mp4",
    "Phong Nha": "/videos/planets/phongnha.mp4",
    "Phố cổ Hội An": "/videos/planets/hoian.mp4",
    "Sa Pa": "/videos/planets/sapa.mp4",
    "Ruộng bậc thang Sa Pa": "/videos/planets/sapa.mp4",
    "Hà Nội": "/videos/planets/hanoi.mp4",
    "Thủ đô Hà Nội": "/videos/planets/hanoi.mp4",
    "Đồng bằng Mê Kông": "/videos/planets/mekong.mp4",
    "Helios": "/videos/planets/helios.mp4",
};

/** Get video source for a planet name, or undefined if no video */
export function getPlanetVideo(planetName: string): string | undefined {
    return PLANET_VIDEOS[planetName];
}
