import { DashboardLayout } from "@/components/DashboardLayout";
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
  CheckCircle2,
  XCircle,
  Store,
  CreditCard,
  FileText,
  Mail,
  ArrowLeft,
  ImageIcon,
  X,
  Calendar,
  Hash,
  User,
  DollarSign,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { useState } from "react";
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

// Mock data
const mockRequestsData: RequestData[] = [
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
];

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

const problemTypeLabels: Record<string, string> = {
  notReceived: "Not Received",
  defect: "Defective Product",
  returnExchange: "Return/Exchange",
  chargeQuestion: "Unrecognized Charge",
};

export default function RefundRequestDetail() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { requestId } = useParams<{ requestId: string }>();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [bonusPercentage, setBonusPercentage] = useState<number>(10);
  const [isProcessing, setIsProcessing] = useState(false);

  // Find the request by ID
  const request = mockRequestsData.find(r => r.id === requestId);

  if (!request) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-16">
          <FileText className="h-16 w-16 text-muted-foreground/50 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Request not found</h2>
          <p className="text-muted-foreground mb-4">The request you're looking for doesn't exist.</p>
          <Button onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const ProblemIcon = problemTypeIcons[request.problemType] || Package;

  const handleApproveCredit = () => {
    setIsProcessing(true);
    setTimeout(() => {
      console.log("Approved credit for:", request.id, "with bonus:", bonusPercentage);
      setIsProcessing(false);
      navigate(-1);
    }, 500);
  };

  const handleIssueRefund = () => {
    setIsProcessing(true);
    setTimeout(() => {
      console.log("Issued refund for:", request.id);
      setIsProcessing(false);
      navigate(-1);
    }, 500);
  };

  const handleReject = () => {
    setIsProcessing(true);
    setTimeout(() => {
      console.log("Rejected:", request.id);
      setIsProcessing(false);
      navigate(-1);
    }, 500);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">Order {request.orderNumber}</h1>
              <Badge className={statusColors[request.status]}>
                {t(`refundRequestDashboard.statuses.${request.status}`, { defaultValue: request.status })}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground font-mono">{request.protocol}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">${request.value.toFixed(2)}</p>
            <p className="text-sm text-muted-foreground">{request.date}</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content - Left Side */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer & Order Info */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                  {t("refundRequestDashboard.orderInfo", { defaultValue: "Order Information" })}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <User className="h-3.5 w-3.5" />
                      {t("refundRequestDashboard.table.customer", { defaultValue: "Customer" })}
                    </div>
                    <p className="font-medium">{request.customer}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Mail className="h-3.5 w-3.5" />
                      Email
                    </div>
                    <p className="font-medium text-sm">{request.email}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Hash className="h-3.5 w-3.5" />
                      {t("refundRequestDashboard.table.order", { defaultValue: "Order" })}
                    </div>
                    <p className="font-medium">{request.orderNumber}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      {t("refundRequestDashboard.table.date", { defaultValue: "Date" })}
                    </div>
                    <p className="font-medium">{request.date}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Problem & Resolution Info */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                  {t("refundRequestDashboard.requestDetails", { defaultValue: "Request Details" })}
                </h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">{t("refundRequestDashboard.table.problemType", { defaultValue: "Problem Type" })}</p>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${problemTypeColors[request.problemType]}`}>
                        <ProblemIcon className="h-5 w-5" />
                      </div>
                      <span className="font-medium">{problemTypeLabels[request.problemType] || request.problemType}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">{t("refundRequestDashboard.preferredResolution", { defaultValue: "Preferred Resolution" })}</p>
                    <div className="flex items-center gap-2">
                      {request.preferredResolution === "credit" ? (
                        <Store className="h-5 w-5 text-emerald-600" />
                      ) : (
                        <CreditCard className="h-5 w-5 text-blue-600" />
                      )}
                      <span className="font-medium capitalize">{request.preferredResolution || "-"}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Customer Verification based on problem type */}
            {request.problemType === "notReceived" && request.evidence && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                    {t("refundRequestDashboard.customerVerification", { defaultValue: "Customer Verification" })}
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <span className="text-sm">{t("refundRequestDashboard.checkedWithCarrier", { defaultValue: "Checked with carrier" })}</span>
                      <Badge variant={request.evidence.checked_carrier ? "default" : "outline"}>
                        {request.evidence.checked_carrier ? t("common.yes", { defaultValue: "Yes" }) : t("common.no", { defaultValue: "No" })}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <span className="text-sm">{t("refundRequestDashboard.checkedWithNeighbors", { defaultValue: "Checked with neighbors" })}</span>
                      <Badge variant={request.evidence.checked_neighbors ? "default" : "outline"}>
                        {request.evidence.checked_neighbors ? t("common.yes", { defaultValue: "Yes" }) : t("common.no", { defaultValue: "No" })}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {(request.problemType === "defect" || request.problemType === "returnExchange") && request.evidence && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                    {t("refundRequestDashboard.productCondition", { defaultValue: "Product Condition" })}
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <span className="text-sm">{t("refundRequestDashboard.productOpened", { defaultValue: "Product was opened" })}</span>
                      <Badge variant={request.evidence.product_opened ? "default" : "outline"}>
                        {request.evidence.product_opened ? t("common.yes", { defaultValue: "Yes" }) : t("common.no", { defaultValue: "No" })}
                      </Badge>
                    </div>
                    {request.evidence.product_packaging && (
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                        <span className="text-sm">{t("refundRequestDashboard.packaging", { defaultValue: "Packaging" })}</span>
                        <Badge variant="outline" className="capitalize">
                          {request.evidence.product_packaging}
                        </Badge>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {request.problemType === "chargeQuestion" && request.evidence && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                    {t("refundRequestDashboard.chargeVerification", { defaultValue: "Charge Verification" })}
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <span className="text-sm">{t("refundRequestDashboard.familyPurchase", { defaultValue: "Family member purchase" })}</span>
                      <Badge variant={request.evidence.family_purchase ? "default" : "outline"}>
                        {request.evidence.family_purchase ? t("common.yes", { defaultValue: "Yes" }) : t("common.no", { defaultValue: "No" })}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <span className="text-sm">{t("refundRequestDashboard.chargebackInitiated", { defaultValue: "Chargeback initiated" })}</span>
                      <Badge variant={request.evidence.chargeback_initiated ? "destructive" : "outline"}>
                        {request.evidence.chargeback_initiated ? t("common.yes", { defaultValue: "Yes" }) : t("common.no", { defaultValue: "No" })}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Evidence Section */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2 mb-4">
                  <FileText className="h-4 w-4" />
                  {t("refundRequestDashboard.evidence", { defaultValue: "Evidence" })}
                </h3>
                
                {/* Description */}
                {request.evidence?.description && (
                  <div className="rounded-lg border bg-muted/20 p-4 mb-4">
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">
                      {request.evidence.description}
                    </p>
                  </div>
                )}

                {/* Photos Grid */}
                {request.evidence?.photos && request.evidence.photos.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {request.evidence.photos.map((photo, index) => (
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
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed bg-muted/10 p-8 text-center">
                    <ImageIcon className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
                    <p className="text-sm text-muted-foreground">{t("refundRequestDashboard.noPhotos", { defaultValue: "No photos submitted" })}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Right Side */}
          <div className="space-y-6">
            {/* Current Status */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                  {t("refundRequestDashboard.currentStatus", { defaultValue: "Current Status" })}
                </h3>
                <div className="text-center">
                  <Badge className={`${statusColors[request.status]} text-sm px-4 py-2`}>
                    {t(`refundRequestDashboard.statuses.${request.status}`, { defaultValue: request.status })}
                  </Badge>
                  {request.decision && (
                    <p className="text-sm text-muted-foreground mt-3">
                      {t("refundRequestDashboard.decisionMade", { defaultValue: "Decision" })}: 
                      <span className="font-medium capitalize ml-1">{request.decision}</span>
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Decision Actions */}
            <Card className="border-primary/20">
              <CardContent className="p-6">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                  {t("refundRequestDashboard.decision", { defaultValue: "Decision" })}
                </h3>

                {request.status === "pending" || request.status === "inReview" ? (
                  <div className="space-y-4">
                    {/* Approve Credit */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
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
                        <div className="pt-6">
                          <p className="text-sm text-muted-foreground">
                            = ${(request.value * (1 + bonusPercentage / 100)).toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <Button 
                        onClick={handleApproveCredit}
                        disabled={isProcessing}
                        className="w-full bg-emerald-600 hover:bg-emerald-700"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        {t("refundRequestDashboard.approveCredit", { defaultValue: "Approve Credit" })}
                      </Button>
                    </div>
                    
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">or</span>
                      </div>
                    </div>

                    {/* Other Actions */}
                    <Button 
                      variant="outline"
                      onClick={handleIssueRefund}
                      disabled={isProcessing}
                      className="w-full"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      {t("refundRequestDashboard.issueRefund", { defaultValue: "Issue Refund" })}
                    </Button>
                    
                    <Button 
                      variant="destructive"
                      onClick={handleReject}
                      disabled={isProcessing}
                      className="w-full"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      {t("refundRequestDashboard.reject", { defaultValue: "Reject" })}
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground mb-3">
                      {t("refundRequestDashboard.alreadyResolved", { defaultValue: "This request has already been resolved" })}
                    </p>
                    {request.decision && (
                      <Badge className={decisionColors[request.decision]}>
                        {request.decision === "credit" ? (
                          <Store className="h-3 w-3 mr-1" />
                        ) : (
                          <CreditCard className="h-3 w-3 mr-1" />
                        )}
                        {t(`refundRequestDashboard.decisions.${request.decision}`, { defaultValue: request.decision })}
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

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
