import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import ResolutionHub from "@/pages/proxy/ResolutionHub";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/safeClient";
import { Session } from "@supabase/supabase-js";
import { UserDataProvider } from "@/hooks/useUserData";
import { MockDataProvider } from "@/contexts/MockDataContext";
import Index from "./pages/Index";
import Home from "./pages/Home";
import Disputes from "./pages/Disputes";
import Integrations from "./pages/Integrations";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";
import Alerts from "./pages/Alerts";
import Avoid from "./pages/Avoid";
import Charges from "./pages/Charges";
import RefundRequest from "./pages/RefundRequest";
import RefundRequestsByStatus from "./pages/RefundRequestsByStatus";
import RefundRequestDetail from "./pages/RefundRequestDetail";
import Admin from "./pages/Admin";
import AdminResolutions from "./pages/AdminResolutions";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import AuthCallback from "./pages/AuthCallback";
import ItemNotReceivedTest from "./pages/ItemNotReceivedTest";

const queryClient = new QueryClient();

const ProtectedLayout = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verifica sessão existente e tenta refresh se necessário
    const checkSession = async () => {
      // Aguarda um pouco para dar tempo do storage carregar (especialmente em iframes)
      await new Promise(resolve => setTimeout(resolve, 300));
      
      let currentSession = null;
      let error = null;
      
      try {
        const result = await supabase.auth.getSession();
        currentSession = result.data.session;
        error = result.error;
      } catch (e) {
        console.error("Erro ao obter sessão:", e);
        error = e as any;
      }
      
      if (error) {
        console.error("Erro ao obter sessão:", error);
      }
      
      // Se não tem sessão mas tem refresh token, tenta fazer refresh
      if (!currentSession) {
        console.log("Sem sessão encontrada, tentando refresh...");
        try {
          const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
          if (!refreshError && refreshedSession) {
            console.log("✅ Sessão renovada com sucesso");
            setSession(refreshedSession);
            setLoading(false);
            return;
          } else if (refreshError) {
            console.warn("Erro ao renovar sessão:", refreshError);
          }
        } catch (e) {
          console.warn("Erro ao tentar refresh:", e);
        }
      } else {
        console.log("✅ Sessão válida encontrada:", currentSession.user.id);
      }
      
      setSession(currentSession);
      setLoading(false);
    };

    checkSession();

    // Escuta mudanças no estado de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.id);
      setSession(session);
      setLoading(false);
      
      // Se a sessão foi renovada, atualiza o estado
      if (event === 'TOKEN_REFRESHED' && session) {
        console.log("✅ Token renovado automaticamente");
      }
      
      if (event === 'SIGNED_OUT') {
        console.log("⚠️ Usuário deslogado");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="ml-4 text-sm text-muted-foreground">Verificando autenticação...</p>
      </div>
    );
  }

  if (!session) {
    console.log("⚠️ Sem sessão, redirecionando para login");
    return <Navigate to="/auth" replace />;
  }

  return (
    <MockDataProvider>
      <UserDataProvider>
        <Outlet />
      </UserDataProvider>
    </MockDataProvider>
  );
};

