import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UserDataContextType {
  userName: string | null;
  storeName: string | null;
  email: string | null;
  phone: string | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const UserDataContext = createContext<UserDataContextType | undefined>(undefined);

interface UserDataProviderProps {
  children: ReactNode;
}

export function UserDataProvider({ children }: UserDataProviderProps) {
  const [userName, setUserName] = useState<string | null>(null);
  const [storeName, setStoreName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUserData = useCallback(async () => {
    try {
      setLoading(true);
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        setUserName(null);
        setStoreName(null);
        setEmail(null);
        setPhone(null);
        setLoading(false);
        return;
      }

      const { data: currentUser, error: currentUserError } = await supabase
        .from('users')
        .select('client_id')
        .eq('id', user.id)
        .maybeSingle();

      if (currentUserError || !currentUser?.client_id) {
        setLoading(false);
        return;
      }

      // Buscar dados locais do banco (incluindo timestamps)
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('nome, nome_empresa, email, telefone, settings_updated_at, shopify_connected_at')
        .eq('id', currentUser.client_id)
        .maybeSingle();

      if (clientError) {
        console.error("Erro ao buscar dados da empresa:", clientError);
        setLoading(false);
        return;
      }

      if (!clientData) {
        // Sem registro em clients para este client_id
        setLoading(false);
        return;
      }

      // Buscar dados da Shopify apenas se houver conexão ativa
      let shopifyData: any = null;
      const hasShopifyConnection = Boolean(clientData.shopify_connected_at);
      if (hasShopifyConnection) {
        try {
          const { data, error } = await supabase.functions.invoke("shop-info");
          if (!error && data?.info?.data?.shop) {
            shopifyData = data.info.data.shop;
          }
        } catch (error) {
          console.error("Erro ao buscar dados da Shopify:", error);
        }
      }

      // Lógica: se settings_updated_at > shopify_connected_at, usar dados locais
      // Caso contrário, usar dados da Shopify (nova integração ou reintegração)
      const settingsUpdatedAt = clientData?.settings_updated_at ? new Date(clientData.settings_updated_at) : null;
      const shopifyConnectedAt = clientData?.shopify_connected_at ? new Date(clientData.shopify_connected_at) : null;

      // Usar dados locais se:
      // 1. Houve edição local (settings_updated_at existe)
      // 2. E não há shopify_connected_at (integração antiga) OU edição foi após conexão
      const useLocalData = settingsUpdatedAt && (!shopifyConnectedAt || settingsUpdatedAt > shopifyConnectedAt);

      if (useLocalData && clientData) {
        // Usuário editou no sistema após conectar - usar dados locais
        setUserName(clientData.nome);
        setStoreName(clientData.nome_empresa);
        setEmail(clientData.email);
        setPhone(clientData.telefone);
      } else if (shopifyData) {
        // Nova integração ou reintegração - usar dados da Shopify
        setUserName(shopifyData.shop_owner || clientData?.nome);
        setStoreName(shopifyData.name || clientData?.nome_empresa);
        setEmail(shopifyData.email || clientData?.email);
        setPhone(shopifyData.phone || clientData?.telefone);
      } else if (clientData) {
        // Sem Shopify - usar dados locais
        setUserName(clientData.nome);
        setStoreName(clientData.nome_empresa);
        setEmail(clientData.email);
        setPhone(clientData.telefone);
      }
      
      setLoading(false);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      setLoading(false);
    }
  }, []);

  // Carregar dados iniciais e escutar mudanças de autenticação
  useEffect(() => {
    loadUserData();

    // Escutar mudanças de autenticação para recarregar dados
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setTimeout(() => {
          loadUserData();
        }, 0);
      } else if (event === 'SIGNED_OUT') {
        setUserName(null);
        setStoreName(null);
        setEmail(null);
        setPhone(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadUserData]);

  const value: UserDataContextType = {
    userName,
    storeName,
    email,
    phone,
    loading,
    refresh: loadUserData
  };

  return React.createElement(UserDataContext.Provider, { value }, children);
}

export function useUserData(): UserDataContextType {
  const context = useContext(UserDataContext);
  if (context === undefined) {
    throw new Error("useUserData must be used within a UserDataProvider");
  }
  return context;
}
