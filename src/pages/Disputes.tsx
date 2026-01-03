import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchInput } from "@/components/SearchInput";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { differenceInDays, parseISO, subMonths, format } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import { DateRangePicker } from "@/components/DateRangePicker";
import { DateRange } from "react-day-picker";
import { DisputeDetailsModal } from "@/components/DisputeDetailsModal";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileSpreadsheet, FileText, FileDown } from "lucide-react";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Filter,
  Loader,
  CalendarDays,
  ShieldQuestion,
  Landmark,
  Download,
  ListCheck,
  MessageCircleQuestion,
  DollarSign,
  Copy,
  ChevronLeft,
  Info,
  X,
} from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/safeClient";
import { useMockDataContext } from "@/contexts/MockDataContext";
import { getMockDisputesData } from "@/data/mockDisputesData";

import { Calendar } from "lucide-react";
import { FaStripe, FaShopify, FaPaypal, FaCreditCard } from "react-icons/fa";

const statusColors = {
  // Azul (Fundo #eaf6ff -> Borda #D0E6FF)
  needs_response: "bg-[#eaf6ff] text-blue-600 border-[#D0E6FF] font-normal",

  // Bege/Amarelo (Fundo #fbf3e9 -> Borda #E6DBCB)
  under_review: "bg-[#fbf3e9] text-yellow-600 border-[#E6DBCB] font-normal",

  // Verde (Fundo #E7F7EE -> Borda #C8EBD5)
  won: "bg-[#E7F7EE] text-green-600 border-[#C8EBD5] font-normal",

  // Vermelho (Fundo #FEE7E7 -> Borda #FCD0D0)
  lost: "bg-[#FEE7E7] text-red-600 border-[#FCD0D0] font-normal",
};

const statusLabels = {
  needs_response: "Optimize Dispute",
  under_review: "Under Bank Review",
  won: "Won",
  lost: "Lost",
};

