import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Bell, ChevronDown, LogOut } from "lucide-react";
import { DateRangePicker } from "./DateRangePicker";
import { DateRange } from "react-day-picker";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { NotificationsModal } from "./NotificationsModal";

type DashboardHeaderProps = {
  onDateRangeChange?: (range: DateRange | undefined) => void;
};

export function DashboardHeader({ onDateRangeChange }: DashboardHeaderProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);

  const changeLanguage = async (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem("language", lng);

    // Save language preference to database
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("clients").update({ language: lng }).eq("id", user.id);
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Erro ao sair",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Logout realizado",
        description: "Até logo!",
      });
      navigate("/auth");
    }
  };

  const handleNotificationsRead = () => {
    setHasUnread(false);
  };

  return (
    <>
      <header className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-foreground flex items-center gap-2">{t("header.welcome")} 👋</h2>
            <p className="text-sm text-muted-foreground mt-1">{t("header.subtitle")}</p>
          </div>
          <div className="flex items-center gap-4">
            {/* Language Dropdown */}
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-1 text-sm">
                  {t("header.language")}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-card">
                <DropdownMenuItem
                  onClick={() => changeLanguage("en")}
                  className="cursor-pointer focus:bg-[#1B966C] focus:text-white"
                >
                  English
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => changeLanguage("pt")}
                  className="cursor-pointer focus:bg-[#1B966C] focus:text-white"
                >
                  Português
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Notification Bell */}
            <NotificationsModal
              open={notificationsOpen}
              onOpenChange={setNotificationsOpen}
              onNotificationsRead={handleNotificationsRead}
            >
              <Button
                variant="ghost"
                size="icon"
                className="relative"
              >
                <Bell className="h-5 w-5" />
                {hasUnread && (
                  <div className="absolute top-1 right-1 h-2 w-2 bg-destructive rounded-full" />
                )}
              </Button>
            </NotificationsModal>

            {/* User Profile Dropdown */}
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 pl-1 pr-2">
                  <Avatar className="h-8 w-8 bg-primary">
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">E</AvatarFallback>
                  </Avatar>
                  <span className="text-sm">Elevora</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-card">
                <DropdownMenuItem onClick={() => navigate("/configuracoes")}>
                  {t("sidebar.settings") || "Settings"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  {i18n.language === "pt" ? "Sair" : "Log out"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

    </>
  );
}
