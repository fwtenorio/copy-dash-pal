import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Settings, RefreshCw, Pause } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface IntegrationCardProps {
  id: string;
  name: string;
  icon: string;
  connected: boolean;
  status?: 'active' | 'paused' | null;
  bgClass: string;
  textClass: string;
  comingSoon?: boolean;
  hasSettings?: boolean;
  onOpenSettings: () => void;
  onToggle?: (status: 'active' | 'paused') => void;
  onDisconnect?: () => void;
}

export function IntegrationCard({
  name,
  icon,
  connected,
  status = null,
  bgClass,
  textClass,
  comingSoon,
  hasSettings,
  onOpenSettings,
  onToggle,
  onDisconnect,
}: IntegrationCardProps) {
  const { t } = useTranslation();

  const isActive = connected && status === 'active';
  const isPaused = connected && status === 'paused';

  const handleSwitchChange = (checked: boolean) => {
    if (checked && !connected) {
      // Ativando quando desconectado: abrir modal
      onOpenSettings();
    } else if (checked && isPaused) {
      // Ligando o switch quando pausado: reativar
      onToggle?.('active');
    } else if (!checked && isActive) {
      // Desligando o switch quando ativo: pausar a integração
      onToggle?.('paused');
    }
  };

  return (
    <div className="rounded-xl border border-[#DEDEDE] overflow-hidden">
      {/* Upper Section - Gray Background */}
      <div className="bg-[#F9F9F9] p-2 space-y-3">
        <div className="flex items-start justify-between">
          {/* <div className={`flex items-center justify-center w-12 h-12 rounded-lg text-xl ${bgClass}`}> */}
          <div className={`flex items-center justify-center w-12 h-12 rounded-lg text-xl`}>
            {/* <span className={textClass}>{icon}</span> */}
            <img
              key={`integration-icon-${name}`}
              src={icon}
              alt={`${name} integration icon`}
              className="h-10 w-10 object-center"
              loading="eager"
              fetchPriority="high"
            />
          </div>
          {(hasSettings || comingSoon) && (
            <div className="flex items-center gap-2">
              {comingSoon && (
                <Badge variant="secondary" className="text-xs font-normal">
                  {t("integrations.comingSoon")}
                </Badge>
              )}
              {hasSettings && connected && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-transparent hover:text-[#6B7280]"
                  onClick={onOpenSettings}
                >
                  <Settings className="h-5 w-5" />
                </Button>
              )}
            </div>
          )}
        </div>
        <h3 className="font-medium text-base text-[#1A1A1A] ml-2">{name}</h3>
      </div>

      {/* Lower Section - White Background */}
      <div className="bg-white p-3">
        {connected ? (
          <div className="flex items-center justify-between">
            {isActive ? (
              <div className="flex items-center gap-2 text-sm text-[#1B966C] px-3 py-1.5 rounded-md border border-[#1B966C] bg-[#1B966C]/5">
                <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M10 3L4.5 8.5L2 6"
                    stroke="#1B966C"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Active
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-[#6B7280] px-3 py-1.5 rounded-md border border-[#6B7280] bg-[#6B7280]/5">
                <Pause className="h-3 w-3" />
                Paused
              </div>
            )}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Switch
                      checked={isActive}
                      onCheckedChange={handleSwitchChange}
                      className="data-[state=checked]:bg-[#1B966C] data-[state=unchecked]:bg-[#6B7280] cursor-pointer"
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isActive ? "Pause integration" : "Resume integration"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <button
              className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-md border border-[#DEDEDE] ${
                comingSoon
                  ? "text-muted-foreground cursor-not-allowed"
                  : "text-muted-foreground cursor-pointer hover:text-[#1B966C]"
              }`}
              onClick={() => !comingSoon && onOpenSettings()}
              disabled={comingSoon}
            >
              <RefreshCw className="h-3 w-3" />
              {t("integrations.connect")}
            </button>
            <Switch
              checked={false}
              disabled={comingSoon}
              onCheckedChange={!comingSoon ? handleSwitchChange : undefined}
              className="border border-[#E5E7EB] data-[state=unchecked]:bg-[#c4c4c4] [&>span]:bg-white [&>span]:border [&>span]:border-[#E5E7EB] [&>span]:shadow-sm cursor-pointer disabled:cursor-not-allowed"
            />
          </div>
        )}
      </div>
    </div>
  );
}
