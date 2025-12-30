import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { CheckCircle2,Info, SearchCheck, CircleCheckBig, DollarSign, Eye, Copy, Store, Zap, FileText, ExternalLink, Edit, Trash2, CheckCircle, Mail, Package, ShoppingBag, CreditCard, MapPin, Clock, AlertCircle, Upload, Landmark, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { generateDisputePDF } from "@/utils/generateDisputePDF";
import { prepareDisputeForPDF } from "@/utils/prepareDisputeForPDF";
import { PDFTestScenarios } from "@/components/PDFTestScenarios";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { FaStripe, FaShopify, FaPaypal, FaCreditCard } from 'react-icons/fa';

interface DisputeDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dispute: any;
}

interface TrackingEvent {
  date: string;
  description: string;
  location: string;
  stage: string;
}

interface TrackingData {
  trackingNumber: string;
  status: string;
  carrier: string;
  events: TrackingEvent[];
}

export function DisputeDetailsModal({ open, onOpenChange, dispute }: DisputeDetailsModalProps) {
  const { t, i18n } = useTranslation();
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [loadingTracking, setLoadingTracking] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [urlLoja, setUrlLoja] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setShowSummary(false);
      if (dispute?.order?.tracking_number) {
        fetchTrackingData(dispute.order.tracking_number);
        fetchShopifyLojaData()
      }
    }
  }, [open, dispute?.order?.tracking_number]);

  const fetchTrackingData = async (trackingNumber: string) => {
    setLoadingTracking(true);
    try {
      const { data, error } = await supabase.functions.invoke('track-shipment', {
        body: { trackingNumber },
      });

      if (error) throw error;

      setTrackingData(data);
    } catch (error) {
      console.error('Error fetching tracking data:', error);
      toast.error(t("disputeModal.errorLoadingTracking"));
    } finally {
      setLoadingTracking(false);
    }
  };
  
  if (!dispute) return null;

  const fetchShopifyLojaData = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("shop-info");
      console.log(data);
      // Checagem segura para evitar erros de leitura
      if (data?.info?.data?.shop?.myshopify_domain) {
        setUrlLoja(data.info.data.shop.myshopify_domain);
      }
      
      if (error) {
        console.error("Error fetching data:", error);
        toast.error(t("disputeModal.errorLoadingData"), {
          description: error.message || t("disputeModal.couldNotLoadShopifyData"),
        });
        return;
      }
      // setDashboardData(data);
    } catch (error) {
      console.error("Error fetching Shopify data:", error);
      toast.error(t("disputeModal.errorConnectingShopify"), {
        description: t("disputeModal.couldNotConnectShopify"),
      });
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const locale = i18n.language === "pt" ? ptBR : enUS;
      const dateFormat = i18n.language === "pt" ? "dd 'de' MMMM 'de' yyyy" : "MMMM dd, yyyy";
      return format(new Date(dateString), dateFormat, { locale });
    } catch {
      return dateString;
    }
  };

  const getStatusColor = (status: string) => {
    const statusMap: Record<string, string> = {
      "won": "bg-green-500/10 text-green-500 border-green-500/20",
      "lost": "bg-red-500/10 text-red-500 border-red-500/20",
      "needs_response": "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
      "under_review": "bg-blue-500/10 text-blue-500 border-blue-500/20",
      "charge_refunded": "bg-purple-500/10 text-purple-500 border-purple-500/20",
      "warning_needs_response": "bg-orange-500/10 text-orange-500 border-orange-500/20",
    };
    return statusMap[status] || "bg-muted text-muted-foreground";
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      "won": t("disputeModal.statusWon"),
      "lost": t("disputeModal.statusLost"),
      "needs_response": t("disputeModal.statusNeedsResponse"),
      "under_review": t("disputeModal.statusUnderReview"),
      "charge_refunded": t("disputeModal.statusChargeRefunded"),
      "warning_needs_response": t("disputeModal.statusWarningNeedsResponse"),
    };
    return statusMap[status] || status;
  };

  const getStatusTitle = (status: string) => {
    const titleMap: Record<string, string> = {
      "won": t("disputeModal.disputeResolved"),
      "lost": t("disputeModal.disputeLost"),
      "needs_response": t("disputeModal.statusNeedsResponse"),
      "under_review": t("disputeModal.statusUnderReview"),
      "charge_refunded": t("disputeModal.statusChargeRefunded"),
      "warning_needs_response": t("disputeModal.statusWarningNeedsResponse"),
    };
    return titleMap[status] || t("disputeModal.disputeSummary");
  };

  const getStatusMessage = (status: string) => {
    const messageMap: Record<string, string> = {
      "won": t("disputeModal.congratulations"),
      "lost": t("disputeModal.unfortunately"),
      "needs_response": t("disputeModal.sendEvidenceDesc"),
      "under_review": t("disputeModal.bankReviewDesc"),
      "charge_refunded": t("disputeModal.statusChargeRefunded"),
      "warning_needs_response": t("disputeModal.statusWarningNeedsResponse"),
    };
    return messageMap[status] || t("disputeModal.disputeSummary");
  };

  const timeline = [
    { 
      label: t("disputeModal.disputeCreated"), 
      description: t("disputeModal.disputeCreatedDesc"),
      date: dispute.initiated_at, 
      completed: true,
      hasPreview: false
    },
    { 
      label: t("disputeModal.sendEvidence"), 
      description: t("disputeModal.sendEvidenceDesc"),
      date: dispute.evidence_sent_on, 
      completed: dispute.status === "won" || dispute.status === "lost" || dispute.status === "under_review",
      hasPreview: dispute.status === "won" || dispute.status === "lost" || dispute.status === "under_review"
    },
    { 
      label: t("disputeModal.bankReview"), 
      description: t("disputeModal.bankReviewDesc"),
      date: dispute.finalized_on, 
      completed: dispute.status === "won" || dispute.status === "lost",
      hasPreview: false
    },
    { 
      label: t("disputeModal.disputeFinalized"), 
      description: t("disputeModal.disputeFinalizedDesc"),
      date: dispute.status === "won" || dispute.status === "lost" ? dispute.finalized_on : null, 
      completed: dispute.status === "won" || dispute.status === "lost",
      hasPreview: false
    },
  ];

  // Dados derivados para seção "Transaction Data"
  const normalizeGatewayLabel = (gateway?: string | null) => {
    const key = (gateway || "").toLowerCase();
    if (key === "shopify_payments") return "Shopify Payments";
    if (key === "stripe") return "Stripe";
    if (key === "paypal") return "PayPal";
    return gateway || "-";
  };

  const formatGatewayList = (gateways?: string[] | null) => {
    if (!gateways || gateways.length === 0) return "-";
    return gateways.map((g) => normalizeGatewayLabel(g)).join(", ");
  };

  const normalizeCountry = (value?: string | null) => {
    if (!value) return null;
    const v = String(value).trim();
    if (!v) return null;
    return v.toUpperCase();
  };

  const formatCountryName = (value?: string | null) => {
    if (!value) return "-";
    const isCode = /^[A-Z]{2}$/.test(value);
    if (isCode) {
      try {
        const display = new Intl.DisplayNames(
          [i18n.language === "pt" ? "pt" : "en"],
          { type: "region" }
        );
        const name = display.of(value);
        if (name) return name;
      } catch (err) {
        // Se Intl não suportar, cai no fallback
      }
    }
    // Se não for código ou Intl falhar, retorna o valor original capitalizado
    return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
  };

  const authorizationKeyRaw =
    dispute?.chargeback_evidence_id ||
    dispute?.charge ||
    dispute?.authorization ||
    ""; // não usar dispute.id para não coincidir com Dispute ID
  const authorizationKeyDisplay =
    authorizationKeyRaw && String(authorizationKeyRaw).length > 15
      ? `${String(authorizationKeyRaw).slice(0, 15)}...`
      : authorizationKeyRaw || "-";
  const gatewayName = normalizeGatewayLabel(
    dispute?.payment_gateway ||
      dispute?.gateway ||
      dispute?.order?.payment_gateway_names?.[0] ||
      "Shopify Payments"
  );
  const transactionDateRaw =
    dispute?.initiated_at ||
    dispute?.createAt ||
    (dispute as any)?.created_at ||
    dispute?.finalized_on ||
    null;
  const transactionDateDisplay = transactionDateRaw
    ? formatDate(transactionDateRaw)
    : "-";
  const validityDisplay = dispute?.finalized_on
    ? formatDate(dispute.finalized_on)
    : "-";
  const cardCategory =
    dispute?.card_brand ||
    dispute?.order?.payment_details?.credit_card_company ||
    "-";
  const chargeDescription =
    dispute?.reason_desc || dispute?.reason || dispute?.order?.name || "-";
  const paymentSource = (() => {
    if (Array.isArray(dispute?.order?.payment_gateway_names)) {
      return formatGatewayList(dispute.order.payment_gateway_names);
    }
    const single =
      dispute?.payment_gateway ||
      dispute?.gateway ||
      (dispute?.order as any)?.payment_gateway_names ||
      "-";
    return normalizeGatewayLabel(String(single));
  })();
  const cardholderName =
    dispute?.order?.billing_address?.name ||
    dispute?.customer_name ||
    dispute?.order?.customer?.first_name ||
    "-";
  const sourceName = dispute?.order?.source_name || "Shopify";
  const countryRaw =
    dispute?.order?.billing_address?.country_code ||
    dispute?.order?.billing_address?.country ||
    dispute?.order?.shipping_address?.country_code ||
    dispute?.order?.shipping_address?.country ||
    (dispute as any)?.country ||
    dispute?.order?.customer?.default_address?.country_code ||
    dispute?.order?.customer?.default_address?.country ||
    null;
  const countryCode = normalizeCountry(countryRaw);
  const countryDisplay = formatCountryName(countryCode || countryRaw);

  const TrophyIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="16 0 176 192"
      className="w-8 h-8"
      fill="#19976f"
      stroke="none"
      aria-hidden="true"
      focusable="false"
    >
      <g>
        <g data-name="14-trophy">
          <path d="M51.977 63.768C60.283 80.763 79.42 94.745 88 100.4v15.147L53.914 136h84.432L104 115.392V100.4c8.58-5.657 27.717-19.639 36.023-36.634C168.343 60.788 176 26.518 176 8a8 8 0 0 0-8-8H24a8 8 0 0 0-8 8c0 18.518 7.657 52.788 35.977 55.768ZM144 46.192V16h15.382c-1.213 9.581-4.802 24.969-15.382 30.192ZM48 16v30.192C37.419 40.969 33.83 25.577 32.618 16ZM188 136a12.013 12.013 0 0 1-12-12 4 4 0 0 0-8 0 12.013 12.013 0 0 1-12 12 4 4 0 0 0 0 8 12.013 12.013 0 0 1 12 12 4 4 0 0 0 8 0 12.013 12.013 0 0 1 12-12 4 4 0 0 0 0-8Z" />
          <path d="M172 63.087a4 4 0 0 0-4 4 12.013 12.013 0 0 1-12 12 4 4 0 0 0 0 8 12.013 12.013 0 0 1 12 12 4 4 0 0 0 8 0 12.013 12.013 0 0 1 12-12 4 4 0 0 0 0-8 12.013 12.013 0 0 1-12-12 4 4 0 0 0-4-4ZM56 108a4 4 0 0 0-4-4 12.013 12.013 0 0 1-12-12 4 4 0 0 0-8 0 12.013 12.013 0 0 1-12 12 4 4 0 0 0 0 8 12.013 12.013 0 0 1 12 12 4 4 0 0 0 8 0 12.013 12.013 0 0 1 12-12 4 4 0 0 0 4-4ZM48.13 184a8 8 0 0 0 8 8h80a8 8 0 0 0 8-8v-40h-96Z" />
        </g>
      </g>
    </svg>
  );

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} ${i18n.language === "pt" ? "copiado!" : "copied!"}`);
  };

  const gatewayLogos = {
      shopify_payments: {
        logo: <FaShopify />,
        bgClass: 'bg-[#FAFAFA]',
        textClass: 'text-[#90BA45]'
      },
      stripe: {
        logo: <FaStripe />,
        bgClass: 'bg-[#FAFAFA]',
        textClass: 'text-[#6961FF]'
      },
      paypal: {
        logo: <FaPaypal />,
        bgClass: 'bg-[#FAFAFA]',
        textClass: 'text-[#12378C]'
      },
      default: {
      logo: <FaCreditCard />,
      bgClass: 'bg-gray-400/10',
      textClass: 'text-gray-700'
    }
  };
  const gatewayInfo = gatewayLogos[dispute.gateway] || gatewayLogos.default;

  return (
    
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* <DialogContent className="max-w-[90vw] max-h-[90vh] overflow-y-auto p-0"> */}
      <DialogContent className="max-w-[1140px] max-h-[98%] overflow-y-auto p-0">
        {/* Sticky Header */}
        <div className="sticky top-0 z-50 bg-background border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{t("disputeModal.chargeback")}</span>
              <span>&gt;</span>
              <span className="font-medium text-foreground">{dispute.id}</span>
            </div>
            {/* <Button variant="outline" size="sm" className="w-full hover:bg-[#19976F] hover:text-white">
              <Eye className="w-3 h-3 mr-2" />
              Pré-visualizar
            </Button> */}
            <Button variant="outline" size="icon" className="h-8 w-8 hover:bg-[#F1F1F1] hover:text-black" onClick={() => onOpenChange(false)}>
              <span className="w-full hover:bg-[#F1F1F1] hover:text-black">×</span>
            </Button>
          </div>

          {dispute.status === "won" ? (
            <> 
              <div className="font-semibold mb-6 mt-3"  style={{
                  fontSize: '25px'
                }}>
                  {t("disputeModal.disputeResolved")}
              </div>
              <div className="text-sm text-muted-foreground -mt-5 mb-2">
                  {t("disputeModal.congratulations")} &nbsp;&nbsp;
                  <Badge className={getStatusColor(dispute.status)}>
                    {t("disputeModal.won")}
                  </Badge>
              </div>
            </> 
          ) : dispute.status === "lost" ? (
            <>
              <div className="font-semibold mb-6 mt-3"  style={{
                  fontSize: '25px'
                }}>
                  {t("disputeModal.disputeLost")}
              </div>
              <div className="text-sm text-muted-foreground -mt-5 mb-2">
                  {t("disputeModal.unfortunately")} &nbsp;&nbsp;
                  <Badge className={getStatusColor(dispute.status)}>
                    {t("disputeModal.lost")}
                  </Badge>
              </div>
            </>
          ) : <>
              <div className="font-semibold mb-6 mt-3"  style={{
                  fontSize: '25px'
                }}>
                  {t("disputeModal.disputeTimeline")}
              </div>
              <div className="text-sm text-muted-foreground -mt-5 mb-2">
                {t("disputeModal.viewFullProgress")}
              </div>
            </>}
        </div>

        <div className="px-6 pb-6 bg-[#FAFAFA] -mt-5" style={{
            background: '#f1f1f1'
          }}>
          <div className="flex items-start justify-between mt-10 px-8 relative">
            {timeline.map((step, index) => {
              // Select icon based on step index
              const StepIcon = [AlertCircle, Upload, Landmark, CheckCircle][index];
              const isLastStep = index === timeline.length - 1;
              const showTrophy = dispute.status === "won" && isLastStep && step.completed;

              return (
                <div key={index} className="flex flex-col items-center relative flex-1">
                  {/* Connection line to next step */}
                  {index < timeline.length - 1 && (
                    <div className={`absolute top-8 left-[50%] w-full h-0.5 ${
                      // 1. Condição Principal: A linha está completa?
                      step.completed && timeline[index + 1].completed 
                        ? (dispute.status === 'lost' // 2. Se SIM, o status final é 'lost'?
                            ? 'bg-red-500' // Cor vermelha para derrota
                            : 'bg-[#18976F]') // 3. Se NÃO (status é 'won' ou 'resovido'), usa o verde
                        : 'bg-[hsl(115.29_24.34%_73.49%)]' // 4. Se a linha não estiver completa, usa o cinza/mutado
                    }`} style={{ zIndex: 0 }} />
                  )}

                  {/* Circle with icon or checkmark */}
                  <div className={`relative w-16 h-16 rounded-full flex items-center justify-center border-4 bg-background ${
                      step.completed
                          ? (dispute.status === 'lost' 
                              ? 'border-red-500' // Borda VERMELHA para 'lost'
                              : 'border-[#18976F]') // Borda VERDE para 'won'
                          : 'border-[hsl(115.29_24.34%_73.49%)]' // Borda CINZA/MUTADA para não concluído
                    }`} 
                    
                    style={{ zIndex: 1 }}
                  >
                      {step.completed ? (
                        showTrophy ? (
                          <TrophyIcon />
                        ) : isLastStep && dispute.status === 'lost' ? (
                          <XCircle className="w-8 h-8 text-white fill-red-500" />
                        ) : dispute.status === 'lost' ? (
                          <CheckCircle2 className="w-8 h-8 text-white fill-red-500" /> // Preenchimento VERMELHO para 'lost'
                        ) : (
                          <CheckCircle2 className="w-8 h-8 text-white fill-[#18976F]" /> // Preenchimento VERDE para 'won'
                        )
                      ) : (
                        <StepIcon className="w-6 h-6 text-muted-foreground" />
                      )}
                  </div>

                  {/* Step info */}
                  <div className="flex flex-col items-center text-center mt-4 max-w-[200px]">
                    <h3 className={`font-semibold mb-1 text-sm ${
                      step.completed ? "text-foreground" : "text-muted-foreground"
                    }`}>
                      {step.label}
                    </h3>

                    <p className={`text-xs mb-2 ${
                      step.completed ? "text-muted-foreground" : "text-muted-foreground/70 "
                    }`}>
                      {step.description}
                    </p>

                    {/* Date or Preview button */}
                    {step.date && !step.hasPreview ? (
                      <p className="text-xs text-muted-foreground/60">
                        {formatDate(step.date)}
                      </p>
                    ) : step.hasPreview && step.date ? (
                        <div className="bg-muted/50 rounded-lg p-3 space-y-2 -mt-3">
                          <p className="text-xs text-muted-foreground/60">
                            {formatDate(step.date)}
                          </p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full hover:bg-[#19976F] hover:text-white"
                            onClick={() => {
                              try {
                                const pdfData = prepareDisputeForPDF(dispute, trackingData);
                                generateDisputePDF(pdfData, trackingData);
                                toast.success(t("disputeModal.pdfGeneratedSuccess"));
                              } catch (error) {
                                console.error("Error generating PDF:", error);
                                toast.error(t("disputeModal.pdfGenerationError"));
                              }
                            }}
                          >
                            <Eye className="w-3 h-3 mr-2" />
                            {t("disputeModal.preview")} PDF
                          </Button>
                        </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Two Column Layout */}
        {dispute.status === "needs_response" && !dispute.evidence_sent_on && !showSummary ? (
          // Se a disputa está apenas criada, mostra seção de envio de evidências
          <div className="mt-8 p-6" style={{
            marginTop: '-40px',
            background: '#f1f1f1'
          }}>
            <div className="border rounded-lg p-6 bg-background max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold">{t("disputeModal.sendAdditionalEvidence")}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t("disputeModal.exampleClientEmail")}
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="hover:bg-[#19976F] hover:text-white"
                  onClick={() => setShowSummary(true)}
                >
                  <Eye className="w-4 h-4 mr-2"/>
                  {t("disputeModal.viewDisputeSummary")}
                </Button>

              </div>

              <div className="space-y-6">
                {/* Comunicação com o cliente */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <h4 className="text-sm font-medium">{t("disputeModal.customerCommunication")}</h4>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-white hover:text-white">
                            <Info className="h-3 w-3 text-muted-foreground" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{t("disputeModal.sendCustomerEvidenceTooltip")}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="border-2 border-dashed rounded-lg p-12 bg-red/30 hover:bg-red/50 transition-colors cursor-pointer" style={{background: '#F6F8FA'}}>
                    <div className="flex flex-col items-center justify-center text-center">
                      <div className="mb-4 p-3 rounded-full bg-background">
                        <Upload className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <p className="text-sm font-medium mb-1">{t("disputeModal.clickToUpload")}</p>
                      <p className="text-xs text-muted-foreground mb-1">
                        {t("disputeModal.supportedFormats")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t("disputeModal.uploadUpToFive")}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Informações de rastreamento */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <h4 className="text-sm font-medium">{t("disputeModal.trackingInformation")}</h4>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-white hover:text-white">
                            <Info className="h-3 w-3 text-muted-foreground" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{t("disputeModal.sendTrackingTooltip")}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="border-2 border-dashed rounded-lg p-12 bg-red/30 hover:bg-red/50 transition-colors cursor-pointer" style={{background: '#F6F8FA'}}>
                    <div className="flex flex-col items-center justify-center text-center">
                      <div className="mb-4 p-3 rounded-full bg-background">
                        <Upload className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <p className="text-sm font-medium mb-1">{t("disputeModal.clickToUpload")}</p>
                      <p className="text-xs text-muted-foreground mb-1">
                        {t("disputeModal.supportedFormats")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t("disputeModal.uploadUpToFive")}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Evidências adicionais */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <h4 className="text-sm font-medium">{t("disputeModal.additionalEvidence")}</h4>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-white hover:text-white">
                            <Info className="h-3 w-3 text-muted-foreground" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{t("disputeModal.sendAdditionalEvidenceTooltip")}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="border-2 border-dashed rounded-lg p-12 bg-red/30 hover:bg-red/50 transition-colors cursor-pointer" style={{background: '#F6F8FA'}}>
                    <div className="flex flex-col items-center justify-center text-center">
                      <div className="mb-4 p-3 rounded-full bg-background">
                        <Upload className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <p className="text-sm font-medium mb-1">{t("disputeModal.clickToUpload")}</p>
                      <p className="text-xs text-muted-foreground mb-1">
                        {t("disputeModal.supportedFormats")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t("disputeModal.uploadUpToFive")}
                      </p>
                    </div>
                </div>

                {/* PDF Test Scenarios 
                <PDFTestScenarios />*/}
              </div>
            </div>
          </div>
          </div>
        ) : (
          // Se a disputa está em "Enviar Evidências" ou além, mostra todo o conteúdo
          <div className="mt-8 grid grid-cols-[70%_30%] gap-4 bg-red border-gray-200 rounded-lg p-6" style={{
            marginTop: '-40px',
            background: '#f1f1f1'
          }}>
          {/* Left Column - Dispute Summary & Order Data */}
          <div className="space-y-4">
            {/* Dispute Summary Section */}
            <div className="border rounded-lg p-6 bg-background">
              <h3 className="text-lg font-semibold mb-6">{t("disputeModal.disputeSummary")}</h3>
              <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                {/* Row 1 */}
                <div>
                  <p className="text-sm text-muted-foreground mb-2">{t("disputeModal.disputeId")}</p>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-muted-foreground text-sm">{dispute.id}</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 hover:bg-[#F1F1F1] hover:text-black"
                      onClick={() => copyToClipboard(dispute.id, t("disputeModal.disputeIdCopied"))}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-2">{t("disputeModal.source")}</p>
                  <p className="font-medium text-muted-foreground text-sm">Shopify</p>
                </div>

                {/* Row 2 */}
                <div>
                  <p className="text-sm text-muted-foreground mb-2">{t("disputeModal.transactionId")}</p>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-muted-foreground text-sm">
                      {dispute.charge ? `${dispute.charge.substring(0, 12)}...` : "-"}
                    </p>
                    {dispute.charge && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => copyToClipboard(dispute.charge, t("disputeModal.transactionIdCopied"))}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-2">{t("disputeModal.bin")}</p>
                  <p className="font-medium text-muted-foreground text-sm">-</p>
                </div>

                {/* Row 3 */}
                <div>
                  <p className="text-sm text-muted-foreground mb-2">{t("disputeModal.openedOn")}</p>
                  <p className="font-medium text-muted-foreground text-sm">{formatDate(dispute.created)}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-2">Status</p>
                  <Badge className={getStatusColor(dispute.status)}>
                    {getStatusLabel(dispute.status)}
                  </Badge>
                </div>

                {/* Row 4 */}
                <div>
                  <p className="text-sm text-muted-foreground mb-2">{t("disputeModal.responseDeadline")}</p>
                  <p className="font-medium text-muted-foreground text-sm">
                    {dispute.evidence_due_by ? formatDate(dispute.evidence_due_by) : "-"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-2">{t("disputeModal.state")}</p>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span className="font-medium text-muted-foreground text-sm">{t("disputeModal.managed")}</span>
                  </div>
                </div>

                {/* Row 5 */}
                <div>
                  <p className="text-sm text-muted-foreground mb-2">{t("disputeModal.amount")}</p>
                  <p className="font-medium text-muted-foreground text-sm">
                    {new Intl.NumberFormat(i18n.language === 'pt' ? 'pt-BR' : 'en-US', {
                      style: 'currency',
                      currency: dispute.currency || 'USD'
                    }).format(dispute.original_amount)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-2">{t("disputeModal.reason")}</p>
                  <p className="font-medium text-muted-foreground text-sm">{dispute.reasonTranslated || "product_not_received"}</p>
                </div>
              </div>
            </div>

            {/* Order Data Section */}
            <div className="border rounded-lg p-6 bg-background">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">{t("disputeModal.orderData")}</h3>
                {/* <Store className="w-5 h-5 text-muted-foreground" /> */}
              </div>

              <div className="space-y-6">
                {/* Email */}
                <div>
                  <p className="text-sm text-muted-foreground mb-2">{t("disputeModal.email")}</p>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <p className="font-medium text-muted-foreground text-sm">{dispute.order?.customer_email || "-"}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-x-12 gap-y-4">
                  {/* Order ID & Purchase Date */}
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">{t("disputeModal.orderId")}</p>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-primary text-sm" style={{ color:'#18976F' }}>{dispute.pedidoId || "1370"}</p>
                      <ExternalLink className="w-3 h-3 text-muted-foreground" />
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-2">{t("disputeModal.purchaseDate")}</p>
                    <p className="font-medium text-muted-foreground text-sm">{dispute.createAt ? formatDate(dispute.createAt) : "-"}</p>
                  </div>

                  {/* Orders Count & Order Amount */}
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">{t("disputeModal.itemQuantity")}</p>
                    <p className="font-medium text-muted-foreground text-sm">{ dispute.ordersQnt || "0"}</p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-2">{t("disputeModal.orderAmount")}</p>
                    <p className="font-medium text-muted-foreground text-sm">
                      {new Intl.NumberFormat(i18n.language === 'pt' ? 'pt-BR' : 'en-US', {
                        style: 'currency',
                        currency: dispute.currency || 'GBP'
                      }).format(dispute.original_amount )}
                    </p>
                  </div>

                  {/* Customer Name & Order Status */}
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">{t("disputeModal.customerName")}</p>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-muted-foreground text-sm">{dispute.customer_name || "Katarzyna Olszewska"}</p>
                      <ExternalLink className="w-3 h-3 text-muted-foreground" />
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-2">{t("disputeModal.orderStatus")}</p>
                    <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                      {t("disputeModal.paid")}
                    </Badge>
                  </div>
                </div>

                {/* Products Section */}
                <div className="space-y-3 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-muted-foreground" />
                    <h4 className="font-semibold text-sm">{t("disputeModal.products")}</h4>
                  </div>
                  
                  {dispute.products && dispute.products.map((produto: { name: string, price: string }, index: number) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <p className="text-muted-foreground truncate">{produto.name}</p>
                      <div className="flex items-center gap-4">
                        {/* A coluna de preço final é preenchida com o preço do item */}
                        <span className="font-medium">
                        {new Intl.NumberFormat(i18n.language === 'pt' ? 'pt-BR' : 'en-US', {
                          style: 'currency',
                          currency: dispute.currency || 'GBP'
                        }).format(parseFloat(produto.price) )} {/* <-- Alteração aqui: adicionado parseFloat() */}
                        </span>
                      </div>
                    </div>
                  ))}

                  <div className="flex items-center justify-between pt-2 border-t">
                    <p className="font-semibold text-sm" style={{ color:'#18976F' }}>{t("disputeModal.totalValue")}</p>
                    <p className="font-semibold" style={{ color:'#18976F' }}>
                      {new Intl.NumberFormat(i18n.language === 'pt' ? 'pt-BR' : 'en-US', {
                        style: 'currency',
                        currency: dispute.currency || 'GBP'
                      }).format(dispute.totalProductsValue )}
                    </p>
                  </div>
                </div>

                {/* Shipping Address */}
                {/* <div className="space-y-3 pt-4 border-t">
                  <h4 className="font-semibold text-sm">Endereço de Cobrança</h4>
                  <div className="grid grid-cols-2 gap-x-12 gap-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Nome</p>
                      <p className="text-sm text-muted-foreground">Katarzyna Olszewska</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">CEP</p>
                      <p className="text-sm text-muted-foreground">-</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Endereço 01</p>
                      <p className="text-sm text-muted-foreground">47 Old Meadow Walk</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">País</p>
                      <p className="text-sm text-muted-foreground">United Kingdom</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Endereço 02</p>
                      <p className="text-sm text-muted-foreground">-</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Telefone</p>
                      <p className="text-sm text-muted-foreground">-</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Cidade</p>
                      <p className="text-sm text-muted-foreground">Wishaw</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Estado</p>
                      <p className="text-sm text-muted-foreground">Scotland</p>
                    </div>
                  </div>
                </div> */}

                {/* Shipping Address */}
                {/* <div className="space-y-3 pt-4 border-t">
                  <h4 className="font-semibold text-sm">Endereço de Entrega</h4>
                  <div className="grid grid-cols-2 gap-x-12 gap-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Nome</p>
                      <p className="text-sm text-muted-foreground">
                        {dispute.order?.shipping_address?.name || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">CEP</p>
                      <p className="text-sm text-muted-foreground">
                        {dispute.order?.shipping_address?.zip || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Endereço</p>
                      <p className="text-sm text-muted-foreground">
                        {dispute.order?.shipping_address?.address1 || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">País</p>
                      <p className="text-sm text-muted-foreground">
                        {dispute.order?.shipping_address?.country_code || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Cidade</p>
                      <p className="text-sm text-muted-foreground">
                        {dispute.order?.shipping_address?.city || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Estado</p>
                      <p className="text-sm text-muted-foreground">
                        {dispute.order?.shipping_address?.province || "-"}
                      </p>
                    </div>
                    {dispute.order?.shipping_address?.phone && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Telefone</p>
                        <p className="text-sm text-muted-foreground">
                          {dispute.order.shipping_address.phone}
                        </p>
                      </div>
                    )}
                  </div>
                </div> */}
              </div>
            </div>

            {/* Transaction Data Section */}
            <div className="border rounded-lg p-6 bg-background">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">{t("disputeModal.transactionData")}</h3>
                {/* <Store className="w-5 h-5 text-muted-foreground" /> */}
              </div>

              <div className="grid grid-cols-2 gap-x-12 gap-y-4">
                {/* Authorization Key */}
                <div>
                  <p className="text-sm text-muted-foreground mb-2">{t("disputeModal.authorizationKey")}</p>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-muted-foreground text-sm">
                      {authorizationKeyDisplay}
                    </p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 hover:bg-[#F1F1F1] hover:text-black"
                      onClick={() =>
                        copyToClipboard(
                          authorizationKeyRaw || "-",
                          t("disputeModal.authorizationKeyCopied")
                        )
                      }
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-2">{t("disputeModal.gateway")}</p>
                  <p className="font-medium text-muted-foreground text-sm">{gatewayName}</p>
                </div>

                {/* Transaction Date */}
                <div>
                  <p className="text-sm text-muted-foreground mb-2">{t("disputeModal.transactionDate")}</p>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-muted-foreground text-sm">{transactionDateDisplay}</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 hover:bg-[#F1F1F1] hover:text-black"
                      onClick={() =>
                        copyToClipboard(
                          transactionDateDisplay,
                          t("disputeModal.transactionDateCopied")
                        )
                      }
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-2">{t("disputeModal.validity")}</p>
                  <p className="font-medium text-muted-foreground text-sm">{validityDisplay}</p>
                </div>

                {/* Card Category */}
                <div>
                  <p className="text-sm text-muted-foreground mb-2">{t("disputeModal.cardCategory")}</p>
                  <p className="font-medium text-muted-foreground text-sm">{cardCategory}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-2">{t("disputeModal.country")}</p>
                  <p className="font-medium text-muted-foreground text-sm">{countryDisplay}</p>
                </div>

                {/* Charge Descriptor */}
                <div>
                  <p className="text-sm text-muted-foreground mb-2">{t("disputeModal.chargeDescription")}</p>
                  <p className="font-medium text-muted-foreground text-sm">{chargeDescription}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-2">{t("disputeModal.paymentSource")}</p>
                  <p className="font-medium text-muted-foreground text-sm">{paymentSource}</p>
                </div>

                {/* Card Name */}
                <div>
                  <p className="text-sm text-muted-foreground mb-2">{t("disputeModal.cardholderName")}</p>
                  <p className="font-medium text-muted-foreground text-sm">{cardholderName}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-2">{t("disputeModal.source")}</p>
                  <p className="font-medium text-muted-foreground text-sm">{sourceName}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Two Blocks Stacked */}
          <div className="space-y-4">
            {/* Chargemind Evidence Block */}
            <div className="border rounded-lg p-4 bg-background" style={{marginRight: '15px', paddingBottom: '0px'}}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 pl-1">
                  <div className="flex justify-center">
                    <div className="h-6 w-6 rounded-full bg-red-500/10 flex items-center justify-center">
                      <div 
                        className={`
                          h-8 w-8 rounded 
                          ${gatewayInfo.bgClass}
                          flex items-center justify-center text-center
                        `}
                      >
                      <span className={`${gatewayInfo.textClass} text-xl`}>
                        {gatewayInfo.logo}
                      </span>
                      </div>
                    </div>
                  </div>
                  <a 
                      href={`https://${urlLoja}`} 
                      target="_blank"
                      rel="noopener noreferrer"
                  >
                      <h3
                        className="text-sm text-muted-foreground ml-1 max-w-[240px] whitespace-nowrap overflow-hidden"
                        style={{
                          WebkitMaskImage: "linear-gradient(90deg, #000 75%, transparent)",
                          maskImage: "linear-gradient(90deg, #000 75%, transparent)"
                        }}
                        title={`https://${urlLoja}`}
                      >
                          https://{urlLoja}
                      </h3>
                  </a>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 hover:bg-white hover:text-white"
                      >
                        <span className="inline-flex items-center">
                          <Info className="h-3 w-3 text-muted-foreground" />
                        </span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left">
                      <p>{t("disputeModal.shopifyUrlTooltip")}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            <div className="border rounded-lg p-4 bg-background" style={{marginRight: '15px'}}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div
                    className="
                      h-8 w-8 rounded-full border border-[#19976f]/30
                      bg-[#19976f]/10 flex items-center justify-center
                    "
                  >
                    <SearchCheck className="w-4 h-4 text-[#19976F]" />
                  </div>
                  <h3 className="font-semibold text-sm">
                    {t("disputeModal.chargemindEvidence")}
                  </h3>
                </div>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 hover:bg-white hover:text-white"
                      >
                        <span className="inline-flex items-center">
                          <Info className="h-3 w-3 text-muted-foreground" />
                        </span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left">
                      <p>{t("disputeModal.reviewEvidenceTooltip")}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              {/* Document Info */}
              <div className="bg-muted/50 rounded-lg p-1 space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-8 h-8 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">690183539d93633ded7dd307...</p>
                    <p className="text-xs text-muted-foreground">November 4 2025</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full hover:bg-[#19976F] hover:text-white"
                  onClick={() => {
                    try {
                      const pdfData = prepareDisputeForPDF(dispute, trackingData);
                      generateDisputePDF(pdfData, trackingData);
                      toast.success(t("disputeModal.pdfGeneratedSuccess"));
                    } catch (error) {
                      console.error("Error generating PDF:", error);
                      toast.error(t("disputeModal.pdfGenerationError"));
                    }
                  }}
                >
                  <Eye className="w-3 h-3 mr-2" />
                  {t("disputeModal.preview")}
                </Button>
              </div>
            </div>

            {/* Fulfillment Journey Block */}
            <div className="border rounded-lg p-4 bg-background" style={{marginRight: '15px'}}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div
                    className="
                      h-8 w-8 rounded-full border border-[#19976f]/30
                      bg-[#19976f]/10 flex items-center justify-center
                    "
                  >
                    <Package className="w-4 h-4 text-[#18976F]" />
                  </div>
                  <h3 className="font-semibold text-sm">
                    {t("disputeModal.deliveryStatus")}
                  </h3>
                </div>
                {dispute?.order?.tracking_url && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 px-2 text-xs text-muted-foreground hover:bg-[#19976F] hover:text-white hover:bg-[#F1F1F1] hover:text-black"
                    onClick={() => window.open(dispute.order.tracking_url, '_blank')}
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                )}
              </div>

              {/* Tracking Number */}
              {dispute?.order?.tracking_number ? (
                <div className="space-y-2 mb-4 p-3 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground">{t("disputeModal.trackingCode")}</p>
                  <div className="flex items-center gap-2"> {/* justify-between foi removido */}
                    <p className="text-sm font-mono font-medium truncate">
                      {dispute.order.tracking_number}
                    </p>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 flex-shrink-0 hover:bg-[#F1F1F1] hover:text-black"
                      onClick={() => copyToClipboard(dispute.order.tracking_number, t("disputeModal.trackingCodeCopied"))}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  {trackingData && (
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-muted-foreground">{t("disputeModal.carrier")}</span>
                      <span className="text-xs font-medium">{trackingData.carrier}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Package className="w-8 h-8 text-muted-foreground mb-2" />
                  <p className="text-xs text-muted-foreground">
                    {t("disputeModal.trackingNotAvailable")}
                  </p>
                </div>
              )}

              {/* Timeline */}
              <div className="space-y-1">
                {loadingTracking ? (
                  // Loading skeleton
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <Skeleton className="w-2 h-2 rounded-full" />
                          {i < 3 && <Skeleton className="w-px h-12 mt-1" />}
                        </div>
                        <div className="flex-1 space-y-1">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-32" />
                          <Skeleton className="h-3 w-28" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : trackingData && trackingData.events.length > 0 ? (
                  // Real tracking data
                  trackingData.events.map((event, idx) => {
                    const isDelivered = event.stage === 'delivered';
                    const isInTransit = event.stage === 'transit';
                    const isFirst = idx === 0;

                    return (
                      <div key={idx} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className={`w-2.5 h-2.5 rounded-full flex items-center justify-center ${
                            isDelivered ? 'bg-green-500' : 
                            isInTransit && isFirst ? 'bg-blue-500' : 
                            'bg-muted-foreground/30'
                          }`}>
                            {isDelivered && <CheckCircle2 className="w-2 h-2 text-white" />}
                          </div>
                          {idx < trackingData.events.length - 1 && (
                            <div className="w-px h-14 bg-border mt-1" />
                          )}
                        </div>
                        <div className="flex-1 pb-3">
                          <p className={`text-xs font-medium ${isFirst ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {event.description}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {new Date(event.date).toLocaleString(i18n.language === 'pt' ? 'pt-BR' : 'en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                          {event.location && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3 text-muted-foreground" />
                              <p className="text-xs text-muted-foreground">{event.location}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  // No tracking data available
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Clock className="w-8 h-8 text-muted-foreground mb-2" />
                    <p className="text-xs text-muted-foreground">
                      {t("disputeModal.trackingDataNotAvailable")}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
