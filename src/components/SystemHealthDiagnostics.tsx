import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Activity, Info, Link as LinkIcon, Shield, ChevronDown, ChevronUp } from "lucide-react";
import { AISphere } from "./AISphere";
import { ParticleNetwork } from "./ParticleNetwork";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { useIntegrationStatus } from "@/hooks/useIntegrationStatus";
import { Link } from "react-router-dom";

const clampValue = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

type WaveConfig = {
  baseY: number;
  amplitude: number;
  frequency: number;
  speed: number;
  stroke: string;
  strokeWidth: number;
  opacity: number;
};

const WAVE_WIDTH = 1200;
const WAVE_SEGMENTS = 18;
const WAVE_PHASES = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2, Math.PI * 2];

const generateWavePath = (config: WaveConfig, phase: number) => {
  const { baseY, amplitude, frequency } = config;
  const step = WAVE_WIDTH / WAVE_SEGMENTS;
  const points: string[] = [];

  for (let i = 0; i <= WAVE_SEGMENTS; i++) {
    const x = i * step;
    const angle = (i / WAVE_SEGMENTS) * Math.PI * 2 * frequency + phase;
    const y = baseY + Math.sin(angle) * amplitude;
    points.push(`${x},${y}`);
  }

  return `M0,${baseY} ${points.map((point) => `L${point}`).join(" ")}`;
};

const waveConfigs: WaveConfig[] = [
  { baseY: 300, amplitude: 12, frequency: 1.4, speed: 16, stroke: "url(#waveGradientStatic)", strokeWidth: 2, opacity: 0.9 },
  { baseY: 320, amplitude: 14, frequency: 1.2, speed: 18, stroke: "#059669", strokeWidth: 1.5, opacity: 0.8 },
  { baseY: 280, amplitude: 10, frequency: 1.8, speed: 14, stroke: "#34d399", strokeWidth: 1.5, opacity: 0.6 },
  { baseY: 300, amplitude: 16, frequency: 1, speed: 20, stroke: "#10b981", strokeWidth: 2.5, opacity: 0.45 },
  { baseY: 150, amplitude: 12, frequency: 1.6, speed: 22, stroke: "#059669", strokeWidth: 1.8, opacity: 0.5 },
  { baseY: 450, amplitude: 12, frequency: 1.4, speed: 24, stroke: "#34d399", strokeWidth: 1.8, opacity: 0.5 },
];

const waveKeyframes = waveConfigs.map((wave) => WAVE_PHASES.map((phase) => generateWavePath(wave, phase)));

const calculateHealthScore = (chargebackRate: number) => {
  const safeRate = Number.isFinite(chargebackRate) ? chargebackRate : 0;

  // Curva por faixas para responder diretamente à Chargeback Rate:
  // 0% a 0.5%  -> queda leve (100 → 70)
  // 0.5% a 1%  -> queda moderada (70 → 35)
  // 1% a 2%    -> queda acentuada (35 → 5)
  // 2% a 2.5%+ -> aproxima de 0
  let score: number;
  if (safeRate <= 0.5) {
    score = 100 - safeRate * 60; // -30 pontos aos 0.5%
  } else if (safeRate <= 1) {
    score = 70 - (safeRate - 0.5) * 70; // -35 pontos entre 0.5% e 1%
  } else if (safeRate <= 2) {
    score = 35 - (safeRate - 1) * 30; // -30 pontos entre 1% e 2%
  } else {
    score = 5 - (safeRate - 2) * 10; // vai a 0 perto de 2.5%
  }

  return Math.round(clampValue(score, 0, 100));
};

const GAUGE_CENTER_X = 100;
const GAUGE_CENTER_Y = 90;
const GAUGE_RADIUS = 78;
const GAUGE_ARC_START = -90;
const GAUGE_ARC_SWEEP = 180;
const GAUGE_SEGMENTS = 30;
const GAUGE_BAR_WIDTH = 2;
const GAUGE_BAR_HEIGHT = 14;
const INACTIVE_BAR_COLOR = "#F9F9F9";
const SUSPENSION_COLOR = "#F43E31";
const DANGER_RED = "#FF3B30";
const COLLAPSE_STORAGE_KEY = "aiSystemMonitorCollapsed";

