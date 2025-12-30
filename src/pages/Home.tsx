import { DashboardLayout } from "@/components/DashboardLayout";
import { MetricCard } from "@/components/MetricCard";
import { ChartCard } from "@/components/ChartCard";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DateRange } from "react-day-picker";
import { format, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Rectangle } from "recharts";
import React from "react";
import { Calendar, Instagram, CircleHelp, MoreHorizontal, Gift } from "lucide-react";
import { DateRangePicker } from "@/components/DateRangePicker";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { useTrendCalculation } from "@/hooks/useTrendCalculation";

import {
  LineChart,
  Line,
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
const GREEN_SHADES = [
  "#E63946", // Vermelho - Product not received
  "#2A9D8F", // Verde - Product not as described
  "#5B21B6", // Roxo - Fraudulent
  "#3B82F6", // Azul - Subscription canceled
  "#F9C74F", // Amarelo - Credit not processed
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

const Index = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const { calculateTrend } = useTrendCalculation();
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
  const [isCountryScrollVisible, setIsCountryScrollVisible] = useState(false);

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
          console.error("Erro ao carregar dateRange do localStorage:", e);
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
  }, []);

  // O valor inicial de useState agora é null ou uma string vazia.
  const [userName, setUserName] = useState<string | null>(null);

  const loadUserData = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        return;
      }

      const { data: currentUser, error: currentUserError } = await supabase
        .from('users')
        .select('client_id')
        .eq('id', user.id)
        .single();

      if (currentUserError || !currentUser?.client_id) {
        return;
      }

      // Buscar dados locais do banco (incluindo settings_updated_at)
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('nome, settings_updated_at')
        .eq('id', currentUser.client_id)
        .single();

      if (clientError) {
        console.error("Erro ao buscar dados da empresa:", clientError);
        return;
      }

      // Buscar dados da Shopify
      let shopifyData: any = null;
      try {
        const { data, error } = await supabase.functions.invoke("shop-info");
        if (!error && data?.info?.data?.shop) {
          shopifyData = data.info.data.shop;
        }
      } catch (error) {
        console.error("Erro ao buscar dados da Shopify:", error);
      }

      // Lógica Last Write Wins
      const localUpdatedAt = clientData?.settings_updated_at ? new Date(clientData.settings_updated_at) : null;
      const shopifyUpdatedAt = shopifyData?.updated_at ? new Date(shopifyData.updated_at) : null;

      // Se dados locais são mais recentes OU não há dados da Shopify, usar dados locais
      if (localUpdatedAt && (!shopifyUpdatedAt || localUpdatedAt > shopifyUpdatedAt)) {
        setUserName(clientData.nome);
      } 
      // Se dados da Shopify são mais recentes, usar dados da Shopify
      else if (shopifyData?.shop_owner) {
        setUserName(shopifyData.shop_owner);
      }
      // Fallback para dados locais
      else if (clientData?.nome) {
        setUserName(clientData.nome);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
  };

  // CORREÇÃO 3: Chamar loadUserData() dentro de useEffect para rodar apenas uma vez na montagem
  useEffect(() => {
    loadUserData();
  }, []); // Array de dependência vazio garante que rode apenas na montagem

  // Lógica para display do nome enquanto carrega
  const displayUserName = userName || "Usuário";
  const displayFirstName = userName ? userName.split(' ')[0] : "Usuário";

  const fetchShopifyData = async (startDate?: Date, endDate?: Date) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke("shopify-disputes", {
        body: {
          startDate: startDate?.toISOString(),
          endDate: endDate?.toISOString(),
        },
      });

      if (error) {
        console.error("Erro ao buscar dados:", error);
        toast({
          title: "Erro ao carregar dados",
          description: error.message || "Não foi possível carregar os dados da Shopify",
          variant: "destructive",
        });
        return;
      }
      setDashboardData(data);
    } catch (error) {
      console.error("Erro ao buscar dados da Shopify:", error);
      toast({
        title: "Erro",
        description: "Não foi possível conectar com a API da Shopify",
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
    if (!dateRange?.from) return "Últimos 6 meses";

    const fromYear = dateRange.from.getFullYear();
    const toYear = dateRange.to?.getFullYear();
    const currentYear = new Date().getFullYear();

    if (!dateRange.to) {
      const showYear = fromYear !== currentYear;
      return format(dateRange.from, showYear ? "d 'de' MMM 'de' yyyy" : "d 'de' MMM", { locale: ptBR });
    }

    const showYear = fromYear !== currentYear || toYear !== currentYear || fromYear !== toYear;

    if (showYear) {
      return `${format(dateRange.from, "d 'de' MMM 'de' yyyy", { locale: ptBR })} a ${format(
        dateRange.to,
        "d 'de' MMM 'de' yyyy",
        { locale: ptBR },
      )}`;
    }

    return `${format(dateRange.from, "d 'de' MMM", { locale: ptBR })} a ${format(dateRange.to, "d 'de' MMM", {
      locale: ptBR,
    })}`;
  };

  // Combinar dados de todos os status quando "all" está selecionado
  const disputesByMonth =
    monthStatusFilter == "all"
      ? (() => {
          const allMonths = dashboardData?.charts?.disputesByMonth?.all || [];
          const needsResponse = dashboardData?.charts?.disputesByMonth?.needs_response || [];
          const underReview = dashboardData?.charts?.disputesByMonth?.under_review || [];
          const won = dashboardData?.charts?.disputesByMonth?.won || [];
          const lost = dashboardData?.charts?.disputesByMonth?.lost || [];

          return allMonths.map((monthData: any) => {
            const month = monthData.month;
            const needsData = needsResponse.find((d: any) => d.month === month) || { count: 0, amount: 0 };
            const reviewData = underReview.find((d: any) => d.month === month) || { count: 0, amount: 0 };
            const wonData = won.find((d: any) => d.month === month) || { count: 0, amount: 0 };
            const lostData = lost.find((d: any) => d.month === month) || { count: 0, amount: 0 };

            return {
              month,
              needs_response_count: needsData.count,
              needs_response_amount: needsData.amount,
              under_review_count: reviewData.count,
              under_review_amount: reviewData.amount,
              won_count: wonData.count,
              won_amount: wonData.amount,
              lost_count: lostData.count,
              lost_amount: lostData.amount,
            };
          });
        })()
      : dashboardData?.charts?.disputesByMonth?.[monthStatusFilter] || [];

  const disputesRateByMonth = dashboardData?.charts?.disputesRateByMonth || [];
  const availableStatuses = dashboardData?.charts?.availableStatuses || [];
  const statusLabels = dashboardData?.charts?.statusLabels || {};

  const disputeReasonTranslations: Record<string, string> = {
    "Produto não recebido": "Product not received",
    "Produto diferente do descrito": "Product not as described",
    "Crédito não processado": "Credit not processed",
    Fraudulenta: "Fraudulent",
    "Cobrança duplicada": "Duplicate charge",
    "Não recebido": "Product not received",
    "Não conforme descrito": "Product not as described",
    Fraude: "Fraudulent",
  };

  const translateDisputeReasonName = (name: string) => disputeReasonTranslations[name] || name;

  // Disputas por processador agora é um array simples com agregação por gateway
  const disputesByProcessor = dashboardData?.charts?.disputesByProcessor || [];
  const availableProcessors = dashboardData?.charts?.availableProcessors || [];

  const disputesByReason =
    dashboardData?.charts?.disputesByReason?.map((item: any) => ({
      ...item,
      name: translateDisputeReasonName(item?.name || "N/A"),
    })) ||
    [
      { name: translateDisputeReasonName("Não recebido"), value: 52, amount: "US$ 0,01 mil" },
      { name: translateDisputeReasonName("Não conforme descrito"), value: 49, amount: "US$ 1,17 mil" },
      { name: translateDisputeReasonName("Fraude"), value: 10, amount: "US$ 0,02 mil" },
    ];

  const disputesByCategory = dashboardData?.charts?.disputesByCategory || [
    { name: "Disputas em Contestações", value: 90, amount: "US$ 0 mil" },
    { name: "Fraude", value: 12, amount: "US$ 0,02 mil" },
  ];

  const disputesByCardNetwork = dashboardData?.charts?.disputesByNetwork || [
    { name: "Outro", value: 77, amount: "US$ 0 mil" },
    { name: "Visa", value: 76, amount: "US$ 0,10 mil" },
  ];

  const disputesByCountry = dashboardData?.charts?.disputesByCountry || [];

  const repeatDisputers = dashboardData?.charts?.repeatDisputers || [];

  const previousMetrics = (dashboardData as any)?.previousMetrics ?? null;
  const trends = {
    activeDisputes: calculateTrend({
      currentValue: dashboardData?.metrics?.activeDisputes,
      previousValue: previousMetrics?.activeDisputes,
      type: "negative_is_good",
    }),
    evidenceSubmitted: calculateTrend({
      currentValue: dashboardData?.metrics?.evidenceSubmitted,
      previousValue: previousMetrics?.evidenceSubmitted,
      type: "positive_is_good",
      neutralOnDecrease: true,
    }),
    underReview: calculateTrend({
      currentValue: dashboardData?.metrics?.review,
      previousValue: previousMetrics?.review,
      type: "positive_is_good",
      neutralOnDecrease: true,
    }),
    disputesRecovered: calculateTrend({
      currentValue: dashboardData?.metrics?.totalWon,
      previousValue: previousMetrics?.totalWon,
      type: "positive_is_good",
    }),
    disputesCreated: calculateTrend({
      currentValue: dashboardData?.metrics?.totalDisputes,
      previousValue: previousMetrics?.totalDisputes,
      type: "negative_is_good",
    }),
    estimatedSavings: calculateTrend({
      currentValue: parseAmount(dashboardData?.metrics?.savedTimeAmount),
      previousValue: previousMetrics ? parseAmount(previousMetrics?.savedTimeAmount) : undefined,
      type: "positive_is_good",
    }),
    winRate: calculateTrend({
      currentValue: dashboardData?.metrics?.winRate,
      previousValue: previousMetrics?.winRate,
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
        <div className="flex items-center justify-center min-h-[60vh]">
          <img src="/spinner.png" alt="Carregando" className="h-8 w-8 animate-spin animate-pulse" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout onDateRangeChange={handleDateRangeChange}>
      <div className="space-y-6">
        {/* Date Range and Filter Controls */}
        <div className="flex items-center gap-4 flex-wrap">
          <DateRangePicker onDateRangeChange={handleDateRangeChange} />
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm" className="hover:bg-[#19976F] hover:text-white">
              <Calendar className="mr-2 h-4 w-4" />
              {t("dashboard.allDisputes")}
            </Button>
            <Button variant="ghost" size="sm" className="hover:bg-[#19976F] hover:text-white">
              {t("dashboard.byChargemind")}
            </Button>
          </div>
        </div>

        {/* Top Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title={t("dashboard.activeDisputes")}
            icon={FileText}
            subtitle={t("dashboard.numberOfCases")}
            value={dashboardData?.metrics?.activeDisputes || "0"}
            valueLabel={t("dashboard.totalValue")}
            amount={dashboardData?.metrics?.activeDisputeAmount || "$0"}
            trend={trends.activeDisputes}
            badge={<Info className="h-3 w-3 text-muted-foreground" />}
            badgeDesc={
              t("sidebar.dashboard") === "Dashboard"
                ? "Quantity and monetary value of disputes started in the selected period that are still in progress."
                : "Quantidade e valor monetário das disputas iniciadas no período selecionado que ainda estão em andamento."
            }
          />
          <MetricCard
            title={t("dashboard.evidenceSubmitted")}
            icon={CheckCircle}
            subtitle={t("dashboard.numberOfCases")}
            value={dashboardData?.metrics?.evidenceSubmitted || "0"}
            valueLabel={t("dashboard.totalValue")}
            amount={`${dashboardData?.metrics?.evidenceSubmittedAmount || "0"}`}
            trend={trends.evidenceSubmitted}
            badge={<Info className="h-3 w-3 text-muted-foreground" />}
            badgeDesc={
              t("sidebar.dashboard") === "Dashboard"
                ? "Number of disputes for which ChargeMind submitted evidence during the selected period."
                : "Número de disputas para as quais a ChargeMind enviou evidências durante o período selecionado."
            }
          />
          <MetricCard
            title={t("dashboard.underReview")}
            icon={Clock}
            subtitle={t("dashboard.numberOfCases")}
            value={dashboardData?.metrics?.review || "0"}
            valueLabel={t("dashboard.totalValue")}
            amount={`${dashboardData?.metrics?.reviewAmount || "0"}`}
            trend={trends.underReview}
            badge={<Info className="h-3 w-3 text-muted-foreground" />}
            badgeDesc={
              t("sidebar.dashboard") === "Dashboard"
                ? "Disputes created in the specified period that are awaiting the bank's decision or buyer's response."
                : "Disputas criadas no período especificado que estão aguardando a decisão do banco ou a resposta do comprador."
            }
          />
          <MetricCard
            title={t("dashboard.disputesRecovered")}
            icon={TrendingUp}
            subtitle={t("dashboard.numberOfCases")}
            value={dashboardData?.metrics?.totalWon || "0"}
            valueLabel={t("dashboard.revenueRecovered")}
            amount={dashboardData?.metrics?.recoveredAmount || "$0"}
            trend={trends.disputesRecovered}
            badge={<Info className="h-3 w-3 text-muted-foreground" />}
            badgeDesc={
              t("sidebar.dashboard") === "Dashboard"
                ? "Number of disputes won in the selected period and their respective monetary value."
                : "Número de disputas vencidas no período selecionado e o respectivo valor monetário."
            }
          />
        </div>

        {/* Second Row Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title={t("dashboard.disputesCreated")}
            icon={Wallet}
            subtitle={t("dashboard.numberOfCases")}
            value={dashboardData?.metrics?.totalDisputes || "0"}
            valueLabel={t("dashboard.totalValue")}
            amount={dashboardData?.metrics?.totalDisputesAmount || "$0"}
            trend={trends.disputesCreated}
            badge={<Info className="h-3 w-3 text-muted-foreground" />}
            badgeDesc={
              t("sidebar.dashboard") === "Dashboard"
                ? "Number of disputes opened within the selected period."
                : "Quantidade de disputas abertas dentro do período selecionado."
            }
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
            value={dashboardData?.metrics?.savedTime || "0"}
            valueLabel={t("dashboard.totalMoneySaved")}
            amount={dashboardData?.metrics?.savedTimeAmount || "$0"}
            badge={<Info className="h-3 w-3 text-muted-foreground" />}
            badgeDesc={
              t("sidebar.dashboard") === "Dashboard"
                ? "Time and money saved with ChargeMind's dispute automation for disputes created in the selected period."
                : "Tempo e dinheiro economizados com a automação de disputas da ChargeMind para as disputas criadas no período selecionado."
            }
          />
          <MetricCard
            title={t("dashboard.winRate")}
            icon={Trophy}
            subtitle={t("dashboard.winRate")}
            value={`${dashboardData?.metrics?.winRate?.toFixed(1) || 0}%`}
            valueLabel={t("dashboard.valueRecoveryRate")}
            amount={`${dashboardData?.metrics?.winRateAmount?.toFixed(1) || 0}%`}
            badge={<Info className="h-3 w-3 text-muted-foreground" />}
            badgeDesc={
              t("sidebar.dashboard") === "Dashboard"
                ? "Due to chargeback procedures, wins typically take longer to confirm than losses. Therefore, the success rate is accurately reflected only three months after activating your ChargeMind account."
                : "Devido aos procedimentos de chargeback, as vitórias costumam levar mais tempo para serem confirmadas do que as perdas. Por isso, a taxa de sucesso é refletida com precisão apenas três meses após a ativação da sua conta ChargeMind."
            }
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Win Rate Trend */}

          <ChartCard
            title={t("dashboard.disputeRate")}
            description={formatDateRangeForDisplay()}
            badge={<Info className="h-4 w-4 text-muted-foreground" />}
            badgeDesc={
              t("sidebar.dashboard") === "Dashboard"
                ? "Display of Success Rate and Recovery Rate trends over the selected period, divided by processors."
                : "Exibição das tendências de Taxa de Sucesso e Taxa de Recuperação ao longo do período selecionado, divididas por processadores."
            }
          >
            <div className="-ml-9 h-[240px]">
              {disputesRateByMonth.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-muted-foreground text-center">
                    <i>{t("sidebar.dashboard") === "Dashboard" ? "No data to display" : "Não há dados para exibir"}</i>
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={disputesRateByMonth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="month"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      interval={0}
                      padding={{ right: 30, left: 30 }}
                    />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      name={
                        rateViewMode === "value"
                          ? t("sidebar.dashboard") === "Dashboard"
                            ? "Rate (%)"
                            : "Taxa (%)"
                          : t("sidebar.dashboard") === "Dashboard"
                            ? "Quantity"
                            : "Quantidade"
                      }
                      dataKey={rateViewMode === "value" ? "amount" : "count"}
                      stroke="#18976f"
                      strokeWidth={2}
                      dot={{ fill: "#ffffffff" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </ChartCard>

          {/* Disputes by Reason */}
          <ChartCard
            title={t("dashboard.disputesByReason")}
            icon={BarChart3}
            description={formatDateRangeForDisplay()}
            badge={<Info className="h-4 w-4 text-muted-foreground" />}
            badgeDesc={
              t("sidebar.dashboard") === "Dashboard"
                ? "Breakdown of disputes by reason during the specified period."
                : "Segmentação das disputas por motivo durante o período especificado."
            }
            className="bg-[#F9F9F9]"
            actions={
              <div className="flex gap-0.5 bg-[#ededed] p-1 rounded-lg border shadow-sm">
                <Button
                  variant={reasonViewMode === "value" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setReasonViewMode("value")}
                  className={`${
                    reasonViewMode === "value"
                      ? "bg-white text-[#1F2937] font-semibold shadow-sm hover:bg-white"
                      : "bg-transparent text-[#6B7280] font-normal hover:text-[#4B5563] hover:bg-transparent"
                  } transition-all`}
                >
                  {t("dashboard.byValue")}
                </Button>
                <Button
                  variant={reasonViewMode === "count" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setReasonViewMode("count")}
                  className={`${
                    reasonViewMode === "count"
                      ? "bg-white text-[#1F2937] font-semibold shadow-sm hover:bg-white"
                      : "bg-transparent text-[#6B7280] font-normal hover:text-[#4B5563] hover:bg-transparent"
                  } transition-all`}
                >
                  {t("dashboard.byQuantity")}
                </Button>
              </div>
            }
          >
            <HorizontalProgressBars
              data={disputesByReason || []}
              mode={reasonViewMode}
              emptyMessage={t("sidebar.dashboard") === "Dashboard" ? "No data to display" : "Não há dados para exibir"}
            />
          </ChartCard>

          {/* Disputes by Month */}
          <ChartCard
            title={t("dashboard.disputesByMonth")}
            icon={BarChart3}
            description={formatDateRangeForDisplay()}
            badge={<Info className="h-4 w-4 text-muted-foreground" />}
            badgeDesc={
              t("sidebar.dashboard") === "Dashboard"
                ? "Display of dispute statuses during the selected period. Click on a status to filter."
                : "Exibição dos status das disputas durante o período selecionado. Clique em um status para filtrar."
            }
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
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 flex-wrap">
                  {availableStatuses.map((status) => {
                    if (status === "all") return null;
                    const isActive = monthStatusFilter === status;
                    return (
                      <Button
                        key={status}
                        variant={isActive ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setMonthStatusFilter(status)}
                        className={
                          isActive
                            ? "h-7 text-xs !bg-[#F5F7F8] !text-[#1f2937] hover:!bg-[#cfd2df]"
                            : "h-7 text-xs hover:bg-[#eef0f6] hover:text-[#1f2937]"
                        }
                      >
                        {statusLabels[status] || status}
                      </Button>
                    );
                  })}
                </div>
              </div>

              <div className="-ml-9 h-[240px]">
                {disputesByMonth.length === 0 ? (
                  <div className="flex items-center justify-center h-full -mt-4">
                    <p className="text-sm text-muted-foreground text-center">
                      <i>
                        {t("sidebar.dashboard") === "Dashboard" ? "No data to display" : "Não há dados para exibir"}
                      </i>
                    </p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={disputesByMonth}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis
                        dataKey="month"
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        padding={{ right: 30, left: 30 }}
                      />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip />
                      <Bar
                        name={
                          monthViewMode === "value"
                            ? t("sidebar.dashboard") === "Dashboard"
                              ? "Value"
                              : "Valor"
                            : t("sidebar.dashboard") === "Dashboard"
                              ? "Quantity"
                              : "Quantidade"
                        }
                        dataKey={monthViewMode === "value" ? "amount" : "count"}
                        radius={[8, 8, 0, 0]}
                        fill={STATUS_COLORS[monthStatusFilter as keyof typeof STATUS_COLORS] || STATUS_COLORS.all}
                        maxBarSize={100}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </ChartCard>

          {/* Disputes by Processor */}
          <ChartCard
            title={t("dashboard.disputesByProcessor")}
            icon={BarChart3}
            description={formatDateRangeForDisplay()}
            badge={<Info className="h-4 w-4 text-muted-foreground" />}
            badgeDesc={
              t("sidebar.dashboard") === "Dashboard"
                ? "Breakdown of disputes by payment processor platform during the specified period."
                : "Segmentação das disputas por plataforma de processador de pagamento durante o período especificado."
            }
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
              <div className="-ml-9 h-[220px]">
                {disputesByProcessor.length === 0 ? (
                  <div className="flex items-center justify-center h-full -mt-4">
                    <p className="text-sm text-muted-foreground text-center">
                      <i>
                        {t("sidebar.dashboard") === "Dashboard" ? "No data to display" : "Não há dados para exibir"}
                      </i>
                    </p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={disputesByProcessor.map((item: any) => ({
                      ...item,
                      tier1: processorViewMode === "value" ? item.amount * 0.5 : item.count * 0.5,
                      tier2: processorViewMode === "value" ? item.amount * 0.3 : item.count * 0.3,
                      tier3: processorViewMode === "value" ? item.amount * 0.2 : item.count * 0.2,
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis
                        dataKey="name"
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        padding={{ right: 30, left: 30 }}
                      />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))" 
                        fontSize={12}
                        tickFormatter={(value) => processorViewMode === "value" ? `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : value}
                      />
                      <Tooltip
                        formatter={(value: any, name: any) => {
                          if (processorViewMode === "value") {
                            return [`$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, name];
                          }
                          return [Math.round(value), name];
                        }}
                      />
                      <Bar
                        name="Base"
                        dataKey="tier1"
                        stackId="a"
                        fill="#35504D"
                        stroke="white"
                        strokeWidth={1}
                        radius={[0, 0, 8, 8]}
                        maxBarSize={80}
                      />
                      <Bar
                        name="Middle"
                        dataKey="tier2"
                        stackId="a"
                        fill="#5a7a76"
                        stroke="white"
                        strokeWidth={1}
                        radius={[0, 0, 0, 0]}
                        maxBarSize={80}
                      />
                      <Bar
                        name="Top"
                        dataKey="tier3"
                        stackId="a"
                        fill="#8aa5a1"
                        stroke="white"
                        strokeWidth={1}
                        radius={[8, 8, 0, 0]}
                        maxBarSize={80}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
              
              {/* Custom Legend - same as Disputes by Month */}
              <div className="bg-[#F9F9F9] rounded-full p-1 flex items-center gap-1 mt-4 w-fit mx-auto">
                {[
                  { key: "under_review", label: "Under Review", labelPt: "Em análise", color: "#53A697" },
                  { key: "needs_response", label: "Processing", labelPt: "Processando", color: "#35504D" },
                  { key: "lost", label: "Lost", labelPt: "Perda", color: "#ef4444" },
                  { key: "won", label: "Won", labelPt: "Ganho", color: "#22c55e" },
                ].map((item) => {
                  const isActive = processorFilter === item.key;
                  return (
                    <button
                      key={item.key}
                      onClick={() => setProcessorFilter(item.key)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        isActive
                          ? "bg-white shadow-sm text-[#1F2937]"
                          : "text-[#6B7280] hover:text-[#4B5563]"
                      }`}
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      {t("sidebar.dashboard") === "Dashboard" ? item.label : item.labelPt}
                    </button>
                  );
                })}
              </div>
            </div>
          </ChartCard>

          {/* Disputes by Category */}
          {/* <ChartCard
            title="Disputas por Categoria"
            description={formatDateRangeForDisplay()}
            badge={<Info className="h-4 w-4 text-muted-foreground" />}
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
            badge={<Info className="h-4 w-4 text-muted-foreground" />}
            badgeDesc={
              t("sidebar.dashboard") === "Dashboard"
                ? "Breakdown of disputes by card network during the specified period."
                : "Segmentação das disputas por bandeira do cartão durante o período especificado."
            }
            className="bg-[#F9F9F9]"
            actions={
              <div className="flex gap-0.5 bg-[#ededed] p-1 rounded-lg border shadow-sm">
                <Button
                  variant={cardNetworkViewMode === "value" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setCardNetworkViewMode("value")}
                  className={`${
                    cardNetworkViewMode === "value"
                      ? "bg-white text-[#1F2937] font-semibold shadow-sm hover:bg-white"
                      : "bg-transparent text-[#6B7280] font-normal hover:text-[#4B5563] hover:bg-transparent"
                  } transition-all`}
                >
                  {t("dashboard.byValue")}
                </Button>
                <Button
                  variant={cardNetworkViewMode === "count" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setCardNetworkViewMode("count")}
                  className={`${
                    cardNetworkViewMode === "count"
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
              {(() => {
                const R = 36;
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
                    <div className="flex items-center justify-center h-[300px]">
                      <p className="text-sm text-muted-foreground text-center">
                        <i>
                          {t("sidebar.dashboard") === "Dashboard" ? "No data to display" : "Não há dados para exibir"}
                        </i>
                      </p>
                    </div>
                  );
                }

                let acc = 0;
                return (
                  <div className="flex items-center justify-between gap-16 py-6">
                    {/* Legenda/lista */}
                    <div className="space-y-4 flex-1">
                      {safeData.map((item: any, index: number) => {
                        const fill = GREEN_SHADES[index % GREEN_SHADES.length];
                        return (
                          <div key={index} className="flex items-center justify-between gap-8">
                            <div className="flex items-center gap-3">
                              <div className="w-4 h-4 rounded" style={{ backgroundColor: fill }} />
                              <span className="text-base text-foreground">{item.name}</span>
                            </div>
                            <div className="flex items-center">
                              {cardNetworkViewMode === "value" ? (
                                <span className="text-base font-semibold text-foreground">
                                  $
                                  {item.amount?.toLocaleString("en-US", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  }) || "0.00"}
                                </span>
                              ) : (
                                <span className="text-base font-semibold text-foreground">{item.count}</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Donut */}
                    <div className="flex-shrink-0">
                      <div className="relative w-72 h-72 flex items-center justify-center">
                        <svg viewBox="0 0 100 100" className="transform -rotate-90">
                          {/* White background circle */}
                          <circle cx="50" cy="50" r={R} fill="none" stroke="white" strokeWidth="18" />
                          {total > 0 &&
                            safeData.map((item: any, index: number) => {
                              const val = Math.max(0, item[metricKey] || 0);
                              const seg = (val / total) * C;
                              const gap = 2.5;
                              const dash = Math.max(0, seg - gap);
                              const offset = -acc;
                              acc += seg;

                              const stroke = GREEN_SHADES[index % GREEN_SHADES.length];

                              return (
                                <circle
                                  key={item.name ?? index}
                                  cx="50"
                                  cy="50"
                                  r={R}
                                  fill="none"
                                  stroke={stroke}
                                  strokeWidth="16"
                                  strokeDasharray={`${dash} ${C - dash}`}
                                  strokeDashoffset={offset}
                                  strokeLinecap="round"
                                />
                              );
                            })}
                        </svg>

                        {/* total no centro */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <div className="text-3xl font-bold text-foreground">
                            {cardNetworkViewMode === "value"
                              ? `$${total?.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}`
                              : total}
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {cardNetworkViewMode === "value" ? t("dashboard.totalValue_lower") : "Total"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </ChartCard>

          {/* Disputes by Country */}
          <ChartCard
            title={t("dashboard.disputesByCountry")}
            description={t("sidebar.dashboard") === "Dashboard" ? "Top countries" : "Top países"}
            badge={<Info className="h-4 w-4 text-muted-foreground" />}
            badgeDesc={
              t("sidebar.dashboard") === "Dashboard"
                ? "Breakdown of disputes by country during the specified period."
                : "Segmentação das disputas por país durante o período especificado."
            }
          >
            <div className={disputesByCountry.length === 0 ? "h-[240px]" : ""}>
              {disputesByCountry.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-muted-foreground text-center">
                    <i>{t("sidebar.dashboard") === "Dashboard" ? "No data to display" : "Não há dados para exibir"}</i>
                  </p>
                </div>
              ) : (
                <div
                  className={`h-[280px] overflow-y-auto relative country-scroll-ghost ${isCountryScrollVisible ? 'show-scroll' : ''}`}
                  onClick={() => setIsCountryScrollVisible(!isCountryScrollVisible)}
                  role="list"
                  aria-label="Disputes by Country"
                  style={{
                    maskImage: 'linear-gradient(black 65%, rgba(0, 0, 0, 0.5) 90%, transparent 100%)',
                    WebkitMaskImage: 'linear-gradient(black 65%, rgba(0, 0, 0, 0.5) 90%, transparent 100%)',
                  }}
                >
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#E5E7EB]">
                        <th className="text-left py-4 text-sm font-semibold text-[#6B7280]">{t("dashboard.country")}</th>
                        <th className="text-center py-4 text-sm font-semibold text-[#6B7280]">{t("sidebar.disputes")}</th>
                        <th className="text-center py-4 text-sm font-semibold text-[#6B7280]">
                          {t("sidebar.dashboard") === "Dashboard" ? "Value" : "Valor"}
                        </th>
                        <th className="text-right py-4 text-sm font-semibold text-[#6B7280]">{t("dashboard.winRate")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {disputesByCountry.map((item: any, index: number) => (
                        <tr key={index} className="border-b border-[#F3F4F6] last:border-b-0">
                          <td className="py-5">
                            <div className="flex items-center gap-3">
                              <span className="w-8 h-8 flex items-center justify-center rounded-full bg-[#F3F4F6] text-lg">
                                {countryCodeToFlag(item.code)}
                              </span>
                              <span className="text-sm font-medium text-[#1F2937]">{stripFlagEmoji(item.country || item.pais || '')}</span>
                            </div>
                          </td>
                          <td className="py-5 text-center text-sm font-medium text-[#1F2937]">{Number(item.count ?? 0)}</td>
                          <td className="py-5 text-center text-sm font-medium text-[#1F2937]">{usd.format(parseAmount(item.amount))}</td>
                          <td className="py-5 text-right text-sm font-medium text-[#1F2937]">
                            {typeof item.winRate === "number" ? `${item.winRate}%` : item.winRate ?? "0%"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </ChartCard>
          
          {/* Ghost Scrollbar CSS */}
          <style>{`
            /* Base scrollbar styling - fixed width to prevent layout shifts */
            .country-scroll-ghost::-webkit-scrollbar {
              width: 6px;
            }
            
            .country-scroll-ghost::-webkit-scrollbar-track {
              background: transparent;
            }
            
            .country-scroll-ghost::-webkit-scrollbar-thumb {
              background: transparent;
              border-radius: 10px;
              transition: background 0.2s ease-in-out;
            }
            
            /* Desktop: Show scrollbar on hover */
            @media (hover: hover) and (pointer: fine) {
              .country-scroll-ghost:hover::-webkit-scrollbar-thumb {
                background: #D1D5DB;
              }
              
              .country-scroll-ghost::-webkit-scrollbar-thumb:hover {
                background: #9CA3AF;
              }
            }
            
            /* Mobile: Show scrollbar when .show-scroll class is active */
            @media (hover: none) or (pointer: coarse) {
              .country-scroll-ghost.show-scroll::-webkit-scrollbar-thumb {
                background: #D1D5DB;
              }
            }
            
            /* Firefox support */
            .country-scroll-ghost {
              scrollbar-width: thin;
              scrollbar-color: transparent transparent;
            }
            
            @media (hover: hover) and (pointer: fine) {
              .country-scroll-ghost:hover {
                scrollbar-color: #D1D5DB transparent;
              }
            }
            
            @media (hover: none) or (pointer: coarse) {
              .country-scroll-ghost.show-scroll {
                scrollbar-color: #D1D5DB transparent;
              }
            }
          `}</style>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;