export default function Disputes() {
  const { t, i18n } = useTranslation();
  const { useMockData, mockChargebackRate } = useMockDataContext();
  const [selectedTab, setSelectedTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [deadlineFilters, setDeadlineFilters] = useState<string[]>([]);
  const [reasonFilters, setReasonFilters] = useState<string[]>([]);
  const [gatewayFilters, setGatewayFilters] = useState<string[]>([]);
  const [amountRangeFilters, setAmountRangeFilters] = useState<string[]>([]);
  const [selectedFilterCategory, setSelectedFilterCategory] = useState("status");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => ({
    from: subMonths(new Date(), 6),
    to: new Date(),
  }));
  const [copiedId, setCopiedId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const [selectedDispute, setSelectedDispute] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDisputes, setSelectedDisputes] = useState<string[]>([]);
  const [selectAllGlobal, setSelectAllGlobal] = useState(false);

  const clearSelection = () => {
    setSelectedDisputes([]);
    setSelectAllGlobal(false);
  };

  const handleSelectAllGlobal = () => {
    setSelectAllGlobal(true);
    // Seleciona todos os IDs das disputas filtradas (todas as páginas)
    setSelectedDisputes(allFilteredDisputes.map((d: any) => d.id));
  };

  const copyToClipboard = (text: string, label: string) => {
    const translatedLabel = label === t("disputes.disputeId") ? t("disputes.disputeIdCopied") : t("disputes.orderIdCopied");
    toast.success(translatedLabel);
    // Cria um textarea temporário
    const el = document.createElement("textarea");
    el.value = text;
    el.setAttribute("readonly", "");
    el.style.position = "absolute";
    el.style.left = "-9999px"; // Move-o para fora do ecrã
    document.body.appendChild(el);

    // Seleciona e copia
    el.select();
    document.execCommand("copy");

    // Remove o elemento
    document.body.removeChild(el);

    // Ativa o feedback visual
    setCopiedId(text as any);
    // Remove o feedback após 2 segundos
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  const {
    data: disputesData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["shopify-disputes", dateRange, useMockData],
    queryFn: async () => {
      // Check if using mock data
      if (useMockData) {
        console.log("Disputes: Using mock data mode");
        return getMockDisputesData({ healthAccount: mockChargebackRate ?? undefined });
      }
      
      console.log("Disputes: Using production mode - fetching real data");
      const { data, error } = await supabase.functions.invoke("shopify-disputes", {
        body: {
          startDate: dateRange?.from?.toISOString(),
          endDate: dateRange?.to?.toISOString(),
        },
      });
      if (error) throw error;

      console.log("Disputes: Received real data:", data?.metrics);
      
      return data;
    },
  });

  const disputeReasonLabels = {
    bank_not_process: "Bank Failure",
    credit_not_processed: "Credit Not Processed",
    customer_initiated: "Customer Initiated",
    debit_not_authorized: "Unauthorized Debit",
    duplicate: "Duplicate Charge",
    fraudulent: "Fraudulent",
    general: "Other",
    incorrect_account_details: "Incorrect Account Details",
    insufficient_funds: "Insufficient Funds",
    product_not_received: "Product Not Received",
    product_unacceptable: "Product Not as Described",
    subscription_canceled: t("disputes.subscriptionCanceled"),
    unrecognized: "Unrecognized Payment",
  };

  const getReasonLabel = (reason: string) => disputeReasonLabels[reason] || reason;

  const gatewayLogos = {
    shopify_payments: {
      logo: <FaShopify />,
      bgClass: "bg-[#FAFAFA]",
      textClass: "text-[#90BA45]",
    },
    stripe: {
      logo: <FaStripe />,
      bgClass: "bg-[#FAFAFA]",
      textClass: "text-[#6961FF]",
    },
    paypal: {
      logo: <FaPaypal />,
      bgClass: "bg-[#FAFAFA]",
      textClass: "text-[#12378C]",
    },
    default: {
      logo: <FaCreditCard />,
      bgClass: "bg-gray-400/10",
      textClass: "text-gray-700",
    },
  };

  const disputes = disputesData?.rawData?.disputes || [];
  const metrics = disputesData?.metrics || {};

  // Extrair gateways únicos das disputas
  const uniqueGateways = Array.from(new Set(disputes.map((d: any) => d.gateway).filter(Boolean)));

  // Função para formatar nome do gateway
  const formatGatewayName = (gateway: string) => {
    return gateway
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  // Calcular diferença de dias entre data atual e evidence_due_by
  const calculateDaysRemaining = (evidenceDueBy: string | null) => {
    if (!evidenceDueBy) return null;
    try {
      const dueDate = parseISO(evidenceDueBy);
      const today = new Date();
      const daysRemaining = differenceInDays(dueDate, today);
      return daysRemaining;
    } catch (error) {
      console.error("Error calculating remaining days:", error);
      return null;
    }
  };

  // Filter disputes based on selected tab, search, and status filters
  const allFilteredDisputes = disputes
    .filter((dispute: any) => {
      let matchesTab = false;
      if (selectedTab === "all") {
        matchesTab = true;
      } else if (selectedTab === "open") {
        matchesTab = dispute.status !== "lost" && dispute.status !== "won";
      } else {
        matchesTab = dispute.status === selectedTab;
      }

      const matchesSearch =
        searchQuery === "" ||
        (dispute.id && dispute.id.toString().includes(searchQuery)) ||
        (dispute.order_id && dispute.order_id.toString().includes(searchQuery)) ||
        (dispute.pedidoId && dispute.pedidoId.toString().includes(searchQuery)) ||
        (dispute.amount && dispute.amount.toString().includes(searchQuery)) ||
        (dispute.original_amount && dispute.original_amount.toString().includes(searchQuery));

      const matchesStatusFilter =
        statusFilters.length === 0 || statusFilters.includes("all") || statusFilters.includes(dispute.status);

      // Filter by deadline
      let matchesDeadlineFilter = true;
      if (deadlineFilters.length > 0) {
        const daysRemaining = calculateDaysRemaining(dispute.evidence_due_by);
        if (daysRemaining !== null) {
          matchesDeadlineFilter = deadlineFilters.some((filter) => {
            if (filter === "1-3") return daysRemaining >= 1 && daysRemaining <= 3;
            if (filter === "4-7") return daysRemaining >= 4 && daysRemaining <= 7;
            if (filter === "7+") return daysRemaining > 7;
            return false;
          });
        } else {
          matchesDeadlineFilter = false;
        }
      }

      // Filter by reason
      const matchesReasonFilter = reasonFilters.length === 0 || reasonFilters.includes(dispute.reason);

      // Filter by gateway
      const matchesGatewayFilter = gatewayFilters.length === 0 || gatewayFilters.includes(dispute.gateway);

      // Filter by amount range
      let matchesAmountFilter = true;
      if (amountRangeFilters.length > 0) {
        const amount = parseFloat(dispute.original_amount ?? dispute.amount ?? "0") || 0;
        matchesAmountFilter = amountRangeFilters.some((filter) => {
          if (filter === "0-100") return amount >= 0 && amount <= 100;
          if (filter === "100-500") return amount > 100 && amount <= 500;
          if (filter === "500-1000") return amount > 500 && amount <= 1000;
          if (filter === "1000-5000") return amount > 1000 && amount <= 5000;
          if (filter === "5000+") return amount > 5000;
          return false;
        });
      }

      return (
        matchesTab &&
        matchesSearch &&
        matchesStatusFilter &&
        matchesDeadlineFilter &&
        matchesReasonFilter &&
        matchesGatewayFilter &&
        matchesAmountFilter
      );
    })
    .map((dispute) => {
      const statusLabels = getReasonLabel(dispute.reason);
      return {
        ...dispute,
        reason_desc: statusLabels,
        reasonTranslated: statusLabels,
      };
    });

  // Pagination logic
  const totalPages = Math.ceil(allFilteredDisputes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const filteredDisputes = allFilteredDisputes.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedTab, searchQuery, statusFilters, deadlineFilters, reasonFilters, gatewayFilters, amountRangeFilters]);

  const toggleStatusFilter = (status: string) => {
    setStatusFilters((prev) => (prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]));
  };

  const toggleDeadlineFilter = (deadline: string) => {
    setDeadlineFilters((prev) => (prev.includes(deadline) ? prev.filter((d) => d !== deadline) : [...prev, deadline]));
  };

  const toggleReasonFilter = (reason: string) => {
    setReasonFilters((prev) => (prev.includes(reason) ? prev.filter((r) => r !== reason) : [...prev, reason]));
  };

  const toggleGatewayFilter = (gateway: string) => {
    setGatewayFilters((prev) => (prev.includes(gateway) ? prev.filter((g) => g !== gateway) : [...prev, gateway]));
  };

  const toggleAmountRangeFilter = (range: string) => {
    setAmountRangeFilters((prev) => (prev.includes(range) ? prev.filter((r) => r !== range) : [...prev, range]));
  };

  // Handle date range change
  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
    if (range?.from && range?.to) {
      refetch();
    }
  };

  // Export functions
  const getExportData = () => {
    // Se selectAllGlobal estiver ativo, exporta todas as disputas filtradas
    // Se houver disputas selecionadas, exporta apenas elas
    // Caso contrário, exporta todas as disputas filtradas
    const disputesToExport = selectAllGlobal
      ? allFilteredDisputes
      : selectedDisputes.length > 0
        ? allFilteredDisputes.filter((d: any) => selectedDisputes.includes(d.id))
        : allFilteredDisputes;

    return disputesToExport.map((dispute: any) => ({
      [t("disputes.gatewayColumn")]: formatGatewayName(dispute.gateway || ""),
      [t("disputes.orderId")]: dispute.pedidoId,
      [t("disputes.disputeId")]: dispute.id,
      [t("disputes.dateColumn")]: format(new Date(dispute.initiated_at), "dd/MM/yyyy"),
      [t("disputes.amount")]: `${dispute.original_amount ?? dispute.amount} ${dispute.currency ?? ""}`,
      [t("disputes.reasonColumn")]: dispute.reason_desc,
      [t("disputes.statusColumn")]: statusLabels[dispute.status as keyof typeof statusLabels] || dispute.status,
    }));
  };

  const exportToCSV = () => {
    const data = getExportData();
    if (data.length === 0) {
      toast.error(t("disputes.noDataToExport"));
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(","),
      ...data.map((row) => headers.map((h) => `"${row[h] || ""}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `disputas_${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    toast.success(t("disputes.exportSuccess") || "Exportação concluída!");
  };

  const exportToXLSX = () => {
    const data = getExportData();
    if (data.length === 0) {
      toast.error(t("disputes.noDataToExport"));
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, t("disputes.title"));
    XLSX.writeFile(workbook, `disputas_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
    toast.success(t("disputes.exportSuccess"));
  };

  const exportToPDF = () => {
    const data = getExportData();
    if (data.length === 0) {
      toast.error(t("disputes.noDataToExport"));
      return;
    }

    const doc = new jsPDF({ orientation: "landscape" });
    const headers = Object.keys(data[0]);
    const rows = data.map((row) => headers.map((h) => row[h] || ""));

    doc.setFontSize(16);
    doc.text(t("disputes.pdfReportTitle"), 14, 15);
    doc.setFontSize(10);
    doc.text(`${t("disputes.pdfGeneratedAt")} ${format(new Date(), "dd/MM/yyyy HH:mm")}`, 14, 22);

    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: 28,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [25, 151, 111] },
    });

    doc.save(`disputas_${format(new Date(), "yyyy-MM-dd")}.pdf`);
    toast.success(t("disputes.exportSuccess"));
  };

  // Sync tabs with status filters
  useEffect(() => {
    const activeFilters = statusFilters.filter((f) => f !== "all");

    if (activeFilters.length === 0 || statusFilters.includes("all")) {
      setSelectedTab("all");
    } else if (activeFilters.length === 1) {
      setSelectedTab(activeFilters[0]);
    } else {
      setSelectedTab("all");
    }
  }, [statusFilters]);

  // Calculate pipeline counts
  const needsResponseCount = disputes.filter((d: any) => d.status === "needs_response").length;
  const underReviewCount = disputes.filter((d: any) => d.status === "under_review").length;
  const totalPipeline = needsResponseCount + underReviewCount;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader title={t("disputes.title")} subtitle={t("disputes.subtitle")} />

        <div className="space-y-6">
          {/* Tabs */}
          <div className="border-b border-border">
            <Tabs value={selectedTab} onValueChange={setSelectedTab}>
              <TabsList className="bg-transparent h-auto p-0 space-x-6">
                <TabsTrigger
                  value="all"
                  className="border-b-[3px] border-transparent data-[state=active]:border-[#38CC92] rounded-none bg-transparent pb-3"
                >
                  {t("disputes.allDisputes")}
                </TabsTrigger>
                <TabsTrigger
                  value="needs_response"
                  className="border-b-[3px] border-transparent data-[state=active]:border-[#38CC92] rounded-none bg-transparent pb-3"
                >
                  {t("disputes.preparingDefense")}
                </TabsTrigger>
                <TabsTrigger
                  value="under_review"
                  className="border-b-[3px] border-transparent data-[state=active]:border-[#38CC92] rounded-none bg-transparent pb-3"
                >
                  {t("disputes.bankReview")}
                </TabsTrigger>
                <TabsTrigger
                  value="won"
                  className="border-b-[3px] border-transparent data-[state=active]:border-[#38CC92] rounded-none bg-transparent pb-3"
                >
                  {t("disputes.won")}
                </TabsTrigger>
                <TabsTrigger
                  value="lost"
                  className="border-b-[3px] border-transparent data-[state=active]:border-[#38CC92] rounded-none bg-transparent pb-3"
                >
                  {t("disputes.lost")}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Filters and Search */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 hover:bg-[#F1F1F1] hover:text-black">
                    <Filter className="h-4 w-4" />
                    {t("disputes.filter")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[600px] p-0" align="start">
                  <div className="flex h-[400px]">
                    {/* Left sidebar - Categories */}
                    <div className="w-[250px] border-r border-border bg-muted/30">
                      <div className="p-4 space-y-1">
                        <button
                          onClick={() => setSelectedFilterCategory("status")}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                            selectedFilterCategory === "status"
                              ? "bg-background text-foreground"
                              : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                          }`}
                        >
                          <Loader className="h-4 w-4" />
                          {t("disputes.status")}
                        </button>
                        <button
                          onClick={() => setSelectedFilterCategory("prazo_resposta")}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                            selectedFilterCategory === "prazo_resposta"
                              ? "bg-background text-foreground"
                              : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                          }`}
                        >
                          <CalendarDays className="h-4 w-4" />
                          {t("disputes.deadlineResponse")}
                        </button>
                        <button
                          onClick={() => setSelectedFilterCategory("motivo")}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                            selectedFilterCategory === "motivo"
                              ? "bg-background text-foreground"
                              : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                          }`}
                        >
                          <MessageCircleQuestion className="h-4 w-4" />
                          {t("disputes.reason")}
                        </button>
                        <button
                          onClick={() => setSelectedFilterCategory("processador")}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                            selectedFilterCategory === "processador"
                              ? "bg-background text-foreground"
                              : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                          }`}
                        >
                          <Landmark className="h-4 w-4" />
                          {t("disputes.gateway")}
                        </button>
                        {/* <button
                        onClick={() => setSelectedFilterCategory("situacao")}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                          selectedFilterCategory === "situacao" 
                            ? "bg-background text-foreground" 
                            : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                        }`}
                      >
                        <ListCheck className="h-4 w-4" />
                        Situação
                      </button> */}
                        <button
                          onClick={() => setSelectedFilterCategory("valor")}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                            selectedFilterCategory === "valor"
                              ? "bg-background text-foreground"
                              : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                          }`}
                        >
                          <DollarSign className="h-4 w-4" />
                          {t("disputes.value")}
                        </button>
                        <button
                          onClick={() => setSelectedFilterCategory("estado")}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                            selectedFilterCategory === "estado"
                              ? "bg-background text-foreground"
                              : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                          }`}
                        >
                          <ShieldQuestion className="h-4 w-4" />
                          {t("disputes.state")}
                        </button>
                      </div>
                    </div>

                    {/* Right content - Filter options */}
                    <div className="flex-1 p-4 overflow-y-auto">
                      {selectedFilterCategory === "status" && (
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="all"
                              checked={statusFilters.includes("all")}
                              onCheckedChange={() => {
                                if (statusFilters.includes("all")) {
                                  setStatusFilters([]);
                                } else {
                                  setStatusFilters(["all"]);
                                }
                              }}
                            />
                            <label htmlFor="all" className="text-sm cursor-pointer">
                              {t("disputes.allDisputesFilter")}
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="needs_response"
                              checked={statusFilters.includes("needs_response")}
                              onCheckedChange={() => {
                                setStatusFilters((prev) => prev.filter((s) => s !== "all"));
                                toggleStatusFilter("needs_response");
                              }}
                            />
                            <label htmlFor="needs_response" className="text-sm cursor-pointer">
                              {t("disputes.preparingDefense")}
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="under_review"
                              checked={statusFilters.includes("under_review")}
                              onCheckedChange={() => {
                                setStatusFilters((prev) => prev.filter((s) => s !== "all"));
                                toggleStatusFilter("under_review");
                              }}
                            />
                            <label htmlFor="under_review" className="text-sm cursor-pointer">
                              {t("disputes.bankReview")}
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="won"
                              checked={statusFilters.includes("won")}
                              onCheckedChange={() => {
                                setStatusFilters((prev) => prev.filter((s) => s !== "all"));
                                toggleStatusFilter("won");
                              }}
                            />
                            <label htmlFor="won" className="text-sm cursor-pointer">
                              {t("disputes.won")}
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="lost"
                              checked={statusFilters.includes("lost")}
                              onCheckedChange={() => {
                                setStatusFilters((prev) => prev.filter((s) => s !== "all"));
                                toggleStatusFilter("lost");
                              }}
                            />
                            <label htmlFor="lost" className="text-sm cursor-pointer">
                              {t("disputes.lost")}
                            </label>
                          </div>
                        </div>
                      )}

                      {selectedFilterCategory === "prazo_resposta" && (
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="deadline-1-3"
                              checked={deadlineFilters.includes("1-3")}
                              onCheckedChange={() => toggleDeadlineFilter("1-3")}
                            />
                            <label htmlFor="deadline-1-3" className="text-sm cursor-pointer">
                              {t("disputes.days1to3")}
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="deadline-4-7"
                              checked={deadlineFilters.includes("4-7")}
                              onCheckedChange={() => toggleDeadlineFilter("4-7")}
                            />
                            <label htmlFor="deadline-4-7" className="text-sm cursor-pointer">
                              {t("disputes.days4to7")}
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="deadline-7+"
                              checked={deadlineFilters.includes("7+")}
                              onCheckedChange={() => toggleDeadlineFilter("7+")}
                            />
                            <label htmlFor="deadline-7+" className="text-sm cursor-pointer">
                              {t("disputes.daysMore7")}
                            </label>
                          </div>
                        </div>
                      )}

                      {selectedFilterCategory === "motivo" && (
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="product_not_received"
                              checked={reasonFilters.includes("product_not_received")}
                              onCheckedChange={() => toggleReasonFilter("product_not_received")}
                            />
                            <label htmlFor="product_not_received" className="text-sm cursor-pointer">
                              {t("disputes.notReceived")}
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="product_unacceptable"
                              checked={reasonFilters.includes("product_unacceptable")}
                              onCheckedChange={() => toggleReasonFilter("product_unacceptable")}
                            />
                            <label htmlFor="product_unacceptable" className="text-sm cursor-pointer">
                              {t("disputes.differentFromDescribed")}
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="credit_not_processed"
                              checked={reasonFilters.includes("credit_not_processed")}
                              onCheckedChange={() => toggleReasonFilter("credit_not_processed")}
                            />
                            <label htmlFor="credit_not_processed" className="text-sm cursor-pointer">
                              {t("disputes.creditNotProcessed")}
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="duplicate"
                              checked={reasonFilters.includes("duplicate")}
                              onCheckedChange={() => toggleReasonFilter("duplicate")}
                            />
                            <label htmlFor="duplicate" className="text-sm cursor-pointer">
                              {t("disputes.duplicateCharge")}
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="debit_not_authorized"
                              checked={reasonFilters.includes("debit_not_authorized")}
                              onCheckedChange={() => toggleReasonFilter("debit_not_authorized")}
                            />
                            <label htmlFor="debit_not_authorized" className="text-sm cursor-pointer">
                              {t("disputes.unauthorizedCharge")}
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="subscription_canceled"
                              checked={reasonFilters.includes("subscription_canceled")}
                              onCheckedChange={() => toggleReasonFilter("subscription_canceled")}
                            />
                            <label htmlFor="subscription_canceled" className="text-sm cursor-pointer">
                              {t("disputes.subscriptionCanceled")}
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="fraudulent"
                              checked={reasonFilters.includes("fraudulent")}
                              onCheckedChange={() => toggleReasonFilter("fraudulent")}
                            />
                            <label htmlFor="fraudulent" className="text-sm cursor-pointer">
                              {t("disputes.fraudulent")}
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="unrecognized"
                              checked={reasonFilters.includes("unrecognized")}
                              onCheckedChange={() => toggleReasonFilter("unrecognized")}
                            />
                            <label htmlFor="unrecognized" className="text-sm cursor-pointer">
                              {t("disputes.unrecognized")}
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="general"
                              checked={reasonFilters.includes("general")}
                              onCheckedChange={() => toggleReasonFilter("general")}
                            />
                            <label htmlFor="general" className="text-sm cursor-pointer">
                              {t("disputes.other")}
                            </label>
                          </div>
                        </div>
                      )}

                      {selectedFilterCategory === "processador" && (
                        <div className="space-y-3">
                          {uniqueGateways.length > 0 ? (
                            uniqueGateways.map((gateway: string) => (
                              <div key={gateway} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`gateway-${gateway}`}
                                  checked={gatewayFilters.includes(gateway)}
                                  onCheckedChange={() => toggleGatewayFilter(gateway)}
                                />
                                <label htmlFor={`gateway-${gateway}`} className="text-sm cursor-pointer">
                                  {formatGatewayName(gateway)}
                                </label>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground">{t("disputes.noGatewayAvailable")}</p>
                          )}
                        </div>
                      )}

                      {selectedFilterCategory === "situacao" && (
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="situacao"
                              checked={statusFilters.includes("situacao")}
                              onCheckedChange={() => toggleStatusFilter("situacao")}
                            />
                            <label htmlFor="situacao" className="text-sm cursor-pointer">
                              {t("disputes.managedByChargemind")}
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="situacao"
                              checked={statusFilters.includes("situacao")}
                              onCheckedChange={() => toggleStatusFilter("situacao")}
                            />
                            <label htmlFor="situacao" className="text-sm cursor-pointer">
                              {t("disputes.notManagedByChargemind")}
                            </label>
                          </div>
                        </div>
                      )}

                      {selectedFilterCategory === "valor" && (
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="amount-0-100"
                              checked={amountRangeFilters.includes("0-100")}
                              onCheckedChange={() => toggleAmountRangeFilter("0-100")}
                            />
                            <label htmlFor="amount-0-100" className="text-sm cursor-pointer">
                              {t("disputes.range0to100")}
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="amount-100-500"
                              checked={amountRangeFilters.includes("100-500")}
                              onCheckedChange={() => toggleAmountRangeFilter("100-500")}
                            />
                            <label htmlFor="amount-100-500" className="text-sm cursor-pointer">
                              {t("disputes.range100to500")}
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="amount-500-1000"
                              checked={amountRangeFilters.includes("500-1000")}
                              onCheckedChange={() => toggleAmountRangeFilter("500-1000")}
                            />
                            <label htmlFor="amount-500-1000" className="text-sm cursor-pointer">
                              {t("disputes.range500to1000")}
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="amount-1000-5000"
                              checked={amountRangeFilters.includes("1000-5000")}
                              onCheckedChange={() => toggleAmountRangeFilter("1000-5000")}
                            />
                            <label htmlFor="amount-1000-5000" className="text-sm cursor-pointer">
                              {t("disputes.range1000to5000")}
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="amount-5000+"
                              checked={amountRangeFilters.includes("5000+")}
                              onCheckedChange={() => toggleAmountRangeFilter("5000+")}
                            />
                            <label htmlFor="amount-5000+" className="text-sm cursor-pointer">
                              {t("disputes.rangeMore5000")}
                            </label>
                          </div>
                        </div>
                      )}

                      {selectedFilterCategory === "estado" && (
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="processamento"
                              checked={statusFilters.includes("processamento")}
                              onCheckedChange={() => toggleStatusFilter("processamento")}
                            />
                            <label htmlFor="processamento" className="text-sm cursor-pointer">
                              {t("disputes.managedByChargemind")}
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="processamento"
                              checked={statusFilters.includes("processamento")}
                              onCheckedChange={() => toggleStatusFilter("processamento")}
                            />
                            <label htmlFor="processamento" className="text-sm cursor-pointer">
                              {t("disputes.notManagedByChargemind")}
                            </label>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              <DateRangePicker onDateRangeChange={handleDateRangeChange} />
            </div>

            {/* 2. NOVO GRUPO DA DIREITA (Pesquisa + Export) */}
            <div className="flex items-center gap-4">
              {/* 2a. Bloco de Pesquisa (movido para aqui) */}
              <div className="max-w-md">
                {" "}
                {/* Removido 'flex-1' e 'items-right' que era inválido */}
                <SearchInput
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder={t("disputes.searchPlaceholder")}
                  inputClassName="w-80"
                />
              </div>

              {/* 2b. Menu de Exportar */}
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 hover:bg-[#F1F1F1] hover:text-black">
                    <Download className="h-4 w-4" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-white z-50">
                  <DropdownMenuItem onClick={() => exportToCSV()} className="cursor-pointer gap-2 hover:bg-[#F9F9F9]">
                    <FileText className="h-4 w-4" />
                    CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => exportToXLSX()} className="cursor-pointer gap-2 hover:bg-[#F9F9F9]">
                    <FileSpreadsheet className="h-4 w-4" />
                    XLSX (Excel)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => exportToPDF()} className="cursor-pointer gap-2 hover:bg-[#F9F9F9]">
                    <FileDown className="h-4 w-4" />
                    PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Bulk Selection Bar - appears between filters and table */}
          <div
            className={`flex items-center justify-between gap-4 px-4 py-3 rounded-lg border transition-all duration-200 ${
              selectedDisputes.length > 0
                ? "bg-[#F0FDF4] border-[#86EFAC] opacity-100 h-auto"
                : "bg-transparent border-transparent opacity-0 h-0 py-0 overflow-hidden"
            }`}
          >
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-[#166534]">
                {selectAllGlobal
                  ? `${allFilteredDisputes.length} ${t("disputes.itemsSelected")}`
                  : `${selectedDisputes.length} ${t("disputes.itemsSelected")}`}
              </span>
              {!selectAllGlobal &&
                selectedDisputes.length === filteredDisputes.length &&
                allFilteredDisputes.length > filteredDisputes.length && (
                  <button
                    onClick={handleSelectAllGlobal}
                    className="text-sm font-medium text-[#059669] hover:text-[#047857] hover:underline"
                  >
                    {`${t("disputes.selectAllItems")} (${allFilteredDisputes.length})`}
                  </button>
                )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSelection}
              className="gap-2 text-[#166534] hover:bg-[#DCFCE7] hover:text-[#166534]"
            >
              <X className="h-4 w-4" />
              {t("disputes.cancelSelection")}
            </Button>
          </div>

          {/* Table */}
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <Table className="min-w-max">
                <TableHeader className="bg-[#F9F9F9]">
                  <TableRow className="hover:bg-[#F9F9F9] whitespace-nowrap">
                    <TableHead className="w-12">
                      <Checkbox
                        checked={
                          selectAllGlobal ||
                          (selectedDisputes.length === filteredDisputes.length && filteredDisputes.length > 0)
                        }
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedDisputes(filteredDisputes.map((d: any) => d.id));
                          } else {
                            setSelectedDisputes([]);
                            setSelectAllGlobal(false);
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead className="text-center normal-case">{t("disputes.gatewayColumn")}</TableHead>
                    <TableHead className="normal-case">{t("disputes.orderId")}</TableHead>
                    <TableHead className="normal-case">{t("disputes.disputeId")}</TableHead>
                    {/* <TableHead >CLIENTE</TableHead> */}
                    <TableHead className="normal-case">{t("disputes.dateColumn")}</TableHead>
                    <TableHead className="normal-case">{t("disputes.amount")}</TableHead>
                    <TableHead className="normal-case">{t("disputes.reasonColumn")}</TableHead>
                    {/* <TableHead>SCORE</TableHead> */}
                    {(selectedTab === "needs_response" || statusFilters.includes("needs_response")) && (
                      <TableHead className="normal-case">{t("disputes.deadlineColumn")}</TableHead>
                    )}
                    <TableHead className="text-center normal-case">{t("disputes.managedBy")}</TableHead>
                    <TableHead className="text-center normal-case">{t("disputes.statusColumn")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8">
                        <div className="flex items-center justify-center">
                          <img src="/spinner.png" alt="Loading" className="h-8 w-8 animate-spin animate-pulse" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredDisputes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                        {t("disputes.noDisputes")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredDisputes.map((dispute, index) => {
                      const gatewayInfo = gatewayLogos[dispute.gateway] || gatewayLogos.default;
                      return (
                        <TableRow
                          key={dispute.id}
                          className={`whitespace-nowrap hover:bg-[#f2f9f6] ${selectedDisputes.includes(dispute.id) ? "bg-[#effff8]" : ""}`}
                        >
                          <TableCell>
                            <Checkbox
                              checked={selectedDisputes.includes(dispute.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedDisputes((prev) => [...prev, dispute.id]);
                                } else {
                                  setSelectedDisputes((prev) => prev.filter((id) => id !== dispute.id));
                                }
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-center">
                              <div className="h-6 w-6 rounded-full bg-red-500/10 flex items-center justify-center">
                                <div
                                  className={`
                                  h-8 w-8 rounded 
                                  ${gatewayInfo.bgClass}
                                  flex items-center justify-center text-center
                                `}
                                >
                                  <span className={`${gatewayInfo.textClass} text-xl`}>{gatewayInfo.logo}</span>
                                </div>
                              </div>
                            </div>
                          </TableCell>

                          {/* O RESTO DAS SUAS CÉLULAS (que estavam fora do map) */}
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <span
                                className="text-primary cursor-pointer hover:underline"
                                onClick={() => {
                                  setSelectedDispute(dispute);
                                  setIsModalOpen(true);
                                }}
                              >
                                {dispute.pedidoId}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 hover:bg-[#F1F1F1] hover:text-black"
                                onClick={() => copyToClipboard(dispute.pedidoId, t("disputes.orderNumber"))}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span
                                className="text-primary cursor-pointer hover:underline"
                                onClick={() => {
                                  setSelectedDispute(dispute);
                                  setIsModalOpen(true);
                                }}
                              >
                                {dispute.id}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 hover:bg-[#F1F1F1] hover:text-black"
                                onClick={() => copyToClipboard(dispute.id, t("disputes.disputeId"))}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                          {/* <TableCell>Customer {index + 1}</TableCell> */}
                          <TableCell className="text-muted-foreground">
                            {format(new Date(dispute.initiated_at), "d MMM yyyy", {
                              locale: i18n.language === "pt" ? ptBR : enUS,
                            })}
                          </TableCell>
                          <TableCell>
                            {dispute.original_amount} {dispute.currency}
                          </TableCell>
                          <TableCell className="text-muted-foreground">{dispute.reason_desc}</TableCell>

                          {(selectedTab === "needs_response" || statusFilters.includes("needs_response")) && (
                            <TableCell className="text-muted-foreground">
                              {(() => {
                                const daysRemaining = calculateDaysRemaining(dispute.evidence_due_by);
                                if (daysRemaining === null) return "-";
                                if (daysRemaining < 0) return "-";
                                if (daysRemaining === 0) return t("disputes.today");
                                if (daysRemaining === 1) {
                                  return (
                                    <Badge
                                      variant="outline"
                                      className="bg-red-500/10 text-red-600 border-red-600/20 font-normal"
                                    >
                                      1 {t("disputes.day")}
                                    </Badge>
                                  );
                                }
                                if (daysRemaining > 1 && daysRemaining <= 3) {
                                  return (
                                    <Badge
                                      variant="outline"
                                      className="bg-red-500/10 text-red-600 border-red-600/20 font-normal"
                                    >
                                      {daysRemaining} {t("disputes.days")}
                                    </Badge>
                                  );
                                }
                                return `${daysRemaining} ${t("disputes.days")}`;
                              })()}
                            </TableCell>
                          )}
                          <TableCell>
                            <div className="flex justify-center">
                              {/* <div className="h-6 w-6 rounded-full bg-red-500/10 flex items-center justify-center"> */}
                              <div className="h-6 w-6 rounded-full bg-green-500/10 flex items-center justify-center">
                                {/* <span className="text-red-600 text-xs">⚠</span> */}
                                <div className="h-6 w-6 rounded-full bg-green-500/10 flex items-center justify-center">
                                  <img src="/spinner.png" alt={t("disputes.loadingAlt")} className="h-3 w-3" />
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={statusColors[dispute.status] || ""}>
                              {statusLabels[dispute.status] || dispute.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {t("settings.showing")} {allFilteredDisputes.length > 0 ? startIndex + 1 : 0} -{" "}
              {Math.min(endIndex, allFilteredDisputes.length)} {t("settings.of")} {allFilteredDisputes.length}
            </span>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    label={t("disputes.previous")}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className={
                      currentPage === 1
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer hover:bg-[#19976F] hover:text-white"
                    }
                  />
                </PaginationItem>

                {[...Array(totalPages)].map((_, i) => {
                  const page = i + 1;
                  // Show first page, last page, current page, and pages around current
                  if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                    return (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => setCurrentPage(page)}
                          isActive={currentPage === page}
                          className="cursor-pointer hover:bg-[#19976F] hover:text-white"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  } else if (page === currentPage - 2 || page === currentPage + 2) {
                    return <PaginationItem key={page}>...</PaginationItem>;
                  }
                  return null;
                })}

                <PaginationItem>
                  <PaginationNext
                    label={t("disputes.next")}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className={
                      currentPage === totalPages
                        ? "pointer-events-none opacity-50 hover:bg-[#19976F] hover:text-white"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      </div>

      <DisputeDetailsModal open={isModalOpen} onOpenChange={setIsModalOpen} dispute={selectedDispute} />
    </DashboardLayout>
  );
}
