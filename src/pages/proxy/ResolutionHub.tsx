import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  CheckCircle, 
  ShieldCheck, 
  FileText, 
  RefreshCw, 
  Package,
  RotateCcw,
  ThumbsDown,
  AlertTriangle,
  Check,
  Clock,
  Mail,
  Copy,
  Store,
  CreditCard,
  ChevronRight,
  Upload,
  Info,
  XCircle,
  ExternalLink
} from "lucide-react";
import { supabase } from "@/integrations/supabase/safeClient";
import { toast, Toaster as Sonner } from "sonner";
import { ItemNotReceivedFlow } from "@/components/ItemNotReceivedFlow";

// ============================================================================
// CENTRALIZED USER-FACING MESSAGES (English)
// ============================================================================
const CM_MESSAGES = {
  VALIDATION: {
    EMPTY: "Please enter at least one piece of information (Order Number or Email) so we can locate your purchase.",
    NOT_FOUND: "We couldn't find an order with those details. Please double-check the order number or try using the email used during checkout.",
    AUTH_ERROR: "Please check your order number and email address. Make sure you are using the same email entered at checkout.",
    MAX_ATTEMPTS: "Too many unsuccessful attempts. For your security, please contact our support team directly via chat or email."
  },
  EVIDENCE: {
    MISSING_PHOTO: "To process your request quickly, please attach at least one photo of the product.",
    MISSING_DESC: "Please provide a brief description of what happened. This helps our team reach a resolution faster.",
    MISSING_FIELD: "Please answer all the security questions above to proceed with your claim.",
    DESC_TOO_SHORT: "Could you provide a bit more detail? (Minimum 10 characters required)"
  },
  SUBMISSION: {
    GENERIC_ERROR: "There was an error registering your request in ChargeMind. Don't worry, your data hasn't been lost. Please try submitting again.",
    UPLOAD_FAILED: "We couldn't upload your photos. Please check your internet connection and try again."
  }
};

type StoreSettings = {
  shop?: string;
  brand_color?: string;
  brand_text_color?: string;
  logo_url?: string;
  heading?: string;
  button_label?: string;
  nome_empresa?: string;
};

const mockSettings: StoreSettings = {
  shop: "demo-shop.myshopify.com",
  brand_color: "#1B966C",
  brand_text_color: "#FFFFFF",
  logo_url: undefined,
  heading: "Need help with your order?",
  button_label: "Locate order",
  nome_empresa: "Sua Loja",
};

function resolveSettings(): StoreSettings {
  const data = (window as Window & { CHARGEMIND_DATA?: unknown }).CHARGEMIND_DATA;
  
  console.log("🔍 resolveSettings - CHARGEMIND_DATA:", data);
  
  if (data && typeof data === "object" && "branding" in data) {
    const branding = (data as { branding?: StoreSettings }).branding;
    
    console.log("🔍 resolveSettings - branding encontrado:", branding);
    
    if (branding && typeof branding === "object") {
      // Verifica se o objeto branding não está vazio
      const hasBrandingData = Object.keys(branding).length > 0;
      
      if (hasBrandingData) {
        const hasBrandColor = branding.brand_color != null && String(branding.brand_color).trim() !== "";
        const hasBrandTextColor = branding.brand_text_color != null && String(branding.brand_text_color).trim() !== "";
        const hasLogoUrl = branding.logo_url != null && String(branding.logo_url).trim() !== "";
        const hasHeading = branding.heading != null && String(branding.heading).trim() !== "";
        const hasNomeEmpresa = branding.nome_empresa != null && String(branding.nome_empresa).trim() !== "";
        
        // IMPORTANTE: Aplica valores do branding primeiro, depois sobrescreve com valores validados
        // Isso garante que valores null/vazios do branding não sobrescrevam os fallbacks
        const resolved: StoreSettings = { 
          ...mockSettings,
          // Aplica todos os campos do branding primeiro
          ...(hasBrandColor ? { brand_color: String(branding.brand_color).trim() } : {}),
          ...(hasBrandTextColor ? { brand_text_color: String(branding.brand_text_color).trim() } : {}),
          ...(hasLogoUrl ? { logo_url: String(branding.logo_url).trim() } : {}),
          ...(hasHeading ? { heading: String(branding.heading).trim() } : hasNomeEmpresa ? { heading: `${String(branding.nome_empresa).trim()} - Need help?` } : {}),
          ...(hasNomeEmpresa ? { nome_empresa: String(branding.nome_empresa).trim() } : {}),
          // Aplica outros campos do branding que não são cores/logo
          ...(branding.button_label ? { button_label: String(branding.button_label).trim() } : {}),
          ...(branding.shop ? { shop: String(branding.shop).trim() } : {}),
        };
        
        console.log("🔍 resolveSettings - settings resolvidos:", resolved);
        console.log("🔍 resolveSettings - brand_color final:", resolved.brand_color);
        console.log("🔍 resolveSettings - brand_text_color final:", resolved.brand_text_color);
        
        return resolved;
      } else {
        console.warn("⚠️ resolveSettings - branding é um objeto vazio, usando mockSettings");
      }
    } else {
      console.warn("⚠️ resolveSettings - branding existe mas não é um objeto válido:", branding);
    }
  } else {
    console.warn("⚠️ resolveSettings - CHARGEMIND_DATA não contém branding:", {
      hasData: !!data,
      dataType: typeof data,
      hasBranding: data && typeof data === "object" ? "branding" in data : false,
    });
  }
  
  console.log("🔍 resolveSettings - retornando mockSettings (fallback)");
  return mockSettings;
}

async function fetchBrandingFromSupabase(): Promise<Partial<StoreSettings>> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return {};

    const { data: userRow } = await supabase
      .from("users")
      .select("client_id")
      .eq("id", user.id)
      .maybeSingle();

    if (!userRow?.client_id) return {};

    const { data: clientData } = await supabase
      .from("clients")
      .select("*")
      .eq("id", userRow.client_id)
      .maybeSingle();

    if (!clientData) return {};

    const result: Partial<StoreSettings> = {};
    const client = clientData as any;
    
    if (client.brand_color) result.brand_color = client.brand_color;
    if (client.brand_text_color) result.brand_text_color = client.brand_text_color;
    if (client.logo_url) result.logo_url = client.logo_url;
    if (client.nome_empresa) {
      result.heading = `${client.nome_empresa} - Precisa de ajuda?`;
      result.nome_empresa = client.nome_empresa;
    }

    return result;
  } catch (error) {
    console.error("Failed to fetch branding:", error);
    return {};
  }
}

// Funções auxiliares para trabalhar com moedas dinâmicas
function extractCurrencySymbol(amountString: string): string {
  // Extrai o símbolo/código da moeda (ex: "$", "R$", "€", "£", etc.)
  const match = amountString.match(/^([^0-9\s]+)/);
  return match ? match[1].trim() : "$";
}

function extractNumericValue(amountString: string): number {
  // Remove símbolos de moeda e formatação, retorna valor numérico
  return parseFloat(
    amountString
      .replace(/[^0-9.,]/g, "") // Remove tudo exceto números, ponto e vírgula
      .replace(",", ".") // Substitui vírgula por ponto
  ) || 0;
}

function formatCurrencyValue(value: number, currencySymbol: string): string {
  // Formata um valor numérico com o símbolo da moeda
  const formatted = value.toFixed(2);
  
  // Se o símbolo contém vírgula (como R$), usa vírgula como separador decimal
  if (currencySymbol.includes("R$") || currencySymbol.includes("€")) {
    return `${currencySymbol}${formatted.replace(".", ",")}`;
  }
  
  // Para outras moedas, usa ponto como separador decimal
  return `${currencySymbol}${formatted}`;
}

// Função para formatar data ISO para DD/MM/YYYY
function formatOrderDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString; // Retorna original se inválida
    }
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateString;
  }
}

// Função para formatar moeda baseada no código da moeda
function formatCurrency(amount: number, currency: string): string {
  try {
    const currencyUpper = currency.toUpperCase();
    
    // Determina o locale baseado na moeda
    let locale = 'en-US';
    if (currencyUpper === 'BRL') locale = 'pt-BR';
    else if (currencyUpper === 'EUR') locale = 'de-DE';
    else if (currencyUpper === 'GBP') locale = 'en-GB';
    
    // Tenta usar Intl.NumberFormat para formatação automática
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyUpper,
    }).format(amount);
  } catch {
    // Fallback: formatação manual
    const formatted = amount.toFixed(2);
    const currencySymbol = getCurrencySymbol(currency);
    
    if (currency.toUpperCase() === 'BRL' || currency.toUpperCase() === 'EUR') {
      return `${currencySymbol}${formatted.replace(".", ",")}`;
    }
    
    return `${currencySymbol}${formatted}`;
  }
}

// Função auxiliar para obter símbolo da moeda
function getCurrencySymbol(currency: string): string {
  const currencyMap: Record<string, string> = {
    'USD': '$',
    'EUR': '€',
    'BRL': 'R$',
    'GBP': '£',
    'CAD': 'C$',
    'AUD': 'A$',
    'JPY': '¥',
    'MXN': 'MX$',
    'CHF': 'CHF',
  };
  
  return currencyMap[currency.toUpperCase()] || currency.toUpperCase();
}

type OrderStatus = "delivered" | "in_transit" | "cancelled" | "refunded" | "pending";
type ResolutionRoute = "not_received" | "defect" | "regret" | "cancel" | "fraud" | null;
type ResolutionDecision = "credit" | "refund" | null;
type CurrentStep = 1 | 2 | 3 | 4 | 5 | 6;

// Interface Order - Suporta tanto dados formatados quanto dados brutos da API
type Order = {
  // Formato atual (dados já formatados)
  orderNumber?: string;
  email: string;
  customerName: string;
  status: OrderStatus;
  orderDate?: string; // String formatada (DD/MM/YYYY)
  totalAmount?: string; // String formatada ($125.00)
  shippingAddress?: string;
  address?: string; // Alias para shippingAddress (formato API)
  carrier?: string;
  trackingNumber?: string;
  trackingUrl?: string; // Link direto para rastreamento na transportadora
  trackingCode?: string; // Código visual de rastreamento (ex: BR123456)
  deliveryDate?: string; // String formatada (DD/MM/YYYY) - mantido para compatibilidade
  deliveryTime?: string; // Timestamp ISO completo com hora (formato 17track: 2024-12-10T14:30:00-03:00)
  items: Array<{
    name: string;
    quantity: number;
    price?: string | number; // String formatada ou número (da API)
    image?: string;
  }>;
  // Formato API (dados brutos)
  id?: string; // Ex: "#1234" ou "1234"
  createdAt?: string; // ISO string (2024-03-12T10:00:00Z)
  total?: number; // Valor numérico final
  currency?: string; // Código da moeda (USD, BRL, EUR, etc.)
  // Breakdown de valores (para exibição detalhada)
  subtotal?: number; // Soma dos produtos (sem frete/desconto)
  shippingCost?: number; // Custo do envio
  discount?: number; // Desconto aplicado (opcional, só renderizar se > 0)
};

// Mock orders for simulation - TODOS OS 10 PEDIDOS DAS DISPUTAS MOCKADAS
const mockOrders: Order[] = [
  {
    orderNumber: "1234",
    email: "maria.silva@exemplo.com",
    customerName: "Maria Silva",
    status: "delivered",
    orderDate: "12/03/2024",
    totalAmount: "$125.00",
    shippingAddress: "Av. Rio Branco, 123, Apto 45 - Itapira, São Paulo - Brazil - 13970-000",
    carrier: "Standard Shipping",
    trackingNumber: "BR123456789BR",
    trackingUrl: "https://www.correios.com.br/enviar/rastreamento?objeto=BR123456789BR",
    trackingCode: "BR123456789BR",
    deliveryDate: "12/10/2024",
    deliveryTime: "2024-12-10T14:30:00-03:00", // Timestamp completo formato 17track
    currency: "USD",
    subtotal: 115.00,
    shippingCost: 10.00,
    total: 125.00,
    items: [
      { name: "Premium Watch - Silver", quantity: 1, price: "$115.00", image: "https://via.placeholder.com/80" },
    ],
  },
  {
    orderNumber: "1235",
    email: "joao.santos@exemplo.com",
    customerName: "João Santos",
    status: "delivered",
    orderDate: "11/28/2024",
    totalAmount: "$89.50",
    shippingAddress: "Rua das Acácias, 456, Bloco B - Campinas, São Paulo - Brazil - 13050-000",
    carrier: "Express Delivery",
    trackingNumber: "BR987654321BR",
    deliveryDate: "12/05/2024",
    deliveryTime: "2024-12-05T10:15:00-03:00", // Timestamp completo formato 17track
    currency: "USD",
    subtotal: 79.90,
    shippingCost: 9.60,
    total: 89.50,
    items: [
      { name: "Leather Wallet - Brown", quantity: 1, price: "$79.90", image: "https://via.placeholder.com/80" },
    ],
  },
  {
    orderNumber: "1236",
    email: "ana.costa@exemplo.com",
    customerName: "Ana Costa",
    status: "delivered",
    orderDate: "11/08/2024",
    totalAmount: "$245.00",
    shippingAddress: "Av. Paulista, 1578, Apto 102 - São Paulo, São Paulo - Brazil - 01310-200",
    carrier: "Same Day Delivery",
    trackingNumber: "SP123ABC456",
    deliveryDate: "12/13/2024",
    deliveryTime: "2024-12-13T16:45:00-03:00", // Timestamp completo formato 17track
    currency: "USD",
    subtotal: 229.90,
    shippingCost: 15.10,
    total: 245.00,
    items: [
      { name: "Designer Sunglasses - Black", quantity: 1, price: "$229.90", image: "https://via.placeholder.com/80" },
    ],
  },
  {
    orderNumber: "1237",
    email: "pedro.costa@exemplo.com",
    customerName: "Pedro Costa",
    status: "refunded",
    orderDate: "10/29/2024",
    totalAmount: "$59.80",
    shippingAddress: "Rua das Palmeiras, 789 - Belo Horizonte, Minas Gerais - Brazil - 30130-000",
    carrier: "Standard Shipping",
    trackingNumber: undefined,
    deliveryDate: undefined,
    deliveryTime: undefined, // Refunded - sem entrega
    currency: "USD",
    subtotal: 59.80,
    shippingCost: 0, // Frete grátis para teste
    total: 59.80,
    items: [
      { name: "Phone Case - Blue", quantity: 1, price: "$59.80", image: "https://via.placeholder.com/80" },
    ],
  },
  {
    orderNumber: "1238",
    email: "carla.mendes@exemplo.com",
    customerName: "Carla Mendes",
    status: "delivered",
    orderDate: "11/23/2024",
    totalAmount: "$156.40",
    shippingAddress: "Rua dos Jacarandás, 321 - Curitiba, Paraná - Brazil - 80010-000",
    carrier: "Express Delivery",
    trackingNumber: "BR456789123BR",
    deliveryDate: "11/30/2024",
    deliveryTime: "2024-11-30T11:20:00-03:00", // Timestamp completo formato 17track
    currency: "USD",
    subtotal: 139.90,
    shippingCost: 16.50,
    total: 156.40,
    items: [
      { name: "Wireless Headphones - Black", quantity: 1, price: "$139.90", image: "https://via.placeholder.com/80" },
    ],
  },
  {
    orderNumber: "1239",
    email: "lucas.almeida@exemplo.com",
    customerName: "Lucas Almeida",
    status: "in_transit",
    orderDate: "12/10/2024",
    totalAmount: "$89.00",
    shippingAddress: "Av. Atlântica, 567 - Rio de Janeiro, Rio de Janeiro - Brazil - 22010-000",
    carrier: "Standard Shipping",
    trackingNumber: "RJ789456123BR",
    trackingUrl: "https://www.correios.com.br/enviar/rastreamento?objeto=RJ789456123BR",
    trackingCode: "RJ789456123BR",
    deliveryDate: undefined,
    deliveryTime: undefined, // in_transit - ainda não entregue
    currency: "USD",
    subtotal: 79.90,
    shippingCost: 9.10,
    total: 89.00,
    items: [
      { name: "Fitness Tracker - Red", quantity: 1, price: "$79.90", image: "https://via.placeholder.com/80" },
    ],
  },
  {
    orderNumber: "1240",
    email: "fernanda.rocha@exemplo.com",
    customerName: "Fernanda Rocha",
    status: "in_transit",
    orderDate: "11/18/2024",
    totalAmount: "$342.50",
    shippingAddress: "Rua Augusta, 1234 - São Paulo, São Paulo - Brazil - 01304-001",
    carrier: "Same Day Delivery",
    trackingNumber: "SP987DEF654",
    trackingUrl: "https://www.correios.com.br/enviar/rastreamento?objeto=SP987DEF654",
    trackingCode: "SP987DEF654",
    deliveryDate: undefined,
    deliveryTime: undefined, // in_transit - ainda não entregue
    currency: "USD",
    subtotal: 329.70, // 159.90 + 79.90 + 89.90
    shippingCost: 12.80,
    total: 342.50,
    items: [
      { name: "Laptop Stand - Silver", quantity: 1, price: "$159.90", image: "https://via.placeholder.com/80" },
      { name: "Wireless Mouse - White", quantity: 1, price: "$79.90", image: "https://via.placeholder.com/80" },
      { name: "USB-C Hub - Gray", quantity: 1, price: "$89.90", image: "https://via.placeholder.com/80" },
    ],
  },
  {
    orderNumber: "1241",
    email: "roberto.lima@exemplo.com",
    customerName: "Roberto Lima",
    status: "pending",
    orderDate: "12/15/2024",
    totalAmount: "$198.00",
    shippingAddress: "Rua das Flores, 456 - Porto Alegre, Rio Grande do Sul - Brazil - 90010-000",
    carrier: "Standard Shipping",
    trackingNumber: undefined,
    trackingUrl: "https://www.correios.com.br/enviar/rastreamento?objeto=BR123456789BR",
    trackingCode: "BR123456789BR",
    deliveryDate: undefined,
    deliveryTime: undefined, // pending - ainda não enviado
    currency: "USD",
    subtotal: 178.90,
    shippingCost: 19.10,
    total: 198.00,
    items: [
      { name: "Gaming Keyboard - RGB", quantity: 1, price: "$178.90", image: "https://via.placeholder.com/80" },
    ],
  },
  {
    orderNumber: "1242",
    email: "juliana.ferreira@exemplo.com",
    customerName: "Juliana Ferreira",
    status: "delivered",
    orderDate: "11/05/2024",
    totalAmount: "$423.50",
    shippingAddress: "Av. Brigadeiro Faria Lima, 2000 - São Paulo, São Paulo - Brazil - 01452-000",
    carrier: "Express Delivery",
    trackingNumber: "SP321GHI789",
    deliveryDate: "11/12/2024",
    deliveryTime: "2024-11-12T09:00:00-03:00", // Timestamp completo formato 17track
    currency: "USD",
    subtotal: 399.90,
    shippingCost: 23.60,
    total: 423.50,
    items: [
      { name: "Smart Watch - Black", quantity: 1, price: "$399.90", image: "https://via.placeholder.com/80" },
    ],
  },
  {
    orderNumber: "1243",
    email: "marcos.santos@exemplo.com",
    customerName: "Marcos Santos",
    status: "delivered",
    orderDate: "11/25/2024",
    totalAmount: "$178.60",
    shippingAddress: "Rua XV de Novembro, 678 - Curitiba, Paraná - Brazil - 80020-000",
    carrier: "Standard Shipping",
    trackingNumber: "PR654JKL321BR",
    deliveryDate: "12/02/2024",
    deliveryTime: "2024-12-02T15:30:00-03:00", // Timestamp completo formato 17track
    currency: "USD",
    subtotal: 159.90,
    shippingCost: 18.70,
    total: 178.60,
    items: [
      { name: "Bluetooth Speaker - Blue", quantity: 1, price: "$159.90", image: "https://via.placeholder.com/80" },
    ],
  },
];

function classNames(...values: Array<string | boolean | undefined>) {
  return values.filter(Boolean).join(" ");
}

