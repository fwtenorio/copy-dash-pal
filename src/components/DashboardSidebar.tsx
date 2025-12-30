import { useCallback, useEffect, useState } from "react";
import {
  LayoutDashboard,
  Shield,
  FileText,
  Bell,
  Zap,
  BellRing,
  CreditCard,
  Undo2,
  Settings,
  CircleHelp,
  ThumbsUp,
  LogOut,
  ChevronsLeft,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StoreSelector } from "@/components/StoreSelector";
import { FeedbackModal } from "@/components/FeedbackModal";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

// Função auxiliar para determinar a cor do badge baseada no tipo de item
const getBadgeColor = (title: string): string => {
  const titleLower = title.toLowerCase();
  
  // Itens críticos (ação requerida) - Vermelho
  if (
    titleLower.includes('dispute') || 
    titleLower.includes('disputa') ||
    titleLower.includes('refund') || 
    titleLower.includes('reembolso') ||
    titleLower.includes('alert') || 
    titleLower.includes('alerta')
  ) {
    return 'bg-red-500';
  }
  
  // Itens positivos/informativos - Verde
  if (
    titleLower.includes('prevent') || 
    titleLower.includes('evitar') ||
    titleLower.includes('integration') || 
    titleLower.includes('integra')
  ) {
    return 'bg-[#1b966c]';
  }
  
  // Cor padrão para outros casos
  return 'bg-red-500';
};

