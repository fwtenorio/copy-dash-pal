import { DashboardLayout } from "@/components/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import {
  Package,
  RotateCcw,
  RefreshCw,
  AlertTriangle,
  Clock3,
  CheckCircle2,
  XCircle,
  Store,
  CreditCard,
  FileText,
  Mail,
  Search,
  ArrowLeft,
  Eye,
  ImageIcon,
  ExternalLink,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { Label } from "@/components/ui/label";

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
        description: "Meu pedido foi marcado como entregue, mas não recebi nada. Já verifiquei com vizinhos e portaria e ninguém viu o pacote. Entrei em contato com a transportadora mas não obtive resposta.",
        checked_carrier: true,
        checked_neighbors: true,
        photos: [
          "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400",
        ]
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
        description: "O produto chegou com defeito de fábrica. A tela está arranhada e há um problema no botão de ligar. Produto veio lacrado, então o defeito é de origem.",
        product_opened: true,
        product_packaging: "original",
        photos: [
          "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=400",
          "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=400",
        ]
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
        description: "Gostaria de trocar o produto por outro tamanho. O produto está em perfeitas condições, apenas não serviu.",
        product_opened: true,
        product_packaging: "original",
        photos: [
          "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400",
        ]
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
        description: "Não reconheço essa cobrança no meu cartão. Não fiz essa compra e ninguém da minha família também.",
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
        description: "Pedido consta como entregue mas nunca recebi. Moro em condomínio fechado e a portaria não recebeu nenhum pacote.",
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

// Status configuration
const statusConfig: Record<string, { icon: React.ElementType; bgColor: string; iconColor: string; label: string }> = {
  pending: { icon: Clock3, bgColor: "bg-amber-50", iconColor: "text-amber-600", label: "Pending" },
  inReview: { icon: Search, bgColor: "bg-blue-50", iconColor: "text-blue-600", label: "In Review" },
  creditIssued: { icon: Store, bgColor: "bg-emerald-50", iconColor: "text-emerald-600", label: "Credit Issued" },
  refundProcessed: { icon: CreditCard, bgColor: "bg-gray-100", iconColor: "text-gray-600", label: "Refund Processed" },
};

// Problem type labels for display
const problemTypeLabels: Record<string, string> = {
  notReceived: "Not Received",
  defect: "Defective Product",
  returnExchange: "Return/Exchange",
  chargeQuestion: "Unrecognized Charge",
};

