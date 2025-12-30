import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Bell, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { NotificationsModal } from "./NotificationsModal";
import { useUserData } from "@/hooks/useUserData";

interface PageHeaderProps {
  title: string;
  subtitle: string;
}

export function PageHeader({ title, subtitle }: PageHeaderProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { userName, storeName, email } = useUserData();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate("/auth");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      toast.error(i18n.language === "pt" ? "Erro ao sair" : "Logout error");
    }
  };

  const displayUserName =
    (userName && userName.trim()) ||
    (storeName && storeName.trim()) ||
    (email && email.split("@")[0]) ||
    "Usuário";

  const handleLanguageChange = async (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem("language", lang);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: currentUser } = await supabase.from("users").select("client_id").eq("id", user.id).single();

        if (currentUser?.client_id) {
          await supabase.from("clients").update({ language: lang }).eq("id", currentUser.client_id);
        }
      }
    } catch (error) {
      console.error("Erro ao salvar preferência de idioma:", error);
    }
  };

  const handleNotificationsRead = () => {
    setHasUnread(false);
  };

  return (
    <>
      <div className="-mx-6 lg:-mx-8 px-6 lg:px-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-white pb-6 relative after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-screen after:h-px after:bg-[#E9E9E9]">
        <div>
          <h1 className="text-2xl font-bold text-[#1F2937]">{title}</h1>
          <p className="text-[#6B7280] mt-1">{subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Language Selector */}
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="bg-white border-[#DEDEDE] text-[#374151] hover:bg-[#F9F9F9] hover:text-[#374151] rounded-md px-4 py-2 font-normal"
              >
                {i18n.language === "pt" ? "Português" : "English"}
                <ChevronDown className="h-4 w-4 ml-2 text-[#6B7280]" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-white z-50 p-1">
              <DropdownMenuItem
                className="text-[#374151] font-normal focus:font-medium focus:text-[#374151] focus:bg-[#F9F9F9] cursor-pointer outline-none rounded-sm px-2 py-1.5"
                onClick={() => handleLanguageChange("en")}
              >
                English
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-[#374151] font-normal focus:font-medium focus:text-[#374151] focus:bg-[#F9F9F9] cursor-pointer outline-none rounded-sm px-2 py-1.5"
                onClick={() => handleLanguageChange("pt")}
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
              variant="outline"
              size="icon"
              className="bg-white border-[#DEDEDE] hover:bg-white rounded-md relative"
            >
              <Bell className="h-5 w-5 text-[#6B7280]" />
              {hasUnread && <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>}
            </Button>
          </NotificationsModal>

          {/* Profile Menu */}
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="bg-white border-[#DEDEDE] text-[#374151] hover:bg-white hover:text-[#374151] rounded-md px-3 py-2 font-normal"
              >
                <div className="h-7 w-7 rounded-full bg-[#1B966C] flex items-center justify-center text-white font-semibold text-sm mr-2">
                  {displayUserName.charAt(0).toUpperCase()}
                </div>
                {displayUserName}
                <ChevronDown className="h-4 w-4 ml-2 text-[#6B7280]" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-white z-50 p-1">
              <DropdownMenuItem
                className="text-[#374151] font-normal focus:font-medium focus:text-[#374151] focus:bg-[#F9F9F9] cursor-pointer outline-none rounded-sm px-2 py-1.5"
                onClick={() => navigate("/configuracoes")}
              >
                {t("sidebar.settings") || "Settings"}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-[#374151] font-normal focus:font-medium focus:text-[#374151] focus:bg-[#F9F9F9] cursor-pointer outline-none rounded-sm px-2 py-1.5"
                onClick={handleLogout}
              >
                {i18n.language === "pt" ? "Sair" : "Log out"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </>
  );
}
