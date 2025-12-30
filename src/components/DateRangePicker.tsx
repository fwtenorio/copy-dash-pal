import * as React from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, ChevronDown } from "lucide-react";
import { format, subDays, subMonths, startOfYear, endOfYear } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";
import { useTranslation } from "react-i18next";

type PresetOption = {
  label: string;
  getValue: () => DateRange;
};

const presetOptions: PresetOption[] = [
  {
    label: "Hoje",
    getValue: () => ({ from: new Date(), to: new Date() }),
  },
  {
    label: "Ontem",
    getValue: () => {
      const yesterday = subDays(new Date(), 1);
      return { from: yesterday, to: yesterday };
    },
  },
  {
    label: "Últimos 7 dias",
    getValue: () => ({ from: subDays(new Date(), 7), to: new Date() }),
  },
  {
    label: "Últimos 30 dias",
    getValue: () => ({ from: subDays(new Date(), 30), to: new Date() }),
  },
  {
    label: "Últimos 90 dias",
    getValue: () => ({ from: subDays(new Date(), 90), to: new Date() }),
  },
  {
    label: "Últimos 6 meses",
    getValue: () => ({ from: subMonths(new Date(), 6), to: new Date() }),
  },
  {
    label: "Últimos 12 meses",
    getValue: () => ({ from: subMonths(new Date(), 12), to: new Date() }),
  },
  {
    label: "Personalizado",
    getValue: () => ({ from: undefined, to: undefined }),
  },
];

type DateRangePickerProps = {
  onDateRangeChange?: (range: DateRange | undefined) => void;
};

export function DateRangePicker({ onDateRangeChange }: DateRangePickerProps) {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = React.useState(false);
  const locale = i18n.language === 'pt' ? ptBR : enUS;
  
  // Carregar do localStorage ou usar valor padrão
  const [selectedPreset, setSelectedPreset] = React.useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dateRangePreset');
      return saved || "Últimos 6 meses";
    }
    return "Últimos 6 meses";
  });
  
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dateRangeValue');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          from: parsed.from ? new Date(parsed.from) : undefined,
          to: parsed.to ? new Date(parsed.to) : undefined,
        };
      }
    }
    return presetOptions[5].getValue();
  });
  
  const [tempDateRange, setTempDateRange] = React.useState<DateRange | undefined>(dateRange);
  const [currentMonth, setCurrentMonth] = React.useState<Date>(new Date());

  const handlePresetClick = (preset: PresetOption) => {
    setSelectedPreset(preset.label);
    const range = preset.getValue();
    setTempDateRange(range);
    if (preset.label !== "Personalizado" && range.from) {
      setCurrentMonth(range.from);
    }
  };

  const handleCalendarSelect = (range: DateRange | undefined) => {
    setTempDateRange(range);
    setSelectedPreset("Personalizado");
  };

  const handleApply = () => {
    setDateRange(tempDateRange);
    onDateRangeChange?.(tempDateRange);
    
    // Salvar no localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('dateRangePreset', selectedPreset);
      localStorage.setItem('dateRangeValue', JSON.stringify({
        from: tempDateRange?.from?.toISOString(),
        to: tempDateRange?.to?.toISOString(),
      }));
    }
    
    setOpen(false);
  };

  const handleCancel = () => {
    setTempDateRange(dateRange);
    setOpen(false);
  };

  const formatDateRange = () => {
    if (!dateRange?.from) return "";
    if (!dateRange.to) {
      return format(dateRange.from, "MMM d", { locale });
    }
    return `${format(dateRange.from, "MMM d", { locale })} to ${format(dateRange.to, "MMM d", { locale })}`;
  };

  const getPresetLabel = () => {
    if (selectedPreset === "Últimos 6 meses") return i18n.language === 'pt' ? "Últimos 6 meses" : "Last 6 Months";
    if (selectedPreset === "Últimos 12 meses") return i18n.language === 'pt' ? "Últimos 12 meses" : "Last 12 Months";
    if (selectedPreset === "Últimos 30 dias") return i18n.language === 'pt' ? "Últimos 30 dias" : "Last 30 Days";
    if (selectedPreset === "Últimos 7 dias") return i18n.language === 'pt' ? "Últimos 7 dias" : "Last 7 Days";
    if (selectedPreset === "Últimos 90 dias") return i18n.language === 'pt' ? "Últimos 90 dias" : "Last 90 Days";
    if (selectedPreset === "Hoje") return i18n.language === 'pt' ? "Hoje" : "Today";
    if (selectedPreset === "Ontem") return i18n.language === 'pt' ? "Ontem" : "Yesterday";
    if (selectedPreset === "Personalizado") return i18n.language === 'pt' ? "Personalizado" : "Custom";
    return selectedPreset;
  };

  const secondMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);

  return (
    <div className="flex items-center gap-4">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            className="bg-white border-[#E5E7EB] text-[#374151] hover:bg-white hover:text-[#374151] hover:border-[#E5E7EB] rounded-lg px-4 py-2 h-auto font-normal"
          >
            <CalendarIcon className="h-5 w-5 text-[#9CA3AF] mr-2" />
            <span>{getPresetLabel()}</span>
            <ChevronDown className="h-4 w-4 text-[#9CA3AF] ml-2" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex">
            {/* Preset options sidebar */}
            <div className="border-r border-border p-2 w-48">
              <div className="space-y-1">
                {presetOptions.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => handlePresetClick(preset)}
                    className={cn(
                      "w-full text-left px-3 py-2 text-sm rounded-md transition-colors",
                      selectedPreset === preset.label
                        ? "bg-[#18976fff] text-white"
                        : "hover:bg-[#18976f1a]"
                    )}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Calendar section */}
            <div className="p-4">
              <div className="flex gap-4">
                <Calendar
                  mode="range"
                  selected={tempDateRange}
                  onSelect={handleCalendarSelect}
                  month={currentMonth}
                  onMonthChange={setCurrentMonth}
                  numberOfMonths={2}
                  className="pointer-events-auto"
                />
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-border">
                <Button variant="ghost" onClick={handleCancel} className="hover:bg-[#FAFAFA] hover:text-[#0F5132] focus-visible:ring-[#18976f]">
                  Cancelar
                </Button>
                <Button onClick={handleApply} className="bg-[#18976f] hover:bg-[#0F5132] hover:text-[#FAFAFA] focus-visible:ring-[#18976f]">Aplicar</Button>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <span className="text-[#374151] text-sm font-normal">{formatDateRange()}</span>
    </div>
  );
}
