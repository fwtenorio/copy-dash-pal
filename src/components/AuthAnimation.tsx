import { useEffect, useState, useRef } from "react";
import { Bell, Shield, Sparkles } from "lucide-react";
import GATEWAY_ICONS from "@/config/integrationIcons";

// Size categories for depth effect
const ICON_SIZES = {
  small: [24, 28, 32],
  medium: [36, 40, 44],
  large: [48, 52, 56],
};

interface OrbitingIcon {
  id: number;
  angle: number;
  radius: number;
  icon: string;
  size: number;
  opacity: number;
  phase: "fadeIn" | "visible" | "fadeOut";
  createdAt: number;
  lifetime: number;
  speed: number;
}

const createOrbitingIcon = (id: number, usedIcons: string[]): OrbitingIcon => {
  const sizeCategory = Math.random() < 0.3 ? "small" : Math.random() < 0.7 ? "medium" : "large";
  const sizes = ICON_SIZES[sizeCategory];
  const size = sizes[Math.floor(Math.random() * sizes.length)];
  
  // Get available icons that aren't currently in use
  const availableIcons = GATEWAY_ICONS.filter(icon => !usedIcons.includes(icon));
  const iconPool = availableIcons.length > 0 ? availableIcons : GATEWAY_ICONS;
  const icon = iconPool[Math.floor(Math.random() * iconPool.length)];
  
  return {
    id,
    angle: Math.random() * 360,
    radius: 110 + Math.random() * 140,
    icon,
    size,
    opacity: 0,
    phase: "fadeIn",
    createdAt: Date.now(),
    lifetime: 5000 + Math.random() * 5000, // 5-10 seconds
    speed: 0.2 + Math.random() * 0.4, // Variable orbit speed
  };
};

