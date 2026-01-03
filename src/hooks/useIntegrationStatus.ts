import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/safeClient";

export const useIntegrationStatus = () => {
  const [hasIntegration, setHasIntegration] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [clientId, setClientId] = useState<string | null>(null);

  useEffect(() => {
    checkIntegrationStatus();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        checkIntegrationStatus(session?.user?.id);
      }
      if (event === "SIGNED_OUT") {
        setHasIntegration(false);
        setClientId(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!clientId) return;

    const channel = supabase
      .channel(`client-integrations-${clientId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "clients", filter: `id=eq.${clientId}` },
        (payload) => {
          const next = payload.new as any;
          const hasAnyIntegration = checkAnyIntegration(next);
          setHasIntegration(hasAnyIntegration);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clientId]);

  const checkAnyIntegration = (data: any) => {
    // Only consider integrations that are connected AND active (not paused)
    // If status is null, treat as active for backward compatibility
    return !!(
      (data?.shopify_connected_at && (data?.shopify_status === 'active' || !data?.shopify_status)) ||
      (data?.woocommerce_connected_at && (data?.woocommerce_status === 'active' || !data?.woocommerce_status)) ||
      (data?.stripe_connected_at && (data?.stripe_status === 'active' || !data?.stripe_status)) ||
      (data?.paypal_connected_at && (data?.paypal_status === 'active' || !data?.paypal_status)) ||
      (data?.klarna_connected_at && (data?.klarna_status === 'active' || !data?.klarna_status)) ||
      (data?.airwallex_connected_at && (data?.airwallex_status === 'active' || !data?.airwallex_status)) ||
      (data?.woopayments_connected_at && (data?.woopayments_status === 'active' || !data?.woopayments_status)) ||
      (data?.braintree_connected_at && (data?.braintree_status === 'active' || !data?.braintree_status)) ||
      (data?.adyen_connected_at && (data?.adyen_status === 'active' || !data?.adyen_status)) ||
      (data?.wix_connected_at && (data?.wix_status === 'active' || !data?.wix_status)) ||
      (data?.magento_connected_at && (data?.magento_status === 'active' || !data?.magento_status))
    );
  };

  const checkIntegrationStatus = async (forcedUserId?: string) => {
    try {
      const { data: { user } } = forcedUserId
        ? await supabase.auth.getUser()
        : await supabase.auth.getUser();

      const effectiveUserId = forcedUserId || user?.id;
      if (!user) {
        setHasIntegration(false);
        setIsLoading(false);
        return;
      }

      // Buscar client_id do usuário
      const { data: userRow } = await supabase
        .from("users")
        .select("client_id")
        .eq("id", effectiveUserId)
        .maybeSingle();

      const clientId = userRow?.client_id;
      if (!clientId) {
        setHasIntegration(false);
        setIsLoading(false);
        return;
      }

      setClientId(clientId);

      // Buscar dados do cliente para verificar se há alguma integração conectada E ativa
      const { data, error } = await supabase
        .from("clients")
        .select(`
          shopify_connected_at, shopify_status,
          woocommerce_connected_at, woocommerce_status,
          stripe_connected_at, stripe_status,
          paypal_connected_at, paypal_status,
          klarna_connected_at, klarna_status,
          airwallex_connected_at, airwallex_status,
          woopayments_connected_at, woopayments_status,
          braintree_connected_at, braintree_status,
          adyen_connected_at, adyen_status,
          wix_connected_at, wix_status,
          magento_connected_at, magento_status
        `)
        .eq("id", clientId)
        .maybeSingle();

      if (error) {
        console.error("Error checking integration status:", error);
        setHasIntegration(false);
        setIsLoading(false);
        return;
      }

      if (!data) {
        setHasIntegration(false);
        setIsLoading(false);
        return;
      }

      // Verifica se há pelo menos uma integração conectada
      const hasAnyIntegration = checkAnyIntegration(data);

      setHasIntegration(hasAnyIntegration);
      setIsLoading(false);
    } catch (error) {
      console.error("Error checking integration status:", error);
      setHasIntegration(false);
      setIsLoading(false);
    }
  };

  return { hasIntegration, isLoading };
};
