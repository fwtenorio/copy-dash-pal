import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Package, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  RefreshCw,
  ImageIcon,
  ExternalLink,
  Clock,
  Mail,
  FileText
} from "lucide-react";
import { format } from "date-fns";

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

interface DisputeRequest {
  id: string;
  order_id: string;
  customer_email: string;
  customer_name: string | null;
  problem_type: string;
  evidence_data: EvidenceData;
  preferred_resolution: string;
  status: string;
  admin_bonus_percentage: number | null;
  admin_notes: string | null;
  order_total: number | null;
  currency: string | null;
  protocol_number: string;
  created_at: string;
  updated_at: string;
}

const problemTypeLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  not_received: { label: "Not Received", variant: "destructive" },
  damaged: { label: "Damaged", variant: "destructive" },
  defective: { label: "Defective", variant: "destructive" },
  wrong_item: { label: "Wrong Item", variant: "secondary" },
  other: { label: "Other", variant: "outline" },
};

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: "Pending Review", color: "bg-amber-100 text-amber-800 border-amber-200", icon: <Clock className="h-3 w-3" /> },
  approved: { label: "Approved", color: "bg-emerald-100 text-emerald-800 border-emerald-200", icon: <CheckCircle2 className="h-3 w-3" /> },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-800 border-red-200", icon: <XCircle className="h-3 w-3" /> },
  refunded: { label: "Refunded", color: "bg-blue-100 text-blue-800 border-blue-200", icon: <RefreshCw className="h-3 w-3" /> },
  processing: { label: "Processing", color: "bg-purple-100 text-purple-800 border-purple-200", icon: <RefreshCw className="h-3 w-3 animate-spin" /> },
  completed: { label: "Completed", color: "bg-gray-100 text-gray-800 border-gray-200", icon: <CheckCircle2 className="h-3 w-3" /> },
};

