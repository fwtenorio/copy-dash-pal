import { DashboardLayout } from "@/components/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "react-i18next";

export default function Avoid() {
  const { t } = useTranslation();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader 
          title={t("sidebar.dashboard") === "Dashboard" ? "Avoid" : "Evitar"} 
          subtitle={t("sidebar.dashboard") === "Dashboard" ? "Avoid losses with preventive intelligence." : "Evite perdas com inteligência preventiva."} 
        />
      
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">
                {t("sidebar.dashboard") === "Dashboard" ? "Payment Processors" : "Processadores de Pagamento"}
              </CardTitle>
              <p className="text-sm text-muted-foreground pt-2">
                {t("sidebar.dashboard") === "Dashboard" 
                  ? "Connect your payment processors to fully automate them with Chargemind Automation."
                  : "Conecte seus processadores de pagamento para automatizá-los completamente com o Chargemind Automation."}
              </p>
              <div className="flex items-center gap-2 text-sm pt-2">
                <span className="text-primary">✨ {t("sidebar.dashboard") === "Dashboard" ? "New!" : "Novo!"}</span>
                <span className="text-muted-foreground">
                  {t("sidebar.dashboard") === "Dashboard"
                    ? "You can add more than one integration (platform or payment processor) of the same type."
                    : "Você pode adicionar mais de uma integração (plataforma ou processador de pagamentos) do mesmo tipo."}
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