const App = () => {
  // --- LÓGICA DE INSTALAÇÃO SHOPIFY ADICIONADA AQUI ---     
  useEffect(() => {
    const checkAndInitOAuth = async () => { 
      const params = new URLSearchParams(window.location.search);
      const shop = params.get("shop");
      const host = params.get("host");
      const isInstalled = params.get("installed");
      const hasTempCreds = params.has("temp_password") || params.has("email");
      const hasCode = params.has("code");
      const hasShopifySession = params.has("session");
      const isAuthCallbackRoute = window.location.pathname.startsWith("/auth/callback");
      const isEmbedded = window.top !== window;

      // Evita loop no callback ou ao voltar já autenticado pela Shopify (embedded)
      if (isAuthCallbackRoute || hasCode) return;
      
      // Se já concluímos o fluxo (installed=true) ou se estamos exibindo credenciais
      if (isInstalled || hasTempCreds) return;

      // Primeiro, verifica se temos uma sessão válida do Supabase (independente de ter shop na URL)
      // O parâmetro 'session' na URL é do Shopify, não do Supabase, então não devemos evitar OAuth por causa dele
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (session && !error) {
        console.log("✅ Sessão válida do Supabase encontrada, permitindo acesso");
        // Se tem sessão mas não tem shop na URL, tenta buscar do localStorage
        if (!shop) {
          // Busca o último shop instalado do localStorage
          const allKeys = Object.keys(localStorage);
          const shopKey = allKeys.find(key => key.startsWith('shopify_installed_'));
          if (shopKey) {
            const lastShop = shopKey.replace('shopify_installed_', '');
            console.log(`Shop encontrado no localStorage: ${lastShop}`);
          }
        }
        return; // Tem sessão válida, não precisa fazer OAuth ou login automático
      }

      // Se não tem sessão, tenta refresh
      console.log("Sem sessão encontrada, tentando refresh...");
      const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshedSession && !refreshError) {
        console.log("✅ Sessão renovada com sucesso");
        return; // Sessão renovada, não precisa OAuth
      } else if (refreshError) {
        console.log("Erro ao renovar sessão:", refreshError.message);
      }

      // Se chegou aqui, não tem sessão válida
      // Verifica se o app foi instalado antes e tenta fazer login automático
      let shopToUse = shop;
      
      // Se não tem shop na URL, tenta buscar do localStorage
      if (!shopToUse) {
        const allKeys = Object.keys(localStorage);
        const shopKey = allKeys.find(key => key.startsWith('shopify_installed_'));
        if (shopKey) {
          shopToUse = shopKey.replace('shopify_installed_', '');
          console.log(`Shop encontrado no localStorage: ${shopToUse}`);
        }
      }
      
      const installedFlag = shopToUse ? localStorage.getItem(`shopify_installed_${shopToUse}`) : null;
      
      if (shopToUse && installedFlag === "true") {
        console.log("⚠️ App instalado mas sem sessão válida. Tentando login automático...");
        
        // Primeiro tenta buscar email do localStorage (mais rápido)
        const savedEmail = localStorage.getItem(`shopify_email_${shopToUse}`);
        const savedUserId = localStorage.getItem(`shopify_user_id_${shopToUse}`);
        
        let emailToUse = savedEmail;
        let userIdToUse = savedUserId;
        
        // Se não tem no localStorage, busca do banco
        if (!emailToUse || !userIdToUse) {
          try {
            const { data: clientData, error: clientError } = await supabase
              .from('clients')
              .select('id, email, shopify_store_name')
              .eq('shopify_store_name', shopToUse)
              .maybeSingle();
            
            if (!clientError && clientData) {
              emailToUse = clientData.email;
              userIdToUse = clientData.id;
              // Salva no localStorage para próxima vez
              if (emailToUse) localStorage.setItem(`shopify_email_${shopToUse}`, emailToUse);
              if (userIdToUse) localStorage.setItem(`shopify_user_id_${shopToUse}`, userIdToUse);
            }
          } catch (e) {
            console.error("Erro ao buscar client:", e);
          }
        }
        
        if (emailToUse && userIdToUse) {
          console.log("✅ Credenciais encontradas, gerando magic link para login automático...");
          
          try {
            // Chama uma função para gerar magic link e fazer login
            const { data: linkData, error: linkError } = await supabase.functions.invoke('shopify-auto-login', {
              body: { shop: shopToUse, email: emailToUse, user_id: userIdToUse },
            });
            
            if (!linkError && linkData?.magic_link) {
              console.log("✅ Magic link gerado, redirecionando para login automático...");
              window.location.href = linkData.magic_link;
              return;
            } else {
              console.warn("⚠️ Não foi possível gerar magic link:", linkError);
            }
          } catch (e) {
            console.error("Erro ao gerar magic link:", e);
          }
        } else {
          console.warn("⚠️ Email ou user_id não encontrados para shop:", shopToUse);
        }
        
        // Se não conseguiu login automático, deixa o ProtectedLayout redirecionar para /auth
        console.log("⚠️ Não foi possível fazer login automático. Redirecionando para /auth");
        return;
      }

      // Se não tem sessão e não tem shop na URL, não pode fazer OAuth
      // Deixa o ProtectedLayout redirecionar para /auth
      if (!shop) {
        console.log("⚠️ Sem shop na URL e sem sessão válida. Redirecionando para login.");
        return;
      }

      // Configurações do OAuth Shopify
      const apiKey = import.meta.env.VITE_SHOPIFY_API_KEY;
      if (!apiKey) {
        console.error("VITE_SHOPIFY_API_KEY não configurada; abortando OAuth.");
        return;
      }
      const redirectUri = `${window.location.origin}/auth/callback`;
      const scopes = [
        "read_customers",
        "write_customers",
        "read_orders",
        "write_orders",
        "read_shopify_payments_disputes",
        "write_shopify_payments_disputes",
      ].join(",");

      // Só inicia o OAuth se veio de um contexto Shopify com ?shop= e não tem sessão
      console.log("Detectado acesso via Shopify sem sessão. Iniciando OAuth...", { shop, host, isEmbedded });
      const state = Date.now().toString(); // nonce simples; ideal usar algo associado ao user_id se tiver
      const authUrl = `https://${shop}/admin/oauth/authorize?client_id=${apiKey}&scope=${scopes}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;
      try {
        const targetWindow = window.top || window;
        targetWindow.location.href = authUrl;
      } catch (err) {
        console.warn("Falha ao redirecionar via window.top, tentando postMessage", err);
        if (isEmbedded && host) {
          // Fallback recomendado para iframes no admin
          window.parent.postMessage(
            { message: "Shopify.API.remoteRedirect", data: { location: authUrl } },
            "*"
          );
        } else {
          window.location.href = authUrl;
        }
      }
    };

    checkAndInitOAuth();
  }, []);
  // ----------------------------------------------------

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner richColors position="bottom-right" />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route element={<ProtectedLayout />}>
              <Route path="/" element={<Index />} />
              <Route path="/home" element={<Home />} />
              <Route path="/disputas" element={<Disputes />} />
              <Route path="/alertas" element={<Alerts />} />
              <Route path="/cobrancas" element={<Charges />} />
              <Route path="/refund-request" element={<RefundRequest />} />
              <Route path="/refund-request/:status" element={<RefundRequestsByStatus />} />
              <Route path="/refund-request/:status/:requestId" element={<RefundRequestDetail />} />
              <Route path="/integracoes" element={<Integrations />} />
              <Route path="/evitar" element={<Avoid />} />
              <Route path="/notificacoes" element={<Notifications />} />
              <Route path="/configuracoes" element={<Settings />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/admin/resolutions" element={<AdminResolutions />} />
              <Route path="/test/item-not-received" element={<ItemNotReceivedTest />} />
            </Route>
            {/* Proxy route - public, no auth required */}
            <Route path="/proxy" element={<ResolutionHub />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;