export default function AdminResolutions() {
  const queryClient = useQueryClient();
  const [selectedDispute, setSelectedDispute] = useState<DisputeRequest | null>(null);
  const [bonusPercentage, setBonusPercentage] = useState<number>(10);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Fetch dispute requests
  const { data: disputes, isLoading, error } = useQuery({
    queryKey: ["dispute-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dispute_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as DisputeRequest[];
    },
  });

  // Update dispute mutation
  const updateDisputeMutation = useMutation({
    mutationFn: async ({ 
      id, 
      status, 
      admin_bonus_percentage 
    }: { 
      id: string; 
      status: string; 
      admin_bonus_percentage?: number | null;
    }) => {
      const { error } = await supabase
        .from("dispute_requests")
        .update({ 
          status, 
          admin_bonus_percentage,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["dispute-requests"] });
      setIsSheetOpen(false);
      setSelectedDispute(null);
      
      const statusMessages: Record<string, string> = {
        approved: "Credit approved successfully!",
        rejected: "Request rejected.",
        refunded: "Refund issued successfully!",
      };
      
      toast.success(statusMessages[variables.status] || "Status updated!");
    },
    onError: (error) => {
      console.error("Error updating dispute:", error);
      toast.error("Failed to update request. Please try again.");
    },
  });

  const handleRowClick = (dispute: DisputeRequest) => {
    setSelectedDispute(dispute);
    setBonusPercentage(dispute.admin_bonus_percentage ?? 10);
    setIsSheetOpen(true);
  };

  const handleApproveCredit = () => {
    if (!selectedDispute) return;
    updateDisputeMutation.mutate({
      id: selectedDispute.id,
      status: "approved",
      admin_bonus_percentage: bonusPercentage,
    });
  };

  const handleIssueRefund = () => {
    if (!selectedDispute) return;
    updateDisputeMutation.mutate({
      id: selectedDispute.id,
      status: "refunded",
      admin_bonus_percentage: null,
    });
  };

  const handleReject = () => {
    if (!selectedDispute) return;
    updateDisputeMutation.mutate({
      id: selectedDispute.id,
      status: "rejected",
      admin_bonus_percentage: null,
    });
  };

  const getImageUrl = (photoPath: string) => {
    // If it's already a full URL, return as is
    if (photoPath.startsWith("http")) return photoPath;
    // Otherwise, construct the Supabase storage URL
    return `https://rhlfnrtwuyskswefzrxu.supabase.co/storage/v1/object/public/dispute-evidence/${photoPath}`;
  };

  const formatCurrency = (amount: number | null, currency: string | null) => {
    if (amount === null) return "N/A";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
    }).format(amount);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader 
          title="Resolution Requests" 
          subtitle="Review and process customer dispute requests"
        />

        {/* Data Table */}
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[140px]">Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Problem</TableHead>
                <TableHead>Preference</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="w-[140px]">Submitted</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  </TableRow>
                ))
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-destructive">
                    <AlertTriangle className="h-5 w-5 mx-auto mb-2" />
                    Failed to load requests
                  </TableCell>
                </TableRow>
              ) : disputes?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    <Package className="h-8 w-8 mx-auto mb-3 opacity-40" />
                    <p className="font-medium">No dispute requests yet</p>
                    <p className="text-sm mt-1">Requests will appear here when customers submit them.</p>
                  </TableCell>
                </TableRow>
              ) : (
                disputes?.map((dispute) => {
                  const problemInfo = problemTypeLabels[dispute.problem_type] || { label: dispute.problem_type, variant: "outline" as const };
                  const statusInfo = statusConfig[dispute.status] || statusConfig.pending;
                  
                  return (
                    <TableRow 
                      key={dispute.id}
                      className="cursor-pointer transition-colors hover:bg-muted/50"
                      onClick={() => handleRowClick(dispute)}
                    >
                      <TableCell className="font-mono font-medium">
                        #{dispute.order_id}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium truncate max-w-[200px]">
                            {dispute.customer_name || "—"}
                          </span>
                          <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {dispute.customer_email}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={problemInfo.variant}>
                          {problemInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="capitalize text-sm">
                        {dispute.preferred_resolution}
                      </TableCell>
                      <TableCell>
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusInfo.color}`}>
                          {statusInfo.icon}
                          {statusInfo.label}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(dispute.order_total, dispute.currency)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(dispute.created_at), "MMM d, yyyy")}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Review Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-full sm:max-w-xl flex flex-col p-0">
          {selectedDispute && (
            <>
              {/* Header */}
              <SheetHeader className="px-6 py-5 border-b bg-muted/30">
                <div className="flex items-start justify-between">
                  <div>
                    <SheetTitle className="text-xl flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Order #{selectedDispute.order_id}
                    </SheetTitle>
                    <SheetDescription className="mt-1.5 flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5" />
                      {selectedDispute.customer_email}
                    </SheetDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold">
                      {formatCurrency(selectedDispute.order_total, selectedDispute.currency)}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">
                      {selectedDispute.protocol_number}
                    </div>
                  </div>
                </div>
              </SheetHeader>

              {/* Scrollable Content */}
              <ScrollArea className="flex-1">
                <div className="px-6 py-5 space-y-6">
                  {/* Section A: Order Context */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      Request Details
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Problem Type</p>
                        <Badge variant={problemTypeLabels[selectedDispute.problem_type]?.variant || "outline"} className="text-sm">
                          {problemTypeLabels[selectedDispute.problem_type]?.label || selectedDispute.problem_type}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Preferred Resolution</p>
                        <p className="font-medium capitalize">{selectedDispute.preferred_resolution}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Customer Name</p>
                        <p className="font-medium">{selectedDispute.customer_name || "Not provided"}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Submitted</p>
                        <p className="font-medium">{format(new Date(selectedDispute.created_at), "PPp")}</p>
                      </div>
                    </div>
                  </div>

                  {/* Additional Context for "Not Received" */}
                  {selectedDispute.problem_type === "not_received" && selectedDispute.evidence_data && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        Customer Verification
                      </h3>
                      <div className="rounded-lg border bg-muted/20 p-4 space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span>Checked with carrier</span>
                          <Badge variant={selectedDispute.evidence_data.checked_carrier ? "default" : "outline"}>
                            {selectedDispute.evidence_data.checked_carrier ? "Yes" : "No"}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Checked with neighbors</span>
                          <Badge variant={selectedDispute.evidence_data.checked_neighbors ? "default" : "outline"}>
                            {selectedDispute.evidence_data.checked_neighbors ? "Yes" : "No"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Section B: Evidence */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Evidence
                    </h3>
                    
                    {/* Description */}
                    {selectedDispute.evidence_data?.description && (
                      <div className="rounded-lg border bg-muted/20 p-4">
                        <p className="text-sm whitespace-pre-wrap">
                          {selectedDispute.evidence_data.description}
                        </p>
                      </div>
                    )}

                    {/* Photos Grid */}
                    {selectedDispute.evidence_data?.photos && selectedDispute.evidence_data.photos.length > 0 ? (
                      <div className="grid grid-cols-3 gap-3">
                        {selectedDispute.evidence_data.photos.map((photo, index) => (
                          <button
                            key={index}
                            onClick={() => setSelectedImage(getImageUrl(photo))}
                            className="aspect-square rounded-lg border bg-muted/30 overflow-hidden hover:ring-2 hover:ring-primary transition-all group relative"
                          >
                            <img
                              src={getImageUrl(photo)}
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
                        <p className="text-sm text-muted-foreground">No photos submitted</p>
                      </div>
                    )}
                  </div>
                </div>
              </ScrollArea>

              {/* Section C: Action Console (Fixed Footer) */}
              <div className="border-t bg-muted/30 px-6 py-5 space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Decision
                </h3>

                {selectedDispute.status === "pending" ? (
                  <div className="space-y-4">
                    {/* Approve Credit Section */}
                    <div className="flex items-end gap-3">
                      <div className="flex-1">
                        <Label htmlFor="bonus" className="text-sm mb-1.5 block">
                          Bonus Percentage
                        </Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id="bonus"
                            type="number"
                            min={0}
                            max={100}
                            value={bonusPercentage}
                            onChange={(e) => setBonusPercentage(Number(e.target.value))}
                            className="w-20 text-center"
                          />
                          <span className="text-sm text-muted-foreground">%</span>
                        </div>
                      </div>
                      <Button 
                        onClick={handleApproveCredit}
                        disabled={updateDisputeMutation.isPending}
                        className="flex-1"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Approve Credit
                      </Button>
                    </div>

                    {/* Other Actions */}
                    <div className="flex gap-3">
                      <Button 
                        variant="outline" 
                        onClick={handleIssueRefund}
                        disabled={updateDisputeMutation.isPending}
                        className="flex-1"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Issue Refund
                      </Button>
                      <Button 
                        variant="destructive" 
                        onClick={handleReject}
                        disabled={updateDisputeMutation.isPending}
                        className="flex-1"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border bg-muted/20 p-4 text-center">
                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${statusConfig[selectedDispute.status]?.color || ""}`}>
                      {statusConfig[selectedDispute.status]?.icon}
                      {statusConfig[selectedDispute.status]?.label || selectedDispute.status}
                    </div>
                    {selectedDispute.admin_bonus_percentage !== null && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Bonus applied: {selectedDispute.admin_bonus_percentage}%
                      </p>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Full-size Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button 
            className="absolute top-4 right-4 text-white/80 hover:text-white"
            onClick={() => setSelectedImage(null)}
          >
            <XCircle className="h-8 w-8" />
          </button>
          <img
            src={selectedImage}
            alt="Evidence full size"
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
          />
        </div>
      )}
    </DashboardLayout>
  );
}