const AuthAnimation = () => {
  const [rotation, setRotation] = useState(0);
  const [visibleCards, setVisibleCards] = useState<number[]>([]);
  const [orbitingIcons, setOrbitingIcons] = useState<OrbitingIcon[]>([]);
  const nextIconId = useRef(0);

  // Initialize orbiting icons
  useEffect(() => {
    const initialIcons: OrbitingIcon[] = [];
    const usedIcons: string[] = [];
    for (let i = 0; i < 8; i++) {
      const icon = createOrbitingIcon(nextIconId.current++, usedIcons);
      icon.createdAt = Date.now() - Math.random() * icon.lifetime * 0.5;
      usedIcons.push(icon.icon);
      initialIcons.push(icon);
    }
    setOrbitingIcons(initialIcons);
  }, []);

  // Orbiting icons lifecycle management
  useEffect(() => {
    const interval = setInterval(() => {
      setOrbitingIcons((prevIcons) => {
        const now = Date.now();
        let updatedIcons = prevIcons.map((icon) => {
          const age = now - icon.createdAt;
          const fadeInDuration = 1000;
          const fadeOutStart = icon.lifetime - 1000;

          if (age < fadeInDuration) {
            return { ...icon, phase: "fadeIn" as const, opacity: (age / fadeInDuration) * 0.35 };
          } else if (age > fadeOutStart) {
            const fadeOutProgress = (age - fadeOutStart) / 1000;
            return { ...icon, phase: "fadeOut" as const, opacity: Math.max(0, 0.35 * (1 - fadeOutProgress)) };
          } else {
            return { ...icon, phase: "visible" as const, opacity: 0.35 };
          }
        });

        // Remove fully faded icons and spawn new ones
        const aliveIcons = updatedIcons.filter((d) => d.opacity > 0 || d.phase === "fadeIn");
        const usedIcons = aliveIcons.map(i => i.icon);
        
        // Maintain around 6-8 icons
        while (aliveIcons.length < 6) {
          aliveIcons.push(createOrbitingIcon(nextIconId.current++, usedIcons));
        }

        return aliveIcons;
      });
    }, 50);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setRotation((prev) => (prev + 0.3) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Sequential card appearance animation
  useEffect(() => {
    const delays = [0, 1500, 3000]; // 0s, 1.5s, 3s
    const timeouts: NodeJS.Timeout[] = [];

    delays.forEach((delay, index) => {
      const timeout = setTimeout(() => {
        setVisibleCards((prev) => [...prev, index]);
      }, delay);
      timeouts.push(timeout);
    });

    return () => timeouts.forEach(clearTimeout);
  }, []);

  const cards = [
    {
      angle: 0,
      radius: 200,
      type: "prevention",
      icon: "shield",
      accentColor: "#19976F",
      gradientBorder: "linear-gradient(135deg, #38CC93, #19976F, #097754)",
      label: "Chargeback Prevented",
      description: "Auto-refunded via RDR",
      badge: "Saved $15.00",
      badgeBg: "rgba(25, 151, 111, 0.1)",
    },
    {
      angle: 120,
      radius: 200,
      type: "combat",
      icon: "sparkles",
      accentColor: "#8B5CF6",
      gradientBorder: "linear-gradient(135deg, #A855F7, #8B5CF6, #6D28D9)",
      label: "Evidence Submitted",
      description: "AI Win Probability: High",
      badge: "93% confidence",
      badgeBg: "rgba(139, 92, 246, 0.1)",
    },
    {
      angle: 240,
      radius: 200,
      type: "alert",
      icon: "bell",
      accentColor: "#F97316",
      gradientBorder: "linear-gradient(135deg, #FB923C, #F97316, #EA580C)",
      label: "Risk Detected",
      description: "AI Monitoring Active",
      badge: "Under Analysis",
      badgeBg: "rgba(249, 115, 22, 0.1)",
    },
  ];

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {/* Pulsing sonar circles */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={`pulse-${i}`}
            className="absolute rounded-full border-2 border-white/30"
            style={{
              width: "100px",
              height: "100px",
              animation: `radar-pulse 4s ease-out infinite`,
              animationDelay: `${i * 1}s`,
            }}
          />
        ))}
      </div>

      {/* Static concentric circles with subtle glow */}
      <div className="absolute inset-0 flex items-center justify-center">
        {[100, 150, 200, 250].map((radius, i) => (
          <div
            key={i}
            className="absolute rounded-full border border-dashed border-white/20"
            style={{
              width: `${radius * 2}px`,
              height: `${radius * 2}px`,
              boxShadow: "0 0 10px rgba(56, 204, 147, 0.1)",
            }}
          />
        ))}
      </div>

      {/* Sonar grid pattern - full background coverage */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Radial circles expanding from center */}
        <div className="absolute inset-0 flex items-center justify-center">
          {[80, 160, 240, 320, 400, 500, 620, 760, 920].map((radius, i) => (
            <div
              key={`grid-circle-${i}`}
              className="absolute rounded-full"
              style={{
                width: `${radius}px`,
                height: `${radius}px`,
                border: "1px solid rgba(56, 204, 147, 0.1)",
              }}
            />
          ))}
        </div>
        {/* Vertical grid lines */}
        {[-40, -20, 0, 20, 40].map((offset, i) => (
          <div
            key={`v-line-${i}`}
            className="absolute h-full"
            style={{
              width: "1px",
              left: `calc(50% + ${offset}%)`,
              background: "rgba(56, 204, 147, 0.08)",
            }}
          />
        ))}
        {/* Horizontal grid lines */}
        {[-40, -20, 0, 20, 40].map((offset, i) => (
          <div
            key={`h-line-${i}`}
            className="absolute w-full"
            style={{
              height: "1px",
              top: `calc(50% + ${offset}%)`,
              background: "rgba(56, 204, 147, 0.08)",
            }}
          />
        ))}
        {/* Diagonal lines */}
        <div
          className="absolute"
          style={{
            width: "1px",
            height: "200%",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%) rotate(45deg)",
            background: "rgba(56, 204, 147, 0.06)",
          }}
        />
        <div
          className="absolute"
          style={{
            width: "1px",
            height: "200%",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%) rotate(-45deg)",
            background: "rgba(56, 204, 147, 0.06)",
          }}
        />
      </div>

      {/* Radar sweep beam - below central sphere */}
      <div
        className="absolute pointer-events-none z-0"
        style={{
          width: "500px",
          height: "500px",
          left: "50%",
          transform: "translate(-50%, -50%)",
          animation: "radar-sweep 3s linear infinite",
        }}
      >
        {/* The beam line - starts from exact center */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: "2px",
            height: "250px",
            transform: "translateX(-50%) translateY(-100%)",
            background: "linear-gradient(to top, rgba(56, 204, 147, 0.8), rgba(56, 204, 147, 0.3), transparent)",
            boxShadow: "0 0 20px rgba(56, 204, 147, 0.5), 0 0 40px rgba(56, 204, 147, 0.3)",
          }}
        />
        {/* Sweep trail/cone effect - trails behind the beam */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: "250px",
            height: "250px",
            transform: "translate(-50%, -50%)",
            background:
              "conic-gradient(from -45deg, transparent 0deg, rgba(56, 204, 147, 0.15) 25deg, transparent 45deg)",
            borderRadius: "50%",
          }}
        />
      </div>

      {/* Futuristic central sphere - above radar sweep */}
      <div className="absolute flex items-center justify-center z-10">
        {/* Outer rotating ring */}
        <div
          className="absolute w-32 h-32 rounded-full"
          style={{
            border: "2px solid transparent",
            borderTopColor: "rgba(56, 204, 147, 0.8)",
            borderRightColor: "rgba(56, 204, 147, 0.4)",
            animation: "ring-rotate 4s linear infinite",
            boxShadow: "0 0 20px rgba(56, 204, 147, 0.3)",
          }}
        />

        {/* Inner rotating ring (reverse) */}
        <div
          className="absolute w-28 h-28 rounded-full"
          style={{
            border: "1px solid transparent",
            borderTopColor: "rgba(255, 255, 255, 0.5)",
            borderBottomColor: "rgba(255, 255, 255, 0.3)",
            animation: "ring-rotate-reverse 3s linear infinite",
          }}
        />

        {/* Glow effect container */}
        <div
          className="absolute w-24 h-24 rounded-full"
          style={{
            animation: "glow-pulse 3s ease-in-out infinite",
          }}
        />

        {/* 3D Sphere with realistic lighting */}
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center relative"
          style={{
            background: "linear-gradient(180deg, #ffffff 0%, #f3f6fa 60%, #e6eef6 100%)",
            transformStyle: "preserve-3d",
            boxShadow: `
              inset 0 -6px 14px rgba(0,0,0,0.06),
              inset 0 6px 14px rgba(255,255,255,0.9),
              0 0 30px rgba(56,204,147,0.25),
              0 8px 20px rgba(56,204,147,0.15)
            `,
            animation: "sphere-pulse 3s ease-in-out infinite",
            willChange: "transform, box-shadow",
          }}
        >
          {/* Specular highlight for curvature */}
          <div
            className="absolute rounded-full pointer-events-none"
            style={{
              width: "70%",
              height: "70%",
              left: "12%",
              top: "6%",
              background:
                "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.6) 10%, rgba(255,255,255,0.15) 30%, transparent 60%)",
              mixBlendMode: "screen",
            }}
          />
          {/* Shadow under sphere for depth */}
          <div
            className="absolute rounded-full pointer-events-none"
            style={{
              left: "8%",
              top: "68%",
              width: "84%",
              height: "16%",
              background:
                "radial-gradient(ellipse at center, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.02) 60%, transparent 100%)",
              filter: "blur(6px)",
              transform: "translateZ(-1px)",
            }}
          />
          <img
            src="/logo_branco_mini.png"
            alt="Logo"
            className="w-10 h-10 relative z-10"
            style={{ transform: "translateZ(20px)" }}
          />
        </div>
      </div>

      {/* Orbiting notification cards */}
      {cards.map(
        ({ angle, radius, type, icon, accentColor, gradientBorder, label, description, badge, badgeBg }, i) => {
          const currentAngle = (rotation + angle) * (Math.PI / 180);
          const x = Math.cos(currentAngle) * radius;
          const y = Math.sin(currentAngle) * radius;

          const IconComponent = icon === "shield" ? Shield : icon === "sparkles" ? Sparkles : Bell;

          const isVisible = visibleCards.includes(i);

          return (
            <div
              key={i}
              className="absolute rounded-xl shadow-xl p-[1px] min-w-[200px] transition-all duration-500 ease-out z-[15]"
              style={{
                transform: `translate(${x}px, ${y}px) ${isVisible ? "scale(1)" : "scale(0.8)"}`,
                background: gradientBorder,
                boxShadow: `0 8px 32px rgba(0, 0, 0, 0.12), 0 0 20px ${accentColor}33`,
                opacity: isVisible ? 1 : 0,
              }}
            >
              <div className="bg-white rounded-[10px] pl-[13px] pr-[10px] py-[10px] relative overflow-hidden">
                {/* Subtle background glow */}
                <div
                  className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-20 blur-2xl"
                  style={{ background: accentColor }}
                />

                {/* Header with icon and label */}
                <div className="flex items-center justify-between mb-2 relative z-10">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded-md flex items-center justify-center"
                      style={{ backgroundColor: badgeBg }}
                    >
                      <IconComponent className="w-3.5 h-3.5" style={{ color: accentColor }} />
                    </div>
                    <span className="text-xs font-semibold" style={{ color: accentColor }}>
                      {label}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-700 font-medium mb-2 relative z-10">{description}</p>

                {/* Badge */}
                <div
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium relative z-10"
                  style={{ backgroundColor: badgeBg, color: accentColor }}
                >
                  {badge}
                </div>
              </div>
            </div>
          );
        },
      )}

      {/* Orbiting payment gateway icons - always below cards (z-index: 5) */}
      {orbitingIcons.map(({ id, angle, radius, icon, size, opacity, speed }) => {
        const currentAngle = (rotation * speed + angle) * (Math.PI / 180);
        const x = Math.cos(currentAngle) * radius;
        const y = Math.sin(currentAngle) * radius;

        return (
          <div
            key={`gateway-${id}`}
            className="absolute flex items-center justify-center z-[5]"
            style={{
              width: `${size}px`,
              height: `${size}px`,
              transform: `translate(${x}px, ${y}px) scale(${0.7 + (opacity / 0.35) * 0.3})`,
              opacity,
              transition: "opacity 0.5s ease-out, transform 0.5s ease-out",
              filter: "grayscale(100%) brightness(1.2)",
            }}
          >
            <img
              src={icon}
              alt="Payment Gateway"
              className="w-full h-full object-contain"
              style={{ filter: "drop-shadow(0 2px 4px rgba(255,255,255,0.3))" }}
            />
          </div>
        );
      })}
    </div>
  );
};

export default AuthAnimation;
