import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";
import { TrendResult } from "@/hooks/useTrendCalculation";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";

interface MetricCardProps {
  title: string;
  icon: LucideIcon;
  iconColor?: string;
  subtitle: string;
  value: string | number | ReactNode;
  valueLabel: string;
  amount: string;
  badge?: ReactNode;
  badgeDesc?: string;
  trend?: TrendResult;
  isEmpty?: boolean;
  emptyMessage?: string;
  emptyImageSrc?: string;
}

export function MetricCard({
  title,
  icon: Icon,
  iconColor = "text-muted-foreground",
  subtitle,
  value,
  valueLabel,
  amount,
  badge,
  badgeDesc,
  trend,
  isEmpty = false,
  emptyMessage = "No disputes were recorded in the selected period.",
  emptyImageSrc = "/graph_empty.svg",
}: MetricCardProps) {
  const trendClasses = {
    positive: {
      text: "text-[#059669]",
      bg: "bg-[#ECFDF5]",
    },
    negative: {
      text: "text-[#DC2626]",
      bg: "bg-[#FEF2F2]",
    },
    neutral: {
      text: "text-[#6B7280]",
      bg: "bg-[#F3F4F6]",
    },
  };

  const badgeStyles = trend ? trendClasses[trend.color] : trendClasses.neutral;

  return (
    <Card className="hover:shadow-md transition-shadow border-border bg-[#F9F9F9] p-2">
      <CardHeader className="pb-3 p-0">
        <div className="flex items-center gap-3">
          <div className="p-2 border border-[#E5E7EB] rounded-lg bg-white">
            <Icon className={`h-5 w-5 text-[#9CA3AF] ${iconColor}`} />
          </div>
          <div className="flex items-center gap-2">
            <CardTitle className="text-[15px] font-medium text-[#1A1A1A]">{title}</CardTitle>
            {badge && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex items-center cursor-help">{badge}</span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p>{badgeDesc}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 pt-[5px]">
        {isEmpty ? (
          <div className="bg-white rounded-lg border border-[#EFEFF0] p-5 min-h-[160px] flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-center text-sm text-muted-foreground">
              <img
                src={emptyImageSrc}
                alt={emptyMessage}
                className="max-w-[45%] h-auto w-auto"
              />
              <span className="text-[#6B7280]">{emptyMessage}</span>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-[#EFEFF0] p-5 space-y-4">
            <div className="space-y-1">
              <div className="text-[13px] font-normal text-[#6B7280]">{subtitle}</div>
              <div className="flex items-center gap-3">
                <div className="text-[20px] font-semibold text-[#1A1A1A]">{value}</div>
                {trend && (
                  <div
                    className={`flex items-center gap-1.5 text-[10px] font-medium px-2.5 py-1 rounded-full ${badgeStyles.bg} ${badgeStyles.text}`}
                  >
                    <trend.icon className="h-3.5 w-3.5" />
                    {trend.value}
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-[#6B7280]">{valueLabel}</div>
              <div className="text-[20px] font-semibold text-[#1A1A1A]">{amount}</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
