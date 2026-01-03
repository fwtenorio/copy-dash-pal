import { DashboardLayout } from "@/components/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Copy, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { SearchInput } from "@/components/SearchInput";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { HelpCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/safeClient";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from "react-i18next";
import { IntegrationCard } from "@/components/IntegrationCard";

// Database field mapping for each integration
// NOTE: Status columns are not persisted in the database in this project; we treat connected integrations as "active".
const dbFieldMapping: Record<string, { field1: string; field2?: string; connectedAt: string }> = {
  shopify: { field1: "shopify_store_name", field2: "shopify_access_token", connectedAt: "shopify_connected_at" },
  "shopify-payments": { field1: "shopify_store_name", field2: "shopify_access_token", connectedAt: "shopify_connected_at" },
  woocommerce: { field1: "woocommerce_store_url", field2: "woocommerce_api_key", connectedAt: "woocommerce_connected_at" },
  stripe: { field1: "stripe_api_key", connectedAt: "stripe_connected_at" },
  paypal: { field1: "paypal_client_id", field2: "paypal_secret", connectedAt: "paypal_connected_at" },
  klarna: { field1: "klarna_api_key", connectedAt: "klarna_connected_at" },
  airwallex: { field1: "airwallex_api_key", connectedAt: "airwallex_connected_at" },
  woopayments: { field1: "woopayments_api_key", connectedAt: "woopayments_connected_at" },
  braintree: { field1: "braintree_merchant_id", field2: "braintree_api_key", connectedAt: "braintree_connected_at" },
  adyen: { field1: "adyen_api_key", field2: "adyen_merchant_account", connectedAt: "adyen_connected_at" },
  wix: { field1: "wix_site_id", field2: "wix_api_key", connectedAt: "wix_connected_at" },
  magento: { field1: "magento_store_url", field2: "magento_api_key", connectedAt: "magento_connected_at" },
};