export function DashboardSidebar() {
  const { open, toggleSidebar } = useSidebar();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [disputesBadge, setDisputesBadge] = useState<number | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const fetchDisputesBadge = useCallback(
    async (uid?: string) => {
      try {
        const targetId = uid ?? userId;
        if (!targetId) return;

        const { data, error } = await supabase
          .from("notifications_menu")
          .select("disputes")
          .eq("user_id", targetId)
          .maybeSingle();

        if (error) {
          console.error("Erro ao buscar contador de disputas:", error);
          return;
        }

        const value = data?.disputes ?? 0;
        setDisputesBadge(value);
      } catch (err) {
        console.error("Erro ao carregar contador de disputas:", err);
      }
    },
    [userId],
  );

  useEffect(() => {
    // Tentar sessão atual
    supabase.auth.getSession().then(({ data }) => {
      const uid = data.session?.user?.id;
      if (uid) {
        setUserId(uid);
        fetchDisputesBadge(uid);
      }
    });

    // Ouvir mudanças de auth
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const uid = session?.user?.id;
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        if (uid) {
          setUserId(uid);
          fetchDisputesBadge(uid);
        }
      } else if (event === "SIGNED_OUT") {
        setUserId(null);
        setDisputesBadge(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchDisputesBadge]);

  // Realtime para refletir o update logo após o login (notifications_menu)
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`notifications_menu_updates_${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications_menu",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const next = (payload.new as any)?.disputes ?? 0;
          setDisputesBadge(next);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // Atualizar badge ao finalizar loading do dashboard (evento disparado na página inicial)
  useEffect(() => {
    const handler = () => fetchDisputesBadge();
    window.addEventListener("dashboard-data-loaded", handler);
    return () => window.removeEventListener("dashboard-data-loaded", handler);
  }, [fetchDisputesBadge]);

  // Atualizar badge quando notificações forem atualizadas no login
  useEffect(() => {
    const handler = (e: Event) => {
      const custom = e as CustomEvent<{ userId?: string }>;
      fetchDisputesBadge(custom.detail?.userId);
    };
    window.addEventListener("notifications-menu-updated", handler);
    return () => window.removeEventListener("notifications-menu-updated", handler);
  }, [fetchDisputesBadge]);

  const menuItems = [
    { title: t("sidebar.dashboard"), icon: LayoutDashboard, url: "/" },
    {
      title: t("sidebar.disputes"),
      icon: FileText,
      url: "/disputas",
      badge: disputesBadge && disputesBadge > 0 ? disputesBadge : null,
      onClick: async () => {
        if (!userId) return;
        try {
          const { error } = await supabase
            .from("notifications_menu")
            .update({ disputes: 0 })
            .eq("user_id", userId);
          if (error) {
            console.error("Erro ao zerar contador de disputas:", error);
            return;
          }
          setDisputesBadge(0);
        } catch (err) {
          console.error("Erro ao zerar contador de disputas:", err);
        }
      },
    },
    { title: t("sidebar.refundRequest"), icon: Undo2, url: "/refund-request", badge: 24 },
    { title: t("sidebar.prevent"), icon: Shield, url: "/evitar", badge: 24 },
    { title: t("sidebar.alerts"), icon: Bell, url: "/alertas", badge: 27 },
    { title: t("sidebar.integrations"), icon: Zap, url: "/integracoes", highlight: true },
    { title: t("sidebar.notifications"), icon: BellRing, url: "/notificacoes" },
    { title: t("sidebar.billing"), icon: CreditCard, url: "/cobrancas" },
    { title: t("sidebar.settings"), icon: Settings, url: "/configuracoes" },
  ];

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/auth");
    } catch (error) {
      toast({
        title: t("errors.logoutFailed", "Logout failed"),
        variant: "destructive",
      });
    }
  };

  const handleFeedbackClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setFeedbackOpen(true);
  };

  return (
    <>
      <Sidebar
        className="border-r border-white/10 bg-[#1a1a1a]"
        collapsible="icon"
        style={{ "--sidebar-width": "260px", "--sidebar-width-icon": "88px" } as React.CSSProperties}
      >
        {/* Header com logo e botão fechar */}
        <div className="p-4 flex items-center justify-between bg-[#1a1a1a]">
          {/* Full logo - always in DOM, hidden when collapsed */}
          <div
            className={`h-[32px] overflow-hidden transition-all duration-300 ml-6 mt-3 ${open ? "min-w-[120px] opacity-100" : "ml-[2px] w-0 min-w-0 opacity-0"}`}
          >
            <img
              key="sidebar-logo-full"
              src="/logo_branco.png"
              alt="Chargemind logo"
              className="h-full w-auto object-left"
              loading="eager"
              fetchPriority="high"
            />
          </div>

          {/* Mini logo - always in DOM, hidden when expanded */}
          <div
            className={`flex justify-center transition-all duration-300 cursor-pointer mr-8 mt-4 ${open ? "w-0 opacity-0 overflow-hidden" : "w-full opacity-100"}`}
            onClick={!open ? toggleSidebar : undefined}
          >
            <img
              key="sidebar-logo-mini"
              src="/logo_branco_mini.png"
              alt="Chargemind mini logo"
              className="h-8 w-8"
              loading="eager"
              fetchPriority="high"
            />
          </div>

          {/* Collapse button - only visible when expanded */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className={`mt-5 h-6 w-6 text-white/60 -mr-7 bg-[#2B2B2B] hover:text-white hover:bg-[#2B2B2B] transition-all duration-300 ${open ? "opacity-100" : "opacity-0 w-0 overflow-hidden"}`}
          >
            <ChevronsLeft className="h-5 w-5" />
          </Button>
        </div>

        {/* Store Selector */}
        {open && (
          <div className="p-3 bg-[#1a1a1a]">
            <div className="mx-3">
              <StoreSelector />
            </div>
          </div>
        )}

        <SidebarContent
          className="py-4 bg-[#1a1a1a] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pd-25"
          style={!open ? { paddingLeft: 25 } : {}}
        >
          <SidebarGroup className="p-0">
            <SidebarGroupContent>
              <SidebarMenu>
                {menuItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild tooltip={!open ? item.title : undefined}>
                      <NavLink
                        to={item.url}
                        onClick={item.onClick}
                        className="peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-none text-left outline-none transition-[width,height,padding] focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 aria-[current=page]:bg-[#1A1A1A] aria-[current=page]:!text-[#38CC93] aria-[current=page]:!border-[#38CC93] border-l-4 border-transparent text-[#E3E3E3] hover:bg-[#1A1A1A] hover:text-[#38CC93] [&>svg]:text-current py-3 pl-[22px] pr-[44px] group-data-[collapsible=icon]:!px-0 group-data-[collapsible=icon]:!py-3 group-data-[collapsible=icon]:!justify-center group-data-[collapsible=icon]:!border-l-0 group-data-[collapsible=icon]:[&>svg]:!size-5 relative"
                      >
                        <item.icon className="h-5 w-5 flex-shrink-0" />

                        {open && <span className="text-sm flex-1">{item.title}</span>}

                        {item.badge !== undefined && item.badge !== null && (
                          <Badge
                            className={`${getBadgeColor(item.title)} text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full p-0 hover:${getBadgeColor(item.title)} ${!open ? "absolute -top-0 -right-0 z-50" : ""}`}
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        {/* Footer */}
        <SidebarFooter className={`border-t border-white/10 py-2 bg-[#1a1a1a] ${open ? 'pl-0' : 'pl-6'}`}>
          <SidebarMenu>
            {/* Help Center */}
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip={!open ? t("sidebar.helpCenter") : undefined}>
                <NavLink
                  to="#"
                  className="peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-none text-left outline-none transition-[width,height,padding] focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 aria-[current=page]:bg-[#1A1A1A] aria-[current=page]:!text-[#E3E3E3] aria-[current=page]:!border-[#1A1A1A] border-l-4 border-transparent text-[#E3E3E3] hover:bg-[#1A1A1A] hover:text-[#38CC93] [&>svg]:text-current py-3 pl-[22px] pr-[44px] group-data-[collapsible=icon]:!px-0 group-data-[collapsible=icon]:!py-3 group-data-[collapsible=icon]:!justify-center group-data-[collapsible=icon]:!border-l-0 group-data-[collapsible=icon]:[&>svg]:!size-5 relative"
                >
                  <CircleHelp className="h-5 w-5 flex-shrink-0" />
                  {open && <span className="text-sm">{t("sidebar.helpCenter")}</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {/* Feedback - opens modal */}
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip={!open ? t("sidebar.feedback") : undefined}>
                <button
                  onClick={handleFeedbackClick}
                  className="peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-none text-left outline-none transition-[width,height,padding] focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 border-l-4 border-transparent text-[#E3E3E3] hover:bg-[#1A1A1A] hover:text-[#38CC93] [&>svg]:text-current py-3 pl-[22px] pr-[44px] group-data-[collapsible=icon]:!px-0 group-data-[collapsible=icon]:!py-3 group-data-[collapsible=icon]:!justify-center group-data-[collapsible=icon]:!border-l-0 group-data-[collapsible=icon]:[&>svg]:!size-5 relative"
                >
                  <ThumbsUp className="h-5 w-5 flex-shrink-0" />
                  {open && <span className="text-sm">{t("sidebar.feedback")}</span>}
                </button>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {/* Log Out - functional */}
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip={!open ? t("sidebar.logOut") : undefined}>
                <button
                  onClick={handleLogout}
                  className="peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-none text-left outline-none transition-[width,height,padding] focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 border-l-4 border-transparent text-[#E3E3E3] hover:bg-[#1A1A1A] hover:text-[#38CC93] [&>svg]:text-current py-3 pl-[22px] pr-[44px] group-data-[collapsible=icon]:!px-0 group-data-[collapsible=icon]:!py-3 group-data-[collapsible=icon]:!justify-center group-data-[collapsible=icon]:!border-l-0 group-data-[collapsible=icon]:[&>svg]:!size-5 relative"
                >
                  <LogOut className="h-5 w-5 flex-shrink-0" />
                  {open && <span className="text-sm">{t("sidebar.logOut")}</span>}
                </button>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      {/* Feedback Modal */}
      <FeedbackModal open={feedbackOpen} onOpenChange={setFeedbackOpen} />
    </>
  );
}
