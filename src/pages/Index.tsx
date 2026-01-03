import { DashboardLayout } from "@/components/DashboardLayout";
import { MetricCard } from "@/components/MetricCard";
import { ChartCard } from "@/components/ChartCard";
import { SystemHealthDiagnostics } from "@/components/SystemHealthDiagnostics";
import {
  FileText,
  CheckCircle,
  Clock,
  TrendingUp,
  Wallet,
  Timer,
  ShieldAlert,
  Trophy,
  Info,
  BarChart3,
  Download,
  Bell,
  ChevronDown,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/safeClient";
import { useNavigate } from "react-router-dom";
import { DateRange } from "react-day-picker";
import { format, subMonths, differenceInCalendarDays } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import { Rectangle } from "recharts";
import React from "react";
import { Calendar, Instagram, CircleHelp, MoreHorizontal } from "lucide-react";
import { DateRangePicker } from "@/components/DateRangePicker";
import { useToast } from "@/hooks/use-toast";
import { useTrendCalculation } from "@/hooks/useTrendCalculation";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import alexeiIcon from "@/assets/alexei-icon.png";
import chargemindIconGreen from "@/assets/chargemind-icon-green.png";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { NotificationsModal } from "@/components/NotificationsModal";
import { useUserData } from "@/hooks/useUserData";
import { useMockDataContext } from "@/contexts/MockDataContext";
import { getMockDisputesData } from "@/data/mockDisputesData";

import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { HorizontalProgressBars } from "@/components/HorizontalProgressBars";

const COLORS = {
  primary: "hsl(242, 89%, 61%)",
  secondary: "hsl(191, 100%, 50%)",
  tertiary: "hsl(269, 85%, 70%)",
};

const STATUS_COLORS = {
  needs_response: "#18976f", // Processamento - Verde escuro
  lost: "#e74c3c", // Perdido - Vermelho
  under_review: "#f39c12", // Em revisão - Laranja
  won: "#2bc49b", // Ganho - Verde claro
  all: "#3ED49B", // Todos - Verde médio
};

// const GREEN_SHADES = [
//   "#18976f", "#2bc49b", "#18976f", "#2bc49b", "#18976f", "#2bc49b", "#18976f", "#2bc49b"
// ];
const REASON_COLORS = [
  "#53A697", // Teal Médio
  "#8AA5A1", // Visa
  "#6DC485", // Verde Claro
  "#525252", // Cinza Chumbo
  "#60BBB1", // Ciano/Aqua
];
// const GREEN_SHADES = [
//   "#454f44",
//   "#0d2a0c",
//   "#3aaa34",
//   "#74b62e",
//   "#597d35",
// ];

const countryCodeToFlag = (code?: string) => {
  if (!code || code.length !== 2) return "🌍";
  return code.toUpperCase().replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));
};

const stripFlagEmoji = (text: string) => {
  // Remove flag emojis (regional indicator symbols) from the beginning of the string
  return text.replace(/^[\uD83C][\uDDE6-\uDDFF][\uD83C][\uDDE6-\uDDFF]\s*/g, '').trim();
};
const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

