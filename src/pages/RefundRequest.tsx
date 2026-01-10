import { DashboardLayout } from "@/components/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  Package,
  RotateCcw,
  RefreshCw,
  AlertTriangle,
  Clock3,
  CheckCircle2,
  Store,
  CreditCard,
  ChevronRight,
  Eye,
  TrendingUp,
  Search,
} from "lucide-react";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";

// Evidence data interface
interface EvidenceData {
  photos?: string[];
  description?: string;
  checked_carrier?: boolean;
  checked_neighbors?: boolean;
  product_opened?: boolean;
  product_packaging?: string;
  family_purchase?: boolean;
  chargeback_initiated?: boolean;
}

// Request interface
interface RequestData {
  id: string;
  orderNumber: string;
  customer: string;
  email: string;
  problemType: string;
  decision: string | null;
  status: string;
  value: number;
  date: string;
  protocol: string;
  evidence?: EvidenceData;
  preferredResolution?: string;
}

// Mock data for the dashboard
const mockRequestsData = {
  problemTypes: {
    notReceived: { count: 12, value: 1450.00 },
    defect: { count: 8, value: 890.50 },
    returnExchange: { count: 5, value: 425.00 },
    chargeQuestion: { count: 3, value: 245.00 },
  },
  statusCounts: {
    pending: 8,
    inReview: 4,
    creditIssued: 3,
    refundProcessed: 1,
  },
  resolutionOutcomes: {
    storeCredit: { count: 15, value: 1875.00, savings: 187.50 },
    refund: { count: 5, value: 625.00, avgTime: "3-5 days" },
  },
  flowSteps: [
    { step: 1, name: "orderValidation", cases: 28, avgTime: "2 min" },
    { step: 2, name: "orderConfirmation", cases: 26, avgTime: "1 min" },
    { step: 3, name: "problemSelection", cases: 24, avgTime: "3 min" },
    { step: 4, name: "resolutionChoice", cases: 22, avgTime: "2 min" },
    { step: 5, name: "evidenceCollection", cases: 18, avgTime: "5 min" },
    { step: 6, name: "finalConfirmation", cases: 16, avgTime: "1 min" },
  ],
  recentRequests: [
    { 
      id: "REQ-001", 
      orderNumber: "#1234", 
      customer: "Maria Silva", 
      email: "maria@example.com",
      problemType: "notReceived", 
      decision: "credit", 
      status: "completed",
      value: 125.00,
      date: "2024-03-12",
      protocol: "CM-2024-001234",
      preferredResolution: "credit",
      evidence: {
        description: "Meu pedido foi marcado como entregue, mas não recebi nada.",
        checked_carrier: true,
        checked_neighbors: true,
        photos: ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400"]
      }
    },
    { 
      id: "REQ-002", 
      orderNumber: "#1235", 
      customer: "João Santos", 
      email: "joao@example.com",
      problemType: "defect", 
      decision: "refund", 
      status: "inReview",
      value: 89.50,
      date: "2024-03-11",
      protocol: "CM-2024-001235",
      preferredResolution: "refund",
      evidence: {
        description: "O produto chegou com defeito de fábrica.",
        product_opened: true,
        product_packaging: "original",
        photos: ["https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=400"]
      }
    },
    { 
      id: "REQ-003", 
      orderNumber: "#1236", 
      customer: "Ana Costa", 
      email: "ana@example.com",
      problemType: "returnExchange", 
      decision: "credit", 
      status: "pending",
      value: 245.00,
      date: "2024-03-10",
      protocol: "CM-2024-001236",
      preferredResolution: "credit",
      evidence: {
        description: "Gostaria de trocar o produto por outro tamanho.",
        product_opened: true,
        product_packaging: "original",
        photos: ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400"]
      }
    },
    { 
      id: "REQ-004", 
      orderNumber: "#1237", 
      customer: "Pedro Costa", 
      email: "pedro@example.com",
      problemType: "chargeQuestion", 
      decision: null, 
      status: "pending",
      value: 59.80,
      date: "2024-03-09",
      protocol: "CM-2024-001237",
      preferredResolution: "refund",
      evidence: {
        description: "Não reconheço essa cobrança no meu cartão.",
        family_purchase: false,
        chargeback_initiated: false,
      }
    },
    { 
      id: "REQ-005", 
      orderNumber: "#1238", 
      customer: "Carla Mendes", 
      email: "carla@example.com",
      problemType: "notReceived", 
      decision: "refund", 
      status: "completed",
      value: 156.40,
      date: "2024-03-08",
      protocol: "CM-2024-001238",
      preferredResolution: "refund",
      evidence: {
        description: "Pedido consta como entregue mas nunca recebi.",
        checked_carrier: true,
        checked_neighbors: true,
      }
    },
  ] as RequestData[],
};

