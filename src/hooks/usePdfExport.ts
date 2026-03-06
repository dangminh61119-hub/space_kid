/**
 * usePdfExport — Client-side PDF export hook for Dashboard
 *
 * Generates a Vietnamese-friendly PDF report for parents using
 * native browser print dialog (no external dependencies).
 * Contains player stats, subject mastery, and AI insights.
 */

"use client";

import { useCallback } from "react";
import { useGame, MASCOT_INFO, CLASS_ABILITIES } from "@/lib/game-context";

export interface PdfReportData {
    playerName: string;
    grade: number;
    level: number;
    cosmo: number;
    streak: number;
    mascotEmoji: string;
    className: string;
    masteryByTopic: Record<string, number>;
    journeysCompleted: number;
}

function generateReportHtml(data: PdfReportData): string {
    const date = new Date().toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    // Build mastery rows
    const subjects = Object.entries(data.masteryByTopic);
    const masteryRows = subjects.length > 0
        ? subjects.map(([topic, pct]) => {
            return `
                <tr>
                    <td style="padding:8px 12px;border-bottom:1px solid #eee;">${topic}</td>
                    <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center;">${pct}%</td>
                    <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center;">
                        <div style="background:#f0f0f0;border-radius:100px;height:8px;width:100%;">
                            <div style="background:${pct >= 70 ? '#22c55e' : pct >= 40 ? '#eab308' : '#ef4444'};height:100%;width:${pct}%;border-radius:100px;"></div>
                        </div>
                    </td>
                </tr>`;
        }).join("")
        : '<tr><td colspan="3" style="padding:20px;text-align:center;color:#999;">Chưa có dữ liệu học tập</td></tr>';



    return `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
        <meta charset="UTF-8">
        <title>Báo cáo học tập – ${data.playerName}</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', -apple-system, system-ui, sans-serif; color: #333; line-height: 1.6; }
            .container { max-width: 700px; margin: 0 auto; padding: 40px 30px; }
            .header { text-align: center; margin-bottom: 32px; padding-bottom: 20px; border-bottom: 3px solid #6366f1; }
            .header h1 { font-size: 24px; color: #1e1b4b; margin-bottom: 4px; }
            .header p { color: #888; font-size: 13px; }
            .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
            .stat-card { background: #f8f9ff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; text-align: center; }
            .stat-card .value { font-size: 24px; font-weight: 700; color: #4f46e5; }
            .stat-card .label { font-size: 11px; color: #888; margin-top: 4px; }
            .section { margin-bottom: 24px; }
            .section h3 { font-size: 16px; color: #1e1b4b; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 1px solid #eee; }
            table { width: 100%; border-collapse: collapse; }
            th { padding: 8px 12px; text-align: left; background: #f8f9ff; font-size: 12px; color: #666; border-bottom: 2px solid #e5e7eb; }
            .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #aaa; font-size: 11px; }
            @media print {
                body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
                .container { padding: 20px; }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🚀 CosmoMosaic – Báo Cáo Học Tập</h1>
                <p>Ngày xuất: ${date}</p>
            </div>

            <!-- Student Info -->
            <div style="background:#f8f9ff;border-radius:12px;padding:16px 20px;margin-bottom:24px;display:flex;align-items:center;gap:16px;">
                <div style="font-size:36px;">${data.mascotEmoji}</div>
                <div>
                    <div style="font-size:18px;font-weight:700;color:#1e1b4b;">${data.playerName}</div>
                    <div style="font-size:13px;color:#888;">Lớp ${data.grade} · ${data.className} · Level ${data.level}</div>
                </div>
            </div>

            <!-- Stats -->
            <div class="stats-grid">
                <div class="stat-card"><div class="value">${data.cosmo.toLocaleString()}</div><div class="label">Tổng ✦</div></div>
                <div class="stat-card"><div class="value">${data.streak}</div><div class="label">Chuỗi ngày</div></div>
                <div class="stat-card"><div class="value">${data.level}</div><div class="label">Level</div></div>
                <div class="stat-card"><div class="value">${data.journeysCompleted}/10</div><div class="label">Hành trình</div></div>
            </div>

            <!-- Subject Mastery -->
            <div class="section">
                <h3>📊 Mastery theo Môn học</h3>
                <table>
                    <thead><tr><th>Môn học</th><th style="text-align:center;">Mastery</th><th style="text-align:center;">Tiến độ</th></tr></thead>
                    <tbody>${masteryRows}</tbody>
                </table>
            </div>



            <div class="footer">
                <p>CosmoMosaic – Ghép tri thức, thắp sáng vũ trụ! 🌟</p>
                <p>Báo cáo tự động tạo bởi CosmoMosaic · Tuân thủ COPPA</p>
            </div>
        </div>
    </body>
    </html>`;
}

export function usePdfExport() {
    const { player } = useGame();

    const exportPdf = useCallback(() => {
        const mascotEmoji = player.mascot ? MASCOT_INFO[player.mascot].emoji : "🚀";
        const className = player.playerClass
            ? CLASS_ABILITIES[player.playerClass].name
            : "Tân Binh";

        const data: PdfReportData = {
            playerName: player.name,
            grade: player.grade,
            level: player.level,
            cosmo: player.cosmo,
            streak: player.streak,
            mascotEmoji,
            className,
            masteryByTopic: player.masteryByTopic,
            journeysCompleted: player.journeysCompleted,
        };

        const html = generateReportHtml(data);

        // Open print dialog in new window
        const printWindow = window.open("", "_blank", "width=800,height=1000");
        if (!printWindow) {
            alert("Không thể mở cửa sổ in. Vui lòng cho phép popup!");
            return;
        }

        printWindow.document.write(html);
        printWindow.document.close();

        // Wait for content to load then trigger print
        printWindow.onload = () => {
            setTimeout(() => {
                printWindow.print();
            }, 300);
        };
    }, [player]);

    return { exportPdf };
}