export default function RefundRequestsByStatus() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { status } = useParams<{ status: string }>();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<RequestData | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [bonusPercentage, setBonusPercentage] = useState<number>(10);
  const [isProcessing, setIsProcessing] = useState(false);

  const currentStatus = status || "pending";
  const config = statusConfig[currentStatus];
  const StatusIcon = config?.icon || Clock3;

  // Filter requests by status
  const getRequestsByStatus = () => {
    const statusMap: Record<string, string[]> = {
      pending: ["pending"],
      inReview: ["inReview"],
      creditIssued: ["completed"],
      refundProcessed: ["completed"],
    };
    
    return mockRequestsData.recentRequests.filter((req) => {
      if (currentStatus === "creditIssued") {
        return req.status === "completed" && req.decision === "credit";
      }
      if (currentStatus === "refundProcessed") {
        return req.status === "completed" && req.decision === "refund";
      }
      return statusMap[currentStatus]?.includes(req.status);
    }).filter((req) =>
      req.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.protocol.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const handleRequestClick = (request: RequestData) => {
    setSelectedRequest(request);
    setBonusPercentage(10);
    setIsDetailModalOpen(true);
  };

  const handleApproveCredit = () => {
    if (!selectedRequest) return;
    setIsProcessing(true);
    setTimeout(() => {
      console.log("Approved credit for:", selectedRequest.id, "with bonus:", bonusPercentage);
      setIsProcessing(false);
      setIsDetailModalOpen(false);
    }, 500);
  };

  const handleIssueRefund = () => {
    if (!selectedRequest) return;
    setIsProcessing(true);
    setTimeout(() => {
      console.log("Issued refund for:", selectedRequest.id);
      setIsProcessing(false);
      setIsDetailModalOpen(false);
    }, 500);
  };

  const handleReject = () => {
    if (!selectedRequest) return;
    setIsProcessing(true);
    setTimeout(() => {
      console.log("Rejected:", selectedRequest.id);
      setIsProcessing(false);
      setIsDetailModalOpen(false);
    }, 500);
  };

  const filteredRequests = getRequestsByStatus();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header with back button */}
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate("/refund-request")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-lg ${config?.bgColor}`}>
              <StatusIcon className={`h-6 w-6 ${config?.iconColor}`} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">
                {t(`refundRequestDashboard.${currentStatus}`, { defaultValue: config?.label })} Requests
              </h1>
              <p className="text-sm text-muted-foreground">
                {filteredRequests.length} {filteredRequests.length === 1 ? "request" : "requests"} found
              </p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("refundRequestDashboard.searchPlaceholder", { defaultValue: "Search by order, customer, email..." })}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Requests Table */}
        <Card>
          <CardContent className="p-0">
            {filteredRequests.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("refundRequestDashboard.table.order", { defaultValue: "Order" })}</TableHead>
                    <TableHead>{t("refundRequestDashboard.table.customer", { defaultValue: "Customer" })}</TableHead>
                    <TableHead>{t("refundRequestDashboard.table.problemType", { defaultValue: "Problem Type" })}</TableHead>
                    <TableHead>{t("refundRequestDashboard.table.decision", { defaultValue: "Decision" })}</TableHead>
                    <TableHead>{t("refundRequestDashboard.table.value", { defaultValue: "Value" })}</TableHead>
                    <TableHead>{t("refundRequestDashboard.table.date", { defaultValue: "Date" })}</TableHead>
                    <TableHead className="text-right">{t("refundRequestDashboard.table.actions", { defaultValue: "Actions" })}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((request) => {
                    const ProblemIcon = problemTypeIcons[request.problemType];
                    return (
                      <TableRow 
                        key={request.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleRequestClick(request)}
                      >
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
                            <span className="text-sm">{t(`refundRequestDashboard.problemTypes.${request.problemType}`, { defaultValue: problemTypeLabels[request.problemType] })}</span>
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
                              {t(`refundRequestDashboard.decisions.${request.decision}`, { defaultValue: request.decision })}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">${request.value.toFixed(2)}</TableCell>
                        <TableCell className="text-muted-foreground">{request.date}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleRequestClick(request); }}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <FileText className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg font-medium">{t("refundRequestDashboard.noRequestsInStatus", { defaultValue: "No requests found" })}</p>
                <p className="text-sm">{t("refundRequestDashboard.noRequestsInStatusDesc", { defaultValue: "There are no requests with this status at the moment." })}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Request Detail Modal */}
        <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0">
            {selectedRequest && (
              <>
                {/* Header */}
                <DialogHeader className="px-6 py-5 border-b bg-muted/30">
                  <div className="flex items-start justify-between">
                    <div>
                      <DialogTitle className="text-xl flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Order {selectedRequest.orderNumber}
                      </DialogTitle>
                      <DialogDescription className="mt-1.5 flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5" />
                        {selectedRequest.email}
                      </DialogDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold">
                        ${selectedRequest.value.toFixed(2)}
                      </div>
                      <div className="text-xs text-muted-foreground font-mono">
                        {selectedRequest.protocol}
                      </div>
                    </div>
                  </div>
                </DialogHeader>

                {/* Scrollable Content */}
                <ScrollArea className="flex-1 max-h-[50vh]">
                  <div className="px-6 py-5 space-y-6">
                    {/* Request Details */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        {t("refundRequestDashboard.requestDetails", { defaultValue: "Request Details" })}
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">{t("refundRequestDashboard.table.problemType", { defaultValue: "Problem Type" })}</p>
                          <div className="flex items-center gap-2">
                            {(() => {
                              const ProblemIcon = problemTypeIcons[selectedRequest.problemType];
                              return (
                                <>
                                  <div className={`p-1 rounded ${problemTypeColors[selectedRequest.problemType]}`}>
                                    <ProblemIcon className="h-4 w-4" />
                                  </div>
                                  <span className="font-medium">{problemTypeLabels[selectedRequest.problemType] || selectedRequest.problemType}</span>
                                </>
                              );
                            })()}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">{t("refundRequestDashboard.preferredResolution", { defaultValue: "Preferred Resolution" })}</p>
                          <p className="font-medium capitalize">{selectedRequest.preferredResolution || "-"}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">{t("refundRequestDashboard.table.customer", { defaultValue: "Customer" })}</p>
                          <p className="font-medium">{selectedRequest.customer}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">{t("refundRequestDashboard.table.date", { defaultValue: "Date" })}</p>
                          <p className="font-medium">{selectedRequest.date}</p>
                        </div>
                      </div>
                    </div>

                    {/* Customer Verification - Not Received */}
                    {selectedRequest.problemType === "notReceived" && selectedRequest.evidence && (
                      <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                          {t("refundRequestDashboard.customerVerification", { defaultValue: "Customer Verification" })}
                        </h3>
                        <div className="rounded-lg border bg-muted/20 p-4 space-y-2 text-sm">
                          <div className="flex items-center justify-between">
                            <span>{t("refundRequestDashboard.checkedWithCarrier", { defaultValue: "Checked with carrier" })}</span>
                            <Badge variant={selectedRequest.evidence.checked_carrier ? "default" : "outline"}>
                              {selectedRequest.evidence.checked_carrier ? t("common.yes", { defaultValue: "Yes" }) : t("common.no", { defaultValue: "No" })}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>{t("refundRequestDashboard.checkedWithNeighbors", { defaultValue: "Checked with neighbors" })}</span>
                            <Badge variant={selectedRequest.evidence.checked_neighbors ? "default" : "outline"}>
                              {selectedRequest.evidence.checked_neighbors ? t("common.yes", { defaultValue: "Yes" }) : t("common.no", { defaultValue: "No" })}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Product Condition - Defect or Return */}
                    {(selectedRequest.problemType === "defect" || selectedRequest.problemType === "returnExchange") && selectedRequest.evidence && (
                      <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                          {t("refundRequestDashboard.productCondition", { defaultValue: "Product Condition" })}
                        </h3>
                        <div className="rounded-lg border bg-muted/20 p-4 space-y-2 text-sm">
                          <div className="flex items-center justify-between">
                            <span>{t("refundRequestDashboard.productOpened", { defaultValue: "Product was opened" })}</span>
                            <Badge variant={selectedRequest.evidence.product_opened ? "default" : "outline"}>
                              {selectedRequest.evidence.product_opened ? t("common.yes", { defaultValue: "Yes" }) : t("common.no", { defaultValue: "No" })}
                            </Badge>
                          </div>
                          {selectedRequest.evidence.product_packaging && (
                            <div className="flex items-center justify-between">
                              <span>{t("refundRequestDashboard.packaging", { defaultValue: "Packaging" })}</span>
                              <Badge variant="outline" className="capitalize">
                                {selectedRequest.evidence.product_packaging}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Charge Verification - Charge Question */}
                    {selectedRequest.problemType === "chargeQuestion" && selectedRequest.evidence && (
                      <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                          {t("refundRequestDashboard.chargeVerification", { defaultValue: "Charge Verification" })}
                        </h3>
                        <div className="rounded-lg border bg-muted/20 p-4 space-y-2 text-sm">
                          <div className="flex items-center justify-between">
                            <span>{t("refundRequestDashboard.familyPurchase", { defaultValue: "Family member purchase" })}</span>
                            <Badge variant={selectedRequest.evidence.family_purchase ? "default" : "outline"}>
                              {selectedRequest.evidence.family_purchase ? t("common.yes", { defaultValue: "Yes" }) : t("common.no", { defaultValue: "No" })}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>{t("refundRequestDashboard.chargebackInitiated", { defaultValue: "Chargeback initiated" })}</span>
                            <Badge variant={selectedRequest.evidence.chargeback_initiated ? "destructive" : "outline"}>
                              {selectedRequest.evidence.chargeback_initiated ? t("common.yes", { defaultValue: "Yes" }) : t("common.no", { defaultValue: "No" })}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Evidence */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        {t("refundRequestDashboard.evidence", { defaultValue: "Evidence" })}
                      </h3>
                      
                      {selectedRequest.evidence?.description && (
                        <div className="rounded-lg border bg-muted/20 p-4">
                          <p className="text-sm whitespace-pre-wrap">
                            {selectedRequest.evidence.description}
                          </p>
                        </div>
                      )}

                      {selectedRequest.evidence?.photos && selectedRequest.evidence.photos.length > 0 ? (
                        <div className="grid grid-cols-3 gap-3">
                          {selectedRequest.evidence.photos.map((photo, index) => (
                            <button
                              key={index}
                              onClick={() => setSelectedImage(photo)}
                              className="aspect-square rounded-lg border bg-muted/30 overflow-hidden hover:ring-2 hover:ring-primary transition-all group relative"
                            >
                              <img
                                src={photo}
                                alt={`Evidence ${index + 1}`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = "/placeholder.svg";
                                }}
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                <ExternalLink className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-lg border border-dashed bg-muted/10 p-6 text-center">
                          <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                          <p className="text-sm text-muted-foreground">{t("refundRequestDashboard.noPhotos", { defaultValue: "No photos submitted" })}</p>
                        </div>
                      )}
                    </div>

                    {/* Current Status */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        {t("refundRequestDashboard.currentStatus", { defaultValue: "Current Status" })}
                      </h3>
                      <div className="rounded-lg border bg-muted/20 p-4 text-center">
                        <Badge className={`${statusColors[selectedRequest.status]} text-sm px-3 py-1`}>
                          {t(`refundRequestDashboard.statuses.${selectedRequest.status}`, { defaultValue: selectedRequest.status })}
                        </Badge>
                        {selectedRequest.decision && (
                          <p className="text-sm text-muted-foreground mt-2">
                            {t("refundRequestDashboard.decisionMade", { defaultValue: "Decision" })}: 
                            <span className="font-medium capitalize ml-1">{selectedRequest.decision}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </ScrollArea>

                {/* Footer Actions */}
                <div className="border-t bg-muted/30 px-6 py-5 space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    {t("refundRequestDashboard.decision", { defaultValue: "Decision" })}
                  </h3>

                  {selectedRequest.status === "pending" || selectedRequest.status === "inReview" ? (
                    <div className="space-y-4">
                      <div className="flex items-end gap-3">
                        <div className="w-24">
                          <Label htmlFor="bonus" className="text-sm mb-1.5 block">
                            {t("refundRequestDashboard.bonusPercentage", { defaultValue: "Bonus %" })}
                          </Label>
                          <Input
                            id="bonus"
                            type="number"
                            min={0}
                            max={100}
                            value={bonusPercentage}
                            onChange={(e) => setBonusPercentage(Number(e.target.value))}
                            className="w-full"
                          />
                        </div>
                        <Button 
                          onClick={handleApproveCredit}
                          disabled={isProcessing}
                          className="bg-emerald-600 hover:bg-emerald-700"
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          {t("refundRequestDashboard.approveCredit", { defaultValue: "Approve Credit" })}
                        </Button>
                      </div>
                      
                      <div className="flex gap-3">
                        <Button 
                          variant="outline"
                          onClick={handleIssueRefund}
                          disabled={isProcessing}
                          className="flex-1"
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          {t("refundRequestDashboard.issueRefund", { defaultValue: "Issue Refund" })}
                        </Button>
                        <Button 
                          variant="destructive"
                          onClick={handleReject}
                          disabled={isProcessing}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          {t("refundRequestDashboard.reject", { defaultValue: "Reject" })}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg border bg-muted/20 p-4 text-center">
                      <p className="text-sm text-muted-foreground mb-2">
                        {t("refundRequestDashboard.alreadyResolved", { defaultValue: "This request has already been resolved" })}
                      </p>
                      {selectedRequest.decision && (
                        <Badge className={decisionColors[selectedRequest.decision]}>
                          {selectedRequest.decision === "credit" ? (
                            <Store className="h-3 w-3 mr-1" />
                          ) : (
                            <CreditCard className="h-3 w-3 mr-1" />
                          )}
                          {t(`refundRequestDashboard.decisions.${selectedRequest.decision}`, { defaultValue: selectedRequest.decision })}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Full-size Image Modal */}
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="max-w-4xl p-0 bg-black/90">
            <button 
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 z-50 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
            >
              <X className="h-5 w-5 text-white" />
            </button>
            {selectedImage && (
              <img
                src={selectedImage}
                alt="Evidence full size"
                className="w-full h-auto max-h-[85vh] object-contain"
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