// Form field configurations
const integrationFormConfig: Record<string, { 
  label1: string; 
  placeholder1: string; 
  label2?: string; 
  placeholder2?: string; 
  isUrl?: boolean; 
  urlSuffix?: string;
  hasHelpPopover?: boolean;
}> = {
  shopify: { label1: "Shop URL", placeholder1: "yourstore", label2: "Access Token", placeholder2: "shpat_xxxxx", isUrl: true, urlSuffix: ".myshopify.com", hasHelpPopover: true },
  "shopify-payments": { label1: "Shop URL", placeholder1: "yourstore", label2: "Access Token", placeholder2: "shpat_xxxxx", isUrl: true, urlSuffix: ".myshopify.com", hasHelpPopover: true },
  woocommerce: { label1: "Store URL", placeholder1: "yourstore.com", label2: "API Key", placeholder2: "ck_xxxxxxxx", isUrl: true },
  stripe: { label1: "Secret Key", placeholder1: "sk_live_xxxxx" },
  paypal: { label1: "Client ID", placeholder1: "AxxxxxxB", label2: "Secret", placeholder2: "ExxxxxxF" },
  klarna: { label1: "API Key", placeholder1: "klarna_xxxxx" },
  airwallex: { label1: "API Key", placeholder1: "airwallex_xxxxx" },
  woopayments: { label1: "API Key", placeholder1: "woo_xxxxx" },
  braintree: { label1: "Merchant ID", placeholder1: "merchant_xxxxx", label2: "API Key", placeholder2: "braintree_xxxxx" },
  adyen: { label1: "API Key", placeholder1: "adyen_xxxxx", label2: "Merchant Account", placeholder2: "YOUR_MERCHANT_ACCOUNT" },
  wix: { label1: "Site ID", placeholder1: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx", label2: "API Key", placeholder2: "wix_xxxxx" },
  magento: { label1: "Store URL", placeholder1: "yourstore.com", label2: "API Key", placeholder2: "magento_xxxxx", isUrl: true },
};

const Integrations = () => {
  const { t } = useTranslation();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<{ name: string; type: string; id: string } | null>(null);
  const [showToken, setShowToken] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("todas");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [shopifyConfig, setShopifyConfig] = useState<{ storeName: string; accessToken: string }>({
    storeName: "",
    accessToken: "",
  });

  // Form fields
  const [formField1, setFormField1] = useState("");
  const [formField2, setFormField2] = useState("");

  // Connection states for all integrations
  const [connectionStates, setConnectionStates] = useState<Record<string, boolean>>({
    shopify: false,
    "shopify-payments": false,
    woocommerce: false,
    stripe: false,
    paypal: false,
    klarna: false,
    airwallex: false,
    woopayments: false,
    braintree: false,
    adyen: false,
    wix: false,
    magento: false,
  });

  // Status states for all integrations (active, paused, or null)
  const [statusStates, setStatusStates] = useState<Record<string, 'active' | 'paused' | null>>({
    shopify: null,
    "shopify-payments": null,
    woocommerce: null,
    stripe: null,
    paypal: null,
    klarna: null,
    airwallex: null,
    woopayments: null,
    braintree: null,
    adyen: null,
    wix: null,
    magento: null,
  });

  const paymentProcessors = [
    { id: "shopify-payments", name: "Shopify Payments", icon: "/Shopify.png", bgClass: "bg-[#E8F5E3]", textClass: "text-[#5E8E3E]", hasSettings: true },
    { id: "stripe", name: "Stripe", icon: "/Stripe.png", bgClass: "bg-[#EDEDFF]", textClass: "text-[#635BFF]", hasSettings: true, comingSoon: true },
    { id: "paypal", name: "Paypal", icon: "/Paypal.png", bgClass: "bg-[#E5F1FA]", textClass: "text-[#0070BA]", hasSettings: true, comingSoon: true },
    { id: "klarna", name: "Klarna", icon: "/Klarna.png", bgClass: "bg-[#FFE8EE]", textClass: "text-[#E5547B]", hasSettings: true, comingSoon: true },
    { id: "airwallex", name: "Airwallex", icon: "/Airwallex.png", bgClass: "bg-[#FFF0E5]", textClass: "", hasSettings: true, comingSoon: true },
    { id: "woopayments", name: "WooPayments", icon: "/WooCommerce.png", bgClass: "bg-[#F3E8F1]", textClass: "text-[#7B5BB0]", hasSettings: true, comingSoon: true },
    { id: "braintree", name: "Braintree", icon: "/Braintree.png", bgClass: "bg-[#E5F8FC]", textClass: "text-[#00C3F0]", hasSettings: true, comingSoon: true },
    { id: "adyen", name: "Adyen", icon: "/Adyen.png", bgClass: "bg-[#E5F8ED]", textClass: "text-[#0ABF53]", hasSettings: true, comingSoon: true },
  ].map(p => ({ ...p, connected: connectionStates[p.id] || false }));

  const platforms = [
    { id: "shopify", name: "Shopify", icon: "/Shopify.png", bgClass: "bg-[#E8F5E3]", textClass: "text-[#5E8E3E]", hasSettings: true },
    { id: "woocommerce", name: "WooCommerce", icon: "/WooCommerce.png", bgClass: "bg-[#F3E8F1]", textClass: "text-[#7B5BB0]", hasSettings: true, comingSoon: true },
    { id: "wix", name: "Wix", icon: "/Wix.png", bgClass: "bg-[#E8F1FF]", textClass: "text-[#0C6EFC]", hasSettings: true, comingSoon: true },
    { id: "magento", name: "Magento", icon: "/Magento.png", bgClass: "bg-[#FDE8E0]", textClass: "text-[#EE672F]", hasSettings: true, comingSoon: true },
  ].map(p => ({ ...p, connected: connectionStates[p.id] || false }));

  useEffect(() => {
    loadClientData();
  }, []);

  const loadClientData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Buscar client_id do usuário na tabela users
      const { data: userRow } = await supabase
        .from("users")
        .select("client_id")
        .eq("id", user.id)
        .maybeSingle();

      const clientId = userRow?.client_id;
      if (!clientId) {
        // Não há empresa vinculada, setar todos os estados como false
        console.log('No clientId found, setting all integrations as disconnected');
        setConnectionStates({
          shopify: false,
          "shopify-payments": false,
          woocommerce: false,
          stripe: false,
          paypal: false,
          klarna: false,
          airwallex: false,
          woopayments: false,
          braintree: false,
          adyen: false,
          wix: false,
          magento: false,
        });
        setStatusStates({
          shopify: null,
          "shopify-payments": null,
          woocommerce: null,
          stripe: null,
          paypal: null,
          klarna: null,
          airwallex: null,
          woopayments: null,
          braintree: null,
          adyen: null,
          wix: null,
          magento: null,
        });
        return;
      }

      // Buscar dados do cliente usando o client_id
      const { data, error } = await supabase
        .from("clients")
        .select(`
          shopify_store_name, shopify_access_token, shopify_connected_at,
          woocommerce_store_url, woocommerce_api_key, woocommerce_connected_at,
          stripe_api_key, stripe_connected_at,
          paypal_client_id, paypal_secret, paypal_connected_at,
          klarna_api_key, klarna_connected_at,
          airwallex_api_key, airwallex_connected_at,
          woopayments_api_key, woopayments_connected_at,
          braintree_merchant_id, braintree_api_key, braintree_connected_at,
          adyen_api_key, adyen_merchant_account, adyen_connected_at,
          wix_site_id, wix_api_key, wix_connected_at,
          magento_store_url, magento_api_key, magento_connected_at
        `)
        .eq("id", clientId)
        .maybeSingle();

      if (error) {
        console.error("Error loading data:", error);
        return;
      }

      if (!data) {
        // Não há registro, setar todos os estados como false
        console.log('No client data found, setting all integrations as disconnected');
        setConnectionStates({
          shopify: false,
          "shopify-payments": false,
          woocommerce: false,
          stripe: false,
          paypal: false,
          klarna: false,
          airwallex: false,
          woopayments: false,
          braintree: false,
          adyen: false,
          wix: false,
          magento: false,
        });
        setStatusStates({
          shopify: null,
          "shopify-payments": null,
          woocommerce: null,
          stripe: null,
          paypal: null,
          klarna: null,
          airwallex: null,
          woopayments: null,
          braintree: null,
          adyen: null,
          wix: null,
          magento: null,
        });
        return;
      }
      if (data) {
        const shopifyStore = (data.shopify_store_name ?? "").trim();
        const shopifyToken = (data.shopify_access_token ?? "").trim();

        setShopifyConfig({
          storeName: shopifyStore,
          accessToken: shopifyToken,
        });

        const newConnectionStates: Record<string, boolean> = {
          shopify: !!data.shopify_connected_at,
          "shopify-payments": !!data.shopify_connected_at,
          woocommerce: !!data.woocommerce_connected_at,
          stripe: !!data.stripe_connected_at,
          paypal: !!data.paypal_connected_at,
          klarna: !!data.klarna_connected_at,
          airwallex: !!data.airwallex_connected_at,
          woopayments: !!data.woopayments_connected_at,
          braintree: !!data.braintree_connected_at,
          adyen: !!data.adyen_connected_at,
          wix: !!data.wix_connected_at,
          magento: !!data.magento_connected_at,
        };
        setConnectionStates(newConnectionStates);

        // Status local: se conectou, consideramos ativo
        const newStatusStates: Record<string, "active" | "paused" | null> = {
          shopify: data.shopify_connected_at ? "active" : null,
          "shopify-payments": data.shopify_connected_at ? "active" : null,
          woocommerce: data.woocommerce_connected_at ? "active" : null,
          stripe: data.stripe_connected_at ? "active" : null,
          paypal: data.paypal_connected_at ? "active" : null,
          klarna: data.klarna_connected_at ? "active" : null,
          airwallex: data.airwallex_connected_at ? "active" : null,
          woopayments: data.woopayments_connected_at ? "active" : null,
          braintree: data.braintree_connected_at ? "active" : null,
          adyen: data.adyen_connected_at ? "active" : null,
          wix: data.wix_connected_at ? "active" : null,
          magento: data.magento_connected_at ? "active" : null,
        };

        setStatusStates(newStatusStates);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const handleCopy = (value: string) => {
    navigator.clipboard.writeText(value);
    toast.success("Copied!", {
      description: value,
    });
  };

  const ScopeChip = ({ value }: { value: string }) => (
    <span className="inline-flex items-center gap-1 rounded bg-muted px-2 py-1 text-[11px] font-mono text-foreground">
      {value}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
        onClick={() => handleCopy(value)}
      >
        <Copy className="h-3 w-3" />
      </Button>
    </span>
  );

  const handleOpenSettings = async (name: string, type: string, id: string) => {
    console.log('handleOpenSettings called:', { name, type, id });
    setSelectedIntegration({ name, type, id });
    setShowToken(false);

    // Buscar dados do banco para preencher os campos
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setFormField1("");
      setFormField2("");
      setIsSettingsOpen(true);
      return;
    }

    // Buscar client_id do usuário
    const { data: userRow } = await supabase
      .from("users")
      .select("client_id")
      .eq("id", user.id)
      .maybeSingle();

    const clientId = userRow?.client_id;
    if (!clientId) {
      setFormField1("");
      setFormField2("");
      setIsSettingsOpen(true);
      return;
    }

    // Buscar dados da integração usando o client_id
    const mapping = dbFieldMapping[id];
    const { data } = await supabase
      .from("clients")
      .select(`${mapping.field1}${mapping.field2 ? `, ${mapping.field2}` : ""}`)
      .eq("id", clientId)
      .maybeSingle();

    setFormField1(data?.[mapping.field1] || shopifyConfig.storeName || "");
    setFormField2(mapping.field2 ? data?.[mapping.field2] || shopifyConfig.accessToken || "" : "");
    console.log('Opening modal, isSettingsOpen will be set to true');
    setIsSettingsOpen(true);
    console.log('Modal state updated');
  };

  const handleToggleStatus = async (id: string, newStatus: "active" | "paused") => {
    // Status é mantido localmente (não persistimos no banco nesta versão)
    const idsToUpdate = id === "shopify" || id === "shopify-payments" ? ["shopify", "shopify-payments"] : [id];

    setStatusStates((prev) => {
      const next = { ...prev };
      idsToUpdate.forEach((updateId) => {
        next[updateId] = newStatus;
      });
      return next;
    });

    toast.success(newStatus === "active" ? "Integration Resumed" : "Integration Paused", {
      description:
        newStatus === "active"
          ? "The integration has been resumed."
          : "The integration has been paused in this session.",
    });
  };

  const handleDisconnect = async (name: string, id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error(t("integrations.userNotAuthenticated"));

      const mapping = dbFieldMapping[id];
      if (!mapping) return;

      // Atualização otimista do toggle para evitar flicker
      const idsToUpdate = id === "shopify" ? ["shopify", "shopify-payments"] : 
                          id === "shopify-payments" ? ["shopify", "shopify-payments"] : [id];
      
      setConnectionStates(prev => {
        const newState = { ...prev };
        idsToUpdate.forEach(updateId => {
          newState[updateId] = false;
        });
        return newState;
      });

      if (id === "shopify" || id === "shopify-payments") {
        let disconnected = false;
        let edgeErrorMessage = "";

        // Usar Edge Function (service role) para garantir permissões e limpeza completa
        try {
          const { data: disconnectResult, error: disconnectError } = await supabase.functions.invoke("shopify-connect", {
            body: { action: "disconnect" },
          });

          if (disconnectError) {
            edgeErrorMessage = disconnectError.message;
            throw disconnectError;
          }

          if (!disconnectResult?.success) {
            edgeErrorMessage = disconnectResult?.error || t("integrations.failedToDisconnectShopify");
            throw new Error(edgeErrorMessage);
          }

          disconnected = true;
        } catch (edgeErr: any) {
          // Tentar obter detalhes da resposta da Edge Function
          try {
            const respText = await edgeErr?.context?.response?.text?.();
            if (respText) {
              console.error("Edge Function response:", respText);
              edgeErrorMessage = respText;
            }
          } catch {
            // ignore
          }

          console.error("Edge Function disconnect error:", edgeErr);

          // Fallback para update direto (pode funcionar se as policies permitirem)
          const { data: userRow } = await supabase
            .from("users")
            .select("client_id")
            .eq("id", user.id)
            .maybeSingle();

          const clientId = userRow?.client_id;
          if (!clientId) {
            throw new Error(edgeErrorMessage || t("integrations.cannotIdentifyClient"));
          }

          const updateData: Record<string, null> = {
            shopify_store_name: null,
            shopify_access_token: null,
            shopify_connected_at: null,
          };

          const { error: directError } = await supabase
            .from("clients")
            .update(updateData)
            .eq("id", clientId);

          if (directError) {
            throw new Error(edgeErrorMessage || directError.message || t("integrations.failedToDisconnectShopify"));
          }

          disconnected = true;
        }

        if (!disconnected) {
          throw new Error(edgeErrorMessage || t("integrations.failedToDisconnectShopify"));
        }
      } else {
        // Demais integrações: update direto
        // Buscar client_id do usuário
        const { data: userRow } = await supabase
          .from("users")
          .select("client_id")
          .eq("id", user.id)
          .maybeSingle();

        const clientId = userRow?.client_id;
        if (!clientId) {
          toast.error(t("integrations.nothingToDisconnect"), {
            description: t("integrations.noCompanyToDisconnect"),
          });
          return;
        }

        const updateData: Record<string, null> = {
          [mapping.field1]: null,
          [mapping.connectedAt]: null,
          ...(mapping.field2 ? { [mapping.field2]: null } : {}),
        };

        const { error } = await supabase
          .from("clients")
          .update(updateData)
          .eq("id", clientId);

        if (error) throw error;
      }

      toast.success(t("integrations.disconnected"), {
        description: `${name} ${t("integrations.disconnectedSuccess")}`,
      });

      // Limpar cache local da Shopify para reabrir o modal sem dados antigos
      if (id === "shopify" || id === "shopify-payments") {
        setShopifyConfig({ storeName: "", accessToken: "" });
        setFormField1("");
        setFormField2("");
      }

      // Recarregar dados para refletir o estado atualizado do backend
      await loadClientData();
    } catch (error: any) {
      // Reverter estado otimista em caso de falha
      const revertId = selectedIntegration?.id || id;
      if (revertId) {
        const failIds = revertId === "shopify" ? ["shopify", "shopify-payments"] : 
                        revertId === "shopify-payments" ? ["shopify", "shopify-payments"] : [revertId];
        setConnectionStates(prev => {
          const newState = { ...prev };
          failIds.forEach(updateId => {
            newState[updateId] = true;
          });
          return newState;
        });
      }

      toast.error(t("integrations.disconnectError"), {
        description: error.message,
      });
    }
  };

  const handleSaveSettings = async () => {
    if (!selectedIntegration) return;
    
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error(t("integrations.userNotAuthenticated"));

      const id = selectedIntegration.id;
      const mapping = dbFieldMapping[id];
      const config = integrationFormConfig[id];
      
      if (!mapping || !config) throw new Error(t("integrations.invalidConfiguration"));

      // Validate required fields
      if (!formField1) throw new Error(t("integrations.fillAllRequiredFields"));
      if (mapping.field2 && !formField2) throw new Error(t("integrations.fillAllRequiredFields"));

      // Special handling for Shopify integrations
      if (id === "shopify" || id === "shopify-payments") {
        // Validação de credenciais
        const { data: validationResult, error: validationError } = await supabase.functions.invoke("validate-shopify", {
          body: {
            shopName: formField1,
            accessToken: formField2,
          },
        });

        if (validationError) {
          throw new Error(t("integrations.errorValidatingCredentials") + ": " + validationError.message);
        }

        if (!validationResult?.valid) {
          throw new Error(validationResult?.error || t("integrations.invalidCredentials"));
        }

        // Preparar shopUrl com sufixo
        let shopUrl = formField1;
        if (config.urlSuffix && !formField1.includes(config.urlSuffix)) {
          shopUrl = `${formField1}${config.urlSuffix}`;
        }

        // Conectar usando a Edge Function
        const { data: connectResult, error: connectError } = await supabase.functions.invoke("shopify-connect", {
          body: {
            shopUrl,
            accessToken: formField2,
          },
        });

        if (connectError) {
          console.error("Edge Function error:", connectError);
          throw new Error(t("integrations.errorConnectingShopify") + ": " + connectError.message);
        }

        if (connectResult?.error) {
          console.error("Error returned by function:", connectResult);
          throw new Error(connectResult.error + (connectResult.details ? " - " + connectResult.details : ""));
        }

        if (!connectResult?.success) {
          throw new Error(t("integrations.failedToConnectShopify"));
        }

        console.log("Shopify connected via Edge Function:", connectResult.client?.id);
      } else {
        // Para outras integrações, usa o método direto
        const { data: userRow } = await supabase
          .from("users")
          .select("client_id")
          .eq("id", user.id)
          .maybeSingle();

        const targetClientId = userRow?.client_id;
        if (!targetClientId) throw new Error(t("integrations.clientNotIdentified"));

        let field1Value = formField1;
        
        // Add URL suffix if configured
        if (config.urlSuffix && !formField1.includes(config.urlSuffix)) {
          field1Value = `${formField1}${config.urlSuffix}`;
        }

        const updateData: Record<string, string> = {
          [mapping.field1]: field1Value,
          [mapping.connectedAt]: new Date().toISOString(),
        };

        if (mapping.field2) {
          updateData[mapping.field2] = formField2;
        }

        console.log("Saving integration to database:", {
          id,
          targetClientId,
          updateData,
        });

        const { error } = await supabase
          .from("clients")
          .update(updateData)
          .eq("id", targetClientId);

        if (error) {
          console.error('Database update error:', error);
          throw error;
        }

        console.log("Integration saved successfully with status 'active'");
      }

      toast.success(t("integrations.settingsSaved"), {
        description: `${t("integrations.connectedSuccessfully")} ${selectedIntegration.name}. ${t("integrations.realDataAvailable")}`,
      });

      // Update local state
      const idsToUpdate = id === "shopify" ? ["shopify", "shopify-payments"] : 
                          id === "shopify-payments" ? ["shopify", "shopify-payments"] : [id];
      
      setConnectionStates(prev => {
        const newState = { ...prev };
        idsToUpdate.forEach(updateId => {
          newState[updateId] = true;
        });
        return newState;
      });

      setStatusStates(prev => {
        const newState = { ...prev };
        idsToUpdate.forEach(updateId => {
          newState[updateId] = 'active';
        });
        console.log('Local status state updated to active for:', idsToUpdate);
        console.log('New status states:', newState);
        return newState;
      });

      setIsSettingsOpen(false);
      
      console.log('Reloading client data to confirm save...');
      // Reload data to confirm save
      await loadClientData();

      console.log('Reloading page to reflect latest integration data...');
      // Recarregar a página para refletir os dados mais recentes da integração
      if (typeof window !== "undefined") {
        window.location.reload();
      }
    } catch (error: any) {
      toast.error(t("integrations.errorSaving"), {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const applyStatusFilter = (item: { connected?: boolean; comingSoon?: boolean }) => {
    if (statusFilter === "todos") return true;
    if (statusFilter === "conectado") return item.connected === true;
    if (statusFilter === "disponivel") return !item.connected && !item.comingSoon;
    if (statusFilter === "breve") return item.comingSoon === true;
    return true;
  };

  const filteredProcessors = paymentProcessors.filter((processor) => {
    const matchesSearch = processor.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "todas" || categoryFilter === "pagamento";
    const matchesStatus = applyStatusFilter(processor);
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const filteredPlatforms = platforms.filter((platform) => {
    const matchesSearch = platform.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "todas" || categoryFilter === "plataforma";
    const matchesStatus = applyStatusFilter(platform);
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const currentConfig = selectedIntegration ? integrationFormConfig[selectedIntegration.id] : null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader title={t("integrations.title")} subtitle={t("integrations.subtitle")} />

        {/* Filters Row */}
        <div className="flex items-center gap-3 flex-wrap justify-end">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder={t("integrations.searchPlaceholder")}
            inputClassName="w-[240px] bg-white border-[#DEDEDE] focus-visible:ring-[#1B966C]"
          />

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px] bg-white border-[#DEDEDE] px-3 focus:ring-gray-200 focus:ring-offset-0">
              <div className="flex items-center gap-1 truncate pr-3">
                <span className="text-[#6B7280] whitespace-nowrap">{t("integrations.category")}:</span>
                <span className="text-[#374151]">
                  {categoryFilter === "todas"
                    ? t("integrations.all")
                    : categoryFilter === "pagamento"
                      ? t("integrations.payment")
                      : t("integrations.platform")}
                </span>
              </div>
            </SelectTrigger>
            <SelectContent className="bg-white z-50 p-1">
              <SelectItem value="todas" className="text-[#374151] font-normal focus:font-medium focus:text-[#374151] focus:bg-[#F9F9F9] cursor-pointer outline-none rounded-sm px-2 py-1.5">
                {t("integrations.all")}
              </SelectItem>
              <SelectItem value="pagamento" className="text-[#374151] font-normal focus:font-medium focus:text-[#374151] focus:bg-[#F9F9F9] cursor-pointer outline-none rounded-sm px-2 py-1.5">
                {t("integrations.payment")}
              </SelectItem>
              <SelectItem value="plataforma" className="text-[#374151] font-normal focus:font-medium focus:text-[#374151] focus:bg-[#F9F9F9] cursor-pointer outline-none rounded-sm px-2 py-1.5">
                {t("integrations.platform")}
              </SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px] bg-white border-[#DEDEDE] px-3 focus:ring-gray-200 focus:ring-offset-0">
              <div className="flex items-center gap-1 truncate pr-3">
                <span className="text-[#6B7280] whitespace-nowrap">{t("integrations.statusLabel")}:</span>
                <span className="text-[#374151]">
                  {statusFilter === "todos"
                    ? t("integrations.all")
                    : statusFilter === "conectado"
                      ? t("integrations.connected")
                      : statusFilter === "disponivel"
                        ? t("integrations.available")
                        : t("integrations.comingSoon")}
                </span>
              </div>
            </SelectTrigger>
            <SelectContent className="bg-white z-50 p-1">
              <SelectItem value="todos" className="text-[#374151] font-normal focus:font-medium focus:text-[#374151] focus:bg-[#F9F9F9] cursor-pointer outline-none rounded-sm px-2 py-1.5">
                {t("integrations.all")}
              </SelectItem>
              <SelectItem value="conectado" className="text-[#374151] font-normal focus:font-medium focus:text-[#374151] focus:bg-[#F9F9F9] cursor-pointer outline-none rounded-sm px-2 py-1.5">
                {t("integrations.connected")}
              </SelectItem>
              <SelectItem value="disponivel" className="text-[#374151] font-normal focus:font-medium focus:text-[#374151] focus:bg-[#F9F9F9] cursor-pointer outline-none rounded-sm px-2 py-1.5">
                {t("integrations.available")}
              </SelectItem>
              <SelectItem value="breve" className="text-[#374151] font-normal focus:font-medium focus:text-[#374151] focus:bg-[#F9F9F9] cursor-pointer outline-none rounded-sm px-2 py-1.5">
                {t("integrations.comingSoon")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Platforms Section */}
        {categoryFilter !== "pagamento" && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-[#1F2937]">{t("integrations.platforms")}</h2>
              <p className="text-sm text-[#6B7280]">{t("integrations.platformsDesc")}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {filteredPlatforms.map((platform) => (
                <IntegrationCard
                  key={platform.id}
                  id={platform.id}
                  name={platform.name}
                  icon={platform.icon}
                  connected={platform.connected}
                  status={statusStates[platform.id]}
                  bgClass={platform.bgClass}
                  textClass={platform.textClass}
                  comingSoon={platform.comingSoon}
                  hasSettings={platform.hasSettings}
                  onOpenSettings={() => handleOpenSettings(platform.name, "platform", platform.id)}
                  onToggle={(newStatus) => handleToggleStatus(platform.id, newStatus)}
                  onDisconnect={() => handleDisconnect(platform.name, platform.id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Payment Processors Section */}
      {categoryFilter !== "plataforma" && (
        <div className="space-y-4 mt-10">
          <div>
            <h2 className="text-lg font-bold text-[#1F2937]">{t("integrations.paymentProcessors")}</h2>
            <p className="text-sm text-[#6B7280]">{t("integrations.paymentProcessorsDesc")}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {filteredProcessors.map((processor) => (
              <IntegrationCard
                key={processor.id}
                id={processor.id}
                name={processor.name}
                icon={processor.icon}
                connected={processor.connected}
                status={statusStates[processor.id]}
                bgClass={processor.bgClass}
                textClass={processor.textClass}
                comingSoon={processor.comingSoon}
                hasSettings={processor.hasSettings}
                onOpenSettings={() => handleOpenSettings(processor.name, "processor", processor.id)}
                onToggle={(newStatus) => handleToggleStatus(processor.id, newStatus)}
                onDisconnect={() => handleDisconnect(processor.name, processor.id)}
              />
            ))}
          </div>
        </div>
      )}

      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t("integrations.configureTitle")} {selectedIntegration?.name}
            </DialogTitle>
            <DialogDescription>
              {t("integrations.configureFill")} {selectedIntegration?.name}
            </DialogDescription>
          </DialogHeader>
          
          {currentConfig && (
            <div className="space-y-4 py-4">
              {/* Field 1 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="field1">{currentConfig.label1}</Label>
                  {currentConfig.hasHelpPopover && (
                    <Popover open={isHelpOpen} onOpenChange={setIsHelpOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-auto p-0 text-[#1B966C] hover:text-[#157a58] hover:bg-transparent">
                          <HelpCircle className="h-4 w-4" />
                          How to get?
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-96 space-y-3 translate-x-[10px] translate-y-[10px]" align="end" side="right">
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1">
                            <h4 className="font-semibold text-sm">How to get the Shopify Access Token</h4>
                            <p className="text-sm text-muted-foreground">
                              Go to Shopify Admin at{" "}
                              <a
                                href="https://admin.shopify.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-mono text-xs bg-muted px-1 py-0.5 rounded underline decoration-dashed underline-offset-4"
                              >
                                admin.shopify.com
                              </a>
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 -mt-1 text-muted-foreground hover:text-foreground"
                            onClick={() => setIsHelpOpen(false)}
                            aria-label="Close"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="rounded-md border bg-muted/40 px-2 py-4 space-y-3 text-sm">
                          <div className="font-medium text-foreground pl-2">Quick steps</div>
                          <ol className="list-decimal list-inside space-y-3 px-2">
                            <li><strong>Settings</strong> → <strong>Apps and sales channels</strong> → <strong>Develop apps</strong>.</li>
                            <li>
                              <strong>App development</strong> → <strong>Create an app</strong><br />
                              (e.g., Chargemind).
                            </li>
                            <li className="space-y-2">
                              <span className="inline">Configure <strong>Admin API scopes</strong> (see below):</span>
                              <div className="rounded-md border bg-background p-3 space-y-2">
                                <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"><strong>Admin API scopes</strong></div>
                                <div className="space-y-2">
                                  <div className="space-y-1.5">
                                    <div className="text-xs font-semibold text-foreground">Orders</div>
                                    <div className="flex flex-wrap gap-2">
                                      <ScopeChip value="write_orders" />
                                      <ScopeChip value="read_orders" />
                                    </div>
                                  </div>
                                  <div className="space-y-1.5">
                                    <div className="text-xs font-semibold text-foreground">Customers</div>
                                    <div className="flex flex-wrap gap-2">
                                      <ScopeChip value="write_customers" />
                                      <ScopeChip value="read_customers" />
                                    </div>
                                  </div>
                                  <div className="space-y-1.5">
                                    <div className="text-xs font-semibold text-foreground">Shopify Payments (disputes)</div>
                                    <div className="flex flex-wrap gap-2">
                                      <ScopeChip value="write_shopify_payments_disputes" />
                                      <ScopeChip value="read_shopify_payments_disputes" />
                                    </div>
                                  </div>
                                  <div className="space-y-1.5">
                                    <div className="text-xs font-semibold text-foreground">Shopify Payments (payouts)</div>
                                    <div className="flex flex-wrap gap-2">
                                      <ScopeChip value="read_shopify_payments_payouts" />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </li>
                            <li><strong>Save</strong> → <strong>API Credentials</strong> → <strong>Install app</strong>.</li>
                            <li><strong>Reveal token once</strong> → Copy the <strong>Admin API Access Token</strong>.</li>
                          </ol>
                        </div>
                      </PopoverContent>
                    </Popover>
                  )}
                </div>
                {currentConfig.isUrl ? (
                  <div className="flex items-center gap-0 border border-input rounded-md focus-within:ring-2 focus-within:ring-[#1b966c] focus-within:ring-offset-2">
                    <span className="pl-3 text-sm text-muted-foreground">https://</span>
                    <input
                      id="field1"
                      className="flex h-10 w-full bg-transparent px-2 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 border-0"
                      placeholder={currentConfig.placeholder1}
                      value={formField1}
                      onChange={(e) => {
                        let value = e.target.value;
                        value = value.replace(/^https?:\/\//, "");
                        if (currentConfig.urlSuffix) {
                          const match = value.match(/^([a-zA-Z0-9-]+)/);
                          value = match ? match[1] : "";
                        }
                        setFormField1(value);
                      }}
                    />
                    {currentConfig.urlSuffix && (
                      <span className="pr-3 text-sm text-muted-foreground">{currentConfig.urlSuffix}</span>
                    )}
                  </div>
                ) : (
                  <div className="relative">
                    <Input
                      id="field1"
                      type={showToken ? "text" : "password"}
                      placeholder={currentConfig.placeholder1}
                      value={formField1}
                      onChange={(e) => setFormField1(e.target.value)}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowToken(!showToken)}
                    >
                      {showToken ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                    </Button>
                  </div>
                )}
              </div>

              {/* Field 2 (if exists) */}
              {currentConfig.label2 && (
                <div className="space-y-2">
                  <Label htmlFor="field2">{currentConfig.label2}</Label>
                  <div className="relative">
                    <Input
                      id="field2"
                      type={showToken ? "text" : "password"}
                      placeholder={currentConfig.placeholder2}
                      value={formField2}
                      onChange={(e) => setFormField2(e.target.value)}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowToken(!showToken)}
                    >
                      {showToken ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <div className="flex justify-between gap-3">
            <Button
              variant="destructive"
              className="gap-2 bg-red-600 hover:bg-red-700 text-white"
              onClick={async () => {
                if (selectedIntegration) {
                  // Limpar os campos locais
                  setFormField1("");
                  setFormField2("");
                  // Fechar o modal
                  setIsSettingsOpen(false);
                  // Desconectar a integração
                  await handleDisconnect(selectedIntegration.name, selectedIntegration.id);
                }
              }}
              disabled={loading}
            >
              Remove
            </Button>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="gap-2 hover:bg-[#F1F1F1] hover:text-black"
                onClick={() => setIsSettingsOpen(false)}
                disabled={loading}
              >
                {t("settings.cancel")}
              </Button>
              <Button
                onClick={handleSaveSettings}
                disabled={loading}
                className="bg-[#1B966C] hover:bg-[#157a58] text-white"
              >
                {loading ? t("integrations.savingChanges") : t("integrations.saveChanges")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};
 
export default Integrations;