// Helper para converter amount para número, mesmo se vier como string formatada
const parseAmount = (value: any): number => {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    // Remove símbolos de moeda, espaços e vírgulas
    const cleaned = value.replace(/[$,\s]/g, "");
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

const getPreviousRange = (range?: { from?: Date; to?: Date }) => {
  if (!range?.from || !range?.to) return null;
  const days = Math.max(1, differenceInCalendarDays(range.to, range.from) + 1);
  const previousTo = new Date(range.from);
  previousTo.setDate(previousTo.getDate() - 1);
  const previousFrom = new Date(previousTo);
  previousFrom.setDate(previousFrom.getDate() - (days - 1));
  return { from: previousFrom, to: previousTo };
};

const formatHours = (hours: number) => {
  const whole = Math.floor(hours);
  const minutes = Math.round((hours - whole) * 60);
  return `${whole}h ${minutes.toString().padStart(2, "0")}m`;
};

const filterDisputesByRange = (disputes: any[], range?: { from?: Date; to?: Date }) => {
  if (!range?.from || !range?.to) return disputes;
  return disputes.filter((d: any) => {
    const rawDate = d?.initiated_at || d?.createAt;
    if (!rawDate) return false;
    const disputeDate = new Date(rawDate);
    return disputeDate >= range.from && disputeDate <= range.to;
  });
};

const calculateMockMetricsForRange = (disputes: any[], range?: { from?: Date; to?: Date }, healthAccount?: number) => {
  const inRange = filterDisputesByRange(disputes, range);
  const sumAmounts = (items: any[]) => items.reduce((acc, d) => acc + (Number(d?.amount) || 0), 0);

  const totalDisputes = inRange.length;
  const totalDisputesAmount = sumAmounts(inRange);

  const active = inRange.filter((d) => d?.status !== "won" && d?.status !== "lost");
  const activeAmount = sumAmounts(active);

  const evidenceSubmitted = inRange.filter((d) => !!d?.evidence_sent_on);
  const evidenceSubmittedAmount = sumAmounts(evidenceSubmitted);

  const review = inRange.filter((d) => d?.status === "under_review");
  const reviewAmount = sumAmounts(review);

  const won = inRange.filter((d) => d?.status === "won");
  const wonAmount = sumAmounts(won);

  const winRate = totalDisputes ? (won.length / totalDisputes) * 100 : 0;
  const savedTimeHours = totalDisputes * 1.5;

  return {
    activeDisputes: active.length,
    activeDisputeAmount: usd.format(activeAmount),
    evidenceSubmitted: evidenceSubmitted.length,
    evidenceSubmittedAmount: usd.format(evidenceSubmittedAmount),
    review: review.length,
    reviewAmount: usd.format(reviewAmount),
    totalWon: won.length,
    totalDisputes,
    totalDisputesAmount: usd.format(totalDisputesAmount),
    recoveredAmount: usd.format(wonAmount),
    savedTime: formatHours(savedTimeHours),
    savedTimeAmount: usd.format(totalDisputes * 4.2),
    winRate,
    winRateAmount: winRate,
    healthAccount: healthAccount ?? 0,
    healthAccountAllTime: healthAccount ?? 0,
  };
};

const Index = () => {
  const { toast: toastNotify } = useToast();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { useMockData, mockChargebackRate } = useMockDataContext();
  const [isCountriesAtTop, setIsCountriesAtTop] = useState(true);
  const [previousMetrics, setPreviousMetrics] = useState<any | null>(null);
  const { calculateTrend } = useTrendCalculation();

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate("/auth");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error(t("errors.logoutError"));
    }
  };
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [reasonViewMode, setReasonViewMode] = useState<"value" | "count">("value");
  const [monthViewMode, setMonthViewMode] = useState<"value" | "count">("value");
  const [monthStatusFilter, setMonthStatusFilter] = useState<string>("all");
  const [processorViewMode, setProcessorViewMode] = useState<"value" | "count">("value");
  const [rateViewMode, setRateViewMode] = useState<"value" | "count">("value");
  const [processorFilter, setProcessorFilter] = useState<string>("all");
  const [cardNetworkViewMode, setCardNetworkViewMode] = useState<"value" | "count">("value");
  const [categoryViewMode, setCategoryViewMode] = useState<"value" | "count">("value");
  const [missingShopify, setMissingShopify] = useState(false);
  const [integrationPaused, setIntegrationPaused] = useState(false);
  const handleLanguageChange = async (lang: "pt" | "en") => {
    i18n.changeLanguage(lang);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user?.id) return;

      const { data: userRow } = await supabase
        .from("users")
        .select("client_id")
        .eq("id", user.id)
        .maybeSingle();

      const clientId = userRow?.client_id;
      if (!clientId) return;

      const { error } = await supabase
        .from("clients")
        .update({ language: lang })
        .eq("id", clientId);

      if (error) {
        console.error("Erro ao salvar idioma:", error);
      }
    } catch (err) {
      console.error("Erro ao salvar idioma:", err);
    }
  };

  const isDataEmpty = (!useMockData && (missingShopify || !dashboardData)) || false;
  const EmptyGraph = () => (
    <div className="flex items-center justify-center w-full h-full">
      <div className="flex flex-col items-center gap-3 text-center text-sm text-muted-foreground">
        <img
          src="/graph_empty.svg"
          alt={t("dashboard.noDataToDisplay")}
          className="max-w-[30%] h-auto w-auto"
        />
        <span className="text-[#6B7280]">
          No disputes were recorded in the selected period.
        </span>
      </div>
    </div>
  );
  const [disputeFilter, setDisputeFilter] = useState<"all" | "chargemind">("all");
  const [hoveredNetworkSegment, setHoveredNetworkSegment] = useState<{ name: string; value: number; color: string; x: number; y: number } | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);
  const [countryOrdersModalOpen, setCountryOrdersModalOpen] = useState(false);
  const [countryOrders, setCountryOrders] = useState<any[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<{ name: string; code?: string } | null>(null);
  const [credentialsModalOpen, setCredentialsModalOpen] = useState(false);
  const [credentialsData, setCredentialsData] = useState<{ email: string; tempPassword: string }>({ email: "", tempPassword: "" });

  const handleNotificationsRead = () => {
    setHasUnread(false);
  };

  // Exibir modal com credenciais geradas via query string (?email=&temp_password=)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get("email");
    const tempParam = params.get("temp_password");
    if (emailParam && tempParam) {
      setCredentialsData({ email: emailParam, tempPassword: tempParam });
      setCredentialsModalOpen(true);
      // Limpa a query para não reabrir ao navegar
      params.delete("email");
      params.delete("temp_password");
      const newUrl =
        window.location.pathname +
        (params.toString() ? `?${params.toString()}` : "") +
        window.location.hash;
      window.history.replaceState({}, "", newUrl);
    }
  }, []);

  // Carregar dateRange do localStorage ou usar valor padrão
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("dateRangeValue");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          return {
            from: parsed.from ? new Date(parsed.from) : undefined,
            to: parsed.to ? new Date(parsed.to) : undefined,
          };
        } catch (e) {
          console.error("Error loading dateRange from localStorage:", e);
        }
      }
    }
    return {
      from: subMonths(new Date(), 6),
      to: new Date(),
    };
  });

  useEffect(() => {
    // Carregar dados com as datas salvas ou padrão
    if (dateRange?.from && dateRange?.to) {
      fetchShopifyData(dateRange.from, dateRange.to);
    } else {
      fetchShopifyData();
    }

    const statuses: string[] = dashboardData?.charts?.availableStatuses || [];
    if (statuses.length > 0) {
      const firstNonAll = statuses.find((s) => s && s !== "all");
      const defaultStatus =
        firstNonAll || (statuses.includes("needs_response") ? "needs_response" : statuses[0] || "all");
      setMonthStatusFilter(defaultStatus);
    } else {
      setMonthStatusFilter("needs_response");
    }
  }, [useMockData]);

  // Reset scroll state when data changes
  useEffect(() => {
    setIsCountriesAtTop(true);
  }, [dashboardData]);

  // Usar o hook centralizado para dados do usuário
  const { userName } = useUserData();

  // Lógica para display do nome enquanto carrega
  const displayUserName = userName || t("common.user");
  const displayFirstName = userName ? userName.split(' ')[0] : t("common.user");

  const fetchShopifyData = async (startDate?: Date, endDate?: Date) => {
    const measure = (label: string) => {
      const key = `⏱ ${label}`;
      console.time(key);
      return () => console.timeEnd(key);
    };

    try {
      // Sempre exibir loading até retornar dados reais ou fallback
      setLoading(true);
      setPreviousMetrics(null);
      const stopTotal = measure("total fetchShopifyData");
      const previousRange = startDate && endDate ? getPreviousRange({ from: startDate, to: endDate }) : null;
      
      // Check if using mock data
      if (useMockData) {
        console.log("Using mock data mode");
        const mockData = getMockDisputesData({ healthAccount: mockChargebackRate ?? undefined });
        const disputes = mockData?.rawData?.disputes ?? [];
        const currentRange = startDate && endDate ? { from: startDate, to: endDate } : undefined;

        const currentMetrics = calculateMockMetricsForRange(
          disputes,
          currentRange,
          mockChargebackRate ?? mockData?.metrics?.healthAccount,
        );
        const previous = previousRange
          ? calculateMockMetricsForRange(
              disputes,
              previousRange,
              mockChargebackRate ?? mockData?.metrics?.healthAccount,
            )
          : null;

        setDashboardData({ ...mockData, metrics: currentMetrics });
        setPreviousMetrics(previous);
        setMissingShopify(false);
        setLoading(false);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("dashboard-data-loaded"));
        }
        return;
      }

      // Guard: só chama a função se houver credenciais Shopify
      try {
        const stopAuth = measure("supabase.auth.getUser");
        const { data: { user } } = await supabase.auth.getUser();
        stopAuth();
        if (!user?.id) {
          setMissingShopify(true);
          setIntegrationPaused(false);
          setDashboardData(null);
          setLoading(false);
          return;
        }

        const stopUserQuery = measure("supabase.users select client_id");
        const { data: userRow } = await supabase
          .from("users")
          .select("client_id")
          .eq("id", user.id)
          .maybeSingle();
        stopUserQuery();

        const clientId = userRow?.client_id;
        if (!clientId) {
          setMissingShopify(true);
          setIntegrationPaused(false);
          setDashboardData(null);
          setLoading(false);
          return;
        }

        const stopClientQuery = measure("supabase.clients select creds");
        const { data: clientRow, error: clientError } = await supabase
          .from("clients")
          .select("*")
          .eq("id", clientId)
          .maybeSingle();
        stopClientQuery();

        if (clientError || !clientRow) {
          setMissingShopify(true);
          setIntegrationPaused(false);
          setDashboardData(null);
          setLoading(false);
          return;
        }

        // Permitir busca mesmo que shopify_connected_at esteja nulo (evita travar se o timestamp não foi salvo)
        const hasCreds =
          !!clientRow.shopify_store_name &&
          !!clientRow.shopify_access_token;

        if (!hasCreds) {
          setMissingShopify(true);
          setIntegrationPaused(false);
          setDashboardData(null);
          setLoading(false);
          return;
        }

        const shopifyStatus = (clientRow as any)?.shopify_status;
        // Check if integration is paused
        if (shopifyStatus === 'paused') {
          console.log("Shopify integration is paused, not fetching data");
          setIntegrationPaused(true);
          setMissingShopify(false); // Not missing, just paused - don't show banner
          setDashboardData(null);
          setLoading(false);
          return;
        }

        setIntegrationPaused(false);
        setMissingShopify(false);
      } catch (guardErr) {
        console.error("Erro ao validar credenciais Shopify:", guardErr);
        setMissingShopify(true);
        setIntegrationPaused(false);
        setDashboardData(null);
        setLoading(false);
        return;
      }
      
      console.log("Using production mode - fetching real data");
      const stopFn = measure("supabase.functions.invoke shopify-disputes");
      const invokeRange = (range?: { from?: Date; to?: Date }) =>
        supabase.functions.invoke("shopify-disputes", {
        body: {
            startDate: range?.from?.toISOString(),
            endDate: range?.to?.toISOString(),
        },
      });

      const [currentResponse, previousResponse, allTimeResponse] = await Promise.all([
        invokeRange(startDate && endDate ? { from: startDate, to: endDate } : undefined),
        previousRange ? invokeRange(previousRange) : Promise.resolve({ data: null, error: null }),
        startDate && endDate ? invokeRange(undefined) : Promise.resolve({ data: null, error: null }),
      ]);
      stopFn();

      const { data, error } = currentResponse;
      const { data: previousData, error: previousError } = previousResponse;
      const { data: allTimeData, error: allTimeError } = allTimeResponse;

      if (error) {
        const detailed =
          (error as any)?.context?.error ||
          (error as any)?.context?.message ||
          (error as any)?.message ||
          t("errors.couldNotLoadShopifyData");
        console.error("Error fetching data:", error, (error as any)?.context);
        setMissingShopify(true);
        toastNotify({
          title: t("errors.loadingDataError"),
          description: typeof detailed === "string" ? detailed : t("errors.couldNotLoadShopifyData"),
          variant: "destructive",
        });
        setDashboardData(null);
        setLoading(false);
        return;
      }
      if (!data || !data.metrics) {
        setMissingShopify(true);
        toastNotify({
          title: t("errors.loadingDataError"),
          description: t("errors.couldNotLoadShopifyData"),
          variant: "destructive",
        });
        setDashboardData(null);
        setLoading(false);
        return;
      }
      // Mescla métricas all-time (sem filtro de data) se disponíveis
      const baseMetrics = allTimeError ? null : allTimeData?.metrics;
      const mergedMetrics = {
        ...data.metrics,
        ...(baseMetrics
          ? {
              healthAccount: baseMetrics.healthAccount,
              healthAccountStatus: baseMetrics.healthAccountStatus,
              healthAccountAllTime: baseMetrics.healthAccount ?? data.metrics?.healthAccount,
              healthAccountStatusAllTime:
                baseMetrics.healthAccountStatus ?? data.metrics?.healthAccountStatus,
            }
          : {
              healthAccountAllTime: data.metrics?.healthAccount,
              healthAccountStatusAllTime: data.metrics?.healthAccountStatus,
            }),
      };
      const mergedRawDataAllTime =
        allTimeData?.rawDataAllTime ??
        allTimeData?.rawData ??
        data.rawDataAllTime ??
        data.rawData ??
        null;

      console.log("Received real data:", mergedMetrics);
      setDashboardData({
        ...data,
        metrics: mergedMetrics,
        rawDataAllTime: mergedRawDataAllTime,
      });
      setPreviousMetrics(previousError ? null : previousData?.metrics ?? null);
      setMissingShopify(false);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("dashboard-data-loaded"));
      }
      stopTotal();
    } catch (error) {
      console.error("Error fetching Shopify data:", error);
      setMissingShopify(true);
      setDashboardData(null);
      toastNotify({
        title: t("common.error"),
        description: t("errors.couldNotConnectShopifyAPI"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
    if (range?.from && range?.to) {
      fetchShopifyData(range.from, range.to);
    }
  };

  const formatDateRangeForDisplay = () => {
    if (!dateRange?.from) return t("common.lastSixMonths");

    const locale = i18n.language === "pt" ? ptBR : enUS;
    const fromYear = dateRange.from.getFullYear();
    const toYear = dateRange.to?.getFullYear();
    const currentYear = new Date().getFullYear();

    if (!dateRange.to) {
      const showYear = fromYear !== currentYear;
      const dateFormat = i18n.language === "pt" 
        ? (showYear ? "d 'de' MMM 'de' yyyy" : "d 'de' MMM")
        : (showYear ? "MMM d, yyyy" : "MMM d");
      return format(dateRange.from, dateFormat, { locale });
    }

    const showYear = fromYear !== currentYear || toYear !== currentYear || fromYear !== toYear;

    if (showYear) {
      const dateFormat = i18n.language === "pt" ? "d 'de' MMM 'de' yyyy" : "MMM d, yyyy";
      const separator = i18n.language === "pt" ? " a " : " to ";
      return `${format(dateRange.from, dateFormat, { locale })}${separator}${format(
        dateRange.to,
        dateFormat,
        { locale },
      )}`;
    }

    const dateFormat = i18n.language === "pt" ? "d 'de' MMM" : "MMM d";
    const separator = i18n.language === "pt" ? " a " : " to ";
    return `${format(dateRange.from, dateFormat, { locale })}${separator}${format(dateRange.to, dateFormat, {
      locale,
    })}`;
  };

  // Color schemes for each status filter
  const STATUS_COLOR_SCHEMES = {
    won: { dark: "#18976f", medium: "#4cb88a", light: "#a8e6cf", dot: "#22c55e" },
    lost: { dark: "#dc2626", medium: "#f87171", light: "#fecaca", dot: "#ef4444" },
    needs_response: { dark: "#35504D", medium: "#5a7a76", light: "#8aa5a1", dot: "#35504D" },
    under_review: { dark: "#53A697", medium: "#7bbfb3", light: "#a8d9d0", dot: "#53A697" },
    all: { dark: "#18976f", medium: "#4cb88a", light: "#a8e6cf", dot: "#22c55e" },
  };

const PROCESSOR_COLOR_SCHEMES: { [key: string]: { dark: string; medium: string; light: string } } = {
  "Shopify Payments": { dark: "#18976f", medium: "#4cb88a", light: "#a8e6cf" }, // Green
  "Stripe": { dark: "#6366f1", medium: "#818cf8", light: "#c7d2fe" }, // Indigo/Purple
  "PayPal": { dark: "#0070ba", medium: "#00a1e0", light: "#99d6f0" }, // Blue
  "default": { dark: "#18976f", medium: "#4cb88a", light: "#a8e6cf" }, // Default green
  };

  // Helper to parse month string to date for sorting (e.g., "Nov '25" -> Date)
  const parseMonthString = (monthStr: string): Date => {
    const monthMap: { [key: string]: number } = {
      Jan: 0,
      Fev: 1,
      Feb: 1,
      Mar: 2,
      Abr: 3,
      Apr: 3,
      Mai: 4,
      May: 4,
      Jun: 5,
      Jul: 6,
      Ago: 7,
      Aug: 7,
      Set: 8,
      Sep: 8,
      Out: 9,
      Oct: 9,
      Nov: 10,
      Dez: 11,
      Dec: 11,
    };
    const parts = monthStr.split(" '");
    const monthName = parts[0];
    const year = parts[1] ? parseInt("20" + parts[1]) : new Date().getFullYear();
    const monthIndex = monthMap[monthName] ?? 0;
    return new Date(year, monthIndex, 1);
  };

  // Disputes base + filtro By Chargemind
  const allDisputesBase: any[] =
    isDataEmpty || !Array.isArray(dashboardData?.rawData?.disputes)
      ? []
      : (dashboardData?.rawData?.disputes as any[]);
  const allDisputesFallback: any[] =
    isDataEmpty || !Array.isArray(dashboardData?.rawDataAllTime?.disputes)
      ? []
      : (dashboardData?.rawDataAllTime?.disputes as any[]);
  const allDisputes: any[] = allDisputesBase.length ? allDisputesBase : allDisputesFallback;
  const filteredDisputes: any[] =
    disputeFilter === "chargemind"
      ? allDisputes.filter((d: any) => d?.by_chargemind === true)
      : allDisputes;

  const computeAggregationsFromDisputes = (disputes: any[]) => {
    const locale = i18n.language === "pt" ? ptBR : enUS;
    const groupBy = <T extends string | number | symbol>(arr: any[], keyFn: (item: any) => T) =>
      arr.reduce((acc, item) => {
        const key = keyFn(item);
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
      }, {} as Record<T, any[]>);

    const sumAmounts = (arr: any[]) => arr.reduce((acc, d) => acc + (Number(d?.amount) || 0), 0);

    // By month
    const monthKey = (dt: Date) => format(dt, "MMM ''yy", { locale });
    const byMonth = groupBy(disputes, (d) => {
      const dt = d?.initiated_at ? new Date(d.initiated_at) : null;
      return dt ? monthKey(dt) : "N/A";
    });

    const disputesByMonthAgg = Object.entries(byMonth as Record<string, any[]>).map(([month, items]) => {
      const itemsArr = items as any[];
      const statusTotal = (status: string) =>
        itemsArr.filter((d) => (d?.status || "").toLowerCase() === status);
      const needs = itemsArr.filter(
        (d) =>
          !["won", "lost", "under_review"].includes((d?.status || "").toLowerCase())
      );
      const won = statusTotal("won");
      const lost = statusTotal("lost");
      const review = statusTotal("under_review");

      const wonAmount = sumAmounts(won);
      const lostAmount = sumAmounts(lost);
      const needsAmount = sumAmounts(needs);
      const reviewAmount = sumAmounts(review);
      const allAmount = sumAmounts(itemsArr);

      return {
        month,
        needs_response_count: needs.length,
        needs_response_amount: needsAmount,
        under_review_count: review.length,
        under_review_amount: reviewAmount,
        won_count: won.length,
        won_amount: wonAmount,
        lost_count: lost.length,
        lost_amount: lostAmount,
        won_tier_bottom: wonAmount / 3,
        won_tier_middle: wonAmount / 3,
        won_tier_top: wonAmount / 3,
        won_tier_bottom_count: Math.ceil(won.length / 3),
        won_tier_middle_count: Math.ceil(won.length / 3),
        won_tier_top_count: Math.max(0, won.length - Math.ceil(won.length / 3) * 2),
        lost_tier_bottom: lostAmount / 3,
        lost_tier_middle: lostAmount / 3,
        lost_tier_top: lostAmount / 3,
        lost_tier_bottom_count: Math.ceil(lost.length / 3),
        lost_tier_middle_count: Math.ceil(lost.length / 3),
        lost_tier_top_count: Math.max(0, lost.length - Math.ceil(lost.length / 3) * 2),
        needs_tier_bottom: needsAmount / 3,
        needs_tier_middle: needsAmount / 3,
        needs_tier_top: needsAmount / 3,
        needs_tier_bottom_count: Math.ceil(needs.length / 3),
        needs_tier_middle_count: Math.ceil(needs.length / 3),
        needs_tier_top_count: Math.max(0, needs.length - Math.ceil(needs.length / 3) * 2),
        review_tier_bottom: reviewAmount / 3,
        review_tier_middle: reviewAmount / 3,
        review_tier_top: reviewAmount / 3,
        review_tier_bottom_count: Math.ceil(review.length / 3),
        review_tier_middle_count: Math.ceil(review.length / 3),
        review_tier_top_count: Math.max(0, review.length - Math.ceil(review.length / 3) * 2),
        all_tier_bottom: allAmount / 3,
        all_tier_middle: allAmount / 3,
        all_tier_top: allAmount / 3,
        all_tier_bottom_count: Math.ceil(itemsArr.length / 3),
        all_tier_middle_count: Math.ceil(itemsArr.length / 3),
        all_tier_top_count: Math.max(0, itemsArr.length - Math.ceil(itemsArr.length / 3) * 2),
        all_count: itemsArr.length,
        all_amount: allAmount,
      };
    }).sort((a, b) => parseMonthString(a.month).getTime() - parseMonthString(b.month).getTime());

    const disputesRateByMonthAgg = disputesByMonthAgg.map((m) => ({
      month: m.month,
      count: m.all_count,
      amount: m.all_amount,
      rate: m.all_count ? (m.won_count / m.all_count) * 100 : 0,
    }));
      
    const byProcessor = groupBy(disputes, (d) => d?.gateway || d?.order?.gateway || "Unknown");
    const disputesByProcessorAgg = Object.entries(byProcessor as Record<string, any[]>).map(
      ([name, items]) => ({
        name,
        count: (items as any[]).length,
        amount: Number(sumAmounts(items as any[]).toFixed(2)),
      }),
    );
 
    const byReason = groupBy(disputes, (d) => d?.reason || "N/A");
    const disputesByReasonAgg = Object.entries(byReason as Record<string, any[]>).map(
      ([name, items]) => ({
        name,
        value: (items as any[]).length,
        count: (items as any[]).length,
        amount: Number(sumAmounts(items as any[]).toFixed(2)),
      }),
    );

    const byNetwork = groupBy(disputes, (d) => d?.card_brand || d?.card_network || "Unknown");
    const disputesByNetworkAgg = Object.entries(byNetwork as Record<string, any[]>).map(
      ([name, items]) => ({
        name,
        count: (items as any[]).length,
        amount: Number(sumAmounts(items as any[]).toFixed(2)),
      }),
    );

    const byCountry = groupBy(disputes, (d) => {
      const addr =
        d?.order?.shipping_address?.country ||
        d?.order?.billing_address?.country ||
        d?.order?.shipping_address?.country_code ||
        d?.order?.shipping_address?.country_code_alpha2 ||
        "N/A";
      return addr || "N/A";
    });
    const disputesByCountryAgg = Object.entries(byCountry as Record<string, any[]>).map(([country, items]) => {
      const arr = items as any[];
      const amount = sumAmounts(arr);
      const won = arr.filter((i) => (i?.status || "").toLowerCase() === "won").length;
      return {
        country,
        count: arr.length,
        amount: Number(amount.toFixed(2)),
        code: "",
        winRate: arr.length ? Math.round((won / arr.length) * 100) : 0,
      };
    });

    const availableStatuses = ["all", ...new Set(disputes.map((d) => (d?.status || "unknown").toLowerCase()))];

    return {
      disputesByMonthAgg,
      disputesRateByMonthAgg,
      disputesByProcessorAgg,
      disputesByReasonAgg,
      disputesByNetworkAgg,
      disputesByCountryAgg,
      availableStatuses,
      aggMetrics: (() => {
        const totalDisputes = disputes.length;
        const totalAmount = sumAmounts(disputes);

        const won = disputes.filter((d) => (d?.status || "").toLowerCase() === "won");
        const lost = disputes.filter((d) => (d?.status || "").toLowerCase() === "lost");
        const review = disputes.filter((d) => (d?.status || "").toLowerCase() === "under_review");
        const active = disputes.filter(
          (d) => !["won", "lost"].includes((d?.status || "").toLowerCase()),
        );
        const evidence = disputes.filter((d) => !!d?.evidence_sent_on);

        const activeAmount = sumAmounts(active);
        const evidenceAmount = sumAmounts(evidence);
        const reviewAmount = sumAmounts(review);
        const wonAmount = sumAmounts(won);

        const winRate = totalDisputes ? (won.length / totalDisputes) * 100 : 0;
        const savedTimeHours = totalDisputes * 1.5;

        return {
          activeDisputes: active.length,
          activeDisputeAmount: usd.format(activeAmount),
          evidenceSubmitted: evidence.length,
          evidenceSubmittedAmount: usd.format(evidenceAmount),
          review: review.length,
          reviewAmount: usd.format(reviewAmount),
          totalWon: won.length,
          totalDisputes,
          totalDisputesAmount: usd.format(totalAmount),
          recoveredAmount: usd.format(wonAmount),
          savedTime: formatHours(savedTimeHours),
          savedTimeAmount: usd.format(totalDisputes * 4.2),
          winRate,
          winRateAmount: winRate,
          healthAccount: 0,
          healthAccountAllTime: 0,
        };
      })(),
    };
  };

  const filteredAgg = disputeFilter === "chargemind" ? computeAggregationsFromDisputes(filteredDisputes) : null;
  // Always combine data for stacked bar chart with 3-tier gradient
  let disputesByMonth = (() => {
    if (isDataEmpty) return [];
    const allMonths = dashboardData?.charts?.disputesByMonth?.all || [];
    const needsResponse = dashboardData?.charts?.disputesByMonth?.needs_response || [];
    const underReview = dashboardData?.charts?.disputesByMonth?.under_review || [];
    const won = dashboardData?.charts?.disputesByMonth?.won || [];
    const lost = dashboardData?.charts?.disputesByMonth?.lost || [];

    const unsortedData = allMonths.map((monthData: any) => {
      const month = monthData.month;
      const needsData = needsResponse.find((d: any) => d.month === month) || { count: 0, amount: 0 };
      const reviewData = underReview.find((d: any) => d.month === month) || { count: 0, amount: 0 };
      const wonData = won.find((d: any) => d.month === month) || { count: 0, amount: 0 };
      const lostData = lost.find((d: any) => d.month === month) || { count: 0, amount: 0 };

      // Calculate totals for each status to create 3-tier visual
      const wonTotal = { count: wonData.count, amount: wonData.amount };
      const lostTotal = { count: lostData.count, amount: lostData.amount };
      const needsTotal = { count: needsData.count, amount: needsData.amount };
      const reviewTotal = { count: reviewData.count, amount: reviewData.amount };
      const allTotal = {
        count: wonData.count + lostData.count + needsData.count + reviewData.count,
        amount: wonData.amount + lostData.amount + needsData.amount + reviewData.amount,
      };

      return {
        month,
        // Individual status data
        needs_response_count: needsData.count,
        needs_response_amount: needsData.amount,
        under_review_count: reviewData.count,
        under_review_amount: reviewData.amount,
        won_count: wonData.count,
        won_amount: wonData.amount,
        lost_count: lostData.count,
        lost_amount: lostData.amount,
        // 3-tier data for each status
        won_tier_bottom: wonTotal.amount / 3,
        won_tier_middle: wonTotal.amount / 3,
        won_tier_top: wonTotal.amount / 3,
        won_tier_bottom_count: Math.ceil(wonTotal.count / 3),
        won_tier_middle_count: Math.ceil(wonTotal.count / 3),
        won_tier_top_count: Math.max(0, wonTotal.count - Math.ceil(wonTotal.count / 3) * 2),
        lost_tier_bottom: lostTotal.amount / 3,
        lost_tier_middle: lostTotal.amount / 3,
        lost_tier_top: lostTotal.amount / 3,
        lost_tier_bottom_count: Math.ceil(lostTotal.count / 3),
        lost_tier_middle_count: Math.ceil(lostTotal.count / 3),
        lost_tier_top_count: Math.max(0, lostTotal.count - Math.ceil(lostTotal.count / 3) * 2),
        needs_tier_bottom: needsTotal.amount / 3,
        needs_tier_middle: needsTotal.amount / 3,
        needs_tier_top: needsTotal.amount / 3,
        needs_tier_bottom_count: Math.ceil(needsTotal.count / 3),
        needs_tier_middle_count: Math.ceil(needsTotal.count / 3),
        needs_tier_top_count: Math.max(0, needsTotal.count - Math.ceil(needsTotal.count / 3) * 2),
        review_tier_bottom: reviewTotal.amount / 3,
        review_tier_middle: reviewTotal.amount / 3,
        review_tier_top: reviewTotal.amount / 3,
        review_tier_bottom_count: Math.ceil(reviewTotal.count / 3),
        review_tier_middle_count: Math.ceil(reviewTotal.count / 3),
        review_tier_top_count: Math.max(0, reviewTotal.count - Math.ceil(reviewTotal.count / 3) * 2),
        // All status 3-tier
        all_tier_bottom: allTotal.amount / 3,
        all_tier_middle: allTotal.amount / 3,
        all_tier_top: allTotal.amount / 3,
        all_tier_bottom_count: Math.ceil(allTotal.count / 3),
        all_tier_middle_count: Math.ceil(allTotal.count / 3),
        all_tier_top_count: Math.max(0, allTotal.count - Math.ceil(allTotal.count / 3) * 2),
      };
    });

    // Sort chronologically by month
    return unsortedData.sort((a: any, b: any) => {
      return parseMonthString(a.month).getTime() - parseMonthString(b.month).getTime();
    });
  })();

  let disputesRateByMonth =
    ((isDataEmpty ? [] : dashboardData?.charts?.disputesRateByMonth) || []).map((d: any) => ({
      month: d?.month || "",
      count: Number(d?.count) || 0,
      amount: Number(d?.amount) || 0,
      rate: Number(d?.rate) || 0,
    })) ?? [];
  if (!disputesRateByMonth.length) {
    disputesRateByMonth = [];
  }
  let availableStatuses = isDataEmpty ? [] : dashboardData?.charts?.availableStatuses || [];
  const statusLabels = isDataEmpty ? {} : dashboardData?.charts?.statusLabels || {};

  const disputeReasonTranslations: Record<string, string> = {
    "Produto não recebido": "Product not received",
    "Produto diferente do descrito": "Product not as described",
    "Crédito não processado": "Credit not processed",
    "Fraudulenta": "Fraudulent",
    "Cobrança duplicada": "Duplicate charge",
    "Não recebido": "Product not received",
    "Não conforme descrito": "Product not as described",
    "Fraude": "Fraudulent",
    "Assinatura cancelada": "Subscription canceled"
  };

  const translateDisputeReasonName = (name: string) => disputeReasonTranslations[name] || name;

  // Disputas por processador agora é um array simples com agregação por gateway
  let disputesByProcessor =
    ((isDataEmpty ? [] : dashboardData?.charts?.disputesByProcessor) || []).map((d: any) => ({
      name: d?.name || "N/A",
      count: Number(d?.count) || 0,
      amount: Number(d?.amount) || 0,
    })) ?? [];
  if (!disputesByProcessor.length) {
    disputesByProcessor = [];
  }
  let availableProcessors = isDataEmpty ? [] : dashboardData?.charts?.availableProcessors || [];

  let disputesByReason =
    ((isDataEmpty ? [] : dashboardData?.charts?.disputesByReason) || []).map((d: any) => ({
      name: translateDisputeReasonName(d?.name || "N/A"),
      value: Number(d?.value) || 0,
      count: Number(d?.count ?? d?.value) || 0,
      amount: Number(d?.amount ?? d?.count ?? d?.value) || 0,
    })) ?? [];
  if (!disputesByReason.length) {
    disputesByReason = [];
  }

  let disputesByCategory =
    ((isDataEmpty ? [] : dashboardData?.charts?.disputesByCategory) || []).map((d: any) => ({
      name: d?.name || "N/A",
      value: Number(d?.value) || 0,
      amount: Number(parseAmount?.(d?.amount) ?? d?.amount ?? 0) || 0,
    }));
  if (!disputesByCategory.length) {
    disputesByCategory = [];
  }

  let disputesByCardNetwork =
    ((isDataEmpty ? [] : dashboardData?.charts?.disputesByNetwork) || []).map((d: any) => ({
      name: d?.name || "N/A",
      count: Number(d?.count) || 0,
      amount: Number(d?.amount) || 0,
    })) ?? [];
  if (!disputesByCardNetwork.length) {
    disputesByCardNetwork = [];
  }

  let disputesByCountry =
    ((isDataEmpty ? [] : dashboardData?.charts?.disputesByCountry) || []).map((d: any) => ({
      country: d?.country || "N/A",
      code: d?.code || "",
      count: Number(d?.count) || 0,
      amount: Number(d?.amount) || 0,
      winRate: Number(d?.winRate) || 0,
    })) ?? [];
  if (!disputesByCountry.length) {
    disputesByCountry = [];
  }

  if (disputeFilter === "chargemind") {
    disputesByMonth = filteredAgg?.disputesByMonthAgg || [];
    disputesRateByMonth = filteredAgg?.disputesRateByMonthAgg || [];
    availableStatuses = filteredAgg?.availableStatuses || [];
    disputesByProcessor = filteredAgg?.disputesByProcessorAgg || [];
    disputesByReason = filteredAgg?.disputesByReasonAgg || [];
    disputesByCardNetwork = filteredAgg?.disputesByNetworkAgg || [];
    disputesByCountry = filteredAgg?.disputesByCountryAgg || [];
    availableProcessors = ["all", ...new Set(disputesByProcessor.map((p) => p.name))];
  }

  const rawOrders = (isDataEmpty ? [] : dashboardData?.rawData?.orders) || [];
  const fallbackOrders = (isDataEmpty ? [] : dashboardData?.rawDataAllTime?.orders) || [];
  const allOrders = rawOrders.length ? rawOrders : fallbackOrders;

  const formatOrderAddress = (order: any) => {
    const address = order?.shipping_address || order?.billing_address;
    if (!address) return "-";
    const parts = [
      address.address1,
      address.address2,
      address.city,
      address.province,
      address.zip,
      address.country || address.country_code,
    ];
    return parts.filter(Boolean).join(", ");
  };

  const getOrderTrackingNumber = (order: any) => {
    const fulfillmentWithTracking = order?.fulfillments?.find((f: any) => f?.tracking_number);
    return (
      fulfillmentWithTracking?.tracking_number ||
      order?.tracking_number ||
      order?.shipping_lines?.[0]?.tracking_number ||
      order?.fulfillments?.[0]?.tracking_number ||
      "-"
    );
  };

  const formatOrderAmount = (order: any) => {
    const amount = parseAmount(order?.current_total_price ?? order?.total_price ?? order?.subtotal_price ?? 0);
    const currency = order?.currency || "USD";
    try {
      return new Intl.NumberFormat(i18n.language === "pt" ? "pt-BR" : "en-US", {
        style: "currency",
        currency,
      }).format(amount);
    } catch {
      return usd.format(amount);
    }
  };

  const formatOrderDate = (order: any) => {
    const dateValue = order?.created_at || order?.createdAt || order?.created_at_min;
    if (!dateValue) return "-";
    try {
      return new Date(dateValue).toLocaleDateString(i18n.language === "pt" ? "pt-BR" : "en-US");
    } catch {
      return dateValue;
    }
  };

  const getOrderProducts = (order: any) => {
    if (Array.isArray(order?.line_items) && order.line_items.length > 0) {
      return order.line_items
        .map((item: any) => item?.title || item?.name)
        .filter(Boolean)
        .join(", ");
    }
    return "-";
  };

  const handleCountryRowClick = (item: any) => {
    const normalizedCountry = stripFlagEmoji(item.country || item.pais || "");
    const filteredOrders = allOrders.filter((order: any) => {
      const shippingCountry = order?.shipping_address?.country || "";
      const shippingCountryCode =
        order?.shipping_address?.country_code || order?.shipping_address?.country_code_alpha2;

      return (
        (shippingCountry &&
          shippingCountry.toLowerCase() === normalizedCountry.toLowerCase()) ||
        (shippingCountryCode &&
          item.code &&
          shippingCountryCode.toLowerCase() === String(item.code).toLowerCase())
      );
    });

    setCountryOrders(filteredOrders);
    setSelectedCountry({ name: normalizedCountry, code: item.code });
    setCountryOrdersModalOpen(true);
  };

  const handleCountryRowKeyDown = (event: React.KeyboardEvent<HTMLTableRowElement>, item: any) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleCountryRowClick(item);
    }
  };

  const handleExportCountryOrders = () => {
    if (!countryOrders.length || typeof window === "undefined") return;

    const headers = [
      t("dashboard.countryOrdersOrderId"),
      t("dashboard.countryOrdersProduct"),
      t("dashboard.countryOrdersCustomer"),
      t("dashboard.countryOrdersAddress"),
      t("dashboard.countryOrdersTracking"),
      t("dashboard.countryOrdersAmount"),
      t("dashboard.countryOrdersDate"),
    ];

    const rows = countryOrders.map((order: any) => {
      const customerName =
        order?.shipping_address?.name ||
        [order?.customer?.first_name, order?.customer?.last_name].filter(Boolean).join(" ") ||
        order?.billing_address?.name ||
        "-";

      return [
        order?.name || order?.id || "",
        getOrderProducts(order),
        customerName,
        formatOrderAddress(order),
        getOrderTrackingNumber(order),
        formatOrderAmount(order),
        formatOrderDate(order),
      ];
    });

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `orders-${selectedCountry?.code || selectedCountry?.name || "country"}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const repeatDisputers = isDataEmpty ? [] : dashboardData?.charts?.repeatDisputers || [];
// Se estiver em modo mock e existir taxa simulada, use diretamente como porcentagem (0-3)
let chargebackRateValue: number | undefined;

if (useMockData && mockChargebackRate !== null && Number.isFinite(mockChargebackRate)) {
  chargebackRateValue = mockChargebackRate;
} else {
  if (isDataEmpty) {
    chargebackRateValue = 0;
  } else {
    // Preferir dados all-time (sem filtro de data)
    const totalDisputesAllTime = dashboardData?.rawDataAllTime?.disputes?.length;
    const totalOrdersAllTime = dashboardData?.rawDataAllTime?.orders?.length;
    const disputesAll = Number(totalDisputesAllTime);
    const ordersAll = Number(totalOrdersAllTime);
    if (Number.isFinite(disputesAll) && Number.isFinite(ordersAll) && ordersAll > 0) {
      chargebackRateValue = (disputesAll / ordersAll) * 100;
    } else {
      const healthAccountRate =
        dashboardData?.metrics?.healthAccountAllTime ?? dashboardData?.metrics?.healthAccount;
      const normalizedChargebackRate =
        typeof healthAccountRate === "string" ? Number(healthAccountRate) : healthAccountRate;

      // Normaliza chargeback (aceita % ou fração). Se vier em base 1, multiplica por 100.
      // Se vier exagerado (ex.: 6500 vindo como bps ou valor bruto), divide por 100.
      chargebackRateValue = Number.isFinite(normalizedChargebackRate)
        ? Number(normalizedChargebackRate)
        : undefined;
      if (Number.isFinite(chargebackRateValue)) {
        if ((chargebackRateValue as number) <= 1) {
          chargebackRateValue = (chargebackRateValue as number) * 100;
        } else if ((chargebackRateValue as number) > 100) {
          chargebackRateValue = (chargebackRateValue as number) / 100;
        }
      }
    }
  }
}

  const safeMetrics =
    disputeFilter === "chargemind"
      ? filteredAgg?.aggMetrics || {}
      : isDataEmpty
        ? {}
        : dashboardData?.metrics || {};
  const previousSafeMetrics = previousMetrics || {};

  const toNumberValue = (value: any) => {
    if (value === null || value === undefined) return undefined;
    if (typeof value === "number") return value;
    if (typeof value === "string") {
      const cleaned = value.replace(/[^\d.-]/g, "");
      const parsed = parseFloat(cleaned);
      return Number.isFinite(parsed) ? parsed : undefined;
    }
    return undefined;
  };

  const trends = {
    activeDisputes: calculateTrend({
      currentValue: toNumberValue(safeMetrics?.activeDisputes),
      previousValue: previousMetrics ? toNumberValue(previousSafeMetrics?.activeDisputes) : undefined,
      type: "negative_is_good",
    }),
    evidenceSubmitted: calculateTrend({
      currentValue: toNumberValue(safeMetrics?.evidenceSubmitted),
      previousValue: previousMetrics ? toNumberValue(previousSafeMetrics?.evidenceSubmitted) : undefined,
      type: "positive_is_good",
      neutralOnDecrease: true,
    }),
    underReview: calculateTrend({
      currentValue: toNumberValue(safeMetrics?.review),
      previousValue: previousMetrics ? toNumberValue(previousSafeMetrics?.review) : undefined,
      type: "positive_is_good",
      neutralOnDecrease: true,
    }),
    disputesRecovered: calculateTrend({
      currentValue: toNumberValue(safeMetrics?.totalWon),
      previousValue: previousMetrics ? toNumberValue(previousSafeMetrics?.totalWon) : undefined,
      type: "positive_is_good",
    }),
    disputesCreated: calculateTrend({
      currentValue: toNumberValue(safeMetrics?.totalDisputes),
      previousValue: previousMetrics ? toNumberValue(previousSafeMetrics?.totalDisputes) : undefined,
      type: "negative_is_good",
    }),
    estimatedSavings: calculateTrend({
      currentValue: parseAmount(safeMetrics?.savedTimeAmount),
      previousValue: previousMetrics ? parseAmount(previousSafeMetrics?.savedTimeAmount) : undefined,
      type: "positive_is_good",
    }),
    winRate: calculateTrend({
      currentValue: toNumberValue(safeMetrics?.winRate),
      previousValue: previousMetrics ? toNumberValue(previousSafeMetrics?.winRate) : undefined,
      type: "positive_is_good",
    }),
    accountHealth: calculateTrend({
      currentValue: 0,
      previousValue: 0,
      type: "negative_is_good",
    }),
  };

  if (loading) {
    return (
      <DashboardLayout onDateRangeChange={handleDateRangeChange}>
        <div className="space-y-6">
          {/* Welcome Header Section - sempre visível */}
          <div className="-mx-6 lg:-mx-8 px-6 lg:px-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-white pb-6 relative after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-screen after:h-px after:bg-[#E9E9E9]">
            <div>
              <h1 className="text-2xl font-bold text-[#1F2937]">Welcome, {displayFirstName}! 👋</h1>
              <p className="text-[#6B7280] mt-1">
                {t("dashboard.welcomeMessage")}
              </p>
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
                    onClick={() => i18n.changeLanguage("en")}
                  >
                    English
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-[#374151] font-normal focus:font-medium focus:text-[#374151] focus:bg-[#F9F9F9] cursor-pointer outline-none rounded-sm px-2 py-1.5"
                    onClick={() => i18n.changeLanguage("pt")}
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
                  {hasUnread && (
                    <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
                  )}
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
                    {t("common.logOut")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Loading Spinner na área de conteúdo */}
          <div className="flex items-center justify-center min-h-[50vh]">
            <img src="/spinner.png" alt={t("common.loading")} className="h-8 w-8 animate-spin animate-pulse" />
          </div>
        </div>

      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout onDateRangeChange={handleDateRangeChange}>
      <div className="space-y-6">
        {/* Welcome Header Section */}
        <div className="-mx-6 lg:-mx-8 px-6 lg:px-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-white pb-6 relative after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-screen after:h-px after:bg-[#E9E9E9]">
          <div>
            <h1 className="text-2xl font-bold text-[#1F2937]">Welcome, {displayFirstName}! 👋</h1>
            <p className="text-[#6B7280] mt-1">
              {t("dashboard.welcomeMessage")}
            </p>
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
                {hasUnread && (
                  <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
                )}
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
                  {t("common.logOut")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {missingShopify && !integrationPaused && (
          <div className="bg-[#FFF7F7] border border-[#FEE2E2] rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-start gap-3 text-sm text-[#374151]">
              <div className="h-9 w-9 rounded-full bg-[#FEE2E2] flex items-center justify-center text-[#DC2626] font-semibold">
                !
              </div>
              <div>
                <p className="font-semibold text-[#111827]">
                  {i18n.language === "pt" ? "Conecte sua loja Shopify" : "Connect your store"}
                </p>
                <p className="text-[#6B7280]">
                  {i18n.language === "pt"
                    ? "Adicione a URL da loja e o token de acesso em Integrações para ver disputas reais e gráficos atualizados."
                    : "Add your shop URL and access token in Integrations to see real disputes and updated charts."}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              className="bg-white border-[#DEDEDE] text-[#1F2937] hover:bg-[#F9F9F9]"
              onClick={() => navigate("/integracoes")}
            >
              {i18n.language === "pt" ? "Ir para Integrações" : "Go to Integrations"}
            </Button>
          </div>
        )}

        {/* System Health & Diagnostics */}
        <SystemHealthDiagnostics chargebackRate={chargebackRateValue} />

        {/* Date Range and Filter Controls */}
        <div className="flex items-center gap-4 flex-wrap">
          <DateRangePicker onDateRangeChange={handleDateRangeChange} />
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className={`rounded-md bg-white px-4 py-2 font-medium ${
                disputeFilter === "all"
                  ? "border-[#1B966C] text-[#1B966C] hover:bg-white hover:text-[#1B966C] hover:border-[#1B966C]"
                  : "border-[#D3D3D3] text-[#484848] hover:bg-white hover:text-[#484848] hover:border-[#D3D3D3]"
              }`}
              onClick={() => setDisputeFilter("all")}
            >
              <BarChart3 className={`h-4 w-4 ${disputeFilter === "all" ? "text-[#1B966C]" : "text-[#484848]"}`} />
              {t("dashboard.allDisputes")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={`rounded-md bg-white px-4 py-2 font-medium ${
                disputeFilter === "chargemind"
                  ? "border-[#1B966C] text-[#1B966C] hover:bg-white hover:text-[#1B966C] hover:border-[#1B966C]"
                  : "border-[#D3D3D3] text-[#484848] hover:bg-white hover:text-[#484848] hover:border-[#D3D3D3]"
              }`}
              onClick={() => setDisputeFilter("chargemind")}
            >
              {disputeFilter === "chargemind" ? (
                <img src={chargemindIconGreen} alt="" className="h-4 w-4" />
              ) : (
                <img
                  src={alexeiIcon}
                  alt=""
                  className="h-4 w-4"
                  style={{
                    filter:
                      "brightness(0) saturate(100%) invert(27%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(55%) contrast(90%)",
                  }}
                />
              )}
              {t("dashboard.byChargemind")}
            </Button>
          </div>
        </div>

        {/* Top Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <MetricCard
            title={t("dashboard.activeDisputes")}
            icon={FileText}
            subtitle={t("dashboard.numberOfCases")}
            value={safeMetrics?.activeDisputes ?? "0"}
            valueLabel={t("dashboard.totalValue")}
            amount={safeMetrics?.activeDisputeAmount ?? "$0"}
            trend={trends.activeDisputes}
            badge={<Info className="h-3 w-3 text-muted-foreground" />}
            badgeDesc={t("dashboard.activeDisputesDesc")}
          />
          <MetricCard
            title={t("dashboard.evidenceSubmitted")}
            icon={CheckCircle}
            subtitle={t("dashboard.numberOfCases")}
            value={safeMetrics?.evidenceSubmitted ?? "0"}
            valueLabel={t("dashboard.totalValue")}
            amount={`${safeMetrics?.evidenceSubmittedAmount ?? "0"}`}
            trend={trends.evidenceSubmitted}
            badge={<Info className="h-3 w-3 text-muted-foreground" />}
            badgeDesc={t("dashboard.evidenceSubmittedDesc")}
          />
          <MetricCard
            title={t("dashboard.underReview")}
            icon={Clock}
            subtitle={t("dashboard.numberOfCases")}
            value={safeMetrics?.review ?? "0"}
            valueLabel={t("dashboard.totalValue")}
            amount={`${safeMetrics?.reviewAmount ?? "0"}`}
            trend={trends.underReview}
            badge={<Info className="h-3 w-3 text-muted-foreground" />}
            badgeDesc={t("dashboard.underReviewDesc")}
          />
          <MetricCard
            title={t("dashboard.disputesRecovered")}
            icon={TrendingUp}
            subtitle={t("dashboard.numberOfCases")}
            value={safeMetrics?.totalWon ?? "0"}
            valueLabel={t("dashboard.revenueRecovered")}
            amount={safeMetrics?.recoveredAmount ?? "$0"}
            trend={trends.disputesRecovered}
            badge={<Info className="h-3 w-3 text-muted-foreground" />}
            badgeDesc={t("dashboard.disputesRecoveredDesc")}
          />
        </div>

        {/* Second Row Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <MetricCard
            title={t("dashboard.disputesCreated")}
            icon={Wallet}
            subtitle={t("dashboard.numberOfCases")}
            value={safeMetrics?.totalDisputes ?? "0"}
            valueLabel={t("dashboard.totalValue")}
            amount={safeMetrics?.totalDisputesAmount ?? "$0"}
            trend={trends.disputesCreated}
            badge={<Info className="h-3 w-3 text-muted-foreground" />}
            badgeDesc={t("dashboard.disputesCreatedDesc")}
          />
          <MetricCard
            title={t("dashboard.accountHealth")}
            icon={ShieldAlert}
            subtitle={t("dashboard.numberOfCases")}
            value="0"
            valueLabel={t("dashboard.totalValue")}
            amount="$0"
            trend={trends.accountHealth}
            badge={<Info className="h-3 w-3 text-muted-foreground" />}
            badgeDesc={t("dashboard.accountHealthDesc")}
          />
          <MetricCard
            title={t("dashboard.estimatedSavings")}
            icon={Timer}
            subtitle={t("dashboard.timeSaved")}
            value={safeMetrics?.savedTime ?? "0"}
            valueLabel={t("dashboard.totalMoneySaved")}
            amount={safeMetrics?.savedTimeAmount ?? "$0"}
            badge={<Info className="h-3 w-3 text-muted-foreground" />}
            badgeDesc={t("dashboard.estimatedSavingsDesc")}
          />
          <MetricCard
            title={t("dashboard.winRate")}
            icon={Trophy}
            subtitle={t("dashboard.winRate")}
            value={`${(safeMetrics?.winRate as number | undefined)?.toFixed?.(1) || 0}%`}
            valueLabel={t("dashboard.valueRecoveryRate")}
            amount={`${(safeMetrics?.winRateAmount as number | undefined)?.toFixed?.(1) || 0}%`}
            badge={<Info className="h-3 w-3 text-muted-foreground" />}
            badgeDesc={t("dashboard.winRateDesc")}
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Win Rate Trend */}

          <ChartCard
            title={t("dashboard.disputeRate")}
            icon={BarChart3}
            description={formatDateRangeForDisplay()}
            badge={<Info className="h-3 w-3 text-muted-foreground" />}
            badgeDesc={t("dashboard.disputeRateDesc")}
            className="bg-[#F9F9F9]"
          >
            <div className="p-4 rounded-lg border border-[#EFEFF0] bg-white min-h-[300px] flex flex-col justify-center">
              {disputesRateByMonth.length === 0 ? (
                <div className="flex items-center justify-center flex-1 min-h-[250px]">
                  <EmptyGraph />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart
                    data={[...disputesRateByMonth].sort((a, b) => {
                      const monthOrder: { [key: string]: number } = {
                        Jan: 1,
                        Fev: 2,
                        Mar: 3,
                        Abr: 4,
                        Mai: 5,
                        Jun: 6,
                        Jul: 7,
                        Ago: 8,
                        Set: 9,
                        Out: 10,
                        Nov: 11,
                        Dez: 12,
                      };
                      const [monthA, yearA] = a.month.split(" '");
                      const [monthB, yearB] = b.month.split(" '");
                      if (yearA !== yearB) return parseInt(yearA) - parseInt(yearB);
                      return (monthOrder[monthA] || 0) - (monthOrder[monthB] || 0);
                    })}
                    margin={{ left: -20, right: 10, top: 10 }}
                  >
                    <defs>
                      <linearGradient id="disputeRateGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10B981" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={true} vertical={false} />
                    <XAxis
                      dataKey="month"
                      stroke="#9CA3AF"
                      fontSize={12}
                      tickLine={false}
                      axisLine={{ stroke: "#E5E7EB" }}
                      padding={{ left: 20, right: 10 }}
                    />
                    <YAxis
                      stroke="#9CA3AF"
                      fontSize={12}
                      tickLine={false}
                      axisLine={{ stroke: "#E5E7EB" }}
                      domain={[0, "auto"]}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const value = payload[0].value;
                          // Parse month label to full format (e.g., "Nov '25" -> "November 2025")
                          const monthMap: { [key: string]: string } = {
                            Jan: "January",
                            Fev: "February",
                            Mar: "March",
                            Abr: "April",
                            Mai: "May",
                            Jun: "June",
                            Jul: "July",
                            Ago: "August",
                            Set: "September",
                            Out: "October",
                            Nov: "November",
                            Dez: "December",
                          };
                          const parts = label?.split(" '") || [];
                          const monthShort = parts[0] || "";
                          const year = parts[1] ? `20${parts[1]}` : "";
                          const fullMonth = monthMap[monthShort] || monthShort;
                          const displayDate = `${fullMonth} ${year}`;

                          return (
                            <div className="bg-white border border-[#E5E7EB] rounded-lg shadow-md p-3 min-w-[180px]">
                              <div className="flex items-center gap-2 text-[#6B7280]">
                                <Calendar className="h-4 w-4" />
                                <span className="text-sm">{displayDate}</span>
                              </div>
                              <div className="border-b border-[#E5E7EB] my-2" />
                              <div className="flex items-center gap-2">
                                <div className="w-1.5 h-4 bg-[#10B981] rounded-sm" />
                                <span className="text-[#1F2937] text-sm">
                                  {rateViewMode === "value" ? "Dispute Rate: " : "Quantity: "}
                                  <span className="font-bold">
                                    {rateViewMode === "value" ? `${Number(value).toFixed(1)}%` : value}
                                  </span>
                                </span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area
                      type="monotone"
                      name={rateViewMode === "value" ? t("dashboard.rate") : t("dashboard.quantity")}
                      dataKey={rateViewMode === "value" ? "amount" : "count"}
                      stroke="#10B981"
                      strokeWidth={2.5}
                      fill="url(#disputeRateGradient)"
                      dot={{ fill: "#ffffff", stroke: "#10B981", strokeWidth: 2, r: 4 }}
                      activeDot={{ fill: "#ffffff", stroke: "#10B981", strokeWidth: 2, r: 6 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </ChartCard>

          {/* Disputes by Reason */}
          <ChartCard
            title={t("dashboard.disputesByReason")}
            icon={BarChart3}
            description={formatDateRangeForDisplay()}
            badge={<Info className="h-3 w-3 text-muted-foreground" />}
            badgeDesc={t("dashboard.disputesByReasonDesc")}
            className="bg-[#F9F9F9]"
            actions={
              <div className="flex bg-[#ededed] rounded-lg p-1 gap-0.5 border shadow-sm">
                <button
                  onClick={() => setReasonViewMode("value")}
                  className={`px-5 py-2 text-sm transition-all rounded-md ${
                    reasonViewMode === "value"
                      ? "bg-white text-[#1F2937] font-semibold shadow-sm"
                      : "bg-transparent text-[#6B7280] font-normal hover:text-[#4B5563]"
                  }`}
                >
                  {t("dashboard.byValue")}
                </button>
                <button
                  onClick={() => setReasonViewMode("count")}
                  className={`px-5 py-2 text-sm transition-all rounded-md ${
                    reasonViewMode === "count"
                      ? "bg-white text-[#1F2937] font-semibold shadow-sm"
                      : "bg-transparent text-[#6B7280] font-normal hover:text-[#4B5563]"
                  }`}
                >
                  {t("dashboard.byQuantity")}
                </button>
              </div>
            }
          >
            <HorizontalProgressBars
              data={disputesByReason || []}
              mode={reasonViewMode}
              emptyMessage={<EmptyGraph />}
            />
          </ChartCard>

          {/* Disputes by Month */}
          <ChartCard
            title={t("dashboard.disputesByMonth")}
            icon={BarChart3}
            description={formatDateRangeForDisplay()}
            badge={<Info className="h-4 w-4 text-muted-foreground" />}
            badgeDesc={t("dashboard.disputesByMonthDesc")}
            className="bg-[#F9F9F9]"
            actions={
              <div className="flex gap-0.5 bg-[#ededed] p-1 rounded-lg border shadow-sm">
                <Button
                  variant={monthViewMode === "value" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setMonthViewMode("value")}
                  className={`${
                    monthViewMode === "value"
                      ? "bg-white text-[#1F2937] font-semibold shadow-sm hover:bg-white"
                      : "bg-transparent text-[#6B7280] font-normal hover:text-[#4B5563] hover:bg-transparent"
                  } transition-all`}
                >
                  {t("dashboard.byValue")}
                </Button>
                <Button
                  variant={monthViewMode === "count" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setMonthViewMode("count")}
                  className={`${
                    monthViewMode === "count"
                      ? "bg-white text-[#1F2937] font-semibold shadow-sm hover:bg-white"
                      : "bg-transparent text-[#6B7280] font-normal hover:text-[#4B5563] hover:bg-transparent"
                  } transition-all`}
                >
                  {t("dashboard.byQuantity")}
                </Button>
              </div>
            }
          >
            <div className="bg-white border border-[#EFEFF0] rounded-lg p-6">
              {disputesByMonth.length === 0 ? (
                <div className="flex items-center justify-center h-[280px]">
                  <EmptyGraph />
                </div>
              ) : (
                <>
                  <div className="h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={(() => {
                          // Calculate max value for current status filter
                          const maxValue = Math.max(
                            ...disputesByMonth.map((item: any) => {
                              const prefix =
                                monthStatusFilter === "won"
                                  ? "won"
                                  : monthStatusFilter === "lost"
                                    ? "lost"
                                    : monthStatusFilter === "needs_response"
                                      ? "needs"
                                      : monthStatusFilter === "under_review"
                                        ? "review"
                                        : "all";
                              
                              const valueKey = monthViewMode === "value" 
                                ? `${prefix === "all" ? "all" : monthStatusFilter}_${monthViewMode === "value" ? "amount" : "count"}`
                                : `${prefix === "all" ? "all" : monthStatusFilter}_count`;
                              
                              // Get the total value for this month
                              if (prefix === "all") {
                                return monthViewMode === "value"
                                  ? (item.won_amount || 0) + (item.lost_amount || 0) + (item.needs_response_amount || 0) + (item.under_review_amount || 0)
                                  : (item.won_count || 0) + (item.lost_count || 0) + (item.needs_response_count || 0) + (item.under_review_count || 0);
                              }
                              
                              return monthViewMode === "value" 
                                ? item[`${monthStatusFilter}_amount`] || 0
                                : item[`${monthStatusFilter}_count`] || 0;
                            }),
                            1
                          );
                          
                          // Process each month data
                          return disputesByMonth.map((item: any) => {
                            const prefix =
                              monthStatusFilter === "won"
                                ? "won"
                                : monthStatusFilter === "lost"
                                  ? "lost"
                                  : monthStatusFilter === "needs_response"
                                    ? "needs"
                                    : monthStatusFilter === "under_review"
                                      ? "review"
                                      : "all";
                            
                            // Get current value for this bar
                            let currentValue = 0;
                            if (prefix === "all") {
                              currentValue = monthViewMode === "value"
                                ? (item.won_amount || 0) + (item.lost_amount || 0) + (item.needs_response_amount || 0) + (item.under_review_amount || 0)
                                : (item.won_count || 0) + (item.lost_count || 0) + (item.needs_response_count || 0) + (item.under_review_count || 0);
                            } else {
                              currentValue = monthViewMode === "value" 
                                ? item[`${monthStatusFilter}_amount`] || 0
                                : item[`${monthStatusFilter}_count`] || 0;
                            }
                            
                            // Calculate percentage relative to max
                            const percentage = (currentValue / maxValue) * 100;
                            
                            // Determine number of blocks
                            let numBlocks = 1;
                            if (percentage > 70) {
                              numBlocks = 3;
                            } else if (percentage > 35) {
                              numBlocks = 2;
                            }
                            
                            // Distribute value across blocks
                            let tierBottom = 0, tierMiddle = 0, tierTop = 0;
                            
                            if (numBlocks === 1) {
                              tierBottom = currentValue;
                            } else if (numBlocks === 2) {
                              tierBottom = currentValue / 2;
                              tierTop = currentValue / 2;
                            } else {
                              tierBottom = currentValue / 3;
                              tierMiddle = currentValue / 3;
                              tierTop = currentValue / 3;
                            }
                            
                            return {
                              ...item,
                              [`${prefix}_tier_bottom${monthViewMode === "count" ? "_count" : ""}`]: tierBottom,
                              [`${prefix}_tier_middle${monthViewMode === "count" ? "_count" : ""}`]: tierMiddle,
                              [`${prefix}_tier_top${monthViewMode === "count" ? "_count" : ""}`]: tierTop,
                              [`${prefix}_numBlocks`]: numBlocks,
                            };
                          });
                        })()}
                        barCategoryGap="20%" 
                        margin={{ left: 5, top: 10, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                        <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis
                          stroke="#9ca3af"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          width={65}
                          tickFormatter={(value) =>
                            monthViewMode === "value"
                              ? `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                              : value
                          }
                        />
                        <Tooltip
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              const dataPoint = payload[0]?.payload;
                              if (!dataPoint) return null;

                              // Parse month label to full format
                              const monthMap: { [key: string]: string } = {
                                Jan: "January",
                                Fev: "February",
                                Mar: "March",
                                Abr: "April",
                                Mai: "May",
                                Jun: "June",
                                Jul: "July",
                                Ago: "August",
                                Set: "September",
                                Out: "October",
                                Nov: "November",
                                Dez: "December",
                              };
                              const parts = label?.split(" '") || [];
                              const monthShort = parts[0] || "";
                              const year = parts[1] ? `20${parts[1]}` : "";
                              const fullMonth = monthMap[monthShort] || monthShort;
                              const displayDate = `${fullMonth} ${year}`;

                              const allStatusItems = [
                                {
                                  key: "under_review",
                                  label: "Under Review",
                                  color: "#53A697",
                                  value:
                                    monthViewMode === "value"
                                      ? dataPoint.under_review_amount
                                      : dataPoint.under_review_count,
                                },
                                {
                                  key: "needs_response",
                                  label: "Processing",
                                  color: "#35504D",
                                  value:
                                    monthViewMode === "value"
                                      ? dataPoint.needs_response_amount
                                      : dataPoint.needs_response_count,
                                },
                                {
                                  key: "lost",
                                  label: "Lost",
                                  color: "#ef4444",
                                  value: monthViewMode === "value" ? dataPoint.lost_amount : dataPoint.lost_count,
                                },
                                {
                                  key: "won",
                                  label: "Won",
                                  color: "#22c55e",
                                  value: monthViewMode === "value" ? dataPoint.won_amount : dataPoint.won_count,
                                },
                              ];

                              // Filter to show only the selected status, or all if "all" is selected
                              const statusItems =
                                monthStatusFilter === "all"
                                  ? allStatusItems
                                  : allStatusItems.filter((item) => item.key === monthStatusFilter);

                              return (
                                <div className="bg-white border border-[#E5E7EB] rounded-lg shadow-md p-3 min-w-[180px]">
                                  <div className="flex items-center gap-2 text-[#6B7280]">
                                    <Calendar className="h-4 w-4" />
                                    <span className="text-sm">{displayDate}</span>
                                  </div>
                                  <div className="border-b border-[#E5E7EB] my-2" />
                                  <div className="space-y-1.5">
                                    {statusItems.map((item) => (
                                      <div key={item.key} className="flex items-center gap-2">
                                        <div className="w-1.5 h-4 rounded-sm" style={{ backgroundColor: item.color }} />
                                        <span className="text-[#1F2937] text-sm">
                                          {item.label}:{" "}
                                          <span className="font-bold">
                                            {monthViewMode === "value"
                                              ? `$${(item.value || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                              : item.value || 0}
                                          </span>
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        {/* Dynamic adaptive stacked bars based on selected filter */}
                        {(() => {
                          const colors =
                            STATUS_COLOR_SCHEMES[monthStatusFilter as keyof typeof STATUS_COLOR_SCHEMES] ||
                            STATUS_COLOR_SCHEMES.all;
                          const prefix =
                            monthStatusFilter === "won"
                              ? "won"
                              : monthStatusFilter === "lost"
                                ? "lost"
                                : monthStatusFilter === "needs_response"
                                  ? "needs"
                                  : monthStatusFilter === "under_review"
                                    ? "review"
                                    : "all";

                          return (
                            <>
                              {/* Bottom block - Darkest shade */}
                              <Bar
                                dataKey={
                                  monthViewMode === "value" ? `${prefix}_tier_bottom` : `${prefix}_tier_bottom_count`
                                }
                                stackId="stack"
                                fill={colors.dark}
                                maxBarSize={90}
                                shape={(props: any) => {
                                  const { x, y, width, height, payload } = props;
                                  if (!height || height <= 0) return null;
                                  
                                  const numBlocks = payload[`${prefix}_numBlocks`];
                                  let radius: [number, number, number, number] = [0, 0, 0, 0];
                                  
                                  // Apply radius based on block configuration
                                  if (numBlocks === 1) {
                                    radius = [10, 10, 10, 10]; // All corners rounded
                                  } else {
                                    radius = [0, 0, 10, 10]; // Bottom corners rounded
                                  }
                                  
                                  return (
                                    <>
                                      {/* Main block without bottom border */}
                                      <Rectangle
                                        x={x}
                                        y={y}
                                        width={width}
                                        height={height}
                                        fill={props.fill}
                                        stroke="none"
                                        radius={radius}
                                      />
                                      {/* Top border only (for blocks above) */}
                                      {numBlocks > 1 && (
                                        <line
                                          x1={x}
                                          y1={y}
                                          x2={x + width}
                                          y2={y}
                                stroke="white"
                                          strokeWidth={2}
                                        />
                                      )}
                                    </>
                                  );
                                }}
                              />
                              {/* Middle block - Medium shade */}
                              <Bar
                                dataKey={
                                  monthViewMode === "value" ? `${prefix}_tier_middle` : `${prefix}_tier_middle_count`
                                }
                                stackId="stack"
                                fill={colors.medium}
                                maxBarSize={90}
                                shape={(props: any) => {
                                  const { x, y, width, height, value } = props;
                                  // Don't render if value is 0
                                  if (!value || value <= 0) return null;
                                  return (
                                    <>
                                      <Rectangle
                                        x={x}
                                        y={y}
                                        width={width}
                                        height={height}
                                        fill={props.fill}
                                        stroke="none"
                                        radius={[0, 0, 0, 0]}
                                      />
                                      {/* White gap line on top */}
                                      <line
                                        x1={x}
                                        y1={y}
                                        x2={x + width}
                                        y2={y}
                                stroke="white"
                                        strokeWidth={2}
                                      />
                                    </>
                                  );
                                }}
                              />
                              {/* Top block - Lightest shade */}
                              <Bar
                                dataKey={monthViewMode === "value" ? `${prefix}_tier_top` : `${prefix}_tier_top_count`}
                                stackId="stack"
                                fill={colors.light}
                                maxBarSize={90}
                                shape={(props: any) => {
                                  const { x, y, width, height, payload, value } = props;
                                  if (!value || value <= 0) return null;
                                  
                                  const numBlocks = payload[`${prefix}_numBlocks`];
                                  
                                  // For 2-block config, use medium color
                                  const fill = numBlocks === 2 ? colors.medium : props.fill;
                                  
                                  return (
                                    <>
                                      <Rectangle
                                        x={x}
                                        y={y}
                                        width={width}
                                        height={height}
                                        fill={fill}
                                        stroke="none"
                                        radius={[10, 10, 0, 0]}
                                      />
                                      {/* White gap line on top */}
                                      <line
                                        x1={x}
                                        y1={y}
                                        x2={x + width}
                                        y2={y}
                                stroke="white"
                                        strokeWidth={2}
                                      />
                                    </>
                                  );
                                }}
                              />
                            </>
                          );
                        })()}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Pill-style Legend at bottom */}
                  <div className="flex justify-center mt-4">
                    <div
                      className="inline-flex items-center gap-1 bg-[#F9F9F9] rounded-full px-2 py-1.5"
                      style={{ backgroundColor: "#EDEDED" }}
                    >
                      {[
                        { key: "under_review", label: "Under Review", color: "#53A697" },
                        { key: "needs_response", label: "Processing", color: "#35504D" },
                        { key: "lost", label: "Lost", color: "#ef4444" },
                        { key: "won", label: "Won", color: "#22c55e" },
                      ].map((item) => {
                        const isActive = monthStatusFilter === item.key;
                        return (
                          <button
                            key={item.key}
                            onClick={() => setMonthStatusFilter(isActive ? "all" : item.key)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-all ${
                              isActive
                                ? "bg-white shadow-sm font-medium text-gray-900"
                                : "text-gray-500 hover:text-gray-700"
                            }`}
                          >
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          </ChartCard>

          {/* Disputes by Processor */}
          <ChartCard
            title={t("dashboard.disputesByProcessor")}
            icon={BarChart3}
            description={formatDateRangeForDisplay()}
            badge={<Info className="h-4 w-4 text-muted-foreground" />}
            badgeDesc={t("dashboard.disputesByProcessorDesc")}
            className="bg-[#F9F9F9]"
            actions={
              <div className="flex gap-0.5 bg-[#ededed] p-1 rounded-lg border shadow-sm">
                <Button
                  variant={processorViewMode === "value" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setProcessorViewMode("value")}
                  className={`${
                    processorViewMode === "value"
                      ? "bg-white text-[#1F2937] font-semibold shadow-sm hover:bg-white"
                      : "bg-transparent text-[#6B7280] font-normal hover:text-[#4B5563] hover:bg-transparent"
                  } transition-all`}
                >
                  {t("dashboard.byValue")}
                </Button>
                <Button
                  variant={processorViewMode === "count" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setProcessorViewMode("count")}
                  className={`${
                    processorViewMode === "count"
                      ? "bg-white text-[#1F2937] font-semibold shadow-sm hover:bg-white"
                      : "bg-transparent text-[#6B7280] font-normal hover:text-[#4B5563] hover:bg-transparent"
                  } transition-all`}
                >
                  {t("dashboard.byQuantity")}
                </Button>
              </div>
            }
          >
            <div className="bg-white border border-[#EFEFF0] rounded-lg p-6">
              {disputesByProcessor.length === 0 ? (
                <div className="flex items-center justify-center h-[280px]">
                  <EmptyGraph />
                </div>
              ) : (
                <>
                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={(() => {
                          const filteredData =
                            processorFilter === "all"
                              ? disputesByProcessor
                              : disputesByProcessor.filter((item: any) => item.name === processorFilter);
                          
                          // Calculate max value for the current dataset
                          const maxValue = Math.max(
                            ...filteredData.map((item: any) =>
                              processorViewMode === "value" ? Number(item.amount || 0) : Number(item.count || 0)
                            ),
                            1 // Prevent division by zero
                          );

                          return filteredData.map((item: any) => {
                            const value =
                              processorViewMode === "value" ? Number(item.amount || 0) : Number(item.count || 0);
                            
                            // Calculate percentage relative to max value
                            const percentage = (value / maxValue) * 100;
                            
                            // Determine number of blocks based on percentage
                            let numBlocks = 1;
                            if (percentage > 70) {
                              numBlocks = 3;
                            } else if (percentage > 35) {
                              numBlocks = 2;
                            }
                            
                            // Get color scheme for this processor
                            const colors = PROCESSOR_COLOR_SCHEMES[item.name] || PROCESSOR_COLOR_SCHEMES.default;
                            
                            // Distribute value across blocks proportionally
                            let tier_bottom = 0, tier_middle = 0, tier_top = 0;
                            
                            if (numBlocks === 1) {
                              tier_bottom = value;
                              tier_middle = 0;
                              tier_top = 0;
                            } else if (numBlocks === 2) {
                              tier_bottom = value / 2;
                              tier_middle = 0;
                              tier_top = value / 2;
                            } else {
                              tier_bottom = value / 3;
                              tier_middle = value / 3;
                              tier_top = value / 3;
                            }
                            
                            return {
                              ...item,
                              tier_bottom,
                              tier_middle,
                              tier_top,
                              numBlocks,
                              originalValue: value,
                              colors, // Add color scheme to data
                            };
                          });
                        })()}
                        barCategoryGap="30%"
                        margin={{ left: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                        <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis
                          stroke="#9ca3af"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          width={65}
                          tickFormatter={(value) =>
                            processorViewMode === "value"
                              ? `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                              : value
                          }
                        />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const dataPoint = payload[0]?.payload;
                              if (!dataPoint) return null;
                              const displayValue = processorViewMode === "value" ? dataPoint.amount : dataPoint.count;
                              const colors = dataPoint.colors || PROCESSOR_COLOR_SCHEMES.default;
                              return (
                                <div className="bg-white border border-[#E5E7EB] rounded-lg shadow-md p-3 min-w-[180px]">
                                  <div className="flex items-center gap-2 text-[#6B7280]">
                                    <BarChart3 className="h-4 w-4" />
                                    <span className="text-sm">{dataPoint.name}</span>
                                  </div>
                                  <div className="border-b border-[#E5E7EB] my-2" />
                                  <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-4 rounded-sm" style={{ backgroundColor: colors.dark }} />
                                    <span className="text-[#1F2937] text-sm">
                                      {processorViewMode === "value"
                                        ? t("dashboard.value")
                                        : t("dashboard.quantity")}
                                      :{" "}
                                      <span className="font-bold">
                                        {processorViewMode === "value"
                                          ? `$${Number(displayValue || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                          : displayValue || 0}
                                      </span>
                                    </span>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        {/* Dynamic stacked bars with adaptive blocks - each processor has its own color */}
                        <Bar
                          dataKey="tier_bottom"
                          stackId="stack"
                          maxBarSize={80}
                          shape={(props: any) => {
                            const { x, y, width, height, payload } = props;
                            if (!height || height <= 0) return null;
                            
                            const numBlocks = payload.numBlocks;
                            const colors = payload.colors || PROCESSOR_COLOR_SCHEMES.default;
                            let radius: [number, number, number, number] = [0, 0, 0, 0];
                            
                            // Apply radius based on block configuration
                            if (numBlocks === 1) {
                              radius = [10, 10, 10, 10]; // All corners rounded
                            } else {
                              radius = [0, 0, 10, 10]; // Bottom corners rounded
                            }
                            
                            return (
                              <>
                                {/* Main block without bottom border */}
                                <Rectangle
                                  x={x}
                                  y={y}
                                  width={width}
                                  height={height}
                                  fill={colors.dark}
                                  stroke="none"
                                  radius={radius}
                                />
                                {/* Top border only (for blocks above) */}
                                {numBlocks > 1 && (
                                  <line
                                    x1={x}
                                    y1={y}
                                    x2={x + width}
                                    y2={y}
                          stroke="white"
                                    strokeWidth={2}
                                  />
                                )}
                              </>
                            );
                          }}
                        />
                        <Bar
                          dataKey="tier_middle"
                          stackId="stack"
                          maxBarSize={80}
                          shape={(props: any) => {
                            const { x, y, width, height, payload, value } = props;
                            // Don't render if value is 0 (only for 1 or 2 block configurations)
                            if (!value || value <= 0) return null;
                            
                            const colors = payload.colors || PROCESSOR_COLOR_SCHEMES.default;
                            
                            return (
                              <>
                                <Rectangle
                                  x={x}
                                  y={y}
                                  width={width}
                                  height={height}
                                  fill={colors.medium}
                                  stroke="none"
                                  radius={[0, 0, 0, 0]}
                                />
                                {/* White gap line on top */}
                                <line
                                  x1={x}
                                  y1={y}
                                  x2={x + width}
                                  y2={y}
                          stroke="white"
                                  strokeWidth={2}
                                />
                              </>
                            );
                          }}
                        />
                        <Bar
                          dataKey="tier_top"
                          stackId="stack"
                          maxBarSize={80}
                          shape={(props: any) => {
                            const { x, y, width, height, payload, value } = props;
                            if (!value || value <= 0) return null;
                            
                            const numBlocks = payload.numBlocks;
                            const colors = payload.colors || PROCESSOR_COLOR_SCHEMES.default;
                            
                            // For 2-block config, use medium color; for 3-block, use light color
                            const fill = numBlocks === 2 ? colors.medium : colors.light;
                            
                            return (
                              <>
                                <Rectangle
                                  x={x}
                                  y={y}
                                  width={width}
                                  height={height}
                                  fill={fill}
                                  stroke="none"
                                  radius={[10, 10, 0, 0]}
                                />
                                {/* White gap line on top */}
                                <line
                                  x1={x}
                                  y1={y}
                                  x2={x + width}
                                  y2={y}
                          stroke="white"
                                  strokeWidth={2}
                                />
                              </>
                            );
                          }}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Pill-style Legend at bottom */}
                  <div className="flex justify-center mt-4">
                    <div
                      className="inline-flex items-center gap-1 bg-[#F9F9F9] rounded-full px-2 py-1.5"
                      style={{ backgroundColor: "#EDEDED" }}
                    >
                      {disputesByProcessor.map((item: any) => {
                        const isActive = processorFilter === item.name;
                        const colors = PROCESSOR_COLOR_SCHEMES[item.name] || PROCESSOR_COLOR_SCHEMES.default;
                        return (
                          <button
                            key={item.name}
                            onClick={() => setProcessorFilter(isActive ? "all" : item.name)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-all ${
                              isActive
                                ? "bg-white shadow-sm font-medium text-gray-900"
                                : "text-gray-500 hover:text-gray-700"
                            }`}
                          >
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.dark }} />
                            {item.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          </ChartCard>

          {/* Disputes by Category */}
          {/* <ChartCard
            title="Disputas por Categoria"
            description={formatDateRangeForDisplay()}
            badge={<Info className="h-3 w-3 text-muted-foreground" />}
            actions={
              <Tabs value={categoryViewMode} onValueChange={(v) => setCategoryViewMode(v as "value" | "count")} className="w-auto">
                <TabsList>
                  <TabsTrigger value="value">Por valor</TabsTrigger>
                  <TabsTrigger value="count">Por quantidade</TabsTrigger>
                </TabsList>
              </Tabs>
            }
          >
            <div className="flex items-center justify-between">
              <div className="space-y-3 flex-1">
                {disputesByCategory.map((item: any, index: number) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: index === 0 ? COLORS.primary : COLORS.secondary }}
                      />
                      <span className="text-sm">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      {categoryViewMode === "value" && (
                        <span className="text-sm font-medium">{item.amount || `US$ ${item.value}`}</span>
                      )}
                      {categoryViewMode === "count" && (
                        <span className="text-sm text-muted-foreground">{item.value}%</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="ml-8">
                <div className="relative w-40 h-40 flex items-center justify-center">
                  <svg viewBox="0 0 100 100" className="transform -rotate-90">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke={COLORS.primary}
                      strokeWidth="12"
                      strokeDasharray="226 251"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke={COLORS.secondary}
                      strokeWidth="12"
                      strokeDasharray="25 251"
                      strokeDashoffset="-226"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-lg font-bold">
                      {categoryViewMode === "value" 
                        ? "US$ 0"
                        : "0%"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {categoryViewMode === "value" ? "Valor total" : "Total"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ChartCard> */}

          {/* Disputes by Card Network */}
          <ChartCard
            title={t("dashboard.disputesByNetwork")}
            icon={BarChart3}
            description={formatDateRangeForDisplay()}
            badge={<Info className="h-3 w-3 text-muted-foreground" />}
            badgeDesc={t("dashboard.disputesByNetworkDesc")}
            className="bg-[#F9F9F9]"
            actions={
              <div className="flex bg-[#ededed] rounded-lg p-1 gap-0.5 border shadow-sm">
                <button
                  onClick={() => setCardNetworkViewMode("value")}
                  className={`px-5 py-2 text-sm transition-all rounded-md ${
                    cardNetworkViewMode === "value"
                      ? "bg-white text-[#1F2937] font-semibold shadow-sm"
                      : "bg-transparent text-[#6B7280] font-normal hover:text-[#4B5563]"
                  }`}
                >
                  {t("dashboard.byValue")}
                </button>
                <button
                  onClick={() => setCardNetworkViewMode("count")}
                  className={`px-5 py-2 text-sm transition-all rounded-md ${
                    cardNetworkViewMode === "count"
                      ? "bg-white text-[#1F2937] font-semibold shadow-sm"
                      : "bg-transparent text-[#6B7280] font-normal hover:text-[#4B5563]"
                  }`}
                >
                  {t("dashboard.byQuantity")}
                </button>
              </div>
            }
          >
            {(() => {
              const R = 40;
              const strokeWidth = 10;
              const C = 2 * Math.PI * R;
              const metricKey = cardNetworkViewMode === "value" ? "amount" : "count";

              const safeData = (disputesByCardNetwork || []).map((d: any) => ({
                ...d,
                amount: Number(d.amount || 0),
                count: Number(d.count || 0),
              }));

              const total = safeData.reduce((s: number, it: any) => s + (it[metricKey] || 0), 0);

              if (safeData.length === 0) {
                return (
                  <div className="flex items-center justify-center min-h-[300px] p-6 rounded-lg border border-[#EFEFF0] bg-white">
                    <EmptyGraph />
                  </div>
                );
              }

              return (
                <div className="flex flex-col md:flex-row items-center justify-between gap-8 p-6 rounded-lg border border-[#EFEFF0] bg-white min-h-[300px] animate-fade-in">
                  {/* Legend on the left */}
                  <div className="space-y-5 flex-1 w-full md:w-auto">
                    {safeData.map((item: any, index: number) => {
                      const fill = REASON_COLORS[index % REASON_COLORS.length];
                      return (
                        <div 
                          key={index} 
                          className="flex items-center justify-between gap-4 animate-fade-in"
                          style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'backwards' }}
                        >
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-3 h-3 rounded-sm animate-scale-in" 
                              style={{ backgroundColor: fill, animationDelay: `${index * 100 + 50}ms`, animationFillMode: 'backwards' }} 
                            />
                            <span className="text-sm text-muted-foreground">{item.name}</span>
                          </div>
                          <div className="flex items-center">
                            {cardNetworkViewMode === "value" ? (
                              <span className="text-sm font-semibold text-foreground">
                                $
                                {item.amount?.toLocaleString("en-US", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                }) || "0.00"}
                              </span>
                            ) : (
                              <span className="text-sm font-semibold text-foreground">{item.count}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Donut chart on the right */}
                  <div className="flex-shrink-0">
                    <div className="relative w-64 h-64 flex items-center justify-center group">
                      <svg 
                        viewBox="0 0 100 100" 
                        className="transform -rotate-90 w-full h-full"
                        onMouseLeave={() => setHoveredNetworkSegment(null)}
                      >
                        {total > 0 &&
                          (() => {
                            let currentOffset = 0;
                            const gap = 1.5;

                            return safeData.map((item: any, index: number) => {
                              const val = Math.max(0, item[metricKey] || 0);
                              const segmentLength = (val / total) * C;
                              const visibleLength = Math.max(0, segmentLength - gap);
                              const segmentOffset = -currentOffset - gap / 2;

                              const segmentColor = REASON_COLORS[index % REASON_COLORS.length];
                              const element = (
                                <g 
                                  key={item.name ?? index} 
                                  className="cursor-pointer"
                                  style={{
                                    opacity: 0,
                                    animation: `fade-in 0.5s ease-out forwards`,
                                    animationDelay: `${index * 120}ms`,
                                  }}
                                >
                                  {/* White stroke outline for separation */}
                                  <circle
                                    cx="50"
                                    cy="50"
                                    r={R}
                                    fill="none"
                                    stroke="white"
                                    strokeWidth={strokeWidth + 2}
                                    strokeDasharray={`${segmentLength} ${C - segmentLength}`}
                                    strokeDashoffset={-currentOffset}
                                    strokeLinecap="butt"
                                  />
                                  {/* Colored segment */}
                                  <circle
                                    cx="50"
                                    cy="50"
                                    r={R}
                                    fill="none"
                                    stroke={segmentColor}
                                    strokeWidth={strokeWidth}
                                    strokeDasharray={`${visibleLength} ${C - visibleLength}`}
                                    strokeDashoffset={segmentOffset}
                                    strokeLinecap="butt"
                                    className="transition-all duration-300 hover:opacity-80"
                                    onMouseEnter={(e) => {
                                      const rect = (e.target as SVGCircleElement).ownerSVGElement?.getBoundingClientRect();
                                      if (rect) {
                                        setHoveredNetworkSegment({
                                          name: item.name,
                                          value: val,
                                          color: segmentColor,
                                          x: e.clientX - rect.left,
                                          y: e.clientY - rect.top,
                                        });
                                      }
                                    }}
                                    onMouseMove={(e) => {
                                      const rect = (e.target as SVGCircleElement).ownerSVGElement?.getBoundingClientRect();
                                      if (rect) {
                                        setHoveredNetworkSegment((prev) => prev ? {
                                          ...prev,
                                          x: e.clientX - rect.left,
                                          y: e.clientY - rect.top,
                                        } : null);
                                      }
                                    }}
                                    onMouseLeave={() => setHoveredNetworkSegment(null)}
                                  />
                                </g>
                              );

                              currentOffset += segmentLength;
                              return element;
                            });
                          })()}
                      </svg>

                      {/* Tooltip */}
                      {hoveredNetworkSegment && (
                        <div 
                          className="absolute bg-white border border-[#E5E7EB] rounded-lg shadow-md p-3 min-w-[160px] pointer-events-none z-50"
                          style={{
                            left: hoveredNetworkSegment.x + 10,
                            top: hoveredNetworkSegment.y - 40,
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-4 rounded-sm" style={{ backgroundColor: hoveredNetworkSegment.color }} />
                            <span className="text-[#1F2937] text-sm">
                              {hoveredNetworkSegment.name}:{" "}
                              <span className="font-bold">
                                {cardNetworkViewMode === "value"
                                  ? `$${hoveredNetworkSegment.value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                  : hoveredNetworkSegment.value}
                              </span>
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Center total */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none animate-scale-in" style={{ animationDelay: '400ms', animationFillMode: 'backwards' }}>
                        <div className="text-[16px] font-medium text-gray-900">
                          {cardNetworkViewMode === "value"
                            ? `$${total?.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}`
                            : total}
                        </div>
                        <div className="text-[14px] font-normal text-slate-500 mt-1">
                          {cardNetworkViewMode === "value" ? t("dashboard.totalValue_lower") : "Total"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </ChartCard>

          {/* Disputes by Country */}
          <ChartCard
            title={t("dashboard.disputesByCountry")}
            icon={BarChart3}
            description={t("dashboard.topCountries")}
            badge={<Info className="h-4 w-4 text-muted-foreground" />}
            className="bg-[#F9F9F9]"
            badgeDesc={t("dashboard.disputesByCountryDesc")}
          >
            <div className="bg-white border border-[#EFEFF0] rounded-lg p-3">
              <div className={disputesByCountry.length === 0 ? "h-[274px]" : ""}>
                {disputesByCountry.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <EmptyGraph />
                  </div>
                ) : (
                  <div 
                    className="h-[280px] overflow-y-auto relative"
                    style={disputesByCountry.length >= 4 && isCountriesAtTop ? {
                      maskImage: 'linear-gradient(180deg, black 65%, rgba(0,0,0,0.5) 90%, transparent 100%)',
                      WebkitMaskImage: 'linear-gradient(180deg, black 65%, rgba(0,0,0,0.5) 90%, transparent 100%)'
                    } : undefined}
                    role="list"
                    aria-label={t("dashboard.disputesByCountry")}
                    onScroll={(e) => {
                      const target = e.currentTarget;
                      const THRESHOLD = 8;
                      const atTop = target.scrollTop <= THRESHOLD;
                      
                      // Atualizar estado apenas se houver mudança
                      if (atTop && !isCountriesAtTop) {
                        setIsCountriesAtTop(true);
                      } else if (!atTop && isCountriesAtTop) {
                        setIsCountriesAtTop(false);
                      }
                    }}
                  >
                  <table className="w-full">
                      <thead className="sticky top-0 bg-white z-10">
                      <tr className="border-b border-[#E5E7EB]">
                          <th className="text-left py-3 text-sm font-semibold text-[#6B7280]">
                          {t("dashboard.country")}
                        </th>
                          <th className="text-center py-3 text-sm font-semibold text-[#6B7280]">
                          {t("sidebar.disputes")}
                        </th>
                          <th className="text-center py-3 text-sm font-semibold text-[#6B7280]">
                            {t("dashboard.value")}
                        </th>
                          <th className="text-right py-3 text-sm font-semibold text-[#6B7280]">
                          {t("dashboard.winRate")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                        {disputesByCountry.map((item: any, index: number) => {
                          const shouldDim = disputesByCountry.length >= 4 && index === 3 && isCountriesAtTop;
                          const reducedPadding = disputesByCountry.length >= 4;
                          return (
                            <tr 
                              key={index} 
                              className="border-b border-[#F3F4F6] last:border-b-0 cursor-pointer hover:bg-slate-50"
                              style={{ 
                                opacity: shouldDim ? 0.75 : 1,
                                transition: 'opacity 0.12s ease'
                              }}
                              role="listitem"
                              tabIndex={0}
                              aria-label={`${stripFlagEmoji(item.country || item.pais || '')}, ${item.count} ${t("sidebar.disputes")}, ${usd.format(parseAmount(item.amount))}`}
                              onClick={() => handleCountryRowClick(item)}
                              onKeyDown={(event) => handleCountryRowKeyDown(event, item)}
                            >
                              <td className={reducedPadding ? "py-3" : "py-5"}>
                            <div className="flex items-center gap-3">
                              <span className="w-8 h-8 flex items-center justify-center rounded-full bg-[#F3F4F6] text-lg">
                                {countryCodeToFlag(item.code)}
                              </span>
                              <span className="text-sm font-medium text-[#1F2937]">{stripFlagEmoji(item.country || item.pais || '')}</span>
                            </div>
                          </td>
                              <td className={`${reducedPadding ? "py-3" : "py-5"} text-center text-sm font-medium text-[#1F2937]`}>
                            {Number(item.count ?? 0)}
                          </td>
                              <td className={`${reducedPadding ? "py-3" : "py-5"} text-center text-sm font-medium text-[#1F2937]`}>
                            {usd.format(parseAmount(item.amount))}
                          </td>
                              <td className={`${reducedPadding ? "py-3" : "py-5"} text-right text-sm font-medium text-[#1F2937]`}>
                            {typeof item.winRate === "number" ? `${item.winRate}%` : item.winRate ?? "0%"}
                          </td>
                        </tr>
                          );
                        })}
                    </tbody>
                  </table>
                  </div>
                )}
              </div>
            </div>
          </ChartCard>
        </div>
      </div>

      <Dialog open={countryOrdersModalOpen} onOpenChange={setCountryOrdersModalOpen}>
        <DialogContent className="max-w-6xl">
          <DialogHeader>
            <DialogTitle>
              {t("dashboard.countryOrdersTitle")}{" "}
              {selectedCountry ? `- ${selectedCountry.name}` : ""}
            </DialogTitle>
            <DialogDescription>
              {t("dashboard.countryOrdersDescription")}
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              {t("dashboard.countryOrdersCount", { count: countryOrders.length })}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCountryOrders}
              disabled={!countryOrders.length}
            >
              <Download className="h-4 w-4 mr-2" />
              {t("dashboard.countryOrdersExport")}
            </Button>
          </div>

          <div className="border rounded-lg">
            <div className="overflow-auto max-h-[60vh]">
              {countryOrders.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  {t("dashboard.countryOrdersEmpty")}
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-muted text-muted-foreground">
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold whitespace-nowrap">
                        {t("dashboard.countryOrdersOrderId")}
                      </th>
                      <th className="text-left px-4 py-3 font-semibold">
                        {t("dashboard.countryOrdersProduct")}
                      </th>
                      <th className="text-left px-4 py-3 font-semibold">
                        {t("dashboard.countryOrdersCustomer")}
                      </th>
                      <th className="text-left px-4 py-3 font-semibold">
                        {t("dashboard.countryOrdersAddress")}
                      </th>
                      <th className="text-left px-4 py-3 font-semibold">
                        {t("dashboard.countryOrdersTracking")}
                      </th>
                      <th className="text-left px-4 py-3 font-semibold">
                        {t("dashboard.countryOrdersAmount")}
                      </th>
                      <th className="text-left px-4 py-3 font-semibold">
                        {t("dashboard.countryOrdersDate")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {countryOrders.map((order: any) => {
                      const customerName =
                        order?.shipping_address?.name ||
                        [order?.customer?.first_name, order?.customer?.last_name]
                          .filter(Boolean)
                          .join(" ") ||
                        order?.billing_address?.name ||
                        "-";

                      return (
                        <tr key={order?.id || order?.name} className="border-t">
                          <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">
                            {order?.name || order?.id || "-"}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {getOrderProducts(order)}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {customerName}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {formatOrderAddress(order)}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {getOrderTrackingNumber(order)}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {formatOrderAmount(order)}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {formatOrderDate(order)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={credentialsModalOpen} onOpenChange={setCredentialsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Credenciais criadas</DialogTitle>
            <DialogDescription>
              Guarde o e-mail e a senha temporária para acessar o sistema. Recomendamos alterar a senha assim que possível.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-md border p-3 bg-muted/50">
              <p className="text-sm text-muted-foreground">E-mail</p>
              <p className="font-medium break-all">{credentialsData.email}</p>
            </div>
            <div className="rounded-md border p-3 bg-muted/50">
              <p className="text-sm text-muted-foreground">Senha temporária</p>
              <p className="font-medium break-all">{credentialsData.tempPassword}</p>
            </div>
            <p className="text-sm text-muted-foreground">
              Após login, altere sua senha no perfil para manter sua conta segura.
            </p>
          </div>
        </DialogContent>
      </Dialog>

    </DashboardLayout>
  );
};

export default Index;
