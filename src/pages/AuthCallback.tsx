import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/safeClient";

// Helper para tentar login com senha temporária
const attemptPasswordLogin = async (
  email: string,
  tempPassword: string,
  setStatus: (status: string) => void,
  setErrorDetail: (detail: string) => void
): Promise<boolean> => {
  setStatus("Fazendo login automático...");
  
  // Aguarda um momento para garantir que a senha foi propagada no backend
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Tenta fazer login com retry
  let loginSuccess = false;
  let lastError = null;
  
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) {
      setStatus(`Tentando login novamente (${attempt + 1}/3)...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: email,
      password: tempPassword,
    });
    
    if (!loginError && loginData.session) {
      loginSuccess = true;
      console.log("Sessão criada com sucesso:", loginData.session.user.id);
      break;
    }
    
    lastError = loginError;
    console.warn(`Tentativa ${attempt + 1} falhou:`, loginError?.message);
  }
  
  if (!loginSuccess) {
    console.error("Falha ao logar automaticamente após 3 tentativas:", lastError);
    setErrorDetail(lastError?.message || "Não foi possível fazer login automático.");
    return false;
  }
  
  return true;
};

const AuthCallback = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState("Processando autenticação...");
  const [errorDetail, setErrorDetail] = useState("");

  useEffect(() => {
    const processAuth = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const shop = params.get("shop");
      const hmac = params.get("hmac");
      const state = params.get("state");
      const autoLogin = params.get("auto_login") === "true";
      const token = params.get("token");
      const type = params.get("type");

      // Log para ver se os parâmetros chegaram na URL
      console.log("Callback params:", { code, shop, autoLogin, token, type });

      // Se é um auto_login via magic link, o Supabase já processou automaticamente
      // Apenas verifica se a sessão foi criada
      if (autoLogin) {
        setStatus("Verificando login automático...");
        // Aguarda um momento para o Supabase processar o magic link
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const { data: { session: autoLoginSession } } = await supabase.auth.getSession();
        if (autoLoginSession) {
          console.log("✅ Login automático bem-sucedido:", autoLoginSession.user.id);
          if (shop) {
            localStorage.setItem(`shopify_installed_${shop}`, "true");
          }
          navigate(`/?shop=${shop || ''}&installed=true`, { replace: true });
          return;
        } else {
          console.warn("⚠️ Magic link processado mas sessão não encontrada");
          setStatus("Erro: Sessão não criada após login automático.");
          // Continua o fluxo normal abaixo
        }
      }

      // Se já temos sessão e já marcamos installed, não reinvocar a função
      const { data: existingSession } = await supabase.auth.getSession();
      const installedFlag = shop ? localStorage.getItem(`shopify_installed_${shop}`) : null;
      if (existingSession.session && installedFlag === "true") {
        console.log("Sessão já existente, pulando invoke e redirecionando.");
        navigate(`/?shop=${shop}&installed=true`);
        return;
      }

      if (!code || !shop) {
        setStatus("Erro: Parâmetros inválidos na URL.");
        return;
      }

      try {
        console.log("Chamando Supabase Function...");
        
        const { data, error } = await supabase.functions.invoke('shopify-callback', {
          body: { code, shop, hmac, state },
        });

        if (error) {
            console.error("Erro Invoke:", error);
            // Captura o corpo do erro se existir
            const bodyError = error.context ? await error.context.json() : error.message;
            throw new Error(JSON.stringify(bodyError) || "Erro desconhecido na function");
        }

        console.log("Sucesso:", data);

        // Se a function retornar magic link, redireciona para ele (mais confiável)
        if (data?.magic_link) {
          setStatus("Redirecionando para login automático...");
          // O magic link já contém tudo necessário, apenas redireciona
          window.location.href = data.magic_link;
          return; // Não continua o fluxo, o magic link vai redirecionar
        } else if (data?.email && data?.temp_password) {
          // Fallback: usa senha temporária
          const loginSuccess = await attemptPasswordLogin(data.email, data.temp_password, setStatus, setErrorDetail);
          if (!loginSuccess) {
            // Se falhar, tenta verificar se já existe uma sessão válida
            const { data: { session: existingSession } } = await supabase.auth.getSession();
            if (!existingSession) {
              setStatus("Erro ao iniciar sessão.");
              return;
            }
            console.log("Sessão existente encontrada, usando ela");
          }
        } else {
          console.warn("Function não retornou credenciais para login automático");
          setStatus("Aviso: Credenciais não recebidas. Redirecionando...");
        }
        
        // Verifica se temos sessão antes de redirecionar
        const { data: { session: finalSession } } = await supabase.auth.getSession();
        if (!finalSession) {
          console.error("Nenhuma sessão encontrada após tentativas de login");
          setStatus("Erro: Não foi possível criar sessão.");
          setErrorDetail("Por favor, faça login manualmente.");
          return;
        }
        
        console.log("Sessão verificada com sucesso:", finalSession.user.id);

        // Marca que a loja já completou o fluxo e salva informações para login automático futuro
        if (shop) {
          localStorage.setItem(`shopify_installed_${shop}`, "true");
          if (data?.email) {
            localStorage.setItem(`shopify_email_${shop}`, data.email);
          }
          if (data?.user_id) {
            localStorage.setItem(`shopify_user_id_${shop}`, data.user_id);
          }
        }
        
        // Redireciona para a home com o usuário já logado
        navigate(`/?shop=${shop}&installed=true`, { replace: true });

      } catch (err: any) {
        console.error("Erro Catch:", err);
        setStatus("Erro fatal na conexão.");
        // Tenta extrair o corpo de erro mesmo que venha em HTML ou texto simples
        let detail = err?.message || "";
        const resp = err?.context?.response;
        if (resp) {
          // Usa clone para não consumir o stream original
          const cloned = resp.clone();
          try {
            // Tenta JSON primeiro
            const body = await cloned.json();
            detail = JSON.stringify(body);
          } catch {
            try {
              // Fallback para texto (HTML ou texto puro)
              detail = await cloned.text();
            } catch {
              // mantém detail atual
            }
          }
        }
        setErrorDetail(detail || JSON.stringify(err));
      }
    };

    processAuth();
  }, [navigate]);

  return (
    <div className="flex items-center justify-center h-screen flex-col gap-4 p-8 text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      <h2 className="text-xl font-bold">{status}</h2>
      {errorDetail && (
        <div className="bg-red-50 text-red-600 p-4 rounded text-sm max-w-md break-all border border-red-200">
            {errorDetail}
        </div>
      )}
    </div>
  );
};

export default AuthCallback;