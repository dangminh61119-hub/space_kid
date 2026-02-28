"use client";

import { motion } from "framer-motion";
import StarField from "@/components/StarField";
import Navbar from "@/components/Navbar";
import NeonButton from "@/components/NeonButton";
import GlassCard from "@/components/GlassCard";
import PlanetIcon from "@/components/PlanetIcon";
import MascotAI from "@/components/MascotAI";
import ChallengePlanets from "@/components/ChallengePlanets";

const features = [
  {
    icon: "🌌",
    title: "Vũ Trụ Neon",
    description: "Khám phá vũ trụ tri thức rực rỡ với đồ họa neon cực đẹp, mỗi hành tinh là một di sản Việt Nam!",
    glow: "cyan" as const,
  },
  {
    icon: "🤖",
    title: "Mascot AI Thông Minh",
    description: "Bạn đồng hành không gian biết nói tiếng Việt, luôn sẵn sàng giúp đỡ và cổ vũ bé!",
    glow: "magenta" as const,
  },
  {
    icon: "🎮",
    title: "Học Mà Chơi",
    description: "Toàn bộ kiến thức SGK 2018 được giấu vào gameplay. Bé chỉ thấy mình đang chơi game siêu vui!",
    glow: "gold" as const,
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.6, ease: "easeOut" as const },
  }),
};

export default function HomePage() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-950">
      {/* Background Elements */}
      <StarField count={100} />
      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0wIDBoNDB2NDBIMHoiIGZpbGw9Im5vbmUiLz4KPHBhdGggZD0iTTAgMGg0MHYxSDB6TTAgMHY0MGgxVjB6IiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIi8+Cjwvc3ZnPg==')] opacity-20 pointer-events-none" />

      <Navbar />
      <MascotAI />

      {/* Hero */}
      <section className="relative z-10 flex flex-col items-center justify-center min-h-screen pt-20 pb-16 px-4 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-8"
        >
          <div className="flex items-center justify-center gap-4 mb-6 relative">
            {/* Glowing orb behind planets */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-cyan-500/20 rounded-full blur-2xl pointer-events-none" />
            <PlanetIcon color1="#00F5FF" color2="#0077B6" size={60} ringColor="#00F5FF" className="animate-float" />
            <PlanetIcon color1="#FF6BFF" color2="#9D174D" size={45} ringColor="#FF6BFF" className="animate-float-slow" />
          </div>
          <h1 className="text-5xl sm:text-7xl md:text-8xl font-black font-[var(--font-heading)] neon-text leading-tight tracking-wide text-white">
            CosmoMosaic
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-xl sm:text-2xl text-slate-300 max-w-2xl mb-4 font-[var(--font-heading)] leading-relaxed"
        >
          Ghép tri thức, thắp sáng vũ trụ! ✨
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.6 }}
          className="text-base text-slate-400 max-w-lg mb-10"
        >
          Game giáo dục cho học sinh tiểu học Việt Nam – Học vô hình trong không gian học tập tương lai.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="flex flex-col sm:flex-row gap-6"
        >
          <NeonButton href="/onboarding" variant="orange" size="lg">
            BẮT ĐẦU HÀNH TRÌNH
          </NeonButton>
          <NeonButton href="/dashboard" variant="cyan" size="lg">
            PHỤ HUYNH
          </NeonButton>
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-10 animate-float cursor-pointer flex flex-col items-center gap-2"
        >
          <span className="text-slate-400 text-sm tracking-widest uppercase font-mono">Hệ Thống Sẵn Sàng</span>
          <div className="w-1 h-8 bg-gradient-to-b from-cyan-400 to-transparent rounded-full" />
        </motion.div>
      </section>

      {/* Features Separator (Glowing Line) */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />

      {/* Features */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-24">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl sm:text-4xl font-bold font-[var(--font-heading)] text-white tracking-wide text-center mb-16"
        >
          Tại sao lại chọn <span className="text-cyan-400">CosmoMosaic?</span> 🌟
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              custom={i}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <GlassCard glow={feature.glow} className="h-full text-center p-8">
                <div className="text-6xl mb-6">{feature.icon}</div>
                <h3 className="text-2xl font-bold font-[var(--font-heading)] text-white mb-4">
                  {feature.title}
                </h3>
                <p className="text-slate-300 text-base leading-relaxed">
                  {feature.description}
                </p>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Planets Preview Separator */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-fuchsia-500/50 to-transparent" />

      {/* Planets Preview */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-24">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl sm:text-4xl font-bold font-[var(--font-heading)] text-white tracking-wide text-center mb-6"
        >
          Hành tinh Di sản <span className="text-fuchsia-400">Việt Nam</span> 🇻🇳
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-slate-400 text-center mb-16 max-w-2xl mx-auto text-lg"
        >
          Mỗi hành tinh mang tên một di sản văn hóa Việt Nam, chứa đựng các thử thách dựa trên sách giáo khoa 2018. Hãy lần lượt khám phá!
        </motion.p>

        {/* Replaced logic with new modular component */}
        <ChallengePlanets />
      </section>

      {/* Class System Separator */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />

      {/* Class System */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-24">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl sm:text-4xl font-bold font-[var(--font-heading)] text-white tracking-wide text-center mb-16"
        >
          Đội Hình <span className="text-amber-400">Vũ Trụ</span> ⚡
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              name: "Chiến binh Sao Băng",
              icon: "⚔️",
              power: "Lá chắn thép – Sai 1 lần không mất điểm!",
              glow: "cyan" as const,
              color: "text-cyan-400",
            },
            {
              name: "Phù thủy Tinh Vân",
              icon: "✨",
              power: "Ngưng đọng thời gian – Thêm thời gian suy nghĩ!",
              glow: "magenta" as const,
              color: "text-fuchsia-400",
            },
            {
              name: "Thợ săn Ngân Hà",
              icon: "🎯",
              power: "Mắt đại bàng – Loại 1 đáp án sai nhanh chóng!",
              glow: "gold" as const,
              color: "text-amber-400",
            },
          ].map((cls, i) => (
            <motion.div
              key={cls.name}
              custom={i}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <GlassCard glow={cls.glow} className="text-center h-full p-8 border-white/5">
                <div className="text-6xl mb-6">{cls.icon}</div>
                <h3 className={`text-xl font-bold font-[var(--font-heading)] ${cls.color} mb-4 uppercase tracking-wider`}>
                  {cls.name}
                </h3>
                <p className="text-slate-300 text-base">{cls.power}</p>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Footer */}
      <section className="relative z-10 text-center py-32 px-6 bg-slate-900/50 border-t border-white/5">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto flex flex-col items-center gap-8"
        >
          <h2 className="text-4xl sm:text-5xl font-bold font-[var(--font-heading)] text-white tracking-wide leading-tight">
            Sẵn sàng Thắp sáng <span className="text-emerald-400">Vũ trụ?</span> 🚀
          </h2>
          <p className="text-slate-400 text-lg mb-2">
            Tham gia ngay hành trình tri thức cùng hàng nghìn bạn nhỏ khắp Việt Nam!
          </p>
          <NeonButton href="/onboarding" variant="green" size="lg">
            BẮT ĐẦU MIỄN PHÍ
          </NeonButton>
        </motion.div>

        <div className="mt-24 pt-8 border-t border-white/5 text-slate-500 text-xs tracking-widest font-mono">
          © 2026 COSMOMOSAIC · HỆ THỐNG GIÁO DỤC TƯƠNG LAI
        </div>
      </section>
    </div>
  );
}