function hexToRgba(hex: string, alpha: number) {
  const normalized = hex.replace("#", "");
  const bigint = parseInt(normalized.length === 3 ? normalized.split("").map((c) => c + c).join("") : normalized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Função para misturar cor com branco (sem transparência)
// percent: porcentagem da cor original (0.06 = 6%)
function mixWithWhite(hex: string, percent: number): string {
  const normalized = hex.replace("#", "");
  const bigint = parseInt(normalized.length === 3 ? normalized.split("").map((c) => c + c).join("") : normalized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  
  // Misturar com branco (255, 255, 255)
  const mixedR = Math.round(r * percent + 255 * (1 - percent));
  const mixedG = Math.round(g * percent + 255 * (1 - percent));
  const mixedB = Math.round(b * percent + 255 * (1 - percent));
  
  return `rgb(${mixedR}, ${mixedG}, ${mixedB})`;
}

/* ============================================================================
   🎨 GUIA VISUAL COMPLETO DO RESOLUTION HUB
   ============================================================================
   
   Este componente usa um sistema de design baseado em Tailwind CSS.
   Abaixo estão TODAS as configurações visuais para facilitar edições futuras.
   
   📐 ESTRUTURA E LAYOUT
   ============================================================================ */
   
   // Container Principal:
   // - max-w-2xl (672px máximo) → Edite para tornar mais largo/estreito
   // - mx-auto (centralizado) → Sempre centralizado
   // - px-4 (16px padding lateral) → Respiro lateral no mobile
   // - py-8 (32px padding vertical) → Espaço top/bottom
   
   // Card Principal:
   // - p-6 (24px padding) mobile
   // - md:p-8 (32px padding) desktop
   // - rounded-lg (8px border-radius)
   // - shadow-sm (sombra sutil)
   
/* ============================================================================
   🎨 CORES E TEMAS
   ============================================================================ */
   
   // Cores de Marca (Primary) - Vêm do banco via storeSettings:
   // - primaryColor: cor da marca (padrão: #1B966C verde)
   // - primaryTextColor: texto sobre primary (padrão: #FFFFFF branco)
   // Usado em: botões principais, badges, destaques
   
   // Cinzas (Neutrals):
   // - gray-50: #F9FAFB → Backgrounds muito sutis
   // - gray-100: #F3F4F6 → Backgrounds de badges, hover
   // - gray-200: #E5E7EB → Borders padrão
   // - gray-300: #D1D5DB → Borders hover, separadores
   // - gray-400: #9CA3AF → Placeholders, textos terciários
   // - gray-500: #6B7280 → Textos secundários
   // - gray-600: #4B5563 → Textos corpo
   // - gray-700: #374151 → Textos principais
   // - gray-800: #1F2937 → Textos escuros
   // - gray-900: #111827 → Títulos, máxima ênfase
   
   // Verde (Sucesso):
   // - green-600: #10B981 → Ícones de sucesso
   // - green-100: #ECFDF5 → Background sucesso
   // Used in: Step 2 (order found), Step 6 (confirmation)
   
   // Amarelo (Aviso/Atenção):
   // - yellow-600: #F59E0B → Ícones de aviso
   // - yellow-700: #D97706 → Texto em avisos
   // - yellow-100: #FEF3C7 → Background aviso
   // Usado em: warnings, Step 6B (reembolso pendente)
   
   // Vermelho (Erro/Alerta):
   // - red-600: #DC2626 → Ícones de erro
   // - red-200: #FEE2E2 → Background erro
   // - red-50: #FEF2F2 → Background erro suave
   // Usado em: erros de validação, opção de fraude
   
/* ============================================================================
   📏 ESPAÇAMENTOS (Tailwind Space Scale)
   ============================================================================ */
   
   // Gap entre elementos (space-y-*):
   // - space-y-2 = 8px → Itens muito próximos
   // - space-y-3 = 12px → Cards de opção
   // - space-y-4 = 16px → Campos de formulário
   // - space-y-6 = 24px → Seções principais
   
   // Margin Top (mt-*):
   // - mt-1 = 4px → Espaço mínimo
   // - mt-2 = 8px → Subtítulos
   // - mt-4 = 16px → Separação média
   // - mt-6 = 24px → Separação grande
   
   // Padding (p-*, px-*, py-*):
   // - p-2 = 8px → Ícones pequenos
   // - p-3 = 12px → Ícones médios
   // - p-4 = 16px → Botões padrão
   // - p-5 = 20px → Cards opção
   // - p-6 = 24px → Cards principais
   // - p-8 = 32px → Cards desktop
   
   // Gap entre elementos flex/grid:
   // - gap-2 = 8px → Pills, badges
   // - gap-3 = 12px → Ícone + texto
   // - gap-4 = 16px → Cards com ícones
   
/* ============================================================================
   🔲 BORDAS, SOMBRAS E CANTOS
   ============================================================================ */
   
   // Border Radius (rounded-*):
   // - rounded = 4px → Elementos pequenos
   // - rounded-md = 6px → Botões
   // - rounded-lg = 8px → Cards padrão, inputs
   // - rounded-xl = 12px → Cards destacados
   // - rounded-full = 50% → Pills, badges circulares
   
   // Border Width:
   // - border = 1px → Padrão
   // - border-2 = 2px → Destaque, focus
   
   // Box Shadow:
   // - shadow-sm = 0 1px 2px rgba(0,0,0,0.05) → Sutil
   // - shadow = 0 1px 3px rgba(0,0,0,0.1) → Padrão
   // - shadow-md = 0 4px 6px rgba(0,0,0,0.1) → Hover
   // - shadow-lg = 0 10px 15px rgba(0,0,0,0.1) → Modais
   
/* ============================================================================
   🖼️ ÍCONES (lucide-react)
   ============================================================================ */
   
   // Tamanhos dos ícones (h-* w-*):
   // - h-4 w-4 = 16px → Ícones muito pequenos (badges)
   // - h-5 w-5 = 20px → Ícones padrão (textos, listas)
   // - h-6 w-6 = 24px → Ícones médios (cards de opção)
   // - h-8 w-8 = 32px → Ícones grandes (confirmações)
   // - h-10 w-10 = 40px → Ícones principais (headers)
   
   // Ícones usados e seus significados:
   // - Package: Order não recebido
   // - RotateCcw: Produto com defeito
   // - ThumbsDown: Arrependimento
   // - AlertTriangle: Fraude, avisos
   // - Store: Store credit
   // - Mail: Refund, e-mail
   // - CheckCircle: Sucesso
   // - Clock: Processamento
   // - ShieldCheck: Segurança
   // - Copy: Copy code
   // - Check: Confirmação
   // - ChevronRight: Navegação
   
/* ============================================================================
   🔘 BOTÕES
   ============================================================================ */
   
   // Botão Principal (Primary):
   // - h-12 = 48px altura → Destaque máximo
   // - px-4 = 16px padding horizontal
   // - rounded-md = 6px cantos
   // - font-semibold = peso 600
   // - text-base = 16px fonte
   // - shadow-sm = sombra sutil
   // - hover:shadow-md = sombra no hover
   // - transition-all = animação suave
   // - backgroundColor: primaryColor (dinâmico)
   
   // Botão Secundário (Outline):
   // - h-11 = 44px altura
   // - variant="outline" = borda cinza
   // - hover:bg-gray-100 = hover cinza
   
   // Botão Ghost (Texto):
   // - variant="ghost" = sem fundo
   // - hover:bg-gray-100 = hover cinza sutil
   
   // Estados:
   // - disabled:opacity-50 = desabilitado
   // - active:scale-[0.99] = feedback visual no clique
   
/* ============================================================================
   📝 INPUTS E FORMULÁRIOS
   ============================================================================ */
   
   // Inputs (Input component):
   // - h-11 = 44px altura (touch-friendly)
   // - px-3 = 12px padding horizontal
   // - py-2 = 8px padding vertical
   // - rounded-lg = 8px cantos
   // - border = 1px cinza
   // - focus:border-2 = 2px no focus
   // - text-base = 16px (evita zoom mobile)
   
   // Labels:
   // - text-sm = 14px fonte
   // - font-medium = peso 500
   // - text-gray-700 = cinza escuro
   // - mb-1 = 4px margin bottom
   
   // Textareas:
   // - min-h-[65px] = altura mínima
   // - resize-y = redimensionável verticalmente
   
   // Mensagens de erro:
   // - rounded-lg = 8px cantos
   // - border border-red-200 = borda vermelha sutil
   // - bg-red-50 = fundo vermelho claro
   // - px-4 py-3 = padding interno
   // - text-sm = 14px fonte
   // - text-red-800 = texto vermelho escuro
   
/* ============================================================================
   🎴 CARDS E CONTAINERS
   ============================================================================ */
   
   // Card Principal:
   // - border-gray-200 = borda cinza
   // - shadow-sm = sombra sutil
   // - rounded-lg = 8px cantos
   // - p-6 / md:p-8 = padding responsivo
   
   // Card de Opção (Option Card):
   // - p-5 = 20px padding
   // - rounded-xl = 12px cantos
   // - border-2 = borda 2px
   // - hover:border-gray-400 = hover escurece borda
   // - hover:bg-gray-50 = hover cinza claro
   // - active:scale-[0.99] = feedback clique
   // - transition-all = animação suave
   
   // Card Primário (Retention - Crédito):
   // - border-2 com primaryColor
   // - background: gradient com primaryColor (8% opacity)
   // - shadow-lg = sombra grande
   // - Badge "⭐ Best choice" no canto
   
   // Card Secundário (Retention - Refund):
   // - border cinza simples
   // - bg-gray-50 = fundo cinza
   // - Sem sombra
   // - Visual propositalmente menos atrativo
   
/* ============================================================================
   🎯 HIERARQUIA VISUAL (IMPORTANTE!)
   ============================================================================ */
   
   // STEP 4 - RETENTION (CRÍTICO PARA CONVERSÃO):
   
   // Opção CRÉDITO (deve ser 2-3x mais visível):
   // ✅ Border: 2px (vs 1px do reembolso)
   // ✅ Background: Gradient colorido (vs cinza do reembolso)
   // ✅ Shadow: shadow-lg (vs sem sombra)
   // ✅ Badge: "⭐ Best choice" bold
   // ✅ Título: text-xl bold (vs text-base medium)
   // ✅ Pills: border adicional, semibold
   // ✅ Botão: h-12, shadow, hover scale
   
   // Opção REEMBOLSO (deve ser menos atrativa):
   // ❌ Border: 1px cinza
   // ❌ Background: gray-50 opaco
   // ❌ Shadow: nenhuma
   // ❌ Título: text-base medium (menor)
   // ❌ Pills: font-normal
   // ❌ Botão: h-11, outline, sem shadow
   
/* ============================================================================
   ✨ ANIMAÇÕES E TRANSIÇÕES
   ============================================================================ */
   
   // Animações CSS:
   // - animate-in = fade-in automático
   // - zoom-in = entrada com zoom
   // - animate-pulse = pulsação (ícone de loading)
   // - animate-spin = rotação (spinner)
   
   // Transições:
   // - transition-all = anima todas as propriedades
   // - duration-150 = 150ms (rápido)
   // - duration-300 = 300ms (médio)
   // - duration-500 = 500ms (lento)
   
   // Hover Effects:
   // - hover:scale-[1.02] = cresce 2%
   // - hover:shadow-md = sombra aumenta
   // - hover:bg-* = muda cor de fundo
   // - hover:border-* = muda cor da borda
   
   // Active Effects:
   // - active:scale-[0.99] = encolhe ao clicar (feedback)
   
/* ============================================================================
   📱 RESPONSIVIDADE
   ============================================================================ */
   
   // Breakpoints Tailwind:
   // - (sem prefixo) = mobile (< 640px)
   // - md: = tablet+ (>= 768px)
   // - lg: = desktop (>= 1024px)
   
   // Ajustes Responsivos:
   // - p-6 md:p-8 = padding cresce no desktop
   // - text-xl md:text-2xl = fonte cresce no desktop
   // - max-w-2xl = largura máxima (672px)
   
/* ============================================================================
   🎨 COMO EDITAR CORES GLOBAIS
   ============================================================================ */
   
   // 1. Cor Primária (Brand):
   //    - Banco de dados: tabela 'clients', coluna 'brand_color'
   //    - Padrão no código: mockSettings.brand_color = "#1B966C"
   
   // 2. Cor do Texto sobre Primary:
   //    - Banco de dados: tabela 'clients', coluna 'brand_text_color'
   //    - Padrão no código: mockSettings.brand_text_color = "#FFFFFF"
   
   // 3. Trocar cinzas para outra paleta:
   //    - Busque "gray-" no código e substitua por "slate-", "zinc-", etc.
   
   // 4. Mudar cor de sucesso (verde):
   //    - Busque "green-" e substitua (ex: "emerald-", "teal-")
   
   // 5. Mudar cor de aviso (amarelo):
   //    - Busque "yellow-" e substitua (ex: "orange-", "amber-")
   
/* ============================================================================
   📝 DICAS DE EDIÇÃO RÁPIDA
   ============================================================================ */
   
   // Aumentar tudo proporcionalmente:
   // 1. Mude o container: max-w-2xl → max-w-3xl
   // 2. Mude o padding: p-6 → p-8, p-8 → p-10
   
   // Deixar mais compacto:
   // 1. Reduza space-y-6 → space-y-4
   // 2. Reduza p-6 → p-4
   
   // Mudar arredondamento:
   // 1. Busque "rounded-lg" e mude para "rounded-xl" (mais) ou "rounded-md" (menos)
   
   // Destacar botões principais:
   // 1. Aumente: h-12 → h-14
   // 2. Adicione: shadow-lg ao invés de shadow-sm
   
   // Suavizar sombras:
   // 1. Reduza: shadow-md → shadow-sm → shadow (ou remova)
   
/* ============================================================================ */

// Componente para renderizar imagem do produto com fallback para ícone
const ProductImage = ({ src, alt }: { src?: string; alt: string }) => {
  const [imageError, setImageError] = useState(false);

  if (!src || imageError) {
    return (
      <div className="w-16 h-16 rounded-lg border border-[#DEDEDE] bg-[#F9F9F9] flex items-center justify-center flex-shrink-0">
        <Package className="h-8 w-8 text-[#6B7280]" />
      </div>
    );
  }

  return (
    <img 
      src={src} 
      alt={alt} 
      className="w-16 h-16 rounded-lg object-cover border"
      onError={() => setImageError(true)}
    />
  );
};

const ResolutionHub = () => {
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(mockSettings);
  const [loadingBranding, setLoadingBranding] = useState(false);
  
  // Step 1: Validação
  const [orderInput, setOrderInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [validationAttempts, setValidationAttempts] = useState(0);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);
  
  // Step 2+: Order status
  const [order, setOrder] = useState<Order | null>(null);
  
  // Step 3: Rota escolhida
  const [route, setRoute] = useState<ResolutionRoute>(null);
  
  // Step 4: Resolution decision
  const [decision, setDecision] = useState<ResolutionDecision>(null);
  
  // Step 5: Evidências
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [checkedNeighbors, setCheckedNeighbors] = useState<boolean | null>(null);
  const [checkedCarrier, setCheckedCarrier] = useState<boolean | null>(null);
  const [productOpened, setProductOpened] = useState<boolean | null>(null);
  const [productPackaging, setProductPackaging] = useState<boolean | null>(null);
  const [recognizeAddress, setRecognizeAddress] = useState<string>("");
  const [familyPurchase, setFamilyPurchase] = useState<boolean | null>(null);
  const [chargebackInitiated, setChargebackInitiated] = useState<boolean | null>(null);
  const [chargebackProtocol, setChargebackProtocol] = useState("");
  const [defectType, setDefectType] = useState("");
  const [regretReason, setRegretReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [evidenceError, setEvidenceError] = useState<string | null>(null);
  
  // Step 6: Confirmação
  const [creditCode, setCreditCode] = useState("");
  const [protocol, setProtocol] = useState("");
  const [npsScore, setNpsScore] = useState<number | null>(null);
  const [experienceRating, setExperienceRating] = useState<"good" | "neutral" | "bad" | null>(null);
  const [additionalFeedback, setAdditionalFeedback] = useState("");
  
  // Controle de navegação
  const [currentStep, setCurrentStep] = useState<CurrentStep>(1);
  const [showItemNotReceivedFlow, setShowItemNotReceivedFlow] = useState(false);

  // Função para rolar para o topo - isolada e reutilizável (versão mais agressiva para produção)
  const scrollToTop = () => {
    // Método 1: Rola o window/document para o topo (múltiplas formas)
    try {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    } catch (e) {
      window.scrollTo(0, 0);
    }
    
    // Método 2: Força scroll direto nas propriedades
    if (document.documentElement) {
      document.documentElement.scrollTop = 0;
      document.documentElement.scrollLeft = 0;
    }
    if (document.body) {
      document.body.scrollTop = 0;
      document.body.scrollLeft = 0;
    }
    
    // Método 3: Encontra e rola todos os elementos com scroll (incluindo pais do Shopify)
    const allScrollableElements = [
      document.documentElement,
      document.body,
      window,
      ...Array.from(document.querySelectorAll('*')).filter((el) => {
        const htmlEl = el as HTMLElement;
        const style = window.getComputedStyle(htmlEl);
        return (
          style.overflow === 'auto' ||
          style.overflow === 'scroll' ||
          style.overflowY === 'auto' ||
          style.overflowY === 'scroll' ||
          htmlEl.scrollHeight > htmlEl.clientHeight
        );
      }) as HTMLElement[],
    ];
    
    allScrollableElements.forEach((el) => {
      if (el && typeof el === 'object') {
        try {
          if ('scrollTop' in el && typeof (el as any).scrollTop === 'number') {
            (el as any).scrollTop = 0;
          }
          if ('scrollLeft' in el && typeof (el as any).scrollLeft === 'number') {
            (el as any).scrollLeft = 0;
          }
          if (el === window) {
            window.scrollTo(0, 0);
          }
        } catch (e) {
          // Ignora erros em elementos que não podem ser rolados
        }
      }
    });
    
    // Método 4: Rola o container principal usando o ID
    const container = document.getElementById('chargemind-resolution-hub-container');
    if (container) {
      container.scrollTop = 0;
      container.scrollLeft = 0;
      // Usa scrollIntoView com diferentes opções
      try {
        container.scrollIntoView({ behavior: 'instant', block: 'start', inline: 'nearest' });
      } catch (e) {
        try {
          container.scrollIntoView(true);
        } catch (e2) {
          // Ignora se não funcionar
        }
      }
    }
    
    // Método 5: Tenta encontrar o elemento pai que pode ter scroll (Shopify)
    let parent = container?.parentElement;
    let depth = 0;
    while (parent && depth < 10) {
      try {
        parent.scrollTop = 0;
        parent.scrollLeft = 0;
      } catch (e) {
        // Ignora
      }
      parent = parent.parentElement;
      depth++;
    }
  };

  // Scroll para o topo quando o componente monta (carregamento inicial)
  useEffect(() => {
    let isScrolling = false;
    
    // Listener para manter scroll no topo (previne scroll indesejado)
    const preventScroll = () => {
      if (isScrolling) return;
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
      if (scrollTop > 10) {
        isScrolling = true;
        scrollToTop();
        setTimeout(() => { isScrolling = false; }, 100);
      }
    };
    
    // Adiciona listener temporário para manter scroll no topo
    window.addEventListener('scroll', preventScroll, { passive: true });
    window.addEventListener('wheel', preventScroll, { passive: true });
    
    // Usa requestAnimationFrame para garantir que execute após o render
    const raf1 = requestAnimationFrame(() => {
      scrollToTop();
      const raf2 = requestAnimationFrame(() => {
        scrollToTop();
      });
      return () => cancelAnimationFrame(raf2);
    });
    
    // Múltiplas tentativas com diferentes timings
    scrollToTop();
    const timer1 = setTimeout(() => scrollToTop(), 0);
    const timer2 = setTimeout(() => scrollToTop(), 50);
    const timer3 = setTimeout(() => scrollToTop(), 100);
    const timer4 = setTimeout(() => scrollToTop(), 200);
    const timer5 = setTimeout(() => scrollToTop(), 300);
    const timer6 = setTimeout(() => {
      // Remove listeners após garantir que está no topo
      window.removeEventListener('scroll', preventScroll);
      window.removeEventListener('wheel', preventScroll);
    }, 500);
    
    return () => {
      cancelAnimationFrame(raf1);
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearTimeout(timer5);
      clearTimeout(timer6);
      window.removeEventListener('scroll', preventScroll);
      window.removeEventListener('wheel', preventScroll);
    };
  }, []);

  // Scroll para o topo quando mudar de etapa
  useEffect(() => {
    // Usa requestAnimationFrame para garantir que execute após o render do novo conteúdo
    const raf1 = requestAnimationFrame(() => {
      scrollToTop();
      const raf2 = requestAnimationFrame(() => {
        scrollToTop();
        const raf3 = requestAnimationFrame(() => {
          scrollToTop();
        });
        return () => cancelAnimationFrame(raf3);
      });
      return () => cancelAnimationFrame(raf2);
    });
    
    // Múltiplas tentativas com diferentes timings
    scrollToTop();
    const timer1 = setTimeout(() => scrollToTop(), 0);
    const timer2 = setTimeout(() => scrollToTop(), 50);
    const timer3 = setTimeout(() => scrollToTop(), 150);
    const timer4 = setTimeout(() => scrollToTop(), 250);
    const timer5 = setTimeout(() => scrollToTop(), 400);
    
    return () => {
      cancelAnimationFrame(raf1);
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearTimeout(timer5);
    };
  }, [currentStep]);

  // Cores dinâmicas
  const getValidColor = (color: string | null | undefined, fallback: string): string => {
    if (!color) return fallback;
    const trimmed = String(color).trim();
    return trimmed !== "" ? trimmed : fallback;
  };
  
  const primaryColor = getValidColor(storeSettings.brand_color, "#1B966C");
  const primaryTextColor = getValidColor(storeSettings.brand_text_color, "#FFFFFF");
  const toastBgColor = mixWithWhite(primaryColor, 0.06);

  const cssVars = useMemo<React.CSSProperties>(() => {
    return {
      "--primary-color": primaryColor,
      "--primary-text-color": primaryTextColor,
      "--primary-soft": hexToRgba(primaryColor, 0.08),
      "--primary-border": hexToRgba(primaryColor, 0.2),
      "--primary-strong": hexToRgba(primaryColor, 0.6),
    } as React.CSSProperties;
  }, [primaryColor, primaryTextColor]);
  
  // Log das cores aplicadas para debug
  useEffect(() => {
    console.log("🎨 Cores aplicadas no componente:", {
      storeSettings_brand_color: storeSettings.brand_color,
      storeSettings_brand_text_color: storeSettings.brand_text_color,
      primaryColor,
      primaryTextColor,
      cssVars: cssVars,
    });
  }, [storeSettings.brand_color, storeSettings.brand_text_color, primaryColor, primaryTextColor, cssVars]);

  const loadSettings = async () => {
    setLoadingBranding(true);
    try {
      const windowSettings = resolveSettings();
      const isLocalDev = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
      
      if (isLocalDev) {
        const supabaseSettings = await fetchBrandingFromSupabase();
        setStoreSettings({ ...windowSettings, ...supabaseSettings });
      } else {
        setStoreSettings(windowSettings);
      }
    } finally {
      setLoadingBranding(false);
    }
  };

  useEffect(() => {
    // Carrega as configurações imediatamente
    loadSettings();
    
    // Função para verificar e recarregar se necessário
    const checkAndReload = () => {
      const data = (window as Window & { CHARGEMIND_DATA?: unknown }).CHARGEMIND_DATA;
      const hasBranding = data && typeof data === "object" && "branding" in data;
      
      if (hasBranding) {
        const branding = (data as { branding?: StoreSettings }).branding;
        const hasBrandColor = branding && branding.brand_color && String(branding.brand_color).trim() !== "";
        
        // Se encontrou branding com cor, recarrega as configurações
        if (hasBrandColor) {
          console.log("✅ CHARGEMIND_DATA com branding encontrado, recarregando configurações...");
          loadSettings();
        }
      }
    };
    
    // Verifica múltiplas vezes para garantir que pega quando o script carregar
    const timeouts = [
      setTimeout(checkAndReload, 50),
      setTimeout(checkAndReload, 200),
      setTimeout(checkAndReload, 500),
    ];
    
    // Também escuta eventos de DOMContentLoaded caso ainda não tenha carregado
    const handleDOMReady = () => {
      checkAndReload();
    };
    
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", handleDOMReady);
    } else {
      handleDOMReady();
    }
    
    return () => {
      timeouts.forEach(id => clearTimeout(id));
      document.removeEventListener("DOMContentLoaded", handleDOMReady);
    };
  }, []);

  // STEP 1: Validação do Order
  const handleValidation = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    
    // Normalização: remove # do início do número e normaliza tudo para lowercase
    const trimmedOrder = orderInput.trim().replace(/^#/, "").toLowerCase();
    const trimmedEmail = emailInput.trim().toLowerCase();
    
    // Validação: pelo menos um campo deve estar preenchido
    if (!trimmedOrder && !trimmedEmail) {
      setValidationError(CM_MESSAGES.VALIDATION.EMPTY);
      return;
    }
    
    setValidating(true);
    
    // Detecta se deve usar mock ou dados reais (fora do try para estar acessível no catch)
      // Prioridade:
      // 1. Parâmetro ?mock=true ou ?mock=false na URL (para Shopify Proxy)
      // 2. CHARGEMIND_DATA.useMockData (vem da Edge Function quando acessado via Shopify Proxy)
      // 3. localStorage "chargemind_use_mock_data" (configurado no /admin)
      // 4. Default: real data (produção)
      const data = (window as Window & { CHARGEMIND_DATA?: { useMockData?: boolean; shop?: string } }).CHARGEMIND_DATA;
      const shop = data?.shop || "demo-shop.myshopify.com";
      
      let useMockData: boolean;
      
      // 1. Verifica parâmetro ?mock na URL (prioridade máxima)
      const urlParams = new URLSearchParams(window.location.search);
      const mockParam = urlParams.get("mock");
      
      if (mockParam !== null) {
        // Parâmetro ?mock=true ou ?mock=false na URL
        useMockData = mockParam === "true";
        console.log("🔍 Modo de busca (via parâmetro URL ?mock=):", useMockData ? "MOCK DATA ✅" : "REAL DATA 🌐");
        console.log("   →", useMockData ? "Test Mode (Mock Data) ativo!" : "Production Mode (Real Data) ativo!");
      } else if (data?.useMockData !== undefined) {
        // 2. Se CHARGEMIND_DATA tem useMockData definido (vem da Edge Function)
        useMockData = data.useMockData;
        console.log("🔍 Modo de busca (via CHARGEMIND_DATA):", useMockData ? "MOCK DATA ✅" : "REAL DATA 🌐");
        console.log("   →", useMockData ? "Test Mode (Mock Data) ativo!" : "Production Mode (Real Data) ativo!");
      } else {
        // 3. Se não tem CHARGEMIND_DATA, verifica localStorage (admin)
        const stored = localStorage.getItem("chargemind_use_mock_data");
        console.log("📦 localStorage 'chargemind_use_mock_data':", stored);
        if (stored !== null) {
          useMockData = JSON.parse(stored);
          console.log("🔍 Modo de busca (via localStorage/admin):", useMockData ? "MOCK DATA ✅" : "REAL DATA 🌐");
          console.log("   →", useMockData ? "Test Mode (Mock Data) ativo!" : "Production Mode (Real Data) ativo!");
        } else {
          // 4. Default: real data (produção)
          useMockData = false;
          console.log("🔍 Modo de busca (default): REAL DATA 🌐");
          console.log("   → Production Mode (Real Data) ativo!");
        }
      }
    
    try {
      let foundOrder: Order | undefined;
      
      console.log("🏪 Shop:", shop);
      
      if (useMockData) {
        // MODO MOCK: Busca nos dados mockados
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("🧪 TEST MODE (MOCK DATA) - Buscando em mockOrders");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("📋 Total de pedidos mockados:", mockOrders.length);
        console.log("🔍 Buscando:", { trimmedOrder, trimmedEmail });
        
        await new Promise(resolve => setTimeout(resolve, 800));
        
        if (trimmedOrder && trimmedEmail) {
          foundOrder = mockOrders.find(
            o => o.orderNumber.toLowerCase() === trimmedOrder && 
                 o.email.toLowerCase() === trimmedEmail
          );
          console.log("🔍 Busca por orderNumber + email:", foundOrder ? "✅ Encontrado" : "❌ Não encontrado");
        } else if (trimmedOrder) {
          foundOrder = mockOrders.find(
            o => o.orderNumber.toLowerCase() === trimmedOrder
          );
          console.log("🔍 Busca por orderNumber:", foundOrder ? "✅ Encontrado" : "❌ Não encontrado");
        } else if (trimmedEmail) {
          foundOrder = mockOrders.find(
            o => o.email.toLowerCase() === trimmedEmail
          );
          console.log("🔍 Busca por email:", foundOrder ? "✅ Encontrado" : "❌ Não encontrado");
        }
      } else {
        // MODO REAL: Busca via API do Shopify
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("🌐 PRODUCTION MODE (REAL DATA) - Buscando via API Shopify");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        const supabaseUrl = (window as any).SUPABASE_URL || "https://xieephvojphtjayjoxbc.supabase.co";
        
        try {
        const response = await fetch(`${supabaseUrl}/functions/v1/shopify-order`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            shop,
            orderNumber: trimmedOrder || undefined,
            email: trimmedEmail || undefined,
          }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("❌ Erro na API:", errorText);
            
            // Verifica se deve fazer fallback para mock em caso de erros de integração/permissão
            const shouldFallbackToMock = 
              (response.status === 500 && errorText.includes("Shopify integration not configured")) ||
              (response.status === 500 && errorText.includes("protected customer data")) ||
              (response.status === 403 && errorText.includes("protected customer data")) ||
              (response.status === 403 && errorText.includes("not approved"));
            
            if (shouldFallbackToMock) {
              console.warn("⚠️ Erro na integração Shopify (app não aprovado ou não configurado). Usando dados mockados como fallback...");
              // Fallback para mock
              await new Promise(resolve => setTimeout(resolve, 800));
              
              if (trimmedOrder && trimmedEmail) {
                foundOrder = mockOrders.find(
                  o => o.orderNumber.toLowerCase() === trimmedOrder && 
                       o.email.toLowerCase() === trimmedEmail
                );
              } else if (trimmedOrder) {
                foundOrder = mockOrders.find(
                  o => o.orderNumber.toLowerCase() === trimmedOrder
                );
              } else if (trimmedEmail) {
                foundOrder = mockOrders.find(
                  o => o.email.toLowerCase() === trimmedEmail
                );
              }
              
              if (foundOrder) {
                console.log("✅ Pedido encontrado nos dados mockados (fallback):", foundOrder);
              } else {
                console.error("❌ Pedido não encontrado nos dados mockados (fallback)");
                console.error("📋 Pedidos disponíveis:", mockOrders.map(o => ({ orderNumber: o.orderNumber, email: o.email })));
                console.error("🔍 Buscando:", { trimmedOrder, trimmedEmail });
                throw new Error(CM_MESSAGES.VALIDATION.NOT_FOUND);
              }
            } else {
              throw new Error(`API error: ${response.status} - ${errorText}`);
            }
          } else {
        const result = await response.json();
        console.log("📦 Resultado da API:", result);
        
        if (result.found && result.order) {
          foundOrder = result.order;
            }
          }
        } catch (fetchError) {
          // Se houver erro de rede ou outro erro, tenta fallback para mock
          // Verifica se o erro está relacionado a problemas de integração/permissão
          const errorMessage = fetchError instanceof Error ? fetchError.message : String(fetchError);
          const isIntegrationError = 
            errorMessage.includes("protected customer data") ||
            errorMessage.includes("not approved") ||
            errorMessage.includes("Shopify integration not configured") ||
            errorMessage.includes("API error: 500") ||
            errorMessage.includes("API error: 403");
          
          if (isIntegrationError) {
            console.warn("⚠️ Erro na integração Shopify. Usando dados mockados como fallback...");
            await new Promise(resolve => setTimeout(resolve, 800));
            
            if (trimmedOrder && trimmedEmail) {
              foundOrder = mockOrders.find(
                o => o.orderNumber.toLowerCase() === trimmedOrder && 
                     o.email.toLowerCase() === trimmedEmail
              );
            } else if (trimmedOrder) {
              foundOrder = mockOrders.find(
                o => o.orderNumber.toLowerCase() === trimmedOrder
              );
            } else if (trimmedEmail) {
              foundOrder = mockOrders.find(
                o => o.email.toLowerCase() === trimmedEmail
              );
            }
            
            if (foundOrder) {
              console.log("✅ Pedido encontrado nos dados mockados (fallback):", foundOrder);
            } else {
              console.error("❌ Pedido não encontrado nos dados mockados (fallback)");
              console.error("📋 Pedidos disponíveis:", mockOrders.map(o => ({ orderNumber: o.orderNumber, email: o.email })));
              console.error("🔍 Buscando:", { trimmedOrder, trimmedEmail });
              // Não precisa lançar erro aqui, já vai cair no bloco "if (!foundOrder)" abaixo
              // que já tem mensagem amigável
            }
          } else {
            // Para outros erros, apenas re-throw
            throw fetchError;
          }
        }
      }
      
      if (!foundOrder) {
        setValidationAttempts(prev => prev + 1);

        if (validationAttempts >= 2) {
          setValidationError(CM_MESSAGES.VALIDATION.MAX_ATTEMPTS);
        } else {
          setValidationError(CM_MESSAGES.VALIDATION.NOT_FOUND);
        }
        return;
      }

      console.log("✅ Pedido encontrado:", { orderNumber: foundOrder.orderNumber, customerName: foundOrder.customerName, email: foundOrder.email, totalAmount: foundOrder.totalAmount });
      setOrder(foundOrder);
      setCurrentStep(2);
      setValidationAttempts(0);
      
    } catch (error) {
      console.error("❌ Erro ao validar pedido:", error);
      console.error("❌ Stack trace:", error instanceof Error ? error.stack : "N/A");
      console.error("❌ Error details:", {
        message: error instanceof Error ? error.message : String(error),
        trimmedOrder,
        trimmedEmail,
        useMockData,
        shop,
      });
      
      // Mensagens amigáveis para o cliente, sem expor detalhes técnicos
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (errorMessage.includes("Order not found")) {
        setValidationError(CM_MESSAGES.VALIDATION.NOT_FOUND);
      } else if (errorMessage.includes("API error") || errorMessage.includes("Failed to search")) {
        setValidationError(CM_MESSAGES.VALIDATION.AUTH_ERROR);
      } else {
        setValidationError(CM_MESSAGES.VALIDATION.AUTH_ERROR);
      }
    } finally {
      setValidating(false);
    }
  };

  // STEP 2 -> STEP 3
  const confirmOrder = () => {
    setCurrentStep(3);
  };

  // STEP 3 -> STEP 4
  const selectRoute = (selectedRoute: ResolutionRoute) => {
    setRoute(selectedRoute);
    
    // Se for "not_received", mostrar o novo fluxo para todos os pedidos
    if (selectedRoute === "not_received") {
      setShowItemNotReceivedFlow(true);
    } else {
      setCurrentStep(4);
    }
  };

  // STEP 4 -> STEP 5
  const selectDecision = (selectedDecision: ResolutionDecision) => {
    setDecision(selectedDecision);

    if (selectedDecision === "credit") {
      // Crédito imediato: gera código e pula para Step 6
      const code = `CREDIT-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      setCreditCode(code);
      setCurrentStep(6);
      } else {
      // Refund: vai para coleta de evidências
      setCurrentStep(5);
    }
  };

  // STEP 5 -> STEP 6
  const handleEvidenceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEvidenceError(null);
    
    // Validação rigorosa para reembolso
    if (description.length < 10) {
      setEvidenceError(CM_MESSAGES.EVIDENCE.DESC_TOO_SHORT);
      return;
    }

    if (route === "not_received") {
      if (checkedNeighbors === null || checkedCarrier === null) {
        setEvidenceError(CM_MESSAGES.EVIDENCE.MISSING_FIELD);
      return;
      }
      if (photos.length === 0) {
        setEvidenceError(CM_MESSAGES.EVIDENCE.MISSING_PHOTO);
        return;
      }
    }

    if (route === "defect") {
      if (photos.length === 0) {
        setEvidenceError(CM_MESSAGES.EVIDENCE.MISSING_PHOTO);
      return;
    }
      if (!defectType) {
        setEvidenceError(CM_MESSAGES.EVIDENCE.MISSING_FIELD);
        return;
      }
    }
    
    if (route === "regret") {
      if (productOpened === null || productPackaging === null || !regretReason) {
        setEvidenceError(CM_MESSAGES.EVIDENCE.MISSING_FIELD);
        return;
      }
      if (photos.length === 0) {
        setEvidenceError(CM_MESSAGES.EVIDENCE.MISSING_PHOTO);
        return;
      }
    }
    
    if (route === "fraud") {
      if (!recognizeAddress || familyPurchase === null || chargebackInitiated === null) {
        setEvidenceError(CM_MESSAGES.EVIDENCE.MISSING_FIELD);
        return;
      }
      if (chargebackInitiated && !chargebackProtocol) {
        setEvidenceError(CM_MESSAGES.EVIDENCE.MISSING_FIELD);
        return;
      }
      if (photos.length === 0) {
        setEvidenceError(CM_MESSAGES.EVIDENCE.MISSING_PHOTO);
        return;
      }
    }
    
    setSubmitting(true);
    
    try {
      // Send simulation - replace with real call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const generatedProtocol = `REF-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      setProtocol(generatedProtocol);
      setCurrentStep(6);
      
    } catch (error) {
      setEvidenceError(CM_MESSAGES.SUBMISSION.GENERIC_ERROR);
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Code copied!", {
      description: text,
      className: "chargemind-code-toast-icon-adjust",
    });
  };

  const copyProtocolToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Protocol copied!", {
      description: text,
      className: "chargemind-code-toast-icon-adjust",
    });
  };

  // RENDERIZAÇÃO DOS STEPS

  const renderHeader = () => {
    // Headline e Subheadline apenas no Step 1, fora do Card
    if (currentStep === 1) {
      return (
        <div className="text-center mb-8">
          {/* Logo do cliente (se houver) */}
          {storeSettings.logo_url && (
            <img 
              src={storeSettings.logo_url} 
              alt={storeSettings.nome_empresa || "Store"} 
              style={{ 
                height: '48px', 
                margin: '0 auto 20px',
                objectFit: 'contain',
              }} 
            />
          )}
          <h1 style={{ 
            fontSize: '28px', 
            fontWeight: '700', 
            color: '#111827',
            marginBottom: '12px',
            lineHeight: '1.3',
            letterSpacing: '-0.02em',
          }}>
            Need help with your order?
          </h1>
          <p style={{ 
            fontSize: '16px', 
            color: '#6B7280',
            lineHeight: '1.6',
            maxWidth: '380px',
            margin: '0 auto',
          }}>
            Our team prioritizes direct resolutions here. Start your support quickly and securely.
          </p>
        </div>
      );
    }
    return null;
  };

  const renderExperienceFeedback = () => {
    return (
      <div className="border-t pt-6 mt-6">
        <p className="chargemind-step-subtitle text-center mb-6" style={{ fontWeight: '600', color: '#1F2937' }}>
          How was your experience resolving this?
        </p>
        
        {/* Emoji rating selection */}
        <div className="flex items-start justify-center gap-6">
          {/* Good - Happy face */}
          <div className="flex flex-col items-center gap-4">
            <button
              onClick={() => setExperienceRating("good")}
              className={`relative w-16 h-16 rounded-full transition-all duration-200 flex items-center justify-center ${
                experienceRating === "good" ? "" : "hover:scale-110"
              } ${experienceRating !== "good" && experienceRating !== null ? "grayscale opacity-50" : ""}`}
              style={experienceRating === "good" ? { 
                boxShadow: `0 0 0 4px ${primaryColor}, 0 0 0 8px white`,
                border: 'none',
                outline: 'none'
              } : { border: 'none', outline: 'none' }}
            >
              <span className="text-4xl">😊</span>
            </button>
            {experienceRating === "good" && (
              <div className="relative">
                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[8px]" style={{ borderBottomColor: primaryColor }} />
                <span className="text-white text-sm font-medium px-4 py-1.5 rounded-full whitespace-nowrap" style={{ backgroundColor: primaryColor, color: primaryTextColor }}>
                  Really Good
                </span>
              </div>
            )}
          </div>

          {/* Neutral - Neutral face */}
          <div className="flex flex-col items-center gap-4">
            <button
              onClick={() => setExperienceRating("neutral")}
              className={`relative w-16 h-16 rounded-full transition-all duration-200 flex items-center justify-center ${
                experienceRating === "neutral" ? "" : "hover:scale-110"
              } ${experienceRating !== "neutral" && experienceRating !== null ? "grayscale opacity-50" : ""}`}
              style={experienceRating === "neutral" ? { 
                boxShadow: `0 0 0 4px ${primaryColor}, 0 0 0 8px white`,
                border: 'none',
                outline: 'none'
              } : { border: 'none', outline: 'none' }}
            >
              <span className="text-4xl">😐</span>
            </button>
            {experienceRating === "neutral" && (
              <div className="relative">
                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[8px]" style={{ borderBottomColor: primaryColor }} />
                <span className="text-white text-sm font-medium px-4 py-1.5 rounded-full whitespace-nowrap" style={{ backgroundColor: primaryColor, color: primaryTextColor }}>
                  Okay
                </span>
              </div>
            )}
          </div>

          {/* Bad - Sad face */}
          <div className="flex flex-col items-center gap-4">
            <button
              onClick={() => setExperienceRating("bad")}
              className={`relative w-16 h-16 rounded-full transition-all duration-200 flex items-center justify-center ${
                experienceRating === "bad" ? "" : "hover:scale-110"
              } ${experienceRating !== "bad" && experienceRating !== null ? "grayscale opacity-50" : ""}`}
              style={experienceRating === "bad" ? { 
                boxShadow: `0 0 0 4px ${primaryColor}, 0 0 0 8px white`,
                border: 'none',
                outline: 'none'
              } : { border: 'none', outline: 'none' }}
            >
              <span className="text-4xl">😔</span>
            </button>
            {experienceRating === "bad" && (
              <div className="relative">
                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[8px]" style={{ borderBottomColor: primaryColor }} />
                <span className="text-white text-sm font-medium px-4 py-1.5 rounded-full whitespace-nowrap" style={{ backgroundColor: primaryColor, color: primaryTextColor }}>
                  Not Good
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 style={{ 
          fontSize: '20px', 
          fontWeight: '600', 
          color: '#111827',
          marginBottom: '8px',
        }}>
          Let's locate your order
        </h2>
        <p style={{ 
          fontSize: '14px', 
          color: '#6B7280',
          lineHeight: '1.5',
        }}>
          Enter the order number or email used for purchase
        </p>
      </div>

      <form onSubmit={handleValidation} className="space-y-5" style={{ padding: '24px' }}>
        {/* Campo 1: Order number */}
        <div className="space-y-2">
          <label 
            htmlFor="order" 
            style={{ 
              display: 'block',
              fontSize: '14px', 
              fontWeight: '500', 
              color: '#374151',
              marginBottom: '6px',
            }}
          >
            Order number
          </label>
          <Input
            id="order"
            type="text"
            placeholder="Example: #1234 or 1234"
            value={orderInput}
            onChange={(e) => {
              const value = e.target.value;
              if (value === '' || /^#?[0-9]*$/.test(value)) {
                setOrderInput(value);
              }
            }}
            style={{
              height: '52px',
              borderRadius: '10px',
              border: '1px solid #D1D5DB',
              fontSize: '15px',
              paddingLeft: '16px',
              paddingRight: '16px',
              backgroundColor: '#FFFFFF',
              transition: 'border-color 0.2s, box-shadow 0.2s',
            }}
            autoComplete="off"
          />
          <p style={{ fontSize: '13px', color: '#9CA3AF', marginTop: '6px' }}>
            You can find the number in the confirmation email.
          </p>
        </div>

        {/* Divisor visual OR */}
        <div className="relative py-4">
          <div className="or-divider">
            <span className="chargemind-or-text">OR</span>
          </div>
        </div>

        {/* Campo 2: Email address */}
        <div className="space-y-2">
          <label 
            htmlFor="email"
            style={{ 
              display: 'block',
              fontSize: '14px', 
              fontWeight: '500', 
              color: '#374151',
              marginBottom: '6px',
            }}
          >
            Email address
          </label>
          <Input
            id="email"
            type="text"
            inputMode="email"
            placeholder="Email used at checkout"
            value={emailInput}
            onChange={(e) => {
              const value = e.target.value;
              if (value === '' || /^[a-zA-Z0-9@._-]*$/.test(value)) {
                setEmailInput(value);
              }
            }}
            style={{
              height: '52px',
              borderRadius: '10px',
              border: '1px solid #D1D5DB',
              fontSize: '15px',
              paddingLeft: '16px',
              paddingRight: '16px',
              backgroundColor: '#FFFFFF',
              transition: 'border-color 0.2s, box-shadow 0.2s',
            }}
            autoComplete="email"
          />
        </div>

        {validationError && (
          <div 
            className="animate-in fade-in slide-in-from-top-2"
            style={{
              backgroundColor: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: '12px',
              padding: '16px 20px',
              marginTop: '16px',
            }}
          >
            <p style={{ fontSize: '14px', fontWeight: '600', color: '#DC2626', marginBottom: '4px' }}>
              We couldn't find your order
            </p>
            <p style={{ fontSize: '13px', color: '#7F1D1D' }}>{validationError}</p>
            {validationAttempts >= 3 && (
              <a href="/suporte" style={{ fontSize: '13px', color: '#DC2626', textDecoration: 'underline', marginTop: '8px', display: 'inline-block' }}>
                Need help? Contact support
              </a>
            )}
          </div>
        )}

        <div className="flex justify-center" style={{ paddingTop: '8px' }}>
          <Button
            type="submit"
            disabled={validating || validationAttempts >= 3}
            style={{ 
              width: '100%',
              height: '52px',
              borderRadius: '10px',
              fontSize: '15px',
              fontWeight: '600',
              backgroundColor: primaryColor, 
              color: primaryTextColor,
              boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
              transition: 'all 0.2s',
              opacity: validating || validationAttempts >= 3 ? 0.5 : 1,
              cursor: validating || validationAttempts >= 3 ? 'not-allowed' : 'pointer',
            }}
          >
            {validating ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Locating...
              </span>
            ) : (
              <span>Locate My Order</span>
            )}
          </Button>
        </div>

        <div className="flex items-center justify-center gap-2" style={{ paddingTop: '4px' }}>
          <ShieldCheck style={{ height: '16px', width: '16px', color: '#9CA3AF' }} />
          <span style={{ fontSize: '13px', color: '#9CA3AF' }}>Your data is protected</span>
        </div>
      </form>
    </div>
  );

  const renderStep2 = () => {
    if (!order) return null;

    return (
      <div className="space-y-6">
        <div className="text-center">
          <div 
            className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 animate-in zoom-in duration-300"
            style={{ 
              backgroundColor: "#25B079",
              boxShadow: "0 4px 12px rgba(16, 185, 129, 0.15)"
            }}
          >
            <Check className="h-8 w-8 text-white" />
          </div>
          <h2 className="chargemind-step-title">We found your order!</h2>
          <p className="chargemind-step-subtitle">
            Confirm if this information is correct
          </p>
        </div>

        <div className="order-tracking-card-wrapper md:px-3">
          <div className="order-tracking-card">
            {/* Header Section */}
            <div className="order-tracking-header">
              <div className="order-tracking-header-left">
                <p className="order-tracking-label">ORDER</p>
                <p className="order-tracking-number">
                  #{order.orderNumber || order.id?.replace('#', '') || 'N/A'}
                </p>
                <p className="order-tracking-customer">{order.customerName}</p>
              </div>
              <span
                className={classNames(
                  "order-tracking-status",
                  order.status === "delivered" ? "order-tracking-status-delivered" :
                  order.status === "in_transit" ? "order-tracking-status-in-transit" :
                  order.status === "refunded" ? "order-tracking-status-refunded" :
                  order.status === "pending" ? "order-tracking-status-pending" :
                  "order-tracking-status-cancelled"
                )}
              >
                {order.status === "delivered" ? "Delivered" :
                 order.status === "in_transit" ? "In transit" :
                 order.status === "refunded" ? "Refunded" :
                 order.status === "pending" ? "Pending" :
                 "Cancelled"}
              </span>
            </div>

            {/* Purchase Details Section */}
            <div className="relative py-5">
              <div className="order-tracking-divider-line"></div>
            </div>
            <div className="order-tracking-details">
              <div className="order-tracking-detail-row">
                <span className="order-tracking-detail-label">Purchase date:</span>
                <span className="order-tracking-detail-value">
                  {order.orderDate || (order.createdAt ? formatOrderDate(order.createdAt) : 'N/A')}
                </span>
              </div>
            </div>

            {/* Products Section */}
            <div className="relative py-5">
              <div className="order-tracking-divider-line"></div>
            </div>
            <div className="order-tracking-products">
              <p className="order-tracking-label">PRODUCTS</p>
              <div className="order-tracking-products-list">
                {order.items.map((item, idx) => (
                  <div key={idx} className="order-tracking-product-item">
                    <ProductImage src={item.image} alt={item.name} />
                    <div className="order-tracking-product-info">
                      <p className="order-tracking-product-name">{item.name}</p>
                      <p className="order-tracking-product-quantity">Quantity: {item.quantity}</p>
                      <p className="order-tracking-product-price">
                        {typeof item.price === 'string' 
                          ? item.price 
                          : typeof item.price === 'number' && order.currency
                          ? formatCurrency(item.price, order.currency)
                          : item.price !== undefined
                          ? String(item.price)
                          : order.currency
                          ? formatCurrency(0, order.currency)
                          : 'N/A'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Price Breakdown Section */}
            {(() => {
              // Calcula valores se não vierem da API
              const currency = order.currency || 'USD';
              
              // Calcula subtotal a partir dos items se não vier da API
              let calculatedSubtotal = order.subtotal;
              if (calculatedSubtotal === undefined && order.items.length > 0) {
                calculatedSubtotal = order.items.reduce((sum, item) => {
                  const itemPrice = typeof item.price === 'number' 
                    ? item.price 
                    : typeof item.price === 'string'
                    ? parseFloat(item.price.replace(/[^0-9.,]/g, '').replace(',', '.')) || 0
                    : 0;
                  return sum + (itemPrice * item.quantity);
                }, 0);
              }
              
              // Usa valores da API ou calcula
              const subtotal = calculatedSubtotal ?? 0;
              // shippingCost pode ser undefined (não veio da API), 0 (grátis), ou um número > 0
              const shipping = order.shippingCost !== undefined ? order.shippingCost : null;
              const discount = order.discount ?? 0;
              const total = order.total ?? (subtotal + (shipping ?? 0) - discount);
              
              // Mostra breakdown se:
              // 1. Há items (sempre mostra breakdown quando há produtos)
              // 2. Há shipping definido (mesmo que seja 0), discount, ou diferença entre subtotal e total
              const shouldShowBreakdown = order.items.length > 0 && (
                shipping !== null || // shipping foi definido (mesmo que seja 0)
                discount > 0 || 
                (subtotal > 0 && total !== subtotal) ||
                (subtotal > 0 && shipping === null && discount === 0 && total === subtotal) // Mostra mesmo se só subtotal = total
              );
              
              if (!shouldShowBreakdown) return null;
              
              return (
                <>
                  <div className="relative py-5">
                    <div className="order-tracking-divider-line"></div>
                  </div>
                  <div className="order-tracking-price-breakdown">
                    {subtotal > 0 && (
                      <div className="order-tracking-breakdown-row">
                        <span className="order-tracking-breakdown-label">Subtotal:</span>
                        <span className="order-tracking-breakdown-value">
                          {formatCurrency(subtotal, currency)}
                        </span>
                      </div>
                    )}
                    {/* Sempre mostra shipping se foi definido na API (mesmo que seja 0) */}
                    {shipping !== null && (
                      <div className="order-tracking-breakdown-row">
                        <span className="order-tracking-breakdown-label">Shipping:</span>
                        <span className="order-tracking-breakdown-value">
                          {shipping === 0 ? formatCurrency(0, currency) : formatCurrency(shipping, currency)}
                        </span>
                      </div>
                    )}
                    {discount > 0 && (
                      <div className="order-tracking-breakdown-row">
                        <span className="order-tracking-breakdown-label">Discount:</span>
                        <span className="order-tracking-breakdown-value order-tracking-breakdown-discount">
                          -{formatCurrency(discount, currency)}
                        </span>
                      </div>
                    )}
                    {total > 0 && (
                      <div className="order-tracking-breakdown-row order-tracking-breakdown-total">
                        <span className="order-tracking-breakdown-label">Total:</span>
                        <span className="order-tracking-breakdown-value order-tracking-breakdown-total-value">
                          {formatCurrency(total, currency)}
                        </span>
                      </div>
                    )}
                  </div>
                </>
              );
            })()}

            {/* Delivery Address Section */}
            <div className="relative py-5">
              <div className="order-tracking-divider-line"></div>
            </div>
            <div className="order-tracking-address">
              <p className="order-tracking-label">DELIVERY ADDRESS</p>
              <p className="order-tracking-address-text">
                {order.shippingAddress || order.address || 'N/A'}
              </p>
            </div>

            {/* Tracking Section (if available) */}
            {(order.trackingNumber || order.trackingUrl || order.trackingCode) && (
              <>
                <div className="relative py-5">
                  <div className="order-tracking-divider-line"></div>
                </div>
                <div className="order-tracking-tracking">
                  <p className="order-tracking-label">TRACKING</p>
                  {order.trackingNumber && (
                    <p className="order-tracking-tracking-text">
                      {order.carrier ? `${order.carrier} - ` : ''}{order.trackingNumber}
                    </p>
                  )}
                  {/* Botão de rastreamento - aparece sempre que houver trackingUrl ou trackingCode */}
                  {(order.trackingUrl || order.trackingCode) && (
                    <a
                      href={order.trackingUrl || (order.trackingCode ? `https://www.correios.com.br/enviar/rastreamento?objeto=${order.trackingCode}` : '#')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="order-tracking-action-btn"
                      title={order.trackingCode ? `Track: ${order.trackingCode}` : "Track order"}
                    >
                      <ExternalLink className="order-tracking-action-icon" />
                      <span className="order-tracking-action-text">Track Order</span>
                    </a>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col items-center">
          <Button
            onClick={confirmOrder}
            className="chargemind-primary-button w-[85%] shadow-sm hover:shadow-md transition-all"
            style={{ backgroundColor: primaryColor, color: primaryTextColor }}
          >
            ✓ Continue
          </Button>
          <button
            type="button"
            onClick={() => {
              setOrder(null);
              setCurrentStep(1);
            }}
            className="chargemind-text-link-not-order"
          >
            Not this order
          </button>
        </div>
      </div>
    );
  };

  const renderStep3 = () => {
    const primaryColorRgba = hexToRgba(primaryColor, 0.1);
    const primaryColorRgbaHover = hexToRgba(primaryColor, 0.15);
    
    return (
      <div className="space-y-6" style={{ padding: '20px' }}>
        <div className="text-center">
          <h2 className="chargemind-step-title">Rapid Resolution Center</h2>
          <p className="chargemind-step-subtitle">
            Avoid waiting for support. Choose an option for immediate resolution.
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => selectRoute("not_received")}
            className="group option-card w-full text-left border active:scale-[0.99] transition-all duration-150"
            style={{ padding: '20px' }}
          >
            <div className="flex items-center gap-4">
              <div 
                className="p-2 rounded-md transition-colors chargemind-rapid-resolution-icon-container"
                style={{
                  backgroundColor: primaryColorRgba,
                  marginTop: '3px',
                }}
              >
                <Package className="h-6 w-6 chargemind-rapid-resolution-icon" style={{ color: primaryColor }} />
              </div>
              <div className="flex-1" style={{ marginTop: '-5px' }}>
                <p className="chargemind-rapid-resolution-card-title" style={{ marginBottom: '0px' }}>Product didn't arrive</p>
                <p className="chargemind-step-subtitle chargemind-rapid-resolution-card-subtitle" style={{ marginTop: '2px', marginBottom: '0px' }}>Check delivery status or report missing items</p>
              </div>
              <ChevronRight className="option-chevron h-5 w-5 flex-shrink-0 transition-colors" style={{ color: '#6B7280', marginTop: '3px' }} />
            </div>
          </button>

          <button
            onClick={() => selectRoute("defect")}
            className="group option-card w-full text-left border active:scale-[0.99] transition-all duration-150"
            style={{ padding: '20px' }}
          >
            <div className="flex items-center gap-4">
              <div 
                className="p-2 rounded-md transition-colors chargemind-rapid-resolution-icon-container"
                style={{
                  backgroundColor: primaryColorRgba,
                  marginTop: '3px',
                }}
              >
                <RotateCcw className="h-6 w-6 chargemind-rapid-resolution-icon" style={{ color: primaryColor }} />
              </div>
              <div className="flex-1" style={{ marginTop: '-5px' }}>
                <p className="chargemind-rapid-resolution-card-title" style={{ marginBottom: '0px' }}>Issue with the product or quality</p>
                <p className="chargemind-step-subtitle chargemind-rapid-resolution-card-subtitle" style={{ marginTop: '2px', marginBottom: '0px' }}>Item damaged, wrong, or doesn't work</p>
              </div>
              <ChevronRight className="option-chevron h-5 w-5 flex-shrink-0 transition-colors" style={{ color: '#6B7280', marginTop: '3px' }} />
            </div>
          </button>

          {/* Opção 3 Dinâmica: Cancelamento ou Retorno/Troca baseado no status do pedido */}
          {order && (order.status === "delivered" || order.status === "in_transit") ? (
            // Pedido Enviado: Mostrar opção de Retorno/Troca
            <button
              onClick={() => selectRoute("regret")}
              className="group option-card w-full text-left border active:scale-[0.99] transition-all duration-150"
              style={{ padding: '20px' }}
            >
              <div className="flex items-center gap-4">
                <div 
                  className="p-2 rounded-md transition-colors chargemind-rapid-resolution-icon-container"
                  style={{
                    backgroundColor: primaryColorRgba,
                    marginTop: '3px',
                  }}
                >
                  <RefreshCw className="h-6 w-6 chargemind-rapid-resolution-icon" style={{ color: primaryColor }} />
                </div>
                <div className="flex-1" style={{ marginTop: '-5px' }}>
                  <p className="chargemind-rapid-resolution-card-title" style={{ marginBottom: '0px' }}>I want to return or exchange</p>
                  <p className="chargemind-step-subtitle chargemind-rapid-resolution-card-subtitle" style={{ marginTop: '2px', marginBottom: '0px' }}>Changed my mind, didn't fit, or didn't like it</p>
                </div>
                <ChevronRight className="option-chevron h-5 w-5 flex-shrink-0 transition-colors" style={{ color: '#6B7280', marginTop: '3px' }} />
              </div>
            </button>
          ) : (
            // Pedido NÃO Enviado: Mostrar opção de Cancelamento
            <button
              onClick={() => selectRoute("cancel")}
              className="group option-card w-full text-left border active:scale-[0.99] transition-all duration-150"
              style={{ padding: '20px' }}
            >
              <div className="flex items-center gap-4">
                <div 
                  className="p-2 rounded-md transition-colors chargemind-rapid-resolution-icon-container"
                  style={{
                    backgroundColor: primaryColorRgba,
                    marginTop: '3px',
                  }}
                >
                  <XCircle className="h-6 w-6 chargemind-rapid-resolution-icon" style={{ color: primaryColor }} />
                </div>
                <div className="flex-1" style={{ marginTop: '-5px' }}>
                  <p className="chargemind-rapid-resolution-card-title" style={{ marginBottom: '0px' }}>I want to cancel my order</p>
                  <p className="chargemind-step-subtitle chargemind-rapid-resolution-card-subtitle" style={{ marginTop: '2px', marginBottom: '0px' }}>Stop shipment and get an instant refund</p>
                </div>
                <ChevronRight className="option-chevron h-5 w-5 flex-shrink-0 transition-colors" style={{ color: '#6B7280', marginTop: '3px' }} />
              </div>
            </button>
          )}

          <button
            onClick={() => selectRoute("fraud")}
            className="group option-card w-full text-left border active:scale-[0.99] transition-all duration-150"
            style={{ padding: '20px' }}
          >
            <div className="flex items-center gap-4">
              <div 
                className="p-2 rounded-md transition-colors chargemind-rapid-resolution-icon-container"
                style={{
                  backgroundColor: primaryColorRgba,
                  marginTop: '3px',
                }}
              >
                <AlertTriangle className="h-6 w-6 chargemind-rapid-resolution-icon" style={{ color: primaryColor }} />
              </div>
              <div className="flex-1" style={{ marginTop: '-5px' }}>
                <p className="chargemind-rapid-resolution-card-title" style={{ marginBottom: '0px' }}>Question about a charge on my statement</p>
                <p className="chargemind-step-subtitle chargemind-rapid-resolution-card-subtitle" style={{ marginTop: '2px', marginBottom: '0px' }}>Don't recognize the store name or amount</p>
              </div>
              <ChevronRight className="option-chevron h-5 w-5 flex-shrink-0 transition-colors" style={{ color: '#6B7280', marginTop: '3px' }} />
            </div>
          </button>
        </div>

        <div className="text-center pt-4 border-t">
          <a href="/suporte" className="chargemind-step-subtitle underline" style={{ color: '#6B7280' }} onMouseEnter={(e) => { e.currentTarget.style.color = primaryColor; }} onMouseLeave={(e) => { e.currentTarget.style.color = '#6B7280'; }}>
            Need to talk to someone? Customer support
          </a>
        </div>

        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setCurrentStep(2)}
            className="chargemind-text-link"
          >
            ← Back
          </button>
        </div>
      </div>
    );
  };

  const renderStep4 = () => {
    if (!route || !order) return null;

    const routeContexts = {
      not_received: {
        title: "Let's resolve this together",
        context: order.status === "delivered" 
          ? `We see the carrier marked as delivered on ${order.deliveryDate}. Sometimes the package is with neighbors or reception.`
          : order.status === "in_transit"
          ? "Your order is on the way. Let's wait for delivery before processing a refund."
          : "We understand your concern about delivery.",
      },
      defect: {
        title: "Let's fix this",
        context: "Product issues happen. Let's find the best solution.",
      },
      regret: {
        title: "Your satisfaction is important",
        context: "We understand preferences change. Let's see the options.",
      },
      cancel: {
        title: "Cancel your order",
        context: "We can cancel your order and process an instant refund.",
      },
      fraud: {
        title: "Let's investigate",
        context: "We take security seriously. We need to verify some details before proceeding.",
      },
    };

    const currentContext = routeContexts[route];
    const currencySymbol = extractCurrencySymbol(order.totalAmount);
    const orderValue = extractNumericValue(order.totalAmount);
    const creditValue = orderValue * 1.1;
    const creditDisplay = formatCurrencyValue(creditValue, currencySymbol);

    return (
      <div className="space-y-8" style={{ padding: '20px' }}>
        <div className="text-center">
          <h2 className="chargemind-step-title">{currentContext.title}</h2>
          <p className="chargemind-step-subtitle">{currentContext.context}</p>
          </div>

        {/* Opção PRIMÁRIA: Crédito - MÁXIMA HIERARQUIA VISUAL */}
        <Card 
          className="border-2 relative overflow-hidden shadow-lg rounded-lg"
          style={{ 
            borderColor: primaryColor,
            background: `linear-gradient(135deg, ${hexToRgba(primaryColor, 0.08)} 0%, white 50%, ${hexToRgba(primaryColor, 0.08)} 100%)`,
            boxShadow: `0 4px 12px ${hexToRgba(primaryColor, 0.15)}`,
            borderRadius: '8px'
          }}
        >
          <div 
            className="absolute top-0 right-0 px-3 pt-2 pb-3 font-medium rounded-bl-lg z-0 chargemind-best-choice-badge"
            style={{ backgroundColor: primaryColor, color: primaryTextColor }}
          >
            <span style={{ color: "#FFD700" }}>★</span> Best choice
          </div>
          <CardContent className="p-6 space-y-6 pt-12">
            <div className="flex items-start gap-4">
              <div 
                className="p-3 rounded-xl chargemind-credit-store-icon-wrapper"
                style={{ backgroundColor: hexToRgba(primaryColor, 0.15), marginTop: '20px' }}
              >
                <CreditCard className="h-6 w-6" style={{ color: primaryColor, marginTop: '3px' }} />
              </div>
              <div className="flex-1">
                <h3 className="chargemind-step-title leading-tight">
                  Store credit of {creditDisplay}
                </h3>
                <p className="chargemind-step-subtitle mt-3" style={{ fontWeight: '500' }}>
                  Receive {creditDisplay} to use on any product
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <span 
                className="px-3 py-2 text-xs font-semibold rounded-full border chargemind-credit-badge"
                style={{ 
                  backgroundColor: hexToRgba(primaryColor, 0.1), 
                  color: primaryColor,
                  borderColor: hexToRgba(primaryColor, 0.2)
                }}
              >
                ✓ Available immediately
              </span>
              <span 
                className="px-3 py-2 text-xs font-semibold rounded-full border chargemind-credit-badge"
                style={{ 
                  backgroundColor: hexToRgba(primaryColor, 0.1), 
                  color: primaryColor,
                  borderColor: hexToRgba(primaryColor, 0.2)
                }}
              >
                ✓ No expiration date
              </span>
              <span 
                className="px-3 py-2 text-xs font-semibold rounded-full border chargemind-credit-badge"
                style={{ 
                  backgroundColor: hexToRgba(primaryColor, 0.1), 
                  color: primaryColor,
                  borderColor: hexToRgba(primaryColor, 0.2)
                }}
              >
                ✓ You choose what you want
              </span>
            </div>

            <div className="flex justify-center">
              <Button
                onClick={() => selectDecision("credit")}
                className="chargemind-primary-button w-[85%] shadow-md hover:shadow-lg transition-all hover:scale-[1.02]"
                style={{ backgroundColor: primaryColor, color: primaryTextColor }}
              >
            Receive {creditDisplay} in Store Credit 
              </Button>
            </div>
          </CardContent>
        </Card>
      

        {/* Opção SECUNDÁRIA: Refund - MÍNIMA HIERARQUIA VISUAL */}
        <Card className="border border-[#DEDEDE] bg-[#F9F9F9] rounded-lg" style={{ borderRadius: '8px' }}>
          <CardContent className="p-5 space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-md bg-[#E9E9E9] chargemind-refund-mail-icon-wrapper" style={{ marginTop: '14px' }}>
                <RotateCcw className="h-5 w-5 text-[#6B7280]" />
              </div>
              <div className="flex-1">
                <h3 className="chargemind-field-label" style={{ fontWeight: '600', color: '#374151' }}>
                  Refund de {order.totalAmount}
                </h3>
                <p className="chargemind-step-subtitle mt-3" style={{ marginTop: '-11px' }}>
                  Return of original amount to payment method
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <span className="px-3 py-1.5 text-xs font-normal rounded-full bg-[#F9F9F9] text-[#6B7280] chargemind-refund-badge">
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  Processed in 5-10 business days
                </span>
              </span>
              <span className="px-3 py-1.5 text-xs font-normal rounded-full bg-[#F9F9F9] text-[#6B7280] chargemind-refund-badge">
                <span className="flex items-center gap-1.5">
                  <Info className="h-4 w-4" />
                  Subject to review
                </span>
              </span>
            </div>

            <div className="flex justify-center">
              <Button
                onClick={() => selectDecision("refund")}
                variant="outline"
                className="chargemind-secondary-button w-[85%] font-medium border-[#DEDEDE] bg-white text-[#374151] hover:bg-[#F9F9F9]"
              >
                Request refund
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-center">
        <button
          type="button"
            onClick={() => setCurrentStep(3)}
          className="chargemind-text-link"
          >
            ← Back
        </button>
        </div>
            </div>
  );
  };

  const renderStep5 = () => {
    if (!route || decision !== "refund") return null;

    return (
      <form onSubmit={handleEvidenceSubmit} className="space-y-6" style={{ padding: '20px' }}>
        <div className="text-center">
          <h2 className="chargemind-step-title">We need to understand better</h2>
          <p className="chargemind-step-subtitle">
            To process your refund, we need some information
                </p>
              </div>

        {/* Descrição detalhada - OBRIGATÓRIA PARA TODOS */}
        <div>
          <label className="chargemind-field-label block mb-2" style={{ fontWeight: '600' }}>
            Describe the problem in detail <span className="text-red-600">*</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Explain in detail what happened (minimum 50 characters)"
            className="chargemind-textarea-field w-full min-h-[120px]"
            required
          />
          <p className={classNames(
            "text-xs font-medium mt-1.5 chargemind-character-counter",
            description.length < 50 ? "text-[#6B7280]" : "text-green-600"
          )}>
            {description.length}/50 characters {description.length >= 50 && "✓"}
          </p>
          </div>

        {/* Campos específicos por rota */}
        {route === "not_received" && (
          <>
        <div className="space-y-3">
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <label className="flex items-start gap-2 chargemind-field-label" style={{ fontWeight: '500' }}>
                  <input
                    type="checkbox"
                    checked={checkedNeighbors ?? false}
                    onChange={(e) => setCheckedNeighbors(e.target.checked)}
                    className="rounded"
                    style={{ accentColor: primaryColor, marginTop: '2px', flexShrink: 0 }}
                    required
                  />
                  Did you check with neighbors, reception, or family members?
                </label>
              </div>

              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <label className="flex items-start gap-2 chargemind-field-label" style={{ fontWeight: '500' }}>
                  <input
                    type="checkbox"
                    checked={checkedCarrier ?? false}
                    onChange={(e) => setCheckedCarrier(e.target.checked)}
                    className="rounded"
                    style={{ accentColor: primaryColor, marginTop: '2px', flexShrink: 0 }}
                    required
                  />
                  Did you contact the carrier?
                </label>
              </div>
            </div>

            <div>
              <label className="chargemind-field-label block mb-2">
                Delivery area photo or carrier proof <span className="text-red-600">*</span>
              </label>
              <label
                htmlFor="upload-photos-not-received"
                className="relative flex flex-col items-center justify-center w-full min-h-[140px] border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 group"
                style={{
                  borderColor: photos.length > 0 ? hexToRgba(primaryColor, 0.4) : '#D1D5DB',
                  backgroundColor: photos.length > 0 ? hexToRgba(primaryColor, 0.03) : '#FAFAFA',
                  boxShadow: photos.length > 0 ? `0 1px 3px ${hexToRgba(primaryColor, 0.1)}` : 'none'
                }}
                onMouseEnter={(e) => {
                  if (photos.length === 0) {
                    e.currentTarget.style.borderColor = hexToRgba(primaryColor, 0.5);
                    e.currentTarget.style.backgroundColor = hexToRgba(primaryColor, 0.05);
                  }
                }}
                onMouseLeave={(e) => {
                  if (photos.length === 0) {
                    e.currentTarget.style.borderColor = '#D1D5DB';
                    e.currentTarget.style.backgroundColor = '#FAFAFA';
                  }
                }}
              >
                <input
                  id="upload-photos-not-received"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => setPhotos(Array.from(e.target.files || []))}
                  required
                  className="hidden"
                />
                <div className="flex flex-col items-center justify-center px-6 py-8">
                  <div 
                    className="p-4 rounded-full mb-3 transition-all"
                    style={{ 
                      backgroundColor: photos.length > 0 ? hexToRgba(primaryColor, 0.15) : hexToRgba(primaryColor, 0.1),
                      transform: photos.length > 0 ? 'scale(1.05)' : 'scale(1)'
                    }}
                  >
                    <Upload className="h-7 w-7" style={{ color: primaryColor }} />
                  </div>
                  <p className="mb-1.5 chargemind-field-label" style={{ fontWeight: '600', color: '#111827' }}>
                    {photos.length > 0 ? (
                      <span style={{ color: primaryColor }}>{photos.length} file(s) selected</span>
                    ) : (
                      <>
                        <span className="underline" style={{ color: primaryColor }}>Click to upload</span>
                        <span className="chargemind-step-subtitle"> or drag files here</span>
                      </>
                    )}
                  </p>
                  <p className="chargemind-helper-text mt-1">PNG, JPG or GIF (max. 10MB per file)</p>
                </div>
              </label>
            </div>
          </>
        )}

        {route === "defect" && (
          <>
            <div>
              <label className="chargemind-field-label block mb-1">
                What is the problem? <span className="text-red-600">*</span>
              </label>
              <select
                value={defectType}
                onChange={(e) => setDefectType(e.target.value)}
                className="chargemind-select-field w-full"
                required
              >
                <option value="">Select...</option>
                <option value="danificado">Damaged</option>
                <option value="diferente">Different from advertised</option>
                <option value="nao_funciona">No funciona</option>
                <option value="outro">Other</option>
              </select>
            </div>

            <div>
              <label className="chargemind-field-label block mb-2">
                Product photos showing the issue (minimum 2 photos) <span className="text-red-600">*</span>
              </label>
              <label
                htmlFor="upload-photos-defect"
                className="relative flex flex-col items-center justify-center w-full min-h-[140px] border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 group"
                style={{
                  borderColor: photos.length > 0 ? hexToRgba(primaryColor, 0.4) : '#D1D5DB',
                  backgroundColor: photos.length > 0 ? hexToRgba(primaryColor, 0.03) : '#FAFAFA',
                  boxShadow: photos.length > 0 ? `0 1px 3px ${hexToRgba(primaryColor, 0.1)}` : 'none'
                }}
                onMouseEnter={(e) => {
                  if (photos.length === 0) {
                    e.currentTarget.style.borderColor = hexToRgba(primaryColor, 0.5);
                    e.currentTarget.style.backgroundColor = hexToRgba(primaryColor, 0.05);
                  }
                }}
                onMouseLeave={(e) => {
                  if (photos.length === 0) {
                    e.currentTarget.style.borderColor = '#D1D5DB';
                    e.currentTarget.style.backgroundColor = '#FAFAFA';
                  }
                }}
              >
                <input
                  id="upload-photos-defect"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => setPhotos(Array.from(e.target.files || []))}
                  required
                  className="hidden"
                />
                <div className="flex flex-col items-center justify-center px-6 py-8">
                  <div 
                    className="p-4 rounded-full mb-3 transition-all"
                    style={{ 
                      backgroundColor: photos.length > 0 ? hexToRgba(primaryColor, 0.15) : hexToRgba(primaryColor, 0.1),
                      transform: photos.length > 0 ? 'scale(1.05)' : 'scale(1)'
                    }}
                  >
                    <Upload className="h-7 w-7" style={{ color: primaryColor }} />
                  </div>
                  <p className="mb-1.5 chargemind-field-label" style={{ fontWeight: '600', color: '#111827' }}>
                    {photos.length > 0 ? (
                      <span style={{ color: primaryColor }}>{photos.length} file(s) selected</span>
                    ) : (
                      <>
                        <span className="underline" style={{ color: primaryColor }}>Click to upload</span>
                        <span className="chargemind-step-subtitle"> or drag files here</span>
                      </>
                    )}
                  </p>
                  <p className="chargemind-helper-text mt-1">PNG, JPG or GIF (max. 10MB per file)</p>
                </div>
              </label>
              {photos.length > 0 && photos.length < 2 && (
                <p className="chargemind-helper-text mt-1" style={{ color: '#DC2626' }}>⚠️ Minimum of 2 photos required</p>
              )}
            </div>
          </>
        )}

        {route === "regret" && (
          <>
            <div className="space-y-3">
              <div>
                <label className="chargemind-field-label block mb-2">
                  Was the product opened/used? <span className="text-red-600">*</span>
                </label>
                <div className="flex gap-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="opened"
                      checked={productOpened === true}
                      onChange={() => setProductOpened(true)}
                      style={{ accentColor: primaryColor }}
                      required
                    />
                    <span className="chargemind-step-subtitle">Yes</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="opened"
                      checked={productOpened === false}
                      onChange={() => setProductOpened(false)}
                      style={{ accentColor: primaryColor }}
                      required
                    />
                    <span className="chargemind-step-subtitle">No</span>
                  </label>
          </div>
        </div>

              <div>
                <label className="chargemind-field-label block mb-2">
                  Is the product in original packaging? <span className="text-red-600">*</span>
          </label>
                <div className="flex gap-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="packaging"
                      checked={productPackaging === true}
                      onChange={() => setProductPackaging(true)}
                      style={{ accentColor: primaryColor }}
                      required
                    />
                    <span className="chargemind-step-subtitle">Yes</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="packaging"
                      checked={productPackaging === false}
                      onChange={() => setProductPackaging(false)}
                      style={{ accentColor: primaryColor }}
                      required
                    />
                    <span className="chargemind-step-subtitle">No</span>
                  </label>
        </div>
      </div>

              <div>
                <label className="chargemind-field-label block mb-1">
                  Reason for return <span className="text-red-600">*</span>
                </label>
                <select
                  value={regretReason}
                  onChange={(e) => setRegretReason(e.target.value)}
                  className="chargemind-select-field w-full"
                  required
                >
                  <option value="">Select...</option>
                  <option value="tamanho">Size didn't fit</option>
                  <option value="expectativa">Different from expectations</option>
                  <option value="duplicado">Purchased by mistake/duplicate</option>
                  <option value="outro">Other reason</option>
                </select>
              </div>
            </div>

            <div>
              <label className="chargemind-field-label block mb-2">
                Product photo in resale condition <span className="text-red-600">*</span>
              </label>
              <label
                htmlFor="upload-photos-regret"
                className="relative flex flex-col items-center justify-center w-full min-h-[140px] border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 group"
                style={{
                  borderColor: photos.length > 0 ? hexToRgba(primaryColor, 0.4) : '#D1D5DB',
                  backgroundColor: photos.length > 0 ? hexToRgba(primaryColor, 0.03) : '#FAFAFA',
                  boxShadow: photos.length > 0 ? `0 1px 3px ${hexToRgba(primaryColor, 0.1)}` : 'none'
                }}
                onMouseEnter={(e) => {
                  if (photos.length === 0) {
                    e.currentTarget.style.borderColor = hexToRgba(primaryColor, 0.5);
                    e.currentTarget.style.backgroundColor = hexToRgba(primaryColor, 0.05);
                  }
                }}
                onMouseLeave={(e) => {
                  if (photos.length === 0) {
                    e.currentTarget.style.borderColor = '#D1D5DB';
                    e.currentTarget.style.backgroundColor = '#FAFAFA';
                  }
                }}
              >
                <input
                  id="upload-photos-regret"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => setPhotos(Array.from(e.target.files || []))}
                  required
                  className="hidden"
                />
                <div className="flex flex-col items-center justify-center px-6 py-8">
                  <div 
                    className="p-4 rounded-full mb-3 transition-all"
                    style={{ 
                      backgroundColor: photos.length > 0 ? hexToRgba(primaryColor, 0.15) : hexToRgba(primaryColor, 0.1),
                      transform: photos.length > 0 ? 'scale(1.05)' : 'scale(1)'
                    }}
                  >
                    <Upload className="h-7 w-7" style={{ color: primaryColor }} />
                  </div>
                  <p className="mb-1.5 chargemind-field-label" style={{ fontWeight: '600', color: '#111827' }}>
                    {photos.length > 0 ? (
                      <span style={{ color: primaryColor }}>{photos.length} photo(s) selected</span>
                    ) : (
                      <>
                        <span className="underline" style={{ color: primaryColor }}>Click to upload</span>
                        <span className="chargemind-step-subtitle"> or drag files here</span>
                      </>
                    )}
                  </p>
                  <p className="chargemind-helper-text mt-1">PNG, JPG or GIF (max. 10MB per file)</p>
                </div>
              </label>
            </div>
          </>
        )}

        {route === "fraud" && (
          <>
            <div>
              <label className="chargemind-field-label block mb-1">
                Do you recognize the delivery address? <span className="text-red-600">*</span>
              </label>
              <select
                value={recognizeAddress}
                onChange={(e) => setRecognizeAddress(e.target.value)}
                className="chargemind-select-field w-full"
                required
              >
                <option value="">Select...</option>
                <option value="sim">Yes</option>
                <option value="nao">No</option>
                <option value="parcialmente">Partially</option>
              </select>
            </div>

            <div className="space-y-3">
              <div>
                <label className="chargemind-field-label block mb-2">
                  Could a family member/acquaintance have made the purchase? <span className="text-red-600">*</span>
                </label>
                <div className="flex gap-3">
                  <label className="flex items-center gap-2">
              <input
                      type="radio"
                      name="family"
                      checked={familyPurchase === true}
                      onChange={() => setFamilyPurchase(true)}
                      style={{ accentColor: primaryColor }}
                      required
                    />
                    <span className="chargemind-step-subtitle">Yes</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="family"
                      checked={familyPurchase === false}
                      onChange={() => setFamilyPurchase(false)}
                      style={{ accentColor: primaryColor }}
                      required
                    />
                    <span className="chargemind-step-subtitle">No</span>
            </label>
          </div>
              </div>

              <div>
                <label className="chargemind-field-label block mb-2">
                  Have you already disputed with your card/bank? <span className="text-red-600">*</span>
                </label>
                <div className="flex gap-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="chargeback"
                      checked={chargebackInitiated === true}
                      onChange={() => setChargebackInitiated(true)}
                      style={{ accentColor: primaryColor }}
                      required
                    />
                    <span className="chargemind-step-subtitle">Yes</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="chargeback"
                      checked={chargebackInitiated === false}
                      onChange={() => setChargebackInitiated(false)}
                      style={{ accentColor: primaryColor }}
                      required
                    />
                    <span className="chargemind-step-subtitle">No</span>
                  </label>
                </div>
              </div>

              {chargebackInitiated && (
                <div>
                  <label className="chargemind-field-label block mb-1">
                    Dispute protocol <span className="text-red-600">*</span>
                  </label>
                  <Input
                    type="text"
                    value={chargebackProtocol}
                    onChange={(e) => setChargebackProtocol(e.target.value)}
                    placeholder="Ex: PROT-123456"
                    className="chargemind-input-field h-[60px] input-field"
                    required
                  />
                </div>
        )}
      </div>

            <div>
              <label className="chargemind-field-label block mb-2">
                Proof (card statement, police report, etc) <span className="text-red-600">*</span>
              </label>
              <label
                htmlFor="upload-photos-fraud"
                className="relative flex flex-col items-center justify-center w-full min-h-[140px] border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 group"
                style={{
                  borderColor: photos.length > 0 ? hexToRgba(primaryColor, 0.4) : '#D1D5DB',
                  backgroundColor: photos.length > 0 ? hexToRgba(primaryColor, 0.03) : '#FAFAFA',
                  boxShadow: photos.length > 0 ? `0 1px 3px ${hexToRgba(primaryColor, 0.1)}` : 'none'
                }}
                onMouseEnter={(e) => {
                  if (photos.length === 0) {
                    e.currentTarget.style.borderColor = hexToRgba(primaryColor, 0.5);
                    e.currentTarget.style.backgroundColor = hexToRgba(primaryColor, 0.05);
                  }
                }}
                onMouseLeave={(e) => {
                  if (photos.length === 0) {
                    e.currentTarget.style.borderColor = '#D1D5DB';
                    e.currentTarget.style.backgroundColor = '#FAFAFA';
                  }
                }}
              >
                <input
                  id="upload-photos-fraud"
                  type="file"
                  accept="image/*,application/pdf"
                  multiple
                  onChange={(e) => setPhotos(Array.from(e.target.files || []))}
                  required
                  className="hidden"
                />
                <div className="flex flex-col items-center justify-center px-6 py-8">
                  <div 
                    className="p-4 rounded-full mb-3 transition-all"
                    style={{ 
                      backgroundColor: photos.length > 0 ? hexToRgba(primaryColor, 0.15) : hexToRgba(primaryColor, 0.1),
                      transform: photos.length > 0 ? 'scale(1.05)' : 'scale(1)'
                    }}
                  >
                    <Upload className="h-7 w-7" style={{ color: primaryColor }} />
                  </div>
                  <p className="mb-1.5 chargemind-field-label" style={{ fontWeight: '600', color: '#111827' }}>
                    {photos.length > 0 ? (
                      <span style={{ color: primaryColor }}>{photos.length} file(s) selected</span>
                    ) : (
                      <>
                        <span className="underline" style={{ color: primaryColor }}>Click to upload</span>
                        <span className="chargemind-step-subtitle"> or drag files here</span>
                      </>
                    )}
                  </p>
                  <p className="chargemind-helper-text mt-1">PNG, JPG, PDF or GIF (max. 10MB per file)</p>
                </div>
              </label>
            </div>
          </>
      )}

        {evidenceError && (
          <div className="animate-in fade-in slide-in-from-top-2 bg-red-50 border border-red-100 rounded-xl px-4 py-[18px] mt-4">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <p className="chargemind-error-title">
                  Something went wrong
                </p>
                <p className="chargemind-error-message">{evidenceError}</p>
              </div>
            </div>
        </div>
      )}

        <div className="flex justify-center">
          <Button
            type="submit"
            disabled={submitting}
            className="chargemind-primary-button w-full shadow-sm hover:shadow-md transition-all disabled:opacity-50"
            style={{ backgroundColor: primaryColor, color: primaryTextColor }}
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Sending...
              </span>
            ) : (
              "Send request"
            )}
          </Button>
        </div>

        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setCurrentStep(4)}
            className="chargemind-text-link"
          >
            ← Back
          </button>
        </div>
    </form>
  );
  };

  const renderStep6 = () => {
    if (!decision) return null;

    if (decision === "credit") {
      return (
        <div className="space-y-6">
          <div className="text-center">
            <div 
              className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 animate-in zoom-in duration-300"
              style={{ 
                backgroundColor: "#25B079",
                boxShadow: "0 4px 12px rgba(16, 185, 129, 0.15)"
              }}
            >
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <h2 className="chargemind-step-title">All set! Your credit is ready</h2>
            <p className="chargemind-step-subtitle">Use it now in the store</p>
          </div>

          <div className="order-tracking-card-wrapper md:px-3">
            <div className="order-tracking-card">
              {/* Header Section */}
              <div className="order-tracking-header">
                <div className="order-tracking-header-left">
                  <p className="order-tracking-label">CREDIT</p>
                  <p className="order-tracking-number">
                    {creditCode}
                  </p>
                  <p className="order-tracking-customer">Available now</p>
                </div>
              </div>

              {/* Credit Details Section */}
              <div className="relative py-5">
                <div className="order-tracking-divider-line"></div>
              </div>
              <div className="order-tracking-details">
                <div className="order-tracking-detail-row">
                  <span className="order-tracking-detail-label">Credit amount:</span>
                  <span className="order-tracking-detail-value">
                    {order?.totalAmount ? (() => { 
                      const currSym = extractCurrencySymbol(order.totalAmount); 
                      const val = extractNumericValue(order.totalAmount) * 1.1; 
                      return formatCurrencyValue(val, currSym); 
                    })() : "$0.00"}
                  </span>
                </div>
                <div className="order-tracking-detail-row" style={{ marginTop: '12px' }}>
                  <span className="order-tracking-detail-label">Sent to:</span>
                  <span className="order-tracking-detail-value">
                    {order?.email || 'N/A'}
                  </span>
                </div>
              </div>

              {/* Credit Code Section */}
              <div className="relative py-5">
                <div className="order-tracking-divider-line"></div>
              </div>
              <div className="order-tracking-address">
                <p className="order-tracking-label">CREDIT CODE</p>
                <div 
                  onClick={() => copyToClipboard(creditCode)}
                  className="bg-white border-2 border-[#DEDEDE] rounded-lg p-5 mt-4 text-center cursor-pointer hover:bg-[#F9F9F9] transition-colors"
                  style={{ borderColor: hexToRgba(primaryColor, 0.3) }}
                >
                  <div className="flex items-center justify-center gap-3">
                    <code 
                      className="text-2xl font-mono font-extrabold tracking-wider"
                      style={{ color: primaryColor }}
                    >
                      {creditCode}
                    </code>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(creditCode);
                      }}
                      className="p-2.5 transition-colors"
                      style={{ backgroundColor: 'transparent', border: 'none', outline: 'none' }}
                      title="Copy code"
                    >
                      <Copy className="h-5 w-5" style={{ color: primaryColor }} />
                    </button>
                  </div>
                  <p className="chargemind-helper-text mt-2">Click anywhere to copy</p>
                </div>
              </div>

              {/* Usage Info Section */}
              <div className="relative py-5">
                <div className="order-tracking-divider-line"></div>
              </div>
              <div className="order-tracking-address">
                <p className="order-tracking-label">USAGE</p>
                <p className="order-tracking-address-text">
                  Use this credit code on any product in the store. The code has been sent to your email.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center">
            <Button
              onClick={() => window.location.href = "/"}
              className="chargemind-primary-button w-[85%] shadow-sm hover:shadow-md transition-all"
              style={{ backgroundColor: primaryColor, color: primaryTextColor }}
            >
              🛍️ Go to store
            </Button>
          </div>

          {/* Feedback com emojis */}
          <div className="border-t pt-6 mt-6">
            <p className="chargemind-step-subtitle text-center mb-6" style={{ fontWeight: '600', color: '#1F2937' }}>
              How was your experience resolving this?
            </p>
            
            {/* Emoji rating selection */}
            <div className="flex items-start justify-center gap-6">
              {/* Good - Happy face */}
              <div className="flex flex-col items-center gap-4">
                <button
                  onClick={() => setExperienceRating("good")}
                  className={`relative w-16 h-16 rounded-full transition-all duration-200 flex items-center justify-center ${
                    experienceRating === "good" ? "" : "hover:scale-110"
                  } ${experienceRating !== "good" && experienceRating !== null ? "grayscale opacity-50" : ""}`}
                  style={experienceRating === "good" ? { 
                    boxShadow: `0 0 0 4px ${primaryColor}, 0 0 0 8px white`,
                    border: 'none',
                    outline: 'none'
                  } : { border: 'none', outline: 'none' }}
                >
                  <span className="text-4xl">😊</span>
                </button>
                {experienceRating === "good" && (
                  <div className="relative">
                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[8px]" style={{ borderBottomColor: primaryColor }} />
                    <span className="text-white text-sm font-medium px-4 py-1.5 rounded-full whitespace-nowrap" style={{ backgroundColor: primaryColor, color: primaryTextColor }}>
                      Really Good
                    </span>
                  </div>
                )}
              </div>

              {/* Neutral - Neutral face */}
              <div className="flex flex-col items-center gap-4">
                <button
                  onClick={() => setExperienceRating("neutral")}
                  className={`relative w-16 h-16 rounded-full transition-all duration-200 flex items-center justify-center ${
                    experienceRating === "neutral" ? "" : "hover:scale-110"
                  } ${experienceRating !== "neutral" && experienceRating !== null ? "grayscale opacity-50" : ""}`}
                  style={experienceRating === "neutral" ? { 
                    boxShadow: `0 0 0 4px ${primaryColor}, 0 0 0 8px white`,
                    border: 'none',
                    outline: 'none'
                  } : { border: 'none', outline: 'none' }}
                >
                  <span className="text-4xl">😐</span>
                </button>
                {experienceRating === "neutral" && (
                  <div className="relative">
                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[8px]" style={{ borderBottomColor: primaryColor }} />
                    <span className="text-white text-sm font-medium px-4 py-1.5 rounded-full whitespace-nowrap" style={{ backgroundColor: primaryColor, color: primaryTextColor }}>
                      Okay
                    </span>
                  </div>
                )}
              </div>

              {/* Bad - Sad face */}
              <div className="flex flex-col items-center gap-4">
                <button
                  onClick={() => setExperienceRating("bad")}
                  className={`relative w-16 h-16 rounded-full transition-all duration-200 flex items-center justify-center ${
                    experienceRating === "bad" ? "" : "hover:scale-110"
                  } ${experienceRating !== "bad" && experienceRating !== null ? "grayscale opacity-50" : ""}`}
                  style={experienceRating === "bad" ? { 
                    boxShadow: `0 0 0 4px ${primaryColor}, 0 0 0 8px white`,
                    border: 'none',
                    outline: 'none'
                  } : { border: 'none', outline: 'none' }}
                >
                  <span className="text-4xl">😔</span>
                </button>
                {experienceRating === "bad" && (
                  <div className="relative">
                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[8px]" style={{ borderBottomColor: primaryColor }} />
                    <span className="text-white text-sm font-medium px-4 py-1.5 rounded-full whitespace-nowrap" style={{ backgroundColor: primaryColor, color: primaryTextColor }}>
                      Not Good
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Refund
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div 
            className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 animate-in zoom-in duration-300"
            style={{ 
              backgroundColor: "#FEF3C7",
              boxShadow: "0 4px 12px rgba(245, 158, 11, 0.15)"
            }}
          >
            <Clock className="h-8 w-8 text-yellow-600" />
          </div>
          <h2 className="chargemind-step-title">Request received</h2>
          <p className="chargemind-step-subtitle">You will receive updates by email</p>
        </div>

        <div className="order-tracking-card-wrapper md:px-3">
          <div className="order-tracking-card">
            {/* Header Section */}
            <div className="order-tracking-header">
              <div className="order-tracking-header-left">
                <p className="order-tracking-label">REFUND REQUEST</p>
                <p className="order-tracking-number">
                  #{protocol}
                </p>
                <p className="order-tracking-customer">Under review</p>
              </div>
            </div>

            {/* Status Details Section */}
            <div className="relative py-5">
              <div className="order-tracking-divider-line"></div>
            </div>
            <div className="order-tracking-details">
              <div className="order-tracking-detail-row">
                <span className="order-tracking-detail-label">Email sent to:</span>
                <span className="order-tracking-detail-value">
                  {order?.email || 'N/A'}
                </span>
              </div>
              <div className="order-tracking-detail-row" style={{ marginTop: '12px' }}>
                <span className="order-tracking-detail-label">Review time:</span>
                <span className="order-tracking-detail-value">
                  24-48 hours
                </span>
              </div>
              <div className="order-tracking-detail-row" style={{ marginTop: '12px' }}>
                <span className="order-tracking-detail-label">Refund time:</span>
                <span className="order-tracking-detail-value">
                  5-10 business days
                </span>
              </div>
            </div>

            {/* Protocol Number Section */}
            <div className="relative py-5">
              <div className="order-tracking-divider-line"></div>
            </div>
            <div className="order-tracking-address">
              <p className="order-tracking-label">PROTOCOL NUMBER</p>
              <div 
                onClick={() => copyProtocolToClipboard(protocol)}
                className="bg-white border-2 border-[#DEDEDE] rounded-lg p-5 mt-4 text-center cursor-pointer hover:bg-[#F9F9F9] transition-colors overflow-hidden"
                style={{ borderColor: hexToRgba(primaryColor, 0.3) }}
              >
                <div className="flex items-center justify-center gap-3 flex-wrap">
                  <code 
                    className="text-lg font-mono font-extrabold tracking-wider break-words overflow-wrap-anywhere"
                    style={{ color: primaryColor, maxWidth: '100%', wordBreak: 'break-all' }}
                  >
                    #{protocol}
                  </code>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      copyProtocolToClipboard(protocol);
                    }}
                    className="p-2.5 transition-colors"
                    style={{ backgroundColor: 'transparent', border: 'none', outline: 'none' }}
                    title="Copy protocol"
                  >
                    <Copy className="h-5 w-5" style={{ color: primaryColor }} />
                  </button>
                </div>
                <p className="chargemind-helper-text mt-2">Click anywhere to copy</p>
              </div>
            </div>

            {/* Important Notice Section */}
            <div className="relative py-5">
              <div className="order-tracking-divider-line"></div>
            </div>
            <div className="order-tracking-address">
              <p className="order-tracking-label">IMPORTANT</p>
              <div className="border-2 rounded-lg p-5 mt-4" style={{ backgroundColor: hexToRgba('#DC2626', 0.1), borderColor: '#DC2626' }}>
                <div className="flex gap-3" style={{ color: '#DC2626' }}>
                  <AlertTriangle className="h-6 w-6 flex-shrink-0" style={{ color: '#DC2626', flexShrink: 0 }} />
                  <div className="flex-1" style={{ color: '#DC2626' }}>
                    <p style={{ fontWeight: '700', color: '#DC2626', fontSize: '14px', lineHeight: '1.5', margin: '0 0 4px 0', padding: 0 }}>IMPORTANT</p>
                    <p style={{ color: '#DC2626', fontSize: '14px', lineHeight: '1.5', margin: 0, padding: 0 }}>
                      Do not initiate a chargeback with your bank while we are reviewing your case. This may delay or cancel your request.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t pt-6">
          <label className="chargemind-field-label block mb-2">
            Is there anything else you'd like to tell us? (optional)
          </label>
          <textarea
            value={additionalFeedback}
            onChange={(e) => setAdditionalFeedback(e.target.value)}
            placeholder="Your feedback helps us improve..."
            className="chargemind-textarea-field w-full min-h-[65px]"
          />
        </div>
        {renderExperienceFeedback()}
      </div>
    );
  };

  return (
    <>
      {/* CSS Isolado - Escopo exclusivo para ResolutionHub usando .chargemind-resolution-hub */}
      <style>{`
        /* ========================================
           RESET ISOLADO - Apenas para ResolutionHub
           Combate estilos do Shopify sem afetar Tailwind
           ======================================== */
        
        /* Container principal: reset básico apenas para combater Shopify */
        .chargemind-resolution-hub {
          font-size: 16px;
          line-height: 1.5;
          max-width: 100%;
          overflow-x: hidden;
          overflow-y: visible !important; /* Não permite scroll vertical próprio */
          /* Garante que não herde text-align do Shopify - !important necessário aqui */
          text-align: initial !important;
          /* Garante que não herde display flex ou grid do Shopify */
          display: block !important;
          /* Garante que não herde margin auto do Shopify */
          margin: 0 !important;
          /* Garante que sempre comece no topo */
          scroll-margin-top: 0 !important;
          scroll-padding-top: 0 !important;
        }
        
        /* Garante que o container principal sempre role para o topo */
        #chargemind-resolution-hub-container {
          scroll-margin-top: 0 !important;
          scroll-padding-top: 0 !important;
        }
        
        /* Proteção contra centralização forçada do Shopify - apenas reset inicial */
        .chargemind-resolution-hub > * {
          text-align: initial;
        }
        
        /* Elementos que devem manter seu próprio text-align - maior especificidade */
        .chargemind-resolution-hub .text-center,
        .chargemind-resolution-hub [class*="text-center"] {
          text-align: center !important;
        }
        .chargemind-resolution-hub .text-left,
        .chargemind-resolution-hub [class*="text-left"] {
          text-align: left !important;
        }
        .chargemind-resolution-hub .text-right,
        .chargemind-resolution-hub [class*="text-right"] {
          text-align: right !important;
        }
        
        /* Proteção contra margin auto do Shopify que centraliza elementos */
        .chargemind-resolution-hub *:not(.mx-auto):not([class*="mx-auto"]) {
          margin-left: initial;
          margin-right: initial;
        }
        
        /* Mantém classes Tailwind de margin que devem funcionar */
        .chargemind-resolution-hub .mx-auto,
        .chargemind-resolution-hub [class*="mx-auto"] {
          margin-left: auto;
          margin-right: auto;
        }
        
        /* Box-sizing border-box apenas para elementos dentro do hub */
        .chargemind-resolution-hub *,
        .chargemind-resolution-hub *::before,
        .chargemind-resolution-hub *::after {
          box-sizing: border-box;
        }
        
        /* Inputs e botões respeitam largura - sem !important para não quebrar Tailwind */
        .chargemind-resolution-hub input,
        .chargemind-resolution-hub textarea,
        .chargemind-resolution-hub button,
        .chargemind-resolution-hub select {
          max-width: 100%;
          box-sizing: border-box;
        }
        
        /* Textos longos quebram corretamente */
        .chargemind-resolution-hub p,
        .chargemind-resolution-hub span {
          word-wrap: break-word;
          overflow-wrap: break-word;
        }
        
        /* Formulários respeitam a largura */
        .chargemind-resolution-hub form {
          max-width: 100%;
          box-sizing: border-box;
        }
        
        /* ========================================
           RADIO BUTTONS - Estilo quadrado
           ======================================== */
        .chargemind-resolution-hub input[type="radio"] {
          border-radius: 0 !important;
          appearance: none !important;
          width: 18px !important;
          height: 18px !important;
          border: 2px solid #D1D5DB !important;
          background-color: #FFFFFF !important;
          position: relative !important;
          cursor: pointer !important;
          transition: all 0.15s ease-in-out !important;
        }
        
        .chargemind-resolution-hub input[type="radio"]:checked {
          background-color: ${primaryColor} !important;
          border-color: ${primaryColor} !important;
        }
        
        .chargemind-resolution-hub input[type="radio"]:checked::after {
          content: '✓' !important;
          position: absolute !important;
          top: 50% !important;
          left: 50% !important;
          transform: translate(-50%, -50%) !important;
          color: #FFFFFF !important;
          font-size: 12px !important;
          font-weight: bold !important;
          line-height: 1 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }
        
        .chargemind-resolution-hub input[type="radio"]:hover {
          border-color: ${primaryColor} !important;
        }
        
        /* Alinhamento vertical dos labels com radio buttons */
        .chargemind-resolution-hub label:has(input[type="radio"]) {
          display: flex !important;
          align-items: center !important;
          gap: 8px !important;
        }
        
        /* Alinhamento do texto dentro dos labels de radio */
        .chargemind-resolution-hub label:has(input[type="radio"]) .chargemind-step-subtitle {
          margin: 0 !important;
          line-height: 1 !important;
          display: flex !important;
          align-items: center !important;
        }
        
        /* Garantir que o input radio esteja alinhado verticalmente */
        .chargemind-resolution-hub label:has(input[type="radio"]) input[type="radio"] {
          margin: 0 !important;
          flex-shrink: 0 !important;
        }
        
        /* ========================================
           CHARACTER COUNTER - Contador de caracteres
           ======================================== */
        .chargemind-resolution-hub .chargemind-character-counter {
          font-size: 12px !important;
        }
        
        /* ========================================
           TEXTAREA FIELDS - Estilos completos dos textareas isolados
           ======================================== */
        /* Border-radius: 8px, Border: 1px solid #D1D5DB - Moderno, claro, padrão Shopify/SaaS */
        .chargemind-resolution-hub .chargemind-textarea-field {
          font-size: 14px !important;
          font-weight: 400 !important;
          color: #374151 !important;
          border-radius: 8px !important;
          border: 1px solid #D1D5DB !important;
          background-color: #FFFFFF !important;
          padding: 12px 16px !important;
          transition: all 0.15s ease-in-out !important;
          resize: vertical !important;
        }
        
        /* Hover: borda e background sutis */
        .chargemind-resolution-hub .chargemind-textarea-field:hover {
          border-color: #E9E9E9 !important;
          background-color: #F9F9F9 !important;
        }
        
        /* Focus: borda + leve glow - Moderno, padrão Shopify/SaaS */
        .chargemind-resolution-hub .chargemind-textarea-field:focus-visible {
          outline: none !important;
          border-color: ${primaryColor} !important;
          box-shadow: 0 0 0 3px ${hexToRgba(primaryColor, 0.1)} !important;
        }
        
        .chargemind-resolution-hub .chargemind-textarea-field::placeholder {
          color: #9CA3AF !important;
          font-weight: 400 !important;
          opacity: 1 !important;
        }
        
        /* ========================================
           SELECT FIELDS - Estilos completos dos selects isolados
           ======================================== */
        /* Border-radius: 8px, Border: 1px solid #D1D5DB - Moderno, claro, padrão Shopify/SaaS */
        .chargemind-resolution-hub .chargemind-select-field {
          font-size: 14px !important;
          font-weight: 400 !important;
          color: #374151 !important;
          border-radius: 8px !important;
          border: 1px solid #D1D5DB !important;
          background-color: #FFFFFF !important;
          padding: 12px 16px !important;
          padding-right: 40px !important;
          height: 56px !important;
          transition: all 0.15s ease-in-out !important;
          appearance: none !important;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23374151' d='M6 9L1 4h10z'/%3E%3C/svg%3E") !important;
          background-repeat: no-repeat !important;
          background-position: right 16px center !important;
        }
        
        /* Hover: borda e background sutis */
        .chargemind-resolution-hub .chargemind-select-field:hover {
          border-color: #E9E9E9 !important;
          background-color: #F9F9F9 !important;
        }
        
        /* Focus: borda + leve glow - Moderno, padrão Shopify/SaaS */
        .chargemind-resolution-hub .chargemind-select-field:focus-visible {
          outline: none !important;
          border-color: ${primaryColor} !important;
          box-shadow: 0 0 0 3px ${hexToRgba(primaryColor, 0.1)} !important;
        }
        
        /* ========================================
           HEADER TITLE - Tamanho de fonte responsivo isolado
           ======================================== */
        /* Mobile: 22px, Desktop: 32px - Sem vazar para outras partes do sistema */
        .chargemind-resolution-hub .chargemind-header-title {
          font-size: 22px !important;
          font-weight: 600 !important;
          line-height: 1.2;
          color: #1F2937 !important;
          margin-bottom: px;
        }
        
        /* Tablet: 24px (>= 640px e < 768px) */
        @media (min-width: 640px) and (max-width: 767px) {
          .chargemind-resolution-hub .chargemind-header-title {
            font-size: 24px !important;
          }
        }
        
        /* Desktop: 32px (>= 768px) */
        @media (min-width: 768px) {
          .chargemind-resolution-hub .chargemind-header-title {
            font-size: 22px !important;
          }
        }
        
        /* ========================================
           HEADER SUBTITLE - Texto explicativo responsivo isolado
           ======================================== */
        /* Mobile: 14px, Desktop: 16px - Texto explicativo, não compete com o título */
        .chargemind-resolution-hub .chargemind-header-subtitle {
          font-size: 14px !important;
          font-weight: 400 !important;
          line-height: 1.5 !important;
          color: #6B7280 !important;
        }
        
        /* Desktop: 16px (>= 768px) */
        @media (min-width: 768px) {
          .chargemind-resolution-hub .chargemind-header-subtitle {
            font-size: 16px !important;
          }
        }
        
        /* ========================================
           STEP TITLE - Título de ação principal responsivo isolado
           ======================================== */
        /* Mobile: 18px, Desktop: 20px - Marca início da ação, sem parecer segundo H1 */
        .chargemind-resolution-hub .chargemind-step-title {
          font-size: 18px !important;
          font-weight: 600 !important;
          line-height: 1.3 !important;
          color: #1F2937 !important;
          margin-bottom: 0px;
        }
        
        /* Desktop: 20px (>= 768px) */
        @media (min-width: 768px) {
          .chargemind-resolution-hub .chargemind-step-title {
            font-size: 20px !important;
          }
        }
        
        /* ========================================
           STEP SUBTITLE - Texto explicativo extremamente legível responsivo isolado
           ======================================== */
        /* Mobile: 14px, Desktop: 15px - Extremamente legível, principalmente no mobile */
        .chargemind-resolution-hub .chargemind-step-subtitle {
          font-size: 14px !important;
          font-weight: 400 !important;
          line-height: 1.5 !important;
          color: #6B7280 !important;
          margin-top: 0px;
          margin-bottom: 10px;
        }
        
        /* Desktop: 15px (>= 768px) */
        @media (min-width: 768px) {
          .chargemind-resolution-hub .chargemind-step-subtitle {
            font-size: 15px !important;
          }
        }
        
        /* ========================================
           FIELD LABELS - Labels dos campos responsivos isolados
           ======================================== */
        /* Mobile: 13px, Desktop: 14px - Labels menores que texto normal, mas claras */
        .chargemind-resolution-hub .chargemind-field-label {
          font-size: 13px !important;
          font-weight: 500 !important;
          line-height: 1.4 !important;
          color: #374151 !important;
        }
        
        /* Desktop: 14px (>= 768px) */
        @media (min-width: 768px) {
          .chargemind-resolution-hub .chargemind-field-label {
            font-size: 14px !important;
          }
        }
        
        /* ========================================
           RAPID RESOLUTION CENTER - Títulos dos cards isolados
           ======================================== */
        /* Títulos dos cards do Rapid Resolution Center com peso maior e isolados */
        .chargemind-resolution-hub .chargemind-rapid-resolution-card-title {
          font-size: 13px !important;
          font-weight: 700 !important;
          line-height: 1.4 !important;
          color: #1F2937 !important;
          margin-bottom: 0px !important;
        }
        
        /* Desktop: 14px (>= 768px) */
        @media (min-width: 768px) {
          .chargemind-resolution-hub .chargemind-rapid-resolution-card-title {
            font-size: 14px !important;
          }
        }
        
        /* Subtítulos dos cards do Rapid Resolution Center com espaçamento reduzido e isolados */
        .chargemind-resolution-hub .chargemind-step-subtitle.chargemind-rapid-resolution-card-subtitle {
          margin-top: 2px !important;
          margin-bottom: 0px !important;
        }
        
        /* Ícones dos cards do Rapid Resolution Center - Tamanho customizado e isolado */
        .chargemind-resolution-hub .chargemind-rapid-resolution-icon-container {
          padding: 8px !important;
          border-radius: 8px !important;
        }
        
        .chargemind-resolution-hub .chargemind-rapid-resolution-icon {
          width: 32px !important;
          height: 32px !important;
        }
        
        /* Container do ícone Store no card de crédito - 47x47px arredondado isolado */
        .chargemind-resolution-hub .chargemind-credit-store-icon-wrapper {
          width: 47px !important;
          height: 47px !important;
          min-width: 47px !important;
          min-height: 47px !important;
          max-width: 47px !important;
          max-height: 47px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          border-radius: 8px !important;
        }
        
        /* Container do ícone Mail no card de refund - 47x47px arredondado isolado */
        .chargemind-resolution-hub .chargemind-refund-mail-icon-wrapper {
          width: 47px !important;
          height: 47px !important;
          min-width: 47px !important;
          min-height: 47px !important;
          max-width: 47px !important;
          max-height: 47px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          border-radius: 8px !important;
        }
        
        /* Badges do card de crédito - Fonte 12px isolado */
        .chargemind-resolution-hub .chargemind-credit-badge {
          font-size: 12px !important;
        }
        
        /* Badges do card de refund - Fonte 12px isolado */
        .chargemind-resolution-hub .chargemind-refund-badge {
          font-size: 12px !important;
        }
        
        /* Badge "Best choice" - Fonte 14px no mobile isolado */
        .chargemind-resolution-hub .chargemind-best-choice-badge {
          font-size: 14px !important;
        }
        
        /* Desktop: mantém 14px ou pode ser ajustado se necessário */
        @media (min-width: 768px) {
          .chargemind-resolution-hub .chargemind-best-choice-badge {
            font-size: 14px !important;
          }
        }
        
        /* Hover dos cards do Rapid Resolution Center - Background degradê com cor da marca 10% */
        .chargemind-resolution-hub .option-card:hover {
          background: linear-gradient(135deg, ${hexToRgba(primaryColor, 0.1)} 0%, white 50%, ${hexToRgba(primaryColor, 0.1)} 100%) !important;
        }
        
        /* ========================================
           INPUT FIELDS - Estilos completos dos inputs isolados
           ======================================== */
        /* Mobile e Desktop: 16px - Evita zoom automático no iOS */
        /* Border-radius: 8px, Border: 1px solid #6B7280 - Cinza escuro, isolado apenas para ResolutionHub */
        .chargemind-resolution-hub .chargemind-input-field {
          font-size: 16px !important;
          font-weight: 400 !important;
          color: #374151 !important;
          border-radius: 8px !important;
          border: 1px solid #4B5563 !important; /* Cinza mais escuro - isolado apenas para ResolutionHub */
          background-color: #FFFFFF !important;
          padding: 12px 16px !important;
          height: 60px !important;
          transition: all 0.15s ease-in-out !important;
        }
        
        /* Hover: borda e background sutis */
        .chargemind-resolution-hub .chargemind-input-field:hover {
          border-color: #374151 !important; /* Cinza ainda mais escuro no hover */
          background-color: #F9F9F9 !important;
        }
        
        /* Focus: borda + leve glow - Moderno, padrão Shopify/SaaS */
        .chargemind-resolution-hub .chargemind-input-field:focus-visible {
          outline: none !important;
          border-color: ${primaryColor} !important;
          box-shadow: 0 0 0 3px ${hexToRgba(primaryColor, 0.1)} !important;
        }
        
        /* Quando há valor digitado: font-weight 600 e cor mais escura */
        .chargemind-resolution-hub .chargemind-input-field.has-value,
        .chargemind-resolution-hub .chargemind-input-field:not(:placeholder-shown) {
          font-weight: 600 !important;
          color: #1F2937 !important;
        }
        
        /* Placeholders: cor mais clara e font-weight normal */
        .chargemind-resolution-hub .chargemind-input-field::placeholder {
          color: #9CA3AF !important;
          font-weight: 400 !important;
          opacity: 1 !important;
        }
        
        /* ========================================
           OR DIVIDER TEXT - Separador "OR" responsivo isolado
           ======================================== */
        /* Mobile: 12px, Desktop: 13px - Pequeno, discreto, funcional */
        .chargemind-resolution-hub .chargemind-or-text {
          font-size: 12px !important;
          font-weight: 500 !important;
          letter-spacing: 0.05em !important;
          text-transform: uppercase !important;
          color: #9CA3AF !important;
        }
        
        /* Desktop: 13px (>= 768px) */
        @media (min-width: 768px) {
          .chargemind-resolution-hub .chargemind-or-text {
            font-size: 13px !important;
          }
        }
        
        /* ========================================
           PRIMARY BUTTON - Botão principal CTA responsivo isolado
           ======================================== */
        /* Border-radius: 999px (pill) - Ação clara, menos agressividade, mais confiança */
        /* Altura: 52-56px, Font-weight: 600 - CTA forte sem gritar */
        .chargemind-resolution-hub .chargemind-primary-button {
          height: 52px !important; /* Mobile: 52px */
          font-size: 16px !important;
          font-weight: 600 !important;
          line-height: 1.5 !important;
          border-radius: 999px !important; /* Pill shape - mais confiança, menos agressividade */
          padding: 0 24px !important;
        }
        
        /* Desktop: 56px altura */
        @media (min-width: 768px) {
          .chargemind-resolution-hub .chargemind-primary-button {
            height: 56px !important; /* Desktop: 56px */
          }
        }
        
        /* ========================================
           SECONDARY BUTTON - Botão secundário CTA responsivo isolado
           ======================================== */
        /* Border-radius: 999px (pill) - Consistência visual com botão principal */
        .chargemind-resolution-hub .chargemind-secondary-button {
          height: 52px !important; /* Mobile: 52px */
          font-size: 16px !important;
          font-weight: 500 !important;
          line-height: 1.5 !important;
          border-radius: 999px !important; /* Pill shape */
          padding: 0 24px !important;
        }
        
        /* Desktop: 56px altura */
        @media (min-width: 768px) {
          .chargemind-resolution-hub .chargemind-secondary-button {
            height: 56px !important; /* Desktop: 56px */
          }
        }
        
        /* ========================================
           TEXT LINK - Links de texto clicáveis isolados
           ======================================== */
        /* Formato base: Texto clicável, sem fundo, sem borda, cor neutra */
        .chargemind-resolution-hub .chargemind-text-link,
        .chargemind-resolution-hub .chargemind-text-link-not-order {
          background: none !important;
          border: none !important;
          padding: 0 !important;
          margin: 0 !important;
          text-decoration: none !important;
          cursor: pointer !important;
          transition: all 0.15s ease-in-out !important;
          display: inline-block !important;
          color: #6B7280 !important; /* Cinza neutro */
        }
        
        /* "Not this order" - Desktop e Mobile: 14px, Font-weight: 500, Line-height: 1.4 */
        .chargemind-resolution-hub .chargemind-text-link-not-order {
          font-size: 14px !important;
          font-weight: 500 !important;
          line-height: 1.4 !important;
          margin-top: 20px !important; /* Espaçamento do botão acima */
        }
        
        /* Hover "Not this order": underline */
        .chargemind-resolution-hub .chargemind-text-link-not-order:hover {
          color: #1F2937 !important; /* Brand dark / cinza escuro */
          text-decoration: underline !important;
        }
        
        /* "← Back" - Desktop e Mobile: 15px, Font-weight: 400, Line-height: 1.4 */
        .chargemind-resolution-hub .chargemind-text-link {
          font-size: 15px !important;
          font-weight: 400 !important;
          line-height: 1.4 !important;
        }
        
        /* Hover "← Back": underline e cor mais escura */
        .chargemind-resolution-hub .chargemind-text-link:hover {
          color: #1F2937 !important; /* Brand dark / cinza escuro */
          text-decoration: underline !important;
        }
        
        /* Focus: outline para acessibilidade */
        .chargemind-resolution-hub .chargemind-text-link:focus-visible,
        .chargemind-resolution-hub .chargemind-text-link-not-order:focus-visible {
          outline: 2px solid ${primaryColor} !important;
          outline-offset: 2px !important;
          border-radius: 2px !important;
        }
        
        /* ========================================
           HELPER TEXT - Texto auxiliar abaixo dos campos isolado
           ======================================== */
        /* Mobile: 12px, Desktop: 13px - Texto auxiliar discreto */
        .chargemind-resolution-hub .chargemind-helper-text {
          font-size: 12px !important;
          font-weight: 400 !important;
          line-height: 1.4 !important;
          color: #9CA3AF !important; /* Cinza claro */
          margin-top: 4px !important;
        }
        
        /* Desktop: 13px (>= 768px) */
        @media (min-width: 768px) {
          .chargemind-resolution-hub .chargemind-helper-text {
            font-size: 13px !important;
          }
        }
        
        /* ========================================
           ERROR MESSAGES - Mensagens de erro isoladas
           ======================================== */
        /* Título do erro: "Something went wrong" */
        /* Desktop e Mobile: 14px, Font-weight: 600, Line-height: 1.4 - Precisa chamar atenção, mas não competir com o CTA */
        .chargemind-resolution-hub .chargemind-error-title {
          font-size: 14px !important;
          font-weight: 600 !important;
          line-height: 1.4 !important;
          color: #991B1B !important; /* Vermelho mais forte (red-600) */
          margin: 0 !important;
          margin-bottom: 8px !important; /* Espaço entre o título e o texto abaixo */
        }
        
        /* Texto explicativo do erro */
        /* Desktop e Mobile: 13px, Font-weight: 400, Line-height: 1.5 - Menor que texto normal, mas ainda confortável no mobile */
        .chargemind-resolution-hub .chargemind-error-message {
          font-size: 13px !important;
          font-weight: 400 !important;
          line-height: 1.5 !important;
          color: #991B1B !important; /* Vermelho mais suave (red-800) ou cinza-avermelhado */
          margin: 0 !important;
        }
        
        /* ========================================
           TRUST TEXT - Texto de confiança/segurança responsivo isolado
           ======================================== */
        /* Mobile: 12px, Desktop: 13px - Deve passar segurança, não chamar atenção */
        .chargemind-resolution-hub .chargemind-trust-text {
          font-size: 12px !important;
          font-weight: 400 !important;
          color: #6B7280 !important;
        }
        
        /* Desktop: 13px (>= 768px) */
        @media (min-width: 768px) {
          .chargemind-resolution-hub .chargemind-trust-text {
            font-size: 13px !important;
          }
        }
        
        /* ========================================
           FOOTER TEXT - Rodapé discreto responsivo isolado
           ======================================== */
        /* Mobile: 11px, Desktop: 12px - Assinatura discreta, padrão SaaS */
        .chargemind-resolution-hub .chargemind-footer-text {
          font-size: 11px !important;
          font-weight: 400 !important;
          color: #6B7280 !important;
          opacity: 0.75 !important; /* 0.7-0.8 (média 0.75) */
        }
        
        /* Desktop: 12px (>= 768px) */
        @media (min-width: 768px) {
          .chargemind-resolution-hub .chargemind-footer-text {
            font-size: 12px !important;
          }
        }
        
        /* ========================================
           FOOTER LOGO - Logo do rodapé isolado
           ======================================== */
        /* Move o logo 4px para baixo para melhor alinhamento */
        .chargemind-resolution-hub .chargemind-footer-logo {
          position: relative !important;
          top: 4px !important;
        }
        
        /* ========================================
           INTERAÇÕES - Hover e focus
           ======================================== */
        
        /* Option Card - Estado padrão: fundo branco, borda cinza */
        .chargemind-resolution-hub .option-card {
          background-color: #FFFFFF !important;
          border: 1px solid #D1D5DB !important; /* Cinza */
          border-radius: 8px !important;
        }
        
        /* Option Card - Estado hover: fundo branco mantido, borda cor da marca mais grossa */
        .chargemind-resolution-hub .option-card:hover {
          background-color: #FFFFFF !important; /* Mantém branco */
          border-color: ${primaryColor} !important; /* Cor da marca */
          border-width: 2px !important; /* Borda mais grossa no hover */
        }
        
        /* Option Chevron - Muda para cor da marca no hover do card */
        .chargemind-resolution-hub .option-card:hover .option-chevron {
          color: ${primaryColor} !important;
        }
        
        /* Borda hover dos campos de input - cor da marca com 50% opacidade */
        .chargemind-resolution-hub .input-field:hover {
          border-color: ${hexToRgba(primaryColor, 0.50)};
        }
        
        /* ========================================
           CARDS - Bordas visíveis como no sistema principal
           ======================================== */
        /* Garante que os Cards tenham borda visível e mais espessa */
        .chargemind-resolution-hub [class*="rounded-md"],
        .chargemind-resolution-hub [class*="rounded-lg"] {
          border-width: 1px !important;
          border-style: solid !important;
          border-color: #D1D5DB !important; /* gray-300 - mais visível que gray-200 */
        }
        
        /* Cards principais com borda mais visível - seletores específicos */
        .chargemind-resolution-hub > div > div[class*="rounded"],
        .chargemind-resolution-hub div[class*="shadow-sm"][class*="rounded"] {
          border-width: 1px !important;
          border-style: solid !important;
          border-color: #D1D5DB !important; /* gray-300 */
        }
        
        /* Força borda em elementos com classe que contenha "Card" ou elementos com shadow-sm */
        .chargemind-resolution-hub div[class*="shadow-sm"]:not(button):not([class*="button"]):not([class*="btn"]) {
          border: 1px solid #D1D5DB !important; /* gray-300 */
        }
        
        /* Seletores mais específicos para garantir borda nos Cards principais */
        .chargemind-resolution-hub > div > div[class*="shadow-sm"],
        .chargemind-resolution-hub > div > div[class*="rounded-md"][class*="shadow"],
        .chargemind-resolution-hub > div > div[class*="rounded-lg"][class*="shadow"] {
          border: 1px solid #D1D5DB !important; /* gray-300 - mais visível */
        }
        
        /* ========================================
           ESTILOS DO TOAST (Sonner) - Escopo isolado
           ======================================== */
        .chargemind-resolution-hub [data-sonner-toast][data-type="success"] [data-icon] {
          color: ${primaryColor};
        }
        .chargemind-resolution-hub [data-sonner-toast][data-type="success"] {
          background: ${toastBgColor};
          border: 1px solid ${primaryColor};
        }
        .chargemind-resolution-hub [data-sonner-toast][data-type="success"] [data-title] {
          font-weight: 600;
        }
        
        /* ========================================
           TOAST CODE COPIED - Ajuste de posição do ícone e layout horizontal
           ======================================== */
        .chargemind-code-toast-icon-adjust [data-icon] {
          margin-top: -1px !important;
        }
        
        .chargemind-code-toast-icon-adjust [data-content] {
          display: flex !important;
          flex-direction: row !important;
          align-items: center !important;
          gap: 8px !important;
        }
        
        .chargemind-code-toast-icon-adjust [data-title] {
          margin: 0 !important;
        }
        
        .chargemind-code-toast-icon-adjust [data-description] {
          margin: 0 !important;
        }
        
        /* ========================================
           ORDER TRACKING CARD - Design idêntico à imagem
           CSS TOTALMENTE ISOLADO - Não vaza para outras partes do sistema
           ======================================== */
        
        /* Container wrapper - isolamento total */
        .chargemind-resolution-hub .order-tracking-card-wrapper {
          width: 100% !important;
          max-width: 600px !important;
          min-width: 320px !important;
          margin: 0 auto !important;
          box-sizing: border-box !important;
        }
        
        /* Card principal */
        .chargemind-resolution-hub .order-tracking-card {
          background-color: #FFFFFF !important;
          border-radius: 1rem !important; /* 16px - cantos arredondados */
          border: 0.5px solid #D1D5DB !important; /* Borda sutil cinza claro */
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1) !important; /* Sombra leve */
          padding: 1rem !important; /* Mobile: 16px */
          width: 100% !important;
          max-width: 100% !important;
          box-sizing: border-box !important;
          min-width: 0 !important;
          overflow-x: hidden !important;
        }
        
        /* Mobile: margin para não encostar nas bordas do card externo */
        @media (max-width: 767px) {
          .chargemind-resolution-hub .order-tracking-card-wrapper {
            padding: 0 1rem !important;
          }
          .chargemind-resolution-hub .order-tracking-card {
            margin: 1rem 0 !important;
            padding: 1rem !important;
          }
        }
        
        /* Desktop: padding maior */
        @media (min-width: 768px) {
          .chargemind-resolution-hub .order-tracking-card {
            padding: 2rem !important; /* Desktop: 32px */
          }
        }
        
        /* Header Section */
        .chargemind-resolution-hub .order-tracking-header {
          display: flex !important;
          align-items: flex-start !important;
          justify-content: space-between !important;
          flex-wrap: wrap !important;
          gap: 12px !important;
          width: 100% !important;
          margin-top: 15px !important;
          margin-bottom: 0 !important;
        }
        
        .chargemind-resolution-hub .order-tracking-header-left {
          flex: 1 !important;
          min-width: 0 !important;
        }
        
        /* Label "ORDER" */
        .chargemind-resolution-hub .order-tracking-label {
          font-size: 11px !important;
          font-weight: 500 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.05em !important;
          color: #6B7280 !important; /* Cinza claro para labels */
          margin: 0 !important;
          margin-bottom: 8px !important;
          line-height: 1.4 !important;
        }
        
        /* Número do pedido */
        .chargemind-resolution-hub .order-tracking-number {
          font-size: 18px !important;
          font-weight: 600 !important;
          color: #1F2937 !important; /* Cinza escuro */
          margin: 0 !important;
          margin-bottom: 4px !important;
          line-height: 1.3 !important;
        }
        
        /* Nome do cliente */
        .chargemind-resolution-hub .order-tracking-customer {
          font-size: 14px !important;
          font-weight: 400 !important;
          color: #6B7280 !important; /* Cinza médio */
          margin: 0 !important;
          line-height: 1.5 !important;
        }
        
        /* Status badge */
        .chargemind-resolution-hub .order-tracking-status {
          padding: 6px 12px !important;
          font-size: 12px !important;
          font-weight: 600 !important;
          border-radius: 9999px !important; /* Pill shape */
          flex-shrink: 0 !important;
          margin-left: 16px !important;
        }
        
        /* Botão de rastreamento - estilo discreto mas clicável */
        .chargemind-resolution-hub .order-tracking-action-btn,
        .chargemind-resolution-hub a.order-tracking-action-btn {
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 8px !important;
          padding: 8px 16px !important; /* Padding simétrico: 8px vertical, 16px horizontal */
          font-size: 12px !important;
          font-weight: 500 !important;
          color: #1F2937 !important; /* Cinza escuro */
          text-decoration: none !important;
          border: 1px solid #D1D5DB !important; /* Borda sutil */
          border-radius: 4px !important;
          background-color: #FFFFFF !important;
          transition: all 0.15s ease-in-out !important;
          cursor: pointer !important;
          margin: 0 !important;
          margin-top: 8px !important;
          line-height: 1.3 !important;
          width: fit-content !important; /* Botão se adapta ao conteúdo */
          min-width: auto !important;
          max-width: none !important; /* Remove limitação de largura */
        }
        
        /* Hover do botão de rastreamento */
        .chargemind-resolution-hub .order-tracking-action-btn:hover {
          background-color: #F9FAFB !important;
          border-color: #9CA3AF !important;
          color: #111827 !important; /* Cinza ainda mais escuro no hover */
          text-decoration: none !important;
        }
        
        /* Ícone do botão de rastreamento */
        .chargemind-resolution-hub .order-tracking-action-icon,
        .chargemind-resolution-hub .order-tracking-action-btn svg,
        .chargemind-resolution-hub .order-tracking-action-btn .order-tracking-action-icon {
          width: 13px !important;
          height: 13px !important;
          min-width: 13px !important;
          min-height: 13px !important;
          max-width: 13px !important;
          max-height: 13px !important;
          flex-shrink: 0 !important;
          color: #1F2937 !important;
          stroke: #1F2937 !important;
        }
        
        /* Texto do botão de rastreamento */
        .chargemind-resolution-hub .order-tracking-action-text,
        .chargemind-resolution-hub .order-tracking-action-btn span {
          white-space: nowrap !important;
          color: #1F2937 !important;
        }
        
        /* Força o tamanho e cor do botão inteiro */
        .chargemind-resolution-hub .order-tracking-action-btn * {
          color: #1F2937 !important;
        }
        
        /* Mobile: ajusta botão de rastreamento */
        @media (max-width: 640px) {
          .chargemind-resolution-hub .order-tracking-action-btn,
          .chargemind-resolution-hub a.order-tracking-action-btn {
            padding: 8px 16px !important; /* Padding simétrico mantido no mobile */
            font-size: 12px !important;
            width: fit-content !important;
            max-width: none !important;
          }
          
          .chargemind-resolution-hub .order-tracking-action-icon,
          .chargemind-resolution-hub .order-tracking-action-btn svg {
            width: 13px !important;
            height: 13px !important;
            min-width: 13px !important;
            min-height: 13px !important;
            max-width: 13px !important;
            max-height: 13px !important;
          }
        }
        
        .chargemind-resolution-hub .order-tracking-status-delivered {
          background-color: #D1FAE5 !important; /* bg-green-100 */
          color: #065F46 !important; /* text-green-700 */
        }
        
        .chargemind-resolution-hub .order-tracking-status-in-transit {
          background-color: #FEF3C7 !important; /* bg-yellow-100 */
          color: #92400E !important; /* text-yellow-700 */
        }
        
        .chargemind-resolution-hub .order-tracking-status-refunded {
          background-color: #E9D5FF !important; /* bg-purple-100 */
          color: #6B21A8 !important; /* text-purple-700 */
        }
        
        .chargemind-resolution-hub .order-tracking-status-pending {
          background-color: #DBEAFE !important; /* bg-blue-100 */
          color: #1E40AF !important; /* text-blue-700 */
        }
        
        .chargemind-resolution-hub .order-tracking-status-cancelled {
          background-color: #F9FAFB !important; /* bg-gray-100 */
          color: #374151 !important; /* text-gray-700 */
        }
        
        /* Divisórias horizontais - estilo similar ao OR divider mas sem texto */
        /* Usa a mesma estrutura do .or-divider mas sem o span com texto */
        .chargemind-resolution-hub .order-tracking-divider-line {
          display: flex !important;
          align-items: center !important;
          text-align: center !important;
          width: 100% !important;
          position: relative !important;
        }
        
        /* Linha contínua usando ::before e ::after (mesmo padrão do OR divider) */
        .chargemind-resolution-hub .order-tracking-divider-line::before,
        .chargemind-resolution-hub .order-tracking-divider-line::after {
          content: '' !important;
          flex: 1 !important;
          border-bottom: 1px solid #D1D5DB !important; /* gray-300 - isolado apenas para ResolutionHub */
        }
        
        /* Garante que o container relative tenha o espaçamento correto */
        .chargemind-resolution-hub .order-tracking-card .relative {
          margin: 0 !important;
          padding: 0 !important;
        }
        
        .chargemind-resolution-hub .order-tracking-card .relative.py-5 {
          padding-top: 20px !important;
          padding-bottom: 20px !important;
        }
        
        /* Seção de detalhes */
        .chargemind-resolution-hub .order-tracking-details {
          display: flex !important;
          flex-direction: column !important;
          gap: 12px !important;
          width: 100% !important;
        }
        
        .chargemind-resolution-hub .order-tracking-detail-row {
          display: flex !important;
          justify-content: space-between !important;
          align-items: center !important;
          width: 100% !important;
        }
        
        .chargemind-resolution-hub .order-tracking-detail-label {
          font-size: 14px !important;
          font-weight: 400 !important;
          color: #6B7280 !important; /* Cinza médio */
          line-height: 1.5 !important;
        }
        
        .chargemind-resolution-hub .order-tracking-detail-value {
          font-size: 14px !important;
          font-weight: 600 !important;
          color: #1F2937 !important; /* Cinza escuro */
          line-height: 1.5 !important;
        }
        
        /* ========================================
           PRICE BREAKDOWN - Breakdown de valores (Subtotal, Frete, Desconto, Total)
           CSS TOTALMENTE ISOLADO - Não vaza para outras partes do sistema
           ======================================== */
        .chargemind-resolution-hub .order-tracking-price-breakdown {
          display: flex !important;
          flex-direction: column !important;
          gap: 8px !important;
          width: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        
        .chargemind-resolution-hub .order-tracking-breakdown-row {
          display: flex !important;
          justify-content: space-between !important;
          align-items: center !important;
          width: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        
        /* Labels do breakdown - fonte menor e cor mais clara */
        .chargemind-resolution-hub .order-tracking-breakdown-label {
          font-size: 13px !important;
          font-weight: 400 !important;
          color: #6B7280 !important; /* Cinza médio - mais claro que o total */
          line-height: 1.5 !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        
        /* Valores do breakdown - fonte menor */
        .chargemind-resolution-hub .order-tracking-breakdown-value {
          font-size: 13px !important;
          font-weight: 400 !important;
          color: #6B7280 !important; /* Cinza médio - mais claro que o total */
          line-height: 1.5 !important;
          margin: 0 !important;
          padding: 0 !important;
          text-align: right !important;
        }
        
        /* Valor de desconto - cor diferente (pode ser verde ou vermelho) */
        .chargemind-resolution-hub .order-tracking-breakdown-discount {
          color: #10B981 !important; /* Verde para desconto */
        }
        
        /* Linha do Total - destaque */
        .chargemind-resolution-hub .order-tracking-breakdown-total {
          margin-top: 4px !important;
          padding-top: 8px !important;
          border-top: 1px solid #E5E7EB !important; /* Linha sutil acima do total */
        }
        
        /* Label do Total - negrito */
        .chargemind-resolution-hub .order-tracking-breakdown-total .order-tracking-breakdown-label {
          font-size: 14px !important;
          font-weight: 600 !important;
          color: #1F2937 !important; /* Cinza escuro - destaque */
        }
        
        /* Valor do Total - negrito e destaque */
        .chargemind-resolution-hub .order-tracking-breakdown-total-value {
          font-size: 14px !important;
          font-weight: 600 !important;
          color: #1F2937 !important; /* Cinza escuro - destaque */
        }
        
        /* Seção de produtos */
        .chargemind-resolution-hub .order-tracking-products {
          width: 100% !important;
        }
        
        .chargemind-resolution-hub .order-tracking-products-list {
          display: flex !important;
          flex-direction: column !important;
          gap: 16px !important;
          margin-top: 16px !important;
        }
        
        .chargemind-resolution-hub .order-tracking-product-item {
          display: flex !important;
          gap: 12px !important;
          width: 100% !important;
          align-items: flex-start !important;
        }
        
        /* Imagem do produto - ajuste para usar o ProductImage existente */
        .chargemind-resolution-hub .order-tracking-product-item > div:first-child,
        .chargemind-resolution-hub .order-tracking-product-item > img:first-child {
          width: 64px !important;
          height: 64px !important;
          flex-shrink: 0 !important;
          border-radius: 8px !important;
          border: 1px solid #DEDEDE !important;
          background-color: #F9F9F9 !important;
          object-fit: cover !important;
        }
        
        .chargemind-resolution-hub .order-tracking-product-info {
          flex: 1 !important;
          min-width: 0 !important;
        }
        
        .chargemind-resolution-hub .order-tracking-product-name {
          font-size: 14px !important;
          font-weight: 600 !important;
          color: #1F2937 !important; /* Cinza escuro */
          margin: 0 !important;
          margin-bottom: 4px !important;
          line-height: 1.4 !important;
          word-wrap: break-word !important;
          overflow-wrap: break-word !important;
        }
        
        .chargemind-resolution-hub .order-tracking-product-quantity {
          font-size: 14px !important;
          font-weight: 400 !important;
          color: #6B7280 !important; /* Cinza médio */
          margin: 0 !important;
          margin-bottom: 8px !important;
          line-height: 1.5 !important;
        }
        
        .chargemind-resolution-hub .order-tracking-product-price {
          font-size: 14px !important;
          font-weight: 600 !important;
          color: #374151 !important; /* Cinza escuro */
          margin: 0 !important;
          line-height: 1.5 !important;
        }
        
        /* Seção de endereço */
        .chargemind-resolution-hub .order-tracking-address {
          width: 100% !important;
        }
        
        .chargemind-resolution-hub .order-tracking-address-text {
          font-size: 14px !important;
          font-weight: 400 !important;
          color: #374151 !important; /* Cinza escuro */
          line-height: 1.6 !important;
          margin-top: 12px !important;
          word-wrap: break-word !important;
          overflow-wrap: break-word !important;
        }
        
        /* Seção de tracking */
        .chargemind-resolution-hub .order-tracking-tracking {
          width: 100% !important;
          display: flex !important;
          flex-direction: column !important;
          margin-bottom: 15px !important;
        }
        
        .chargemind-resolution-hub .order-tracking-tracking-text {
          font-size: 14px !important;
          font-weight: 400 !important;
          color: #374151 !important; /* Cinza escuro */
          line-height: 1.6 !important;
          margin-top: 12px !important;
          margin-bottom: 0 !important;
          word-wrap: break-word !important;
          overflow-wrap: break-word !important;
        }
        
        /* Garante que textos quebrem corretamente */
        .chargemind-resolution-hub .order-tracking-card * {
          word-wrap: break-word !important;
          overflow-wrap: break-word !important;
          box-sizing: border-box !important;
        }
      `}</style>
      
      {/* Script inline para garantir scroll no topo imediatamente - isolado apenas para ResolutionHub */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              // Função para forçar scroll no topo
              function forceScrollToTop() {
                try {
                  window.scrollTo(0, 0);
                  if (document.documentElement) document.documentElement.scrollTop = 0;
                  if (document.body) document.body.scrollTop = 0;
                  const container = document.getElementById('chargemind-resolution-hub-container');
                  if (container) {
                    container.scrollTop = 0;
                    container.scrollIntoView({ behavior: 'instant', block: 'start' });
                  }
                } catch(e) {}
              }
              
              // Executa imediatamente
              forceScrollToTop();
              
              // Executa após DOM estar pronto
              if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', forceScrollToTop);
              } else {
                forceScrollToTop();
              }
              
              // Executa após window load
              window.addEventListener('load', forceScrollToTop);
              
              // Executa múltiplas vezes para garantir
              setTimeout(forceScrollToTop, 0);
              setTimeout(forceScrollToTop, 50);
              setTimeout(forceScrollToTop, 100);
              setTimeout(forceScrollToTop, 200);
            })();
          `,
        }}
      />
      <div 
        id="chargemind-resolution-hub-container"
        className="chargemind-resolution-hub min-h-screen px-4 pt-4 pb-10 font-sans"
        style={{
          ...cssVars,
          fontSize: '16px',
          lineHeight: '1.5',
          maxWidth: '100%',
          overflowX: 'hidden',
          backgroundColor: '#F8F9FA', /* Cinza claro similar ao sistema */
        }}
      >
        <div 
          className="mx-auto w-full max-w-[500px]"
          style={{
            boxSizing: 'border-box',
          }}
        >
          {/* Step Progress Indicator */}
          {!showItemNotReceivedFlow && (
            <div className="flex justify-center gap-1.5 mb-6">
              {[1, 2, 3, 4, 5, 6].map((step) => (
                <div
                  key={step}
                  className="h-1.5 rounded-full transition-all duration-300"
                  style={{
                    width: step === currentStep ? '24px' : '8px',
                    backgroundColor: step <= currentStep ? primaryColor : '#E5E7EB',
                    opacity: step < currentStep ? 0.6 : 1,
                  }}
                />
              ))}
            </div>
          )}

          {renderHeader()}

        <Card 
          className="shadow-lg"
          style={{
            maxWidth: '100%',
            width: '100%',
            flexShrink: 0,
            boxSizing: 'border-box',
            border: '1px solid #E5E7EB', /* gray-200 - mais sutil */
            borderRadius: '0.75rem', /* 12px - igual ao sistema */
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)', /* shadow-lg */
          }}
        >
          <CardContent 
            style={{
              maxWidth: '100%',
              boxSizing: 'border-box',
              paddingTop: '28px',
              paddingBottom: '28px',
              paddingLeft: '0px',
              paddingRight: '0px',
            }}
          >
            {showItemNotReceivedFlow && order ? (
              <div className="px-4 md:px-0">
                <ItemNotReceivedFlow
                  order={order}
                  primaryColor={storeSettings.brand_color || "#1B966C"}
                  primaryTextColor={storeSettings.brand_text_color || "#FFFFFF"}
                  onClose={() => {
                    setShowItemNotReceivedFlow(false);
                    setRoute(null);
                    setCurrentStep(3);
                  }}
                  onComplete={() => {
                    // Ao completar Step 2, fecha o componente e vai para Step 4 original
                    setShowItemNotReceivedFlow(false);
                    setCurrentStep(4);
                  }}
                />
              </div>
            ) : (
              <>
                {currentStep === 1 && renderStep1()}
                {currentStep === 2 && renderStep2()}
                {currentStep === 3 && renderStep3()}
                {currentStep === 4 && renderStep4()}
                {currentStep === 5 && renderStep5()}
                {currentStep === 6 && renderStep6()}
              </>
            )}
          </CardContent>
        </Card>

        <div className="text-center mt-8">
          <p style={{ fontSize: '12px', color: '#9CA3AF', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
            Powered by <img src="https://xieephvojphtjayjoxbc.supabase.co/storage/v1/object/public/assets/proxy/logo.png" alt="Chargemind" style={{ height: '13px', opacity: 0.7 }} />
          </p>
        </div>
      </div>
      
      <Sonner 
        position="bottom-right"
        theme="light"
      />
    </div>
    </>
  );
};

export default ResolutionHub;