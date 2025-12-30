import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Download, Heart, X, LucideIcon } from "lucide-react";
import { ReactNode } from "react";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";

interface ChartCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
  badge?: ReactNode;
  badgeDesc?: string;
  icon?: LucideIcon;
  className?: string;
}

export function ChartCard({
  title,
  description,
  children,
  actions,
  badge,
  badgeDesc,
  icon: Icon,
  className,
}: ChartCardProps) { 
  return (
    <Card className={`p-2 ${className || ""}`}>
      <CardHeader className="p-0 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              {Icon && (
                <div className="p-2 border border-[#E5E7EB] rounded-lg bg-white">
                  <Icon className="h-5 w-5 text-[#9CA3AF]" />
                </div>
              )}
              <div>
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
                {description && (
                  <CardDescription className="text-[13px] font-normal mt-1 text-muted-foreground">
                    {description}
                  </CardDescription>
                )}
              </div>
            </div>
          </div>
          {actions}
        </div>
      </CardHeader>
      <CardContent className="p-0">{children}</CardContent>
    </Card>
  );
}
