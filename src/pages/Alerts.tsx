import { DashboardLayout } from "@/components/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "react-i18next";

export default function Alerts() {
  const { t } = useTranslation();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader 
          title={t("alerts.title")} 
          subtitle={t("alerts.subtitle")} 
        />
      
        <div className="space-y-8">
        {/* Payment Processors Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{t("alerts.paymentProcessors")}</CardTitle>
            <p className="text-sm text-muted-foreground pt-2">
              {t("alerts.paymentProcessorsDesc")}
            </p>
            <div className="flex items-center gap-2 text-sm pt-2">
              <span className="text-primary">{t("alerts.newFeature")}</span>
              <span className="text-muted-foreground">
                {t("alerts.newFeatureDesc")}
              </span>
            </div>
          </CardHeader>
          <CardContent>
          </CardContent>
        </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}