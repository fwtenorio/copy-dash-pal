import { DashboardLayout } from "@/components/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import { mockDisputes } from "@/data/mockDisputesData";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function Charges() {
  const { t } = useTranslation();
  const charges = mockDisputes;

  const getStatusTranslation = (status: string): string => {
    const statusMap: Record<string, string> = {
      won: t("charges.statusWon"),
      lost: t("charges.statusLost"),
      under_review: t("charges.statusUnderReview"),
    };
    return statusMap[status] || status;
  };

  const getStatusBadgeClasses = (status: string): string => {
    const statusMap: Record<string, string> = {
      won: "bg-[#E7F7EE] text-green-600 border-[#C8EBD5]",
      lost: "bg-[#FEE7E7] text-red-600 border-[#FCD0D0]",
      under_review: "bg-[#fbf3e9] text-yellow-600 border-[#E6DBCB]",
    };
    return statusMap[status] || "";
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader 
          title={t("charges.title")} 
          subtitle={t("charges.subtitle")} 
        />
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">
                {t("charges.customerCharges")}
              </CardTitle>
              <p className="text-sm text-muted-foreground pt-2">
                {t("charges.customerChargesDesc")}
              </p>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("charges.id")}</TableHead>
                    <TableHead>{t("charges.order")}</TableHead>
                    <TableHead>{t("charges.amount")}</TableHead>
                    <TableHead>{t("charges.status")}</TableHead>
                    <TableHead>{t("charges.gateway")}</TableHead>
                    <TableHead>{t("charges.reason")}</TableHead>
                    <TableHead>{t("charges.date")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {charges.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        {t("charges.noChargesFound")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    charges.map(charge => (
                      <TableRow key={charge.id}>
                        <TableCell className="font-mono text-xs">{charge.id}</TableCell>
                        <TableCell>{charge.pedidoId || charge.order_id}</TableCell>
                        <TableCell>$ {Number(charge.amount).toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline"
                            className={getStatusBadgeClasses(charge.status)}
                          >
                            {getStatusTranslation(charge.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>{charge.gateway}</TableCell>
                        <TableCell>{charge.reasonTranslated}</TableCell>
                        <TableCell>
                          {charge.initiated_at && new Date(charge.initiated_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
