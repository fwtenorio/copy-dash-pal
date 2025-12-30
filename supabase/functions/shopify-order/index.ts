import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      throw new Error("Supabase configuration missing");
    }

    const { shop, orderNumber, email } = await req.json();

    if (!shop) {
      throw new Error("Shop parameter is required");
    }

    if (!orderNumber && !email) {
      throw new Error("Order number or email is required");
    }

    console.log("Searching order - Shop:", shop, "Order:", orderNumber, "Email:", email);

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { data: clientData, error: clientError } = await supabase
      .from("clients")
      .select("id, shopify_store_name, shopify_access_token")
      .eq("shopify_store_name", shop)
      .maybeSingle();

    if (clientError || !clientData || !clientData.shopify_access_token) {
      throw new Error("Shopify integration not configured");
    }

    console.log("Client found:", clientData.shopify_store_name);

    let shopifyQuery = "";
    if (orderNumber && email) {
      shopifyQuery = "name:" + orderNumber + " AND email:" + email;
    } else if (orderNumber) {
      shopifyQuery = "name:" + orderNumber;
    } else if (email) {
      shopifyQuery = "email:" + email;
    }

    const shopifyUrl = "https://" + clientData.shopify_store_name + "/admin/api/2024-01/orders.json?status=any&query=" + encodeURIComponent(shopifyQuery) + "&limit=1";

    console.log("Calling Shopify API:", shopifyUrl);

    const shopifyResponse = await fetch(shopifyUrl, {
      headers: {
        "X-Shopify-Access-Token": clientData.shopify_access_token,
        "Content-Type": "application/json",
      },
    });

    if (!shopifyResponse.ok) {
      const errorText = await shopifyResponse.text();
      console.error("Shopify API error:", shopifyResponse.status, "-", errorText);
      throw new Error("Failed to fetch order from Shopify");
    }

    const shopifyData = await shopifyResponse.json();
    const orders = shopifyData.orders || [];

    if (orders.length === 0) {
      console.log("Order not found");
      return new Response(
        JSON.stringify({ found: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let shopifyOrder = orders[0];
    console.log("Order found:", shopifyOrder.name);
    console.log("Order ID:", shopifyOrder.id);
    
    // Fazer uma segunda chamada para obter detalhes completos do pedido
    // Isso garante que todos os campos do endereço sejam retornados
    const orderDetailUrl = "https://" + clientData.shopify_store_name + "/admin/api/2024-01/orders/" + shopifyOrder.id + ".json";
    console.log("Fetching order details:", orderDetailUrl);
    
    try {
      const orderDetailResponse = await fetch(orderDetailUrl, {
        headers: {
          "X-Shopify-Access-Token": clientData.shopify_access_token,
          "Content-Type": "application/json",
        },
      });
      
      if (orderDetailResponse.ok) {
        const orderDetailData = await orderDetailResponse.json();
        if (orderDetailData.order) {
          shopifyOrder = orderDetailData.order;
          console.log("Order details fetched successfully (REST API)");
          console.log("Full order structure (shipping_address):", JSON.stringify(shopifyOrder.shipping_address, null, 2));
          console.log("Full order structure (billing_address):", JSON.stringify(shopifyOrder.billing_address, null, 2));
          
          // Se ainda não temos address1/city/zip, tenta GraphQL API
          const shipping = shopifyOrder.shipping_address || {};
          if (!shipping.address1 && !shipping.city && !shipping.zip) {
            console.log("Address fields missing, trying GraphQL API...");
            try {
              const graphqlQuery = {
                query: `
                  query getOrder($id: ID!) {
                    order(id: $id) {
                      shippingAddress {
                        address1
                        address2
                        city
                        province
                        provinceCode
                        country
                        zip
                      }
                      billingAddress {
                        address1
                        address2
                        city
                        province
                        provinceCode
                        country
                        zip
                      }
                    }
                  }
                `,
                variables: {
                  id: `gid://shopify/Order/${shopifyOrder.id}`
                }
              };
              
              const graphqlUrl = "https://" + clientData.shopify_store_name + "/admin/api/2024-01/graphql.json";
              const graphqlResponse = await fetch(graphqlUrl, {
                method: "POST",
                headers: {
                  "X-Shopify-Access-Token": clientData.shopify_access_token,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(graphqlQuery),
              });
              
              if (graphqlResponse.ok) {
                const graphqlData = await graphqlResponse.json();
                console.log("GraphQL response:", JSON.stringify(graphqlData, null, 2));
                
                // Mesmo com erros de permissão, podemos ter dados parciais em graphqlData.data
                if (graphqlData.data && graphqlData.data.order) {
                  const gqlShipping = graphqlData.data.order.shippingAddress;
                  const gqlBilling = graphqlData.data.order.billingAddress;
                  
                  console.log("GraphQL shipping_address:", JSON.stringify(gqlShipping, null, 2));
                  console.log("GraphQL billing_address:", JSON.stringify(gqlBilling, null, 2));
                  
                  // Função auxiliar para atualizar apenas campos não-null
                  const updateAddress = (target: any, source: any) => {
                    if (!source) return target;
                    const updated = { ...target };
                    // Atualiza apenas campos que não são null/undefined
                    if (source.address1 !== null && source.address1 !== undefined) updated.address1 = source.address1;
                    if (source.address2 !== null && source.address2 !== undefined) updated.address2 = source.address2;
                    if (source.city !== null && source.city !== undefined) updated.city = source.city;
                    if (source.province !== null && source.province !== undefined) updated.province = source.province;
                    if (source.provinceCode !== null && source.provinceCode !== undefined) updated.province_code = source.provinceCode;
                    if (source.country !== null && source.country !== undefined) updated.country = source.country;
                    if (source.zip !== null && source.zip !== undefined) updated.zip = source.zip;
                    return updated;
                  };
                  
                  // Atualiza os endereços com dados do GraphQL (mesmo que parciais)
                  if (gqlShipping) {
                    shopifyOrder.shipping_address = updateAddress(
                      shopifyOrder.shipping_address || {},
                      gqlShipping
                    );
                  }
                  
                  if (gqlBilling) {
                    shopifyOrder.billing_address = updateAddress(
                      shopifyOrder.billing_address || {},
                      gqlBilling
                    );
                  }
                  
                  console.log("Updated shipping_address:", JSON.stringify(shopifyOrder.shipping_address, null, 2));
                  console.log("Updated billing_address:", JSON.stringify(shopifyOrder.billing_address, null, 2));
                  
                  // Log de aviso se houver erros de permissão mas ainda temos dados
                  if (graphqlData.errors && graphqlData.errors.length > 0) {
                    console.log("GraphQL API returned partial data due to permission restrictions (PII access requires Shopify Plus/Advanced plan)");
                  }
                }
              } else {
                const errorText = await graphqlResponse.text();
                console.log("GraphQL API error:", graphqlResponse.status, "-", errorText);
              }
            } catch (graphqlError) {
              console.log("GraphQL API error:", graphqlError);
            }
          }
        }
      } else {
        console.log("Failed to fetch order details, using initial order data");
        console.log("Full order structure (shipping_address):", JSON.stringify(shopifyOrder.shipping_address, null, 2));
        console.log("Full order structure (billing_address):", JSON.stringify(shopifyOrder.billing_address, null, 2));
      }
    } catch (error) {
      console.log("Error fetching order details:", error);
      console.log("Using initial order data");
      console.log("Full order structure (shipping_address):", JSON.stringify(shopifyOrder.shipping_address, null, 2));
      console.log("Full order structure (billing_address):", JSON.stringify(shopifyOrder.billing_address, null, 2));
    }
    
    console.log("Order keys:", Object.keys(shopifyOrder));

    const mappedOrder = {
      orderNumber: shopifyOrder.name.replace("#", ""),
      email: shopifyOrder.email || (shopifyOrder.customer ? shopifyOrder.customer.email : "") || "",
      customerName: (shopifyOrder.customer && shopifyOrder.customer.first_name && shopifyOrder.customer.last_name)
        ? shopifyOrder.customer.first_name + " " + shopifyOrder.customer.last_name
        : (shopifyOrder.customer ? shopifyOrder.customer.email : "") || "Customer",
      status: mapShopifyStatus(shopifyOrder.fulfillment_status, shopifyOrder.financial_status),
      orderDate: new Date(shopifyOrder.created_at).toLocaleDateString("pt-BR"),
      totalAmount: formatCurrency(parseFloat(shopifyOrder.total_price), shopifyOrder.currency || "USD"),
      shippingAddress: (() => {
        console.log("Raw shipping_address:", JSON.stringify(shopifyOrder.shipping_address));
        console.log("Raw billing_address:", JSON.stringify(shopifyOrder.billing_address));
        
        // Tenta múltiplas fontes de endereço em ordem de prioridade:
        // 1. shipping_address
        // 2. billing_address  
        // 3. customer.default_address (endereço padrão do cliente)
        const shipping = shopifyOrder.shipping_address || {};
        const billing = shopifyOrder.billing_address || {};
        const customerDefault = (shopifyOrder.customer && shopifyOrder.customer.default_address) || {};
        
        console.log("Customer default_address:", JSON.stringify(customerDefault));
        
        // Cria objeto combinado com prioridade: shipping > billing > customer.default_address
        const combinedAddress = {
          address1: shipping.address1 || billing.address1 || customerDefault.address1 || "",
          address2: shipping.address2 || billing.address2 || customerDefault.address2 || "",
          city: shipping.city || billing.city || customerDefault.city || "",
          province: shipping.province || billing.province || customerDefault.province || "",
          province_code: shipping.province_code || billing.province_code || customerDefault.province_code || "",
          country: shipping.country || billing.country || customerDefault.country || "",
          zip: shipping.zip || billing.zip || customerDefault.zip || "",
        };
        
        console.log("Combined address:", JSON.stringify(combinedAddress));
        return formatShippingAddress(combinedAddress);
      })(),
      carrier: (shopifyOrder.fulfillments && shopifyOrder.fulfillments[0]) ? shopifyOrder.fulfillments[0].tracking_company : "Not available",
      trackingNumber: (shopifyOrder.fulfillments && shopifyOrder.fulfillments[0]) ? shopifyOrder.fulfillments[0].tracking_number : undefined,
      deliveryDate: (shopifyOrder.fulfillments && shopifyOrder.fulfillments[0] && shopifyOrder.fulfillments[0].updated_at)
        ? new Date(shopifyOrder.fulfillments[0].updated_at).toLocaleDateString("pt-BR")
        : undefined,
      deliveryTime: (shopifyOrder.fulfillments && shopifyOrder.fulfillments[0] && shopifyOrder.fulfillments[0].updated_at)
        ? shopifyOrder.fulfillments[0].updated_at // Timestamp ISO completo (formato 17track)
        : undefined,
      items: (shopifyOrder.line_items || []).map((item: any) => ({
        name: item.title,
        quantity: item.quantity,
        price: formatCurrency(parseFloat(item.price), shopifyOrder.currency || "USD"),
        image: item.product_id ? "https://via.placeholder.com/80" : undefined,
      })),
    };

    return new Response(
      JSON.stringify({ found: true, order: mappedOrder }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

// Função para formatar valor monetário baseado na moeda do pedido
function formatCurrency(amount: number, currencyCode: string): string {
  const currency = currencyCode.toUpperCase();
  
  // Formatação baseada no código da moeda
  switch (currency) {
    case "USD":
      return "$" + amount.toFixed(2);
    case "EUR":
      return "€" + amount.toFixed(2).replace(".", ",");
    case "BRL":
      return "R$ " + amount.toFixed(2).replace(".", ",");
    case "GBP":
      return "£" + amount.toFixed(2);
    case "CAD":
      return "C$" + amount.toFixed(2);
    case "AUD":
      return "A$" + amount.toFixed(2);
    case "JPY":
      return "¥" + Math.round(amount).toString();
    case "MXN":
      return "MX$" + amount.toFixed(2);
    case "CHF":
      return "CHF " + amount.toFixed(2);
    default:
      // Formatação genérica: código da moeda + valor
      return currency + " " + amount.toFixed(2);
  }
}

function mapShopifyStatus(fulfillmentStatus: string | null, financialStatus: string): "delivered" | "in_transit" | "cancelled" {
  if (financialStatus === "refunded" || financialStatus === "voided") {
    return "cancelled";
  }
  
  if (fulfillmentStatus === "fulfilled") {
    return "delivered";
  }
  
  if (fulfillmentStatus === "partial" || fulfillmentStatus === "in_progress") {
    return "in_transit";
  }
  
  return "in_transit";
}

function formatShippingAddress(address: any): string {
  if (!address) {
    console.log("Shipping address is null or undefined");
    return "Address not available";
  }
  
  console.log("Shipping address data:", JSON.stringify(address));
  
  // Função auxiliar para verificar se um valor é válido (não null, undefined ou string vazia)
  const isValid = (value: any): boolean => {
    return value !== null && value !== undefined && value !== "" && String(value).trim() !== "";
  };
  
  const parts: string[] = [];
  
  // Adiciona cada parte apenas se for válida (ordem: rua, complemento, cidade, estado, país, CEP)
  if (isValid(address.address1)) parts.push(String(address.address1).trim());
  if (isValid(address.address2)) parts.push(String(address.address2).trim());
  if (isValid(address.city)) parts.push(String(address.city).trim());
  
  // Estado: tenta province primeiro (nome completo), depois province_code (código)
  if (isValid(address.province)) {
    parts.push(String(address.province).trim());
  } else if (isValid(address.province_code)) {
    parts.push(String(address.province_code).trim());
  }
  
  // País
  if (isValid(address.country)) parts.push(String(address.country).trim());
  
  // CEP (sempre no final)
  if (isValid(address.zip)) parts.push(String(address.zip).trim());
  
  // Se temos pelo menos algum dado (mesmo que só province e country), retorna formatado
  // Caso contrário, retorna mensagem padrão
  const formatted = parts.length > 0 ? parts.join(", ") : "Address not available";
  console.log("Formatted address:", formatted);
  
  return formatted;
}
