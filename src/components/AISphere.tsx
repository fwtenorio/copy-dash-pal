import { motion } from "framer-motion";

interface AISphereProps {
  isPulsing?: boolean;
  size?: number;
}
 
export const AISphere = ({ isPulsing = false, size = 200 }: AISphereProps) => {
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Container principal com float */}
      <motion.div
        className="relative"
        style={{ width: size, height: size }}
        animate={{
          y: [0, -8, 0],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          repeatType: "loop",
          ease: "easeInOut",
        }}
      >
        {/* Linhas radiais de fundo */}
        <div className="absolute inset-0 overflow-hidden rounded-full opacity-10">
          {[...Array(24)].map((_, i) => {
            const rotation = (i * 360) / 24;
            return (
              <motion.div
                key={`radial-${i}`}
                className="absolute left-1/2 top-1/2 origin-top"
                style={{
                  width: "1px",
                  height: "50%",
                  background: "linear-gradient(to bottom, rgba(5, 150, 105, 0.3), transparent)",
                  transform: `rotate(${rotation}deg) translateX(-50%)`,
                }}
                animate={{
                  opacity: [0.1, 0.3, 0.1],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: i * 0.1,
                  ease: "easeInOut",
                }}
              />
            );
          })}
        </div>

        {/* Glow externo - Camada 1 (Verde vibrante) */}
        <motion.div
          className="absolute inset-[-15%] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(52, 211, 153, 0.2) 0%, rgba(5, 150, 105, 0.15) 30%, rgba(16, 185, 129, 0.1) 50%, transparent 75%)",
            filter: "blur(20px)",
          }}
          animate={{
            scale: [1, 1.05, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            repeatType: "loop",
            ease: "easeInOut",
          }}
        />

        {/* Glow externo - Camada 2 (Pulso de pensamento) */}
        <motion.div
          className="absolute inset-[-12%] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(167, 243, 208, 0.15) 0%, rgba(52, 211, 153, 0.1) 25%, rgba(5, 150, 105, 0.05) 50%, transparent 70%)",
            filter: "blur(18px)",
          }}
          animate={{
            scale: [0.98, 1.08, 0.98],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 1.8,
            repeat: Infinity,
            repeatType: "loop",
            ease: [0.4, 0.0, 0.2, 1],
          }}
        />

        {/* Glow externo - Camada 3 (Energia neural) */}
        <motion.div
          className="absolute inset-[-18%] rounded-full"
          style={{
            background: "radial-gradient(circle, transparent 0%, rgba(5, 150, 105, 0.12) 20%, rgba(4, 120, 87, 0.08) 40%, transparent 65%)",
            filter: "blur(25px)",
          }}
          animate={{
            scale: [1, 1.03, 1],
            opacity: [0.2, 0.35, 0.2],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            repeatType: "loop",
            ease: "linear",
          }}
        />

        {/* Anel orbital externo - Verde (segmentado) */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            border: "3px solid transparent",
            borderTopColor: "#a7f3d0",
            borderRightColor: "#a7f3d0",
            boxShadow: "0 0 20px rgba(167, 243, 208, 0.6)",
          }}
          animate={{
            rotate: [0, 360],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "linear",
          }}
        />

        {/* Anel orbital externo - Cyan (segmentado, oposto) */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            border: "3px solid transparent",
            borderBottomColor: "#06b6d4",
            borderLeftColor: "#06b6d4",
            boxShadow: "0 0 20px rgba(6, 182, 212, 0.6)",
          }}
          animate={{
            rotate: [0, -360],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "linear",
          }}
        />

        {/* Anel orbital médio - Verde */}
        <motion.div
          className="absolute inset-[10%] rounded-full"
          style={{
            border: "2.5px solid transparent",
            borderTopColor: "#34d399",
            borderLeftColor: "#34d399",
            boxShadow: "0 0 15px rgba(52, 211, 153, 0.7)",
          }}
          animate={{
            rotate: [0, -360],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "linear",
          }}
        />

        {/* Anel orbital médio - Cyan (oposto) */}
        <motion.div
          className="absolute inset-[10%] rounded-full"
          style={{
            border: "2.5px solid transparent",
            borderBottomColor: "#22d3ee",
            borderRightColor: "#22d3ee",
            boxShadow: "0 0 15px rgba(34, 211, 238, 0.7)",
          }}
          animate={{
            rotate: [0, 360],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "linear",
          }}
        />

        {/* Círculo interno base (mais amplo) */}
        <div
          className="absolute inset-[14%] rounded-full"
          style={{
            background: "radial-gradient(circle at 40% 40%, rgba(6, 78, 59, 0.9), rgba(17, 24, 39, 0.95))",
            border: "1px solid rgba(5, 150, 105, 0.3)",
            boxShadow: "0 0 30px rgba(5, 150, 105, 0.4), inset 0 0 30px rgba(6, 182, 212, 0.2)",
          }}
        />

        {/* Cérebro AI - Lado esquerdo (cerebral/orgânico) */}
        <motion.div
          className="absolute left-[28%] top-[28%] w-[22%] h-[44%] rounded-l-full overflow-hidden"
          style={{
            background: "linear-gradient(to right, rgba(5, 150, 105, 0.4), transparent)",
            clipPath: "polygon(0 0, 100% 10%, 100% 90%, 0 100%)",
          }}
          animate={{
            opacity: [0.6, 0.9, 0.6],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {/* Linhas cerebrais esquerdas */}
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={`left-${i}`}
              className="absolute left-0 w-full"
              style={{
                top: `${20 + i * 12}%`,
                height: "2px",
                background: "rgba(5, 150, 105, 0.8)",
                borderRadius: "2px",
              }}
              animate={{
                scaleX: [0.8, 1, 0.8],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut",
              }}
            />
          ))}
        </motion.div>

        {/* Cérebro AI - Lado direito (tecnológico/circuito) */}
        <motion.div
          className="absolute right-[28%] top-[28%] w-[22%] h-[44%] rounded-r-full overflow-hidden"
          style={{
            background: "linear-gradient(to left, rgba(6, 182, 212, 0.4), transparent)",
            clipPath: "polygon(0 10%, 100% 0, 100% 100%, 0 90%)",
          }}
          animate={{
            opacity: [0.6, 0.9, 0.6],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5,
          }}
        >
          {/* Linhas de circuito direitas */}
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={`right-${i}`}
              className="absolute right-0 w-full"
              style={{
                top: `${20 + i * 12}%`,
                height: "2px",
                background: "rgba(6, 182, 212, 0.8)",
                borderRadius: "2px",
              }}
              animate={{
                scaleX: [0.8, 1, 0.8],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2 + 0.5,
                ease: "easeInOut",
              }}
            />
          ))}
        </motion.div>

        {/* Linha central divisória */}
        <motion.div
          className="absolute left-1/2 top-[28%] w-[1px] h-[44%]"
          style={{
            background: "linear-gradient(to bottom, transparent, rgba(255, 255, 255, 0.8), transparent)",
            transform: "translateX(-50%)",
          }}
          animate={{
            opacity: [0.4, 0.9, 0.4],
            scaleY: [0.95, 1.05, 0.95],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Núcleo central brilhante (maior e pulsante) */}
        <motion.div
          className="absolute left-[39%] top-[39%] w-[22%] h-[22%] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(167, 243, 208, 1), rgba(52, 211, 153, 0.8), rgba(6, 182, 212, 0.6))",
            boxShadow: "0 0 20px rgba(52, 211, 153, 1), 0 0 40px rgba(6, 182, 212, 0.6)",
          }}
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.9, 1, 0.9],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Logo central com cor personalizada */}
        <div
          className="absolute left-1/2 top-1/2 w-6 h-6"
          aria-label="Logo central"
          style={{
            transform: "translate(-50%, -50%)",
            backgroundColor: "#0E4143",
            WebkitMaskImage: "url('/logo_branco_mini.png')", 
            maskImage: "url('/logo_branco_mini.png')",
            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",
            WebkitMaskPosition: "center",
            maskPosition: "center",
            WebkitMaskSize: "contain",
            maskSize: "contain",
            filter: "drop-shadow(0 0 6px rgba(26, 32, 34, 0.45))",
          }}
        />

        {/* Partículas de conexão neural */}
        {[...Array(8)].map((_, i) => {
          const angle = (i * Math.PI * 2) / 8;
          const radius = size * 0.25;
          return (
            <motion.div
              key={`particle-${i}`}
              className="absolute rounded-full"
              style={{
                width: 3,
                height: 3,
                background: i % 2 === 0 ? "rgba(5, 150, 105, 1)" : "rgba(6, 182, 212, 1)",
                boxShadow: `0 0 6px ${i % 2 === 0 ? "rgba(5, 150, 105, 1)" : "rgba(6, 182, 212, 1)"}`,
                left: "50%",
                top: "50%",
              }}
              animate={{
                x: [
                  Math.cos(angle) * radius * 0.8,
                  Math.cos(angle) * radius * 1.2,
                  Math.cos(angle) * radius * 0.8,
                ],
                y: [
                  Math.sin(angle) * radius * 0.8,
                  Math.sin(angle) * radius * 1.2,
                  Math.sin(angle) * radius * 0.8,
                ],
                opacity: [0.3, 1, 0.3],
                scale: [0.8, 1.2, 0.8],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: i * 0.3,
                ease: "easeInOut",
              }}
            />
          );
        })}
      </motion.div>

      
    </div>
  );
};
