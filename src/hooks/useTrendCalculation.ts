import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

type TrendType = "positive_is_good" | "negative_is_good";

type TrendColor = "positive" | "negative" | "neutral";

export type TrendResult = {
  value: string;
  color: TrendColor;
  icon: typeof ArrowUpRight;
};

type CalculateTrendParams = {
  currentValue: number | string | null | undefined;
  previousValue: number | string | null | undefined;
  type: TrendType;
  neutralOnDecrease?: boolean;
};

const toNumber = (value: number | string | null | undefined): number => {
  if (value === null || value === undefined) return Number.NaN;
  if (typeof value === "number") return Number.isFinite(value) ? value : Number.NaN;
  if (typeof value === "string") {
    const cleaned = value.replace(/[^\d.-]/g, "");
    const parsed = parseFloat(cleaned);
    return Number.isFinite(parsed) ? parsed : Number.NaN;
  }
  return Number.NaN;
};

const formatValue = (value: number) => {
  const formatted = Math.abs(value) < 10 ? value.toFixed(2) : value.toFixed(1);
  return `${value >= 0 ? "+" : ""}${formatted}%`;
};

export const useTrendCalculation = () => {
  const calculateTrend = ({
    currentValue,
    previousValue,
    type,
    neutralOnDecrease = false,
  }: CalculateTrendParams): TrendResult => {
    const current = toNumber(currentValue);
    const previous = toNumber(previousValue);

    if (!Number.isFinite(current) || !Number.isFinite(previous)) {
      return { value: "—", color: "neutral", icon: Minus };
    }

    const zeroGuardIncrease = previous === 0 && current > 0;
    const zeroGuardNoChange = previous === 0 && current === 0;

    const rawChange = zeroGuardIncrease
      ? 100
      : zeroGuardNoChange
        ? 0
        : ((current - previous) / (previous || 1)) * 100;

    const isIncrease = current >= previous;

    let color: TrendColor = "neutral";
    if (rawChange !== 0) {
      const goodDirection = type === "positive_is_good" ? isIncrease : !isIncrease;
      if (!goodDirection && neutralOnDecrease && isIncrease === false) {
        color = "neutral";
      } else {
        color = goodDirection ? "positive" : "negative";
      }
    }

    const icon =
      rawChange === 0 ? Minus : isIncrease ? ArrowUpRight : ArrowDownRight;

    return {
      value: formatValue(rawChange),
      color,
      icon,
    };
  };

  return { calculateTrend };
};