const problemTypeIcons: Record<string, React.ElementType> = {
  notReceived: Package,
  defect: RotateCcw,
  returnExchange: RefreshCw,
  chargeQuestion: AlertTriangle,
};

const problemTypeColors: Record<string, string> = {
  notReceived: "bg-amber-50 text-amber-700",
  defect: "bg-rose-50 text-rose-700",
  returnExchange: "bg-blue-50 text-blue-700",
  chargeQuestion: "bg-purple-50 text-purple-700",
};

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  inReview: "bg-blue-100 text-blue-800",
  creditIssued: "bg-emerald-100 text-emerald-800",
  refundProcessed: "bg-gray-100 text-gray-800",
  completed: "bg-emerald-100 text-emerald-800",
};

const decisionColors: Record<string, string> = {
  credit: "bg-emerald-50 text-emerald-700",
  refund: "bg-blue-50 text-blue-700",
};

export default function RefundRequest() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredRequests = mockRequestsData.recentRequests.filter(
    (req) =>
      req.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.protocol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStatusCardClick = (status: string) => {
    navigate(`/refund-request/${status}`);
  };

  const problemCategories = [
    { 
      key: "notReceived", 
      icon: Package, 
      color: "amber",
      evidenceList: ["checkedNeighbors", "contactedCarrier", "photoDeliveryArea"]
    },
    { 
      key: "defect", 
      icon: RotateCcw, 
      color: "rose",
      evidenceList: ["photosOfDefect", "defectTypeSelected", "descriptionMin50"]
    },
    { 
      key: "returnExchange", 
      icon: RefreshCw, 
      color: "blue",
      evidenceList: ["productCondition", "originalPackaging", "reasonSelection", "photos"]
    },
    { 
      key: "chargeQuestion", 
      icon: AlertTriangle, 
      color: "purple",
      evidenceList: ["addressRecognition", "familyPurchaseCheck", "chargebackStatus"]
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader 
          title={t("refundRequestDashboard.title")} 
          subtitle={t("refundRequestDashboard.subtitle")} 
        />

        {/* Status Overview Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card 
            className="border-border cursor-pointer hover:border-primary/50 hover:shadow-md transition-all"
            onClick={() => handleStatusCardClick("pending")}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-50">
                  <Clock3 className="h-5 w-5 text-amber-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">{t("refundRequestDashboard.pending")}</p>
                  <p className="text-2xl font-bold text-foreground">{mockRequestsData.statusCounts.pending}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card 
            className="border-border cursor-pointer hover:border-primary/50 hover:shadow-md transition-all"
            onClick={() => handleStatusCardClick("inReview")}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-50">
                  <Search className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">{t("refundRequestDashboard.inReview")}</p>
                  <p className="text-2xl font-bold text-foreground">{mockRequestsData.statusCounts.inReview}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card 
            className="border-border cursor-pointer hover:border-primary/50 hover:shadow-md transition-all"
            onClick={() => handleStatusCardClick("creditIssued")}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-50">
                  <Store className="h-5 w-5 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">{t("refundRequestDashboard.creditIssued")}</p>
                  <p className="text-2xl font-bold text-foreground">{mockRequestsData.statusCounts.creditIssued}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card 
            className="border-border cursor-pointer hover:border-primary/50 hover:shadow-md transition-all"
            onClick={() => handleStatusCardClick("refundProcessed")}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gray-100">
                  <CreditCard className="h-5 w-5 text-gray-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">{t("refundRequestDashboard.refundProcessed")}</p>
                  <p className="text-2xl font-bold text-foreground">{mockRequestsData.statusCounts.refundProcessed}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Problem Categories + Resolution Outcomes */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Problem Categories */}
          <Card className="border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{t("refundRequestDashboard.problemCategories")}</CardTitle>
                <Badge className="bg-primary/10 text-primary border-0">
                  {Object.values(mockRequestsData.problemTypes).reduce((acc, p) => acc + p.count, 0)} {t("refundRequestDashboard.totalCases")}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {problemCategories.map((category) => {
                const Icon = category.icon;
                const data = mockRequestsData.problemTypes[category.key as keyof typeof mockRequestsData.problemTypes];
                return (
                  <div
                    key={category.key}
                    className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${problemTypeColors[category.key]}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{t(`refundRequestDashboard.problemTypes.${category.key}`)}</p>
                        <p className="text-sm text-muted-foreground">{data.count} {t("refundRequestDashboard.cases")}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">${data.value.toFixed(2)}</p>
                      <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto" />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Resolution Outcomes */}
          <Card className="border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{t("refundRequestDashboard.resolutionOutcomes")}</CardTitle>
                <Badge className="bg-emerald-50 text-emerald-700 border-0">{t("refundRequestDashboard.retentionFocus")}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Store Credit Option */}
              <div className="p-4 rounded-xl border-2 border-primary bg-gradient-to-r from-primary/5 to-primary/10">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Store className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-foreground">{t("refundRequestDashboard.storeCredit")}</p>
                      <Badge className="bg-primary text-primary-foreground text-xs">⭐ {t("refundRequestDashboard.bestChoice")}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{t("refundRequestDashboard.storeCreditDesc")}</p>
                    <div className="flex gap-4 mt-3">
                      <div>
                        <p className="text-xs text-muted-foreground">{t("refundRequestDashboard.cases")}</p>
                        <p className="font-semibold text-foreground">{mockRequestsData.resolutionOutcomes.storeCredit.count}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{t("refundRequestDashboard.totalValue")}</p>
                        <p className="font-semibold text-foreground">${mockRequestsData.resolutionOutcomes.storeCredit.value.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{t("refundRequestDashboard.savingsBonus")}</p>
                        <p className="font-semibold text-emerald-600">+${mockRequestsData.resolutionOutcomes.storeCredit.savings.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Refund Option */}
              <div className="p-4 rounded-xl border border-border bg-muted/30">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <CreditCard className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{t("refundRequestDashboard.refund")}</p>
                    <p className="text-sm text-muted-foreground mt-1">{t("refundRequestDashboard.refundDesc")}</p>
                    <div className="flex gap-4 mt-3">
                      <div>
                        <p className="text-xs text-muted-foreground">{t("refundRequestDashboard.cases")}</p>
                        <p className="font-semibold text-foreground">{mockRequestsData.resolutionOutcomes.refund.count}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{t("refundRequestDashboard.totalValue")}</p>
                        <p className="font-semibold text-foreground">${mockRequestsData.resolutionOutcomes.refund.value.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{t("refundRequestDashboard.avgTime")}</p>
                        <p className="font-semibold text-foreground">{mockRequestsData.resolutionOutcomes.refund.avgTime}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Resolution Flow Steps */}
        <Card className="border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{t("refundRequestDashboard.resolutionFlow")}</CardTitle>
              <Badge className="bg-blue-50 text-blue-700 border-0">{t("refundRequestDashboard.sixSteps")}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{t("refundRequestDashboard.resolutionFlowDesc")}</p>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {mockRequestsData.flowSteps.map((step, index) => (
                <div
                  key={step.step}
                  className="relative p-4 rounded-lg border border-border bg-card hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                      {step.step}
                    </div>
                    {index < mockRequestsData.flowSteps.length - 1 && (
                      <ChevronRight className="h-4 w-4 text-muted-foreground absolute right-2 top-1/2 -translate-y-1/2 hidden xl:block" />
                    )}
                  </div>
                  <p className="text-sm font-medium text-foreground">{t(`refundRequestDashboard.flowSteps.${step.name}`)}</p>
                  <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                    <span>{step.cases} {t("refundRequestDashboard.cases")}</span>
                    <span>~{step.avgTime}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Evidence Requirements */}
        <Card className="border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{t("refundRequestDashboard.evidenceRequirements")}</CardTitle>
              <Badge className="bg-amber-50 text-amber-700 border-0">{t("refundRequestDashboard.byCategory")}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{t("refundRequestDashboard.evidenceRequirementsDesc")}</p>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {problemCategories.map((category) => {
                const Icon = category.icon;
                return (
                  <div key={category.key} className="p-4 rounded-lg border border-border">
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`p-1.5 rounded ${problemTypeColors[category.key]}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <p className="font-medium text-foreground">{t(`refundRequestDashboard.problemTypes.${category.key}`)}</p>
                    </div>
                    <ul className="space-y-2">
                      {category.evidenceList.map((evidence) => (
                        <li key={evidence} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          {t(`refundRequestDashboard.evidence.${evidence}`)}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent Requests Table */}
        <Card className="border-border">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg">{t("refundRequestDashboard.recentRequests")}</CardTitle>
                <p className="text-sm text-muted-foreground">{t("refundRequestDashboard.recentRequestsDesc")}</p>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("refundRequestDashboard.searchPlaceholder")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("refundRequestDashboard.table.order")}</TableHead>
                    <TableHead>{t("refundRequestDashboard.table.customer")}</TableHead>
                    <TableHead>{t("refundRequestDashboard.table.problemType")}</TableHead>
                    <TableHead>{t("refundRequestDashboard.table.decision")}</TableHead>
                    <TableHead>{t("refundRequestDashboard.table.value")}</TableHead>
                    <TableHead>{t("refundRequestDashboard.table.status")}</TableHead>
                    <TableHead>{t("refundRequestDashboard.table.date")}</TableHead>
                    <TableHead className="text-right">{t("refundRequestDashboard.table.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((request) => {
                    const ProblemIcon = problemTypeIcons[request.problemType];
                    return (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium">{request.orderNumber}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-foreground">{request.customer}</p>
                            <p className="text-xs text-muted-foreground">{request.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className={`p-1 rounded ${problemTypeColors[request.problemType]}`}>
                              <ProblemIcon className="h-3 w-3" />
                            </div>
                            <span className="text-sm">{t(`refundRequestDashboard.problemTypes.${request.problemType}`)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {request.decision ? (
                            <Badge className={decisionColors[request.decision]}>
                              {request.decision === "credit" ? (
                                <Store className="h-3 w-3 mr-1" />
                              ) : (
                                <CreditCard className="h-3 w-3 mr-1" />
                              )}
                              {t(`refundRequestDashboard.decisions.${request.decision}`)}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">${request.value.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge className={statusColors[request.status]}>
                            {t(`refundRequestDashboard.statuses.${request.status}`)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{request.date}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            {filteredRequests.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                {t("refundRequestDashboard.noResults")}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Coming Soon Banner */}
        <div className="rounded-lg border border-dashed border-primary bg-primary/5 p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground">{t("refundRequestDashboard.comingSoonTitle")}</p>
              <p className="text-sm text-muted-foreground mt-1">{t("refundRequestDashboard.comingSoonDesc")}</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