const buildGaugeSegments = (activeRatio: number) => {
  const step = GAUGE_SEGMENTS > 1 ? GAUGE_ARC_SWEEP / (GAUGE_SEGMENTS - 1) : 0;
  const activeCount = Math.round(clampValue(activeRatio, 0, 1) * GAUGE_SEGMENTS);

  return Array.from({ length: GAUGE_SEGMENTS }, (_, index) => {
    const angle = GAUGE_ARC_START + index * step;
    const isActive = index < activeCount;
    return { angle, isActive };
  });
};

// Componente do Medidor de Pressão
const PressureGauge = ({
  healthScore,
  chargebackRate,
}: {
  healthScore: number;
  chargebackRate: number;
}) => {
  const [animatedScore, setAnimatedScore] = useState(0);
  const [animatedChargeback, setAnimatedChargeback] = useState(0);

  useEffect(() => {
    const scoreInterval = setInterval(() => {
      setAnimatedScore((prev) => {
        if (prev < healthScore) return Math.min(prev + 1, healthScore);
        if (prev > healthScore) return Math.max(prev - 1, healthScore);
        return prev;
      });
    }, 20);

    const chargebackInterval = setInterval(() => {
      setAnimatedChargeback((prev) => {
        const diff = Math.abs(prev - chargebackRate);
        const step = diff > 1 ? 0.1 : 0.01;
        if (prev < chargebackRate) return Math.min(prev + step, chargebackRate);
        if (prev > chargebackRate) return Math.max(prev - step, chargebackRate);
        return prev;
      });
    }, 50);

    return () => {
      clearInterval(scoreInterval);
      clearInterval(chargebackInterval);
    };
  }, [healthScore, chargebackRate]);

  const getScoreColor = (score: number) => {
    if (score >= 70) return "#1ca276"; // verde padrão solicitado
    if (score >= 40) return "#f7b307"; // âmbar brilhante
    return "#EF4444"; // vermelho crítico atualizado
  };

  const getChargebackColor = (rate: number) => {
    if (rate <= 0.5) return "#1ca276"; // Healthy padrão solicitado
    if (rate < 1.0) return "#f7b307"; // Attention
    if (rate < 2.0) return "#EF4444"; // Critical atualizado
    return SUSPENSION_COLOR; // Risk of Suspension unificado
  };

  const scoreColor = getScoreColor(animatedScore);
  const chargebackColor = getChargebackColor(animatedChargeback);
  const isSuspension = animatedChargeback >= 2;
  const effectiveScoreColor = isSuspension ? DANGER_RED : scoreColor;
  const dangerColor = isSuspension ? SUSPENSION_COLOR : chargebackColor;
  const chargebackDisplay = `${animatedChargeback.toFixed(2)}%`;
  const needleAngle = isSuspension ? -90 : -90 + (animatedScore / 100) * 180;
  const gaugeActiveRatio = isSuspension ? 1 : animatedScore / 100;
  const gaugeSegments = buildGaugeSegments(gaugeActiveRatio);
  const OUTLIER_CAP = 2;
  const normalizedChargeback = Math.max(0, animatedChargeback);
  const isOutlier = normalizedChargeback > OUTLIER_CAP;
  const barFill = Math.min(normalizedChargeback, OUTLIER_CAP) / OUTLIER_CAP;

  return (
    <div className="flex flex-col items-center space-y-6">
      {/* Medidor Principal */}
      <div
        className="relative w-64 h-40"
        style={{ transform: "translateY(-18px)" }}
      >
        <svg viewBox="0 0 200 100" className="w-full h-full">
          <defs>
            <filter id="dangerGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <g filter={isSuspension ? "url(#dangerGlow)" : undefined}>
            {gaugeSegments.map((segment, index) => (
              <rect
                key={segment.angle}
                x={GAUGE_CENTER_X - GAUGE_BAR_WIDTH / 2}
                y={GAUGE_CENTER_Y - GAUGE_RADIUS - GAUGE_BAR_HEIGHT / 2}
                width={GAUGE_BAR_WIDTH}
                height={GAUGE_BAR_HEIGHT}
                rx={2}
                ry={2}
                fill={segment.isActive ? effectiveScoreColor : INACTIVE_BAR_COLOR}
                transform={`rotate(${segment.angle} ${GAUGE_CENTER_X} ${GAUGE_CENTER_Y})`}
              />
            ))}
          </g>

          <line
            x1={GAUGE_CENTER_X}
            y1={GAUGE_CENTER_Y}
            x2={GAUGE_CENTER_X}
            y2={GAUGE_CENTER_Y - 60}
            stroke={effectiveScoreColor}
            strokeWidth="3"
            strokeLinecap="round"
            style={{
              transformOrigin: `${GAUGE_CENTER_X}px ${GAUGE_CENTER_Y}px`,
              transform: `rotate(${needleAngle}deg)`,
              transition: "transform 0.3s ease-out"
            }}
          />
          
          <circle
            cx={GAUGE_CENTER_X}
            cy={GAUGE_CENTER_Y}
            r="6"
            fill={effectiveScoreColor}
          />
        </svg>
        
        <div
          className="absolute left-1/2 transform -translate-x-1/2 text-center pb-0"
          style={{ bottom: 0 }}
        >
          <motion.div
            key={animatedScore}
            initial={{ scale: 1.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1, y: -30 }}
            className="text-3xl font-bold font-mono"
            style={{ color: effectiveScoreColor }}
          >
            {Math.round(animatedScore)}
          </motion.div>
          <div
            className="text-xs text-white tracking-wider font-semibold"
            style={{ marginTop: 8 }}
          >
            Health Score
          </div>
        </div>
      </div>

      {/* Mini Medidor - Chargeback Rate */}
      <div className="w-full px-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-white">Chargeback Rate</span>
          </div>
          <motion.span
            key={chargebackDisplay}
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            className="text-lg font-mono font-bold"
            style={{ color: dangerColor }}
          >
            {chargebackDisplay}
          </motion.span>
        </div>
        
        <div
          className="relative h-2 bg-slate-800 rounded-full border border-slate-700"
          style={{
            overflow: isSuspension ? "visible" : "hidden",
            boxShadow: isSuspension ? "0 0 20px #FF3B3040, 0 0 50px #FF3B301f" : undefined
          }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{
              backgroundColor: dangerColor,
              boxShadow: isSuspension
                ? `0 0 18px ${SUSPENSION_COLOR}, 0 0 36px ${SUSPENSION_COLOR}99`
                : `0 0 8px ${chargebackColor}40`,
              left: isSuspension ? "-7%" : undefined,
              position: isSuspension ? "absolute" : "relative",
              transform: isSuspension ? "translateY(-1px)" : undefined
            }}
            initial={{ width: 0 }}
            animate={{ width: isSuspension ? "115%" : `${barFill * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        <div className="flex justify-between mt-1 text-xs">
          <span style={isSuspension ? { color: "#94a3b8", opacity: 0.45, filter: "grayscale(1)" } : undefined}>
            0%
          </span>
          <span
            className="text-emerald-500"
            style={isSuspension ? { color: "#94a3b8", opacity: 0.45, filter: "grayscale(1)" } : undefined}
          >
            0.5%
          </span>
          <span
            className="text-amber-500"
            style={isSuspension ? { color: "#94a3b8", opacity: 0.45, filter: "grayscale(1)" } : undefined}
          >
            1%
          </span>
          <span style={isSuspension ? { color: SUSPENSION_COLOR } : undefined}>2%+</span>
        </div>
      </div>

    </div>
  );
};

const getChargebackStatus = (rate: number) => {
  if (!Number.isFinite(rate)) return { label: "–", color: "text-slate-400" };
  if (rate <= 0.5) return { label: "Healthy", color: "text-[#1ca276]" };
  if (rate < 1.0) return { label: "Warning", color: "text-amber-400" };
  if (rate < 2.0) return { label: "Critical", color: "text-[#EF4444]" };
  return { label: "Risk of Suspension", color: `text-[${SUSPENSION_COLOR}]` };
};

const getChargebackStatusColorValue = (rate: number) => {
  if (!Number.isFinite(rate)) return "#94a3b8"; // slate-400
  if (rate <= 0.5) return "#1ca276"; // verde padrão solicitado
  if (rate < 1.0) return "#f7b307"; // âmbar brilhante
  if (rate < 2.0) return "#EF4444"; // vermelho crítico atualizado
  return SUSPENSION_COLOR; // cor unificada para suspensão
};

type SystemHealthDiagnosticsProps = {
  chargebackRate?: number;
};

// Componente Principal
export const SystemHealthDiagnostics = ({ chargebackRate: externalChargebackRate }: SystemHealthDiagnosticsProps) => {
  const { hasIntegration, isLoading } = useIntegrationStatus();
  const [currentMessage, setCurrentMessage] = useState(0);
  const [isPulsing, setIsPulsing] = useState(false);
  const [healthScore, setHealthScore] = useState(98);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const hasExternalChargebackRate = Number.isFinite(externalChargebackRate);
  const externalChargebackRateValue = hasExternalChargebackRate ? Number(externalChargebackRate) : undefined;
  const [chargebackRate, setChargebackRate] = useState(externalChargebackRateValue ?? 0.65);
  const [fadeIn, setFadeIn] = useState(true);
  const chargebackStatus = getChargebackStatus(chargebackRate);
  const chargebackStatusColor = getChargebackStatusColorValue(chargebackRate);
  const isChargebackCritical = Number.isFinite(chargebackRate) && chargebackRate >= 1;

  const diagnosticMessages = [
    "Scanning transaction logs for anomalies...",
    "Monitoring real-time gateway status...",
    "Detecting fraud patterns...",
    "Verifying IP integrity and Proxy nodes...",
    "Synchronizing with Gateway API...",
    "Cross-referencing Billing vs. Shipping Geolocation...",
    "Validating customer device fingerprint...",
    "Compiling customer transaction history...",
    "Tracking confirmed. Attaching Proof of Delivery...",
    "Analyzing transaction digital signature...",
    "Calculating win probability: 98.2%...",
    "Encrypting dispute defense payload..."
  ];

  useEffect(() => {
    // Só alterna mensagens se houver integração conectada
    if (!hasIntegration) return;

    const messageInterval = setInterval(() => {
      setFadeIn(false);
      
      setTimeout(() => {
        // Seleciona um índice aleatório diferente do atual
        let newIndex;
        do {
          newIndex = Math.floor(Math.random() * diagnosticMessages.length);
        } while (newIndex === currentMessage && diagnosticMessages.length > 1);
        
        setCurrentMessage(newIndex);
        setFadeIn(true);
        setIsPulsing(true);
        setTimeout(() => setIsPulsing(false), 800);
      }, 300);
    }, 5000);

    return () => clearInterval(messageInterval);
  }, [currentMessage, diagnosticMessages.length, hasIntegration]);

  useEffect(() => {
    if (externalChargebackRateValue === undefined) return;
    setChargebackRate(externalChargebackRateValue);
  }, [externalChargebackRateValue]);

  useEffect(() => {
    setHealthScore(calculateHealthScore(chargebackRate));
  }, [chargebackRate]);

  useEffect(() => {
    const dataInterval = setInterval(() => {
      if (externalChargebackRateValue === undefined) {
        setChargebackRate((prev) => {
          const change = (Math.random() - 0.5) * 0.2;
          return Math.max(0.3, Math.min(1.5, prev + change));
        });
      }
    }, 5000);

    return () => clearInterval(dataInterval);
  }, [externalChargebackRateValue]);

  useEffect(() => {
    const stored = localStorage.getItem(COLLAPSE_STORAGE_KEY);
    if (stored !== null) {
      setIsCollapsed(stored === "true");
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(COLLAPSE_STORAGE_KEY, String(isCollapsed));
  }, [isCollapsed]);

  const toggleCollapsed = () => setIsCollapsed((prev) => !prev);
  const expandIfCollapsed = () => {
    if (isCollapsed) setIsCollapsed(false);
  };
  const handleKeyExpand: React.KeyboardEventHandler<HTMLDivElement> = (event) => {
    if (!isCollapsed) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setIsCollapsed(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative w-full"
    >
      <Card className="shadow-none transition-shadow border-border bg-transparent p-2">
        <CardHeader className="pb-3 p-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 border border-[#E5E7EB] rounded-lg bg-white">
                <Activity className="h-5 w-5 text-[#9CA3AF]" />
              </div>
              <div className="flex items-center gap-2">
                <h2 className="text-[15px] font-medium text-[#1A1A1A]">AI System Monitor</h2>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex items-center cursor-help">
                        <Info className="h-3 w-3 text-muted-foreground" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <p>Real-time monitoring of system health metrics and AI diagnostic analysis</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
            <button
              type="button"
              onClick={toggleCollapsed}
              className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors"
              aria-label={isCollapsed ? "Expand AI System Monitor" : "Collapse AI System Monitor"}
            >
              {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </button>
          </div>
        </CardHeader>
        <CardContent
          className="p-0 pt-[5px]"
          role="button"
          tabIndex={isCollapsed ? 0 : -1}
          onClick={expandIfCollapsed}
          onKeyDown={handleKeyExpand}
        >
          <motion.div
            layout
            animate={{ height: isCollapsed ? 64 : "auto", opacity: 1 }}
            transition={{ duration: 0.45, ease: "easeInOut" }}
            className="relative rounded-lg border overflow-hidden transition-all duration-500 ease-in-out"
            style={{
              backgroundColor: "#1A1A1A",
              borderColor: "#2A2A2A",
            }}
          >
            {/* Camadas de fundo já montadas (preloading) */}
            <ParticleNetwork />
            <div
              className="absolute inset-0 pointer-events-none transition-all duration-500 ease-in-out"
              style={{
                opacity: isCollapsed ? 0.16 : 0.07,
                transform: isCollapsed ? "scaleY(0.24)" : "scaleY(1)",
                transformOrigin: "top center",
              }}
            >
              <motion.svg
                className="w-full h-full"
                viewBox="0 0 1200 600"
                preserveAspectRatio="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <linearGradient id="waveGradientStatic" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="50%" stopColor="#059669" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                  <mask id="fadeMaskStatic">
                    <linearGradient id="fadeGradientHStatic" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="white" stopOpacity="0.1" />
                      <stop offset="10%" stopColor="white" stopOpacity="1" />
                      <stop offset="90%" stopColor="white" stopOpacity="1" />
                      <stop offset="100%" stopColor="white" stopOpacity="0.1" />
                    </linearGradient>
                    <linearGradient id="fadeGradientVStatic" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="white" stopOpacity="0.1" />
                      <stop offset="15%" stopColor="white" stopOpacity="1" />
                      <stop offset="85%" stopColor="white" stopOpacity="1" />
                      <stop offset="100%" stopColor="white" stopOpacity="0.1" />
                    </linearGradient>
                    <rect x="0" y="0" width="1200" height="600" fill="url(#fadeGradientHStatic)" />
                    <rect x="0" y="0" width="1200" height="600" fill="url(#fadeGradientVStatic)" opacity="0.3" />
                  </mask>
                </defs>
                <g mask="url(#fadeMaskStatic)" strokeLinecap="round">
                  {waveConfigs.map((wave, idx) => {
                    const keyframes = waveKeyframes[idx];

                    return (
                      <motion.path
                        key={idx}
                        d={keyframes[0]}
                        fill="none"
                        stroke={wave.stroke}
                        strokeWidth={wave.strokeWidth}
                        opacity={wave.opacity}
                        animate={{ d: keyframes }}
                        transition={{
                          duration: wave.speed,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                      />
                    );
                  })}
                </g>
              </motion.svg>
            </div>

            {/* Estado colapsado (sobreposto) */}
            <div
              className={`absolute inset-x-0 top-0 z-20 flex items-center justify-between px-6 h-[60px] transition-opacity duration-300 ${
                isCollapsed ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}
            >
              <div className="flex items-center gap-2 text-sm text-white">
                <div className="relative">
                  <div
                    className="w-2 h-2 rounded-full animate-pulse"
                    style={{ backgroundColor: hasIntegration ? "#10b981" : "#DF9720" }}
                  />
                  <div
                    className="absolute inset-0 w-2 h-2 rounded-full animate-ping"
                    style={{ backgroundColor: hasIntegration ? "#10b981" : "#DF9720" }}
                  />
                </div>
                <span className="font-medium">
                  {hasIntegration ? (
                    <>
                      <span style={{ color: "#ffffff" }}>System Status: </span>
                      <span style={{ color: "#31CA94" }}>Active Monitoring</span>
                    </>
                  ) : (
                    <>
                      <span style={{ color: "#ffffff" }}>System Standby: </span>
                      <span style={{ color: "#DF9720" }}>Awaiting Data Stream...</span>
                    </>
                  )}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm font-semibold">
                <div className="relative">
                  <div
                    className="w-2 h-2 rounded-full animate-pulse"
                    style={{ backgroundColor: chargebackStatusColor }}
                  />
                  <div
                    className="absolute inset-0 w-2 h-2 rounded-full animate-ping"
                    style={{ backgroundColor: chargebackStatusColor }}
                  />
                </div>
                <span>
                  <span style={{ color: "#ffffff" }}>Current Health: </span>
                  <span style={{ color: chargebackStatusColor }}>{chargebackStatus.label || "Risk of Suspension"}</span>
                </span>
              </div>
            </div>

            {/* Conteúdo expandido permanece montado e entra/saí junto */}
            <div
              className={`relative grid grid-cols-1 md:grid-cols-2 gap-8 p-8 items-start transition-all duration-500 ease-in-out ${
                isCollapsed ? "opacity-0 pointer-events-none max-h-0" : "opacity-100 max-h-[1600px]"
              }`}
              style={{ overflow: "hidden" }}
            >
              {/* Seção Esquerda - AI Diagnostic Orb */}
              <div className="flex flex-col items-center justify-start space-y-6 w-full h-full">
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <Shield className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-[12px] font-bold text-white uppercase tracking-wider">
                      CHARGEMIND AI SHIELD
                    </h3>
                  </div>
                  <div className="h-px w-32 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent mx-auto" />
                </div>

                <AISphere isPulsing={isPulsing} size={154} />

                <div className="text-center min-h-[60px] flex items-center justify-center">
                  {!hasIntegration ? (
                    <Link
                      to="/integracoes"
                      className="group text-sm text-slate-400 font-mono px-6 py-3 bg-slate-800/80 rounded-lg border border-slate-600/30 backdrop-blur-sm hover:border-emerald-500/50 hover:text-slate-300 transition-all duration-300 flex items-center gap-2"
                    >
                      <span>Integration required. Connect Store API to activate...</span>
                      <LinkIcon className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  ) : (
                    <p
                      className="text-[12px] text-white font-mono px-6 py-3 bg-slate-800/80 rounded-lg border border-emerald-500/30 backdrop-blur-sm transition-opacity duration-300"
                      style={{
                        opacity: fadeIn ? 1 : 0,
                      }}
                    >
                      <span className="inline-block mr-2 animate-pulse text-emerald-400">▸</span>
                      {diagnosticMessages[currentMessage]}
                    </p>
                  )}
                </div>

                <div
                  className="flex items-center space-x-2 mt-auto"
                  style={{ transform: "translateY(10px)" }}
                >
                  <div className="relative">
                    <div
                      className="w-3 h-3 rounded-full animate-pulse"
                      style={{ backgroundColor: hasIntegration ? "#10b981" : "#DF9720" }}
                    />
                    <div
                      className="absolute inset-0 w-3 h-3 rounded-full animate-ping"
                      style={{ backgroundColor: hasIntegration ? "#10b981" : "#DF9720" }}
                    />
                  </div>
                  <span
                    className="text-xs font-mono uppercase tracking-wider font-semibold"
                    style={{ color: hasIntegration ? "#34d399" : "#DF9720" }}
                  >
                    {hasIntegration ? "Active Monitoring" : "System Standby: Awaiting Data Stream..."}
                  </span>
                </div>
              </div>

              <div className="hidden md:block absolute left-1/2 top-8 bottom-8 w-px bg-gradient-to-b from-transparent via-slate-700 to-transparent" />

              {/* Seção Direita - Pressure Gauge */}
              <div className="flex flex-col items-center justify-start space-y-6 w-full h-full">
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-[12px] font-bold text-white uppercase tracking-wider">
                      Account Health
                    </h3>
                  </div>
                  <div className="h-px w-32 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent mx-auto" />
                </div>

                <PressureGauge healthScore={healthScore} chargebackRate={chargebackRate} />

                <div className="flex flex-col items-center space-y-2 mt-auto">
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <div
                        className="w-3 h-3 rounded-full animate-pulse"
                        style={{ backgroundColor: chargebackStatusColor }}
                      />
                      <div
                        className="absolute inset-0 w-3 h-3 rounded-full animate-ping"
                        style={{ backgroundColor: chargebackStatusColor }}
                      />
                    </div>
                    <span
                      className="text-xs font-mono uppercase tracking-wider font-semibold"
                      style={{ color: chargebackStatusColor }}
                    >
                      {chargebackStatus.label}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute inset-0 rounded-lg pointer-events-none">
              <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-emerald-900/15 via-cyan-900/15 to-emerald-900/15 opacity-25 blur-sm animate-pulse" />
            </div>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
