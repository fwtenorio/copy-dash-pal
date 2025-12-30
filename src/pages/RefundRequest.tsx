import { DashboardLayout } from "@/components/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import {
  FileText,
  ShieldCheck,
  BellRing,
  UploadCloud,
  Clock3,
  CheckCircle2,
  XCircle,
  Link,
} from "lucide-react";

export default function RefundRequest() {
  const { t } = useTranslation();

  const statusCards = [
    { label: t("refundRequest.pending"), value: "08", icon: Clock3, tone: "bg-amber-50 text-amber-700" },
    { label: t("refundRequest.inReview"), value: "04", icon: BellRing, tone: "bg-blue-50 text-blue-700" },
    { label: t("refundRequest.approved"), value: "03", icon: CheckCircle2, tone: "bg-emerald-50 text-emerald-700" },
    { label: t("refundRequest.declined"), value: "01", icon: XCircle, tone: "bg-rose-50 text-rose-700" },
  ];

  const nextSteps = [
    { title: t("refundRequest.uploadEvidence"), description: t("refundRequest.uploadEvidenceDesc"), icon: UploadCloud },
    { title: t("refundRequest.notifyCustomer"), description: t("refundRequest.notifyCustomerDesc"), icon: BellRing },
    { title: t("refundRequest.syncProcessor"), description: t("refundRequest.syncProcessorDesc"), icon: Link },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader title={t("refundRequest.title")} subtitle={t("refundRequest.subtitle")} />

        <div className="grid gap-6 xl:grid-cols-2">
          <Card className="border-[#E5E7EB]">
            <CardHeader className="space-y-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-xl">{t("refundRequest.quickActions")}</CardTitle>
                <Badge className="bg-emerald-50 text-emerald-700 border-0">{t("refundRequest.betaLabel")}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{t("refundRequest.quickActionsDesc")}</p>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-[#E5E7EB] p-4 space-y-3 hover:border-[#19976F] transition-colors">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-md bg-emerald-50 text-emerald-700">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold text-[#111827]">{t("refundRequest.startRequest")}</p>
                    <p className="text-sm text-muted-foreground">{t("refundRequest.startRequestDesc")}</p>
                  </div>
                </div>
                <Button variant="outline" className="w-full justify-center border-[#19976F] text-[#19976F] hover:bg-[#19976F] hover:text-white">
                  {t("refundRequest.startRequestCta")}
                </Button>
              </div>

              <div className="rounded-lg border border-[#E5E7EB] p-4 space-y-3 hover:border-[#19976F] transition-colors">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-md bg-blue-50 text-blue-700">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold text-[#111827]">{t("refundRequest.viewPolicy")}</p>
                    <p className="text-sm text-muted-foreground">{t("refundRequest.viewPolicyDesc")}</p>
                  </div>
                </div>
                <Button variant="ghost" className="w-full justify-center text-[#111827] hover:bg-[#F3F4F6]">
                  {t("refundRequest.viewPolicyCta")}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#E5E7EB]">
            <CardHeader className="space-y-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-xl">{t("refundRequest.statusOverview")}</CardTitle>
                <Badge className="bg-[#F3F4F6] text-[#4B5563] border-0">{t("refundRequest.updatedToday")}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{t("refundRequest.statusOverviewDesc")}</p>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {statusCards.map((card) => (
                  <div
                    key={card.label}
                    className="rounded-lg border border-[#E5E7EB] bg-white px-4 py-3 flex items-center gap-3"
                  >
                    <div className={`p-2 rounded-md ${card.tone}`}>
                      <card.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">{card.label}</p>
                      <p className="text-lg font-semibold text-[#111827]">{card.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-[#E5E7EB]">
          <CardHeader className="space-y-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-xl">{t("refundRequest.nextSteps")}</CardTitle>
              <Badge className="bg-[#19976F] text-white border-0">{t("refundRequest.guided")}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{t("refundRequest.nextStepsDesc")}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {nextSteps.map((step) => (
              <div
                key={step.title}
                className="flex items-start gap-4 p-4 rounded-lg border border-[#E5E7EB] bg-white"
              >
                <div className="p-2 rounded-md bg-[#F3F4F6] text-[#111827]">
                  <step.icon className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-[#111827]">{step.title}</p>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}

            <div className="rounded-lg border border-dashed border-[#19976F] bg-[#F8FFFB] p-4 text-sm text-[#0F172A]">
              <p className="font-semibold text-[#0F172A] mb-1">{t("refundRequest.comingSoonTitle")}</p>
              <p className="text-muted-foreground">{t("refundRequest.comingSoon")}</p>
            </div>

          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
