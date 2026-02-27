"use client";

import { motion } from "framer-motion";
import StarField from "@/components/StarField";
import Navbar from "@/components/Navbar";
import NeonButton from "@/components/NeonButton";
import GlassCard from "@/components/GlassCard";
import PlanetIcon from "@/components/PlanetIcon";

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
    <div className="min-h-screen relative">
      <StarField count={100} />
      <Navbar />

      {/* Hero */}
      <section className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-6"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <PlanetIcon color1="#00F5FF" color2="#0077B6" size={50} ringColor="#00F5FF" className="animate-float" />
            <PlanetIcon color1="#FF6BFF" color2="#9D174D" size={35} ringColor="#FF6BFF" className="animate-float-slow" />
          </div>
          <h1 className="text-5xl sm:text-7xl md:text-8xl font-black font-[var(--font-heading)] neon-text leading-tight">
            CosmoMosaic
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-lg sm:text-xl text-white/70 max-w-xl mb-3 font-[var(--font-heading)]"
        >
          Ghép tri thức, thắp sáng vũ trụ! ✨
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.6 }}
          className="text-sm text-white/50 max-w-md mb-8"
        >
          Game giáo dục cho học sinh tiểu học Việt Nam – Học vô hình trong vũ trụ neon rực rỡ
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <NeonButton href="/onboarding" variant="cyan" size="lg">
            Bắt đầu Hành trình 🚀
          </NeonButton>
          <NeonButton href="/dashboard" variant="magenta" size="lg">
            Phụ huynh 👨‍👩‍👧
          </NeonButton>
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-8 animate-float"
        >
          <span className="text-white/30 text-sm">↓ Khám phá thêm</span>
        </motion.div>
      </section>

      {/* Features */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 py-20">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl sm:text-4xl font-bold font-[var(--font-heading)] neon-text text-center mb-12"
        >
          Tại sao CosmoMosaic? 🌟
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              custom={i}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <GlassCard glow={feature.glow} className="h-full text-center">
                <div className="text-5xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold font-[var(--font-heading)] text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-white/60 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Planets Preview */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 py-20">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl sm:text-4xl font-bold font-[var(--font-heading)] neon-text text-center mb-4"
        >
          Hành tinh Di sản Việt Nam 🇻🇳
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-white/50 text-center mb-12 max-w-lg mx-auto"
        >
          Mỗi hành tinh mang tên một di sản văn hóa Việt Nam, chứa đựng kiến thức từ sách giáo khoa 2018
        </motion.p>

        <div className="flex flex-wrap justify-center gap-8">
          {[
            { name: "Vịnh Hạ Long", emoji: "🏝️", c1: "#00F5FF", c2: "#0077B6", ring: "#00F5FF" },
            { name: "Cố đô Huế", emoji: "🏯", c1: "#FF6BFF", c2: "#9D174D", ring: "#FF6BFF" },
            { name: "Làng Gióng", emoji: "⚔️", c1: "#FFE066", c2: "#D97706", ring: "#FFE066" },
          ].map((planet, i) => (
            <motion.div
              key={planet.name}
              custom={i}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="flex flex-col items-center gap-3 group cursor-pointer"
            >
              <div className="planet-card">
                <PlanetIcon
                  color1={planet.c1}
                  color2={planet.c2}
                  ringColor={planet.ring}
                  size={100}
                />
              </div>
              <span className="text-2xl">{planet.emoji}</span>
              <span className="text-sm text-white/70 group-hover:text-neon-cyan transition-colors font-semibold">
                {planet.name}
              </span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Class System */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 py-20">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl sm:text-4xl font-bold font-[var(--font-heading)] neon-text text-center mb-12"
        >
          Chọn Lớp Nhân Vật ⚡
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              name: "Chiến binh Sao Băng",
              icon: "⚔️",
              power: "Lá chắn thép – Sai 1 lần không mất máu!",
              glow: "cyan" as const,
              color: "neon-cyan",
            },
            {
              name: "Phù thủy Tinh Vân",
              icon: "✨",
              power: "Ngưng đọng thời gian – Thêm thời gian suy nghĩ!",
              glow: "magenta" as const,
              color: "neon-magenta",
            },
            {
              name: "Thợ săn Ngân Hà",
              icon: "🎯",
              power: "Mắt đại bàng – Loại 1 đáp án sai!",
              glow: "gold" as const,
              color: "neon-gold",
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
              <GlassCard glow={cls.glow} className="text-center h-full">
                <div className="text-5xl mb-3">{cls.icon}</div>
                <h3 className={`text-lg font-bold font-[var(--font-heading)] text-${cls.color} mb-2`}>
                  {cls.name}
                </h3>
                <p className="text-white/60 text-sm">{cls.power}</p>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Footer */}
      <section className="relative z-10 text-center py-20 px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold font-[var(--font-heading)] neon-text mb-4">
            Sẵn sàng Thắp sáng Vũ trụ? 🚀
          </h2>
          <p className="text-white/50 mb-8 max-w-md mx-auto">
            Tham gia ngay hành trình tri thức cùng hàng nghìn bạn nhỏ khắp Việt Nam!
          </p>
          <NeonButton href="/onboarding" variant="cyan" size="lg">
            Bắt đầu Miễn phí
          </NeonButton>
        </motion.div>

        <div className="mt-16 pt-8 border-t border-white/10 text-white/30 text-xs">
          © 2026 CosmoMosaic · Ghép tri thức, thắp sáng vũ trụ! ✨
        </div>
      </section>
    </div>
  );
}
