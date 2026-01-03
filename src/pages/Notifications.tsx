import { DashboardLayout } from "@/components/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/safeClient";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Bell, Shield, Mail, FileText, AlertTriangle, Plus, RefreshCcw, XCircle, Hand, ShieldAlert, Ban, Clock } from "lucide-react";

interface NotificationSetting {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
  icon: React.ReactNode;
}

export default function Notifications() {
  const { t } = useTranslation();
  const [conflictSettings, setConflictSettings] = useState<NotificationSetting[]>([]);
  const [alertSettings, setAlertSettings] = useState<NotificationSetting[]>([]);

  // Update translations when language changes
  useEffect(() => {
    setConflictSettings([
      {
        id: "new-dispute-created",
        title: t("notifications.newDisputeCreated"),
        description: t("notifications.newDisputeCreatedDesc"),
        enabled: conflictSettings.find(s => s.id === "new-dispute-created")?.enabled || false,
        icon: <Plus className="h-5 w-5 text-[#19976F]" />,
      },
      {
        id: "auto-refund-executed",
        title: t("notifications.autoRefundExecuted"),
        description: t("notifications.autoRefundExecutedDesc"),
        enabled: conflictSettings.find(s => s.id === "auto-refund-executed")?.enabled || false,
        icon: <RefreshCcw className="h-5 w-5 text-[#19976F]" />,
      },
      {
        id: "dispute-win",
        title: t("notifications.disputeWin"),
        description: t("notifications.disputeWinDesc"),
        enabled: conflictSettings.find(s => s.id === "dispute-win")?.enabled || false,
        icon: <Shield className="h-5 w-5 text-[#19976F]" />,
      },
      {
        id: "dispute-lost",
        title: t("notifications.disputeLost"),
        description: t("notifications.disputeLostDesc"),
        enabled: conflictSettings.find(s => s.id === "dispute-lost")?.enabled || false,
        icon: <XCircle className="h-5 w-5 text-[#19976F]" />,
      },
      {
        id: "manual-action-required",
        title: t("notifications.manualActionRequired"),
        description: t("notifications.manualActionRequiredDesc"),
        enabled: conflictSettings.find(s => s.id === "manual-action-required")?.enabled || false,
        icon: <Hand className="h-5 w-5 text-[#19976F]" />,
      },
      {
        id: "high-risk-order",
        title: t("notifications.highRiskOrder"),
        description: t("notifications.highRiskOrderDesc"),
        enabled: conflictSettings.find(s => s.id === "high-risk-order")?.enabled || false,
        icon: <ShieldAlert className="h-5 w-5 text-[#19976F]" />,
      },
      {
        id: "evidence-submitted",
        title: t("notifications.evidenceSubmitted"),
        description: t("notifications.evidenceSubmittedDesc"),
        enabled: conflictSettings.find(s => s.id === "evidence-submitted")?.enabled || false,
        icon: <FileText className="h-5 w-5 text-[#19976F]" />,
      },
      {
        id: "weekly-summary",
        title: t("notifications.weeklySummary"),
        description: t("notifications.weeklySummaryDesc"),
        enabled: conflictSettings.find(s => s.id === "weekly-summary")?.enabled || false,
        icon: <Mail className="h-5 w-5 text-[#19976F]" />,
      },
    ]);

    setAlertSettings([
      {
        id: "new-alert-blocked",
        title: t("notifications.newAlertBlocked"),
        description: t("notifications.newAlertBlockedDesc"),
        enabled: alertSettings.find(s => s.id === "new-alert-blocked")?.enabled || false,
        icon: <AlertTriangle className="h-5 w-5 text-orange-500" />,
      },
      {
        id: "alert-resolution-failed",
        title: t("notifications.alertResolutionFailed"),
        description: t("notifications.alertResolutionFailedDesc"),
        enabled: alertSettings.find(s => s.id === "alert-resolution-failed")?.enabled || false,
        icon: <Ban className="h-5 w-5 text-orange-500" />,
      },
      {
        id: "alert-expiration-warning",
        title: t("notifications.alertExpirationWarning"),
        description: t("notifications.alertExpirationWarningDesc"),
        enabled: alertSettings.find(s => s.id === "alert-expiration-warning")?.enabled || false,
        icon: <Clock className="h-5 w-5 text-orange-500" />,
      },
      {
        id: "alert-weekly-report",
        title: t("notifications.alertWeeklyReport"),
        description: t("notifications.alertWeeklyReportDesc"),
        enabled: alertSettings.find(s => s.id === "alert-weekly-report")?.enabled || false,
        icon: <Mail className="h-5 w-5 text-orange-500" />,
      },
    ]);
  }, [t]);

  useEffect(() => {
    fetchNotificationSettings();
  }, []);

  const fetchNotificationSettings = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error(t("notifications.userNotAuthenticated"));
      }

      const { data: currentUser, error: currentUserError } = await supabase
        .from('users')
        .select('client_id')
        .eq('id', user.id)
        .single();

      if (currentUserError || !currentUser?.client_id) {
        console.error("Error fetching client_id:", currentUserError);
        return;
      }

      const { data: settings, error: settingsError } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('client_id', currentUser.client_id)
        .maybeSingle();

      if (settingsError) {
        console.error("Error fetching settings:", settingsError);
        return;
      }

      if (settings) {
        setConflictSettings(prev => prev.map(setting => {
          if (setting.id === "dispute-win") return { ...setting, enabled: settings.disputa_ganha };
          if (setting.id === "evidence-submitted") return { ...setting, enabled: settings.provas_apresentadas };
          if (setting.id === "weekly-summary") return { ...setting, enabled: settings.resumo_semanal };
          return setting;
        }));

        setAlertSettings(prev => prev.map(setting => {
          if (setting.id === "new-alert-blocked") return { ...setting, enabled: settings.novo_alerta_impedido };
          if (setting.id === "alert-weekly-report") return { ...setting, enabled: settings.relatorio_semanal_alertas };
          return setting;
        }));
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  };

  const saveNotificationSetting = async (settingId: string, enabled: boolean) => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error(t("notifications.userNotAuthenticated"));
      }

      const { data: currentUser, error: currentUserError } = await supabase
        .from('users')
        .select('client_id')
        .eq('id', user.id)
        .single();

      if (currentUserError || !currentUser?.client_id) {
        throw new Error(t("notifications.errorFetchingUserData"));
      }

      const columnMap: { [key: string]: string } = {
        "dispute-win": "disputa_ganha",
        "evidence-submitted": "provas_apresentadas",
        "weekly-summary": "resumo_semanal",
        "new-alert-blocked": "novo_alerta_impedido",
        "alert-weekly-report": "relatorio_semanal_alertas",
      };

      const columnName = columnMap[settingId];
      
      if (!columnName) {
        throw new Error(t("notifications.invalidSetting"));
      }

      const { error: upsertError } = await supabase
        .from('notification_settings')
        .upsert(
          {
            client_id: currentUser.client_id,
            [columnName]: enabled,
          },
          {
            onConflict: 'client_id'
          }
        );

      if (upsertError) {
        throw upsertError;
      }

      toast.success(t("notifications.settingSaved"), {
        description: t("notifications.settingSavedDesc"),
      });
    } catch (error: any) {
      console.error("Error saving settings:", error);
      toast.error(t("notifications.errorSaving"), {
        description: error.message || t("notifications.errorSavingDesc"),
      });
    }
  };

  const handleConflictToggle = (id: string) => {
    setConflictSettings((prev) => {
      const updatedSettings = prev.map((setting) =>
        setting.id === id ? { ...setting, enabled: !setting.enabled } : setting
      );
      const toggledSetting = updatedSettings.find(s => s.id === id);
      if (toggledSetting) {
        saveNotificationSetting(id, toggledSetting.enabled);
      }
      return updatedSettings;
    });
  };

  const handleAlertToggle = (id: string) => {
    setAlertSettings((prev) => {
      const updatedSettings = prev.map((setting) =>
        setting.id === id ? { ...setting, enabled: !setting.enabled } : setting
      );
      const toggledSetting = updatedSettings.find(s => s.id === id);
      if (toggledSetting) {
        saveNotificationSetting(id, toggledSetting.enabled);
      }
      return updatedSettings;
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader 
          title={t("notifications.title")} 
          subtitle={t("notifications.subtitle")} 
        />

        <div className="space-y-6">
          {/* Conflict Management Section */}
          <Card className="p-0 overflow-hidden">
            <div className="px-4 py-4 bg-[#F9F9F9] border-b border-[#E5E7EB]">
              <div className="flex items-center gap-3">
                <div className="p-2 border border-[#E5E7EB] rounded-lg bg-white">
                  <Bell className="h-5 w-5 text-[#9CA3AF]" />
                </div>
                <div>
                  <h3 className="text-[15px] font-medium text-[#1A1A1A]">{t("notifications.conflictManagement")}</h3>
                  <p className="text-[13px] font-normal mt-1 text-muted-foreground">
                    {t("notifications.subtitle")}
                  </p>
                </div>
              </div>
            </div>
            <CardContent className="p-0">
              {conflictSettings.map((setting, index) => (
                <div
                  key={setting.id}
                  className={`flex items-center justify-between gap-4 p-5 hover:bg-[#F9F9F9] transition-colors ${
                    index !== conflictSettings.length - 1 ? 'border-b border-[#E5E7EB]' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="mt-0.5 p-2 bg-[#F0FDF4] rounded-lg">
                      {setting.icon}
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-medium text-[#1F2937]">{setting.title}</h3>
                      <p className="text-sm text-[#6B7280]">
                        {setting.description}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={setting.enabled}
                    onCheckedChange={() => handleConflictToggle(setting.id)}
                    className="data-[state=checked]:bg-[#19976F]"
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Alerts Section */}
          <Card className="p-0 overflow-hidden">
            <div className="px-4 py-4 bg-[#F9F9F9] border-b border-[#E5E7EB]">
              <div className="flex items-center gap-3">
                <div className="p-2 border border-[#E5E7EB] rounded-lg bg-white">
                  <AlertTriangle className="h-5 w-5 text-[#9CA3AF]" />
                </div>
                <div className="flex items-center gap-2">
                  <h3 className="text-[15px] font-medium text-[#1A1A1A]">{t("notifications.alerts")}</h3>
                  <Badge className="bg-orange-50 text-orange-600 hover:bg-orange-50 border-0 font-medium text-[11px]">
                    {t("notifications.alertsExclusive")}
                  </Badge>
                </div>
              </div>
            </div>
            <CardContent className="p-0">
              {alertSettings.map((setting, index) => (
                <div
                  key={setting.id}
                  className={`flex items-center justify-between gap-4 p-5 hover:bg-[#F9F9F9] transition-colors ${
                    index !== alertSettings.length - 1 ? 'border-b border-[#E5E7EB]' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="mt-0.5 p-2 bg-orange-50 rounded-lg">
                      {setting.icon}
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-medium text-[#1F2937]">{setting.title}</h3>
                      <p className="text-sm text-[#6B7280]">
                        {setting.description}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={setting.enabled}
                    onCheckedChange={() => handleAlertToggle(setting.id)}
                    className="data-[state=checked]:bg-[#19976F]"
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
