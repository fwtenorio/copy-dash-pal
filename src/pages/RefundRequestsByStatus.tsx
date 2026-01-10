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
  Clock3,
  Store,
  CreditCard,
  FileText,
  Search,
  ArrowLeft,
  Eye,
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
    navigate(`/refund-request/${currentStatus}/${request.id}`);
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
      </div>
    </DashboardLayout>
  );
}
