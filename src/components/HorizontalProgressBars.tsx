import React, { useState } from "react";

const PROGRESS_BAR_COLORS = [
  "#53A697", // Teal Médio
  "#8AA5A1", // Visa
  "#6DC485", // Verde Claro
  "#525252", // Cinza Chumbo
  "#60BBB1", // Ciano/Aqua
];

interface ProgressBarItem {
  name: string;
  amount?: number;
  count?: number;
}

interface HorizontalProgressBarsProps {
  data: ProgressBarItem[];
  mode: "value" | "count";
  emptyMessage?: React.ReactNode;
}

export function HorizontalProgressBars({
  data,
  mode,
  emptyMessage = "No data to display",
}: HorizontalProgressBarsProps) {
  const [hoveredItem, setHoveredItem] = useState<{ name: string; value: number; color: string; clientX: number; clientY: number } | null>(null);

  const safeData = (data || []).map((d) => ({
    ...d,
    amount: Number(d.amount || 0),
    count: Number(d.count || 0),
  }));

  const metricKey = mode === "value" ? "amount" : "count";
  const maxValue = Math.max(...safeData.map((item) => item[metricKey] || 0), 1);

  if (safeData.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[300px] p-6 rounded-lg border border-[#EFEFF0] bg-white">
        {typeof emptyMessage === "string" ? (
          <p className="text-sm text-muted-foreground text-center">
            <i>{emptyMessage}</i>
          </p>
        ) : (
          emptyMessage
        )}
      </div>
    );
  }

  return (
    <div className="p-6 rounded-lg border border-[#EFEFF0] bg-white min-h-[300px] relative">
      <div className="space-y-5">
        {safeData.map((item, index) => {
          const value = item[metricKey] || 0;
          const percentage = (value / maxValue) * 100;
          const barColor = PROGRESS_BAR_COLORS[index % PROGRESS_BAR_COLORS.length];
          const showValueInside = percentage > 15;

          const formattedValue =
            mode === "value"
              ? `$${value.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`
              : value.toString();

          return (
            <div key={index} className="flex items-center gap-4">
              {/* Label */}
              <div className="w-[180px] flex-shrink-0">
                <span className="font-normal text-[#1F2937]" style={{ fontSize: '14px' }}>{item.name}</span>
              </div>

              {/* Progress bar container */}
              <div className="flex-1 relative">
                <div 
                  className="w-full h-9 bg-[#F3F4F6] rounded-md overflow-hidden cursor-pointer"
                  onMouseEnter={(e) => {
                    setHoveredItem({
                      name: item.name,
                      value,
                      color: barColor,
                      clientX: e.clientX,
                      clientY: e.clientY,
                    });
                  }}
                  onMouseMove={(e) => {
                    setHoveredItem((prev) => prev ? {
                      ...prev,
                      clientX: e.clientX,
                      clientY: e.clientY,
                    } : null);
                  }}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  <div
                    className="h-full rounded-md flex items-center transition-all duration-300"
                    style={{
                      width: `${Math.max(percentage, 2)}%`,
                      backgroundColor: barColor,
                    }}
                  >
                    {showValueInside && (
                      <span className="font-normal text-white px-3 whitespace-nowrap" style={{ fontSize: '14px' }}>
                        {formattedValue}
                      </span>
                    )}
                  </div>
                </div>

                {/* Value outside bar when percentage is small */}
                {!showValueInside && (
                  <span
                    className="absolute top-1/2 -translate-y-1/2 font-normal text-[#1F2937] whitespace-nowrap"
                    style={{
                      left: `calc(${Math.max(percentage, 2)}% + 8px)`,
                      fontSize: '14px',
                    }}
                  >
                    {formattedValue}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Tooltip */}
      {hoveredItem && (
        <div 
          className="fixed bg-white border border-[#E5E7EB] rounded-lg shadow-md p-3 min-w-[160px] pointer-events-none z-50"
          style={{
            left: hoveredItem.clientX + 15,
            top: hoveredItem.clientY - 20,
          }}
        >
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-4 rounded-sm" style={{ backgroundColor: hoveredItem.color }} />
            <span className="text-[#1F2937] text-sm">
              {hoveredItem.name}:{" "}
              <span className="font-bold">
                {mode === "value"
                  ? `$${hoveredItem.value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : hoveredItem.value}
              </span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
