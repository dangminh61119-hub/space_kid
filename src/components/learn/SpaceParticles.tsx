"use client";

/**
 * SpaceParticles — Tech Agent ambient effects
 * Cyan-tinted particles, tech grid highlights, floating hexagons
 * Lightweight, CSS-only, mobile-friendly
 */
export default function SpaceParticles() {
  return (
    <>
      <div className="space-particles" aria-hidden="true">
        {/* Cyan twinkling stars */}
        <div className="sp-layer sp-layer-1" />
        <div className="sp-layer sp-layer-2" />
        <div className="sp-layer sp-layer-3" />
        {/* Tech grid highlight pulses */}
        <div className="sp-grid-pulse sp-grid-pulse-1" />
        <div className="sp-grid-pulse sp-grid-pulse-2" />
        {/* Floating tech shapes */}
        <div className="sp-hex sp-hex-1" />
        <div className="sp-hex sp-hex-2" />
        <div className="sp-hex sp-hex-3" />
        {/* Connection line */}
        <div className="sp-circuit sp-circuit-1" />
        <div className="sp-circuit sp-circuit-2" />
      </div>

      <style jsx>{`
        .space-particles {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          overflow: hidden;
        }

        /* ─── Cyan Star layers ─── */
        .sp-layer {
          position: absolute;
          border-radius: 50%;
          background: transparent;
        }

        .sp-layer-1 {
          width: 2px; height: 2px;
          animation: sp-twinkle 4s ease-in-out infinite alternate;
          box-shadow:
            120px 80px 0 0 rgba(0, 212, 255, 0.4),
            340px 150px 0 0 rgba(0, 212, 255, 0.25),
            560px 220px 0 0 rgba(103, 232, 249, 0.5),
            790px 90px 0 0 rgba(0, 212, 255, 0.35),
            980px 310px 0 0 rgba(103, 232, 249, 0.4),
            1150px 180px 0 0 rgba(0, 212, 255, 0.25),
            200px 400px 0 0 rgba(245, 158, 11, 0.3),
            450px 520px 0 0 rgba(0, 212, 255, 0.5),
            680px 450px 0 0 rgba(245, 158, 11, 0.25),
            900px 550px 0 0 rgba(0, 212, 255, 0.4),
            150px 650px 0 0 rgba(103, 232, 249, 0.35),
            380px 720px 0 0 rgba(0, 212, 255, 0.25),
            620px 680px 0 0 rgba(245, 158, 11, 0.4),
            850px 750px 0 0 rgba(0, 212, 255, 0.35),
            1050px 620px 0 0 rgba(103, 232, 249, 0.5);
        }

        .sp-layer-2 {
          width: 3px; height: 3px;
          animation: sp-twinkle 6s ease-in-out 2s infinite alternate;
          box-shadow:
            80px 200px 0 0 rgba(0, 212, 255, 0.3),
            320px 350px 0 0 rgba(245, 158, 11, 0.25),
            540px 120px 0 0 rgba(0, 212, 255, 0.35),
            760px 480px 0 0 rgba(103, 232, 249, 0.25),
            950px 200px 0 0 rgba(0, 212, 255, 0.3),
            1100px 400px 0 0 rgba(245, 158, 11, 0.2),
            260px 580px 0 0 rgba(0, 212, 255, 0.35),
            490px 700px 0 0 rgba(103, 232, 249, 0.25),
            730px 600px 0 0 rgba(0, 212, 255, 0.3),
            170px 300px 0 0 rgba(245, 158, 11, 0.3);
        }

        .sp-layer-3 {
          width: 1px; height: 1px;
          animation: sp-twinkle 3s ease-in-out 1s infinite alternate;
          box-shadow:
            40px 30px 0 0 rgba(0, 212, 255, 0.2),
            180px 260px 0 0 rgba(103, 232, 249, 0.15),
            400px 60px 0 0 rgba(0, 212, 255, 0.3),
            630px 340px 0 0 rgba(245, 158, 11, 0.15),
            820px 160px 0 0 rgba(0, 212, 255, 0.2),
            1000px 500px 0 0 rgba(103, 232, 249, 0.15),
            280px 480px 0 0 rgba(0, 212, 255, 0.2),
            510px 620px 0 0 rgba(245, 158, 11, 0.25),
            750px 530px 0 0 rgba(0, 212, 255, 0.15),
            950px 700px 0 0 rgba(103, 232, 249, 0.2);
        }

        /* ─── Grid highlight pulses ─── */
        .sp-grid-pulse {
          position: absolute;
          width: 200px;
          height: 200px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(0, 212, 255, 0.06) 0%, transparent 70%);
          pointer-events: none;
        }
        .sp-grid-pulse-1 {
          top: 20%;
          right: 15%;
          animation: sp-pulse-drift 12s ease-in-out infinite alternate;
        }
        .sp-grid-pulse-2 {
          bottom: 30%;
          left: 20%;
          animation: sp-pulse-drift 15s ease-in-out 3s infinite alternate-reverse;
        }

        /* ─── Floating hexagons ─── */
        .sp-hex {
          position: absolute;
          width: 30px;
          height: 30px;
          border: 1px solid rgba(0, 212, 255, 0.12);
          transform: rotate(45deg);
          border-radius: 4px;
        }
        .sp-hex-1 {
          top: 15%;
          left: 8%;
          animation: sp-float-hex 8s ease-in-out infinite, sp-twinkle 6s ease-in-out infinite alternate;
        }
        .sp-hex-2 {
          top: 60%;
          right: 12%;
          width: 20px;
          height: 20px;
          border-color: rgba(245, 158, 11, 0.1);
          animation: sp-float-hex 10s ease-in-out 2s infinite, sp-twinkle 8s ease-in-out 1s infinite alternate;
        }
        .sp-hex-3 {
          bottom: 25%;
          left: 45%;
          width: 24px;
          height: 24px;
          border-color: rgba(0, 212, 255, 0.08);
          animation: sp-float-hex 12s ease-in-out 4s infinite, sp-twinkle 7s ease-in-out 2s infinite alternate;
        }

        /* ─── Circuit lines ─── */
        .sp-circuit {
          position: absolute;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(0, 212, 255, 0.1), rgba(0, 212, 255, 0.15), transparent);
          pointer-events: none;
        }
        .sp-circuit-1 {
          top: 35%;
          left: 0;
          right: 0;
          animation: sp-circuit-scan 20s linear infinite;
        }
        .sp-circuit-2 {
          top: 70%;
          left: 0;
          right: 0;
          animation: sp-circuit-scan 25s linear 8s infinite;
          opacity: 0.5;
        }

        @keyframes sp-twinkle {
          0% { opacity: 0.3; }
          50% { opacity: 1; }
          100% { opacity: 0.4; }
        }

        @keyframes sp-pulse-drift {
          0% { transform: translate(0, 0) scale(1); opacity: 0.5; }
          50% { opacity: 0.8; }
          100% { transform: translate(40px, -30px) scale(1.2); opacity: 0.4; }
        }

        @keyframes sp-float-hex {
          0%, 100% { transform: rotate(45deg) translateY(0); }
          50% { transform: rotate(45deg) translateY(-15px); }
        }

        @keyframes sp-circuit-scan {
          0% { clip-path: inset(0 100% 0 0); }
          40% { clip-path: inset(0 0 0 0); }
          60% { clip-path: inset(0 0 0 0); }
          100% { clip-path: inset(0 0 0 100%); }
        }
      `}</style>
    </>
  );
}
