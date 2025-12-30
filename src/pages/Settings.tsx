import { DashboardLayout } from "@/components/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PhoneInput } from "@/components/ui/phone-input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import {
  Building2,
  Mail,
  User,
  Phone,
  DollarSign,
  Plus,
  ExternalLink,
  Users,
  Settings as SettingsIcon,
  AlertCircle,
  Loader2,
  Shield,
  Copy,
  Check,
  MoreVertical,
  UserX,
  UserCheck,
  Trash2,
  Key,
  Eye,
  EyeOff,
  Monitor,
  Smartphone,
  MapPin,
  MonitorSmartphone,
  Image as ImageIcon,
  UploadCloud,
  Palette,
  Send,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useUserData } from "@/hooks/useUserData";
import { QRCodeSVG } from "qrcode.react";
import * as OTPAuth from "otpauth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm, Controller } from "react-hook-form";
import { SaveBar } from "@/components/SaveBar";

interface TeamMember {
  id: string;
  nome: string;
  email: string;
  user_level: string;
  created_at: string;
  active?: boolean;
}

interface SettingsFormData {
  nomeEmpresa: string;
  emailContato: string;
  nomeCompleto: string;
  telefone: string;
  currency: string;
}

interface ActiveSession {
  id: string;
  device: string;
  browser: string;
  os: string;
  location: string;
  ip: string;
  type: "desktop" | "mobile";
  current: boolean;
}

export default function Settings() {
  const { t } = useTranslation();
  const { userName, storeName, email, phone, loading: userDataLoading, refresh: refreshUserData } = useUserData();

  // React Hook Form
  const form = useForm<SettingsFormData>({
    defaultValues: {
      nomeEmpresa: "",
      emailContato: "",
      nomeCompleto: "",
      telefone: "",
      currency: "usd",
    },
  });

  const contactEmail = (form.watch("emailContato") || email || "").trim();

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoadingTeam, setIsLoadingTeam] = useState(true);
  const [currentUserLevel, setCurrentUserLevel] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [hasShownMigrationWarning, setHasShownMigrationWarning] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [currentLogoUrl, setCurrentLogoUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const initialBrandColorRef = useRef("#000000");
  const [brandColor, setBrandColor] = useState(initialBrandColorRef.current);
  const initialBrandTextColorRef = useRef("#FFFFFF");
  const [brandTextColor, setBrandTextColor] = useState(initialBrandTextColorRef.current);
  const brandingColumnsAvailable = useRef(true);
  const brandingWarningShown = useRef(false);
  const initialSenderSettingsRef = useRef({
    fromName: "",
    replyToEmail: "",
    emailFooter: "",
  });
  const [fromName, setFromName] = useState(initialSenderSettingsRef.current.fromName);
  const [replyToEmail, setReplyToEmail] = useState(initialSenderSettingsRef.current.replyToEmail);
  const [emailFooter, setEmailFooter] = useState(initialSenderSettingsRef.current.emailFooter);
  const initialPolicySupportRef = useRef({
    refundPolicyUrl: "",
    supportUrl: "",
  });
  const [refundPolicyUrl, setRefundPolicyUrl] = useState(initialPolicySupportRef.current.refundPolicyUrl);
  const [supportUrl, setSupportUrl] = useState(initialPolicySupportRef.current.supportUrl);

  // Estados do modal de adicionar usuário
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newUserNome, setNewUserNome] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserFuncao, setNewUserFuncao] = useState<"admin" | "user">("user");
  const [newUserStatus, setNewUserStatus] = useState(true);
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  // 2FA states
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorSecret, setTwoFactorSecret] = useState<string | null>(null);
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifying2FA, setIsVerifying2FA] = useState(false);
  const [secretCopied, setSecretCopied] = useState(false);
  const [isLoading2FA, setIsLoading2FA] = useState(true);

  // Estados para gerenciamento de membros
  const [memberToToggle, setMemberToToggle] = useState<TeamMember | null>(null);
  const [memberToRemove, setMemberToRemove] = useState<TeamMember | null>(null);
  const [confirmEmail, setConfirmEmail] = useState("");
  const [isTogglingMember, setIsTogglingMember] = useState(false);
  const [isRemovingMember, setIsRemovingMember] = useState(false);

  // Estados para alteração de senha
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Estados para deletar conta
  const [showDeleteAccountDialog, setShowDeleteAccountDialog] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(null);
  const MAX_LOGO_SIZE_BYTES = 2 * 1024 * 1024;
  const ACCEPTED_LOGO_TYPES = ["image/png", "image/jpeg", "image/svg+xml"];

  const detectDeviceInfo = () => { 
    const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
    const isMobile = /Mobi|Android|iPhone|iPad/i.test(ua);
    const os = /Windows/i.test(ua)
      ? "Windows"
      : /Mac OS X/i.test(ua)
        ? "macOS"
        : /Android/i.test(ua)
          ? "Android"
          : /iPhone|iPad|iPod/i.test(ua)
            ? "iOS"
            : "Sistema desconhecido";

    const browser = /Edg\//i.test(ua)
      ? "Edge"
      : /Chrome\/|CriOS\//i.test(ua) && !/Edg\//i.test(ua)
        ? "Chrome"
        : /Safari\//i.test(ua) && !/Chrome\/|CriOS\//i.test(ua)
          ? "Safari"
          : /Firefox\//i.test(ua)
            ? "Firefox"
            : "Navegador desconhecido";

    return {
      os,
      browser,
      type: isMobile ? ("mobile" as const) : ("desktop" as const),
      device: isMobile ? "Dispositivo móvel" : "Computador",
    };
  };

  const fetchLocationInfo = async () => {
    // Endpoint público indisponível; usamos fallback seguro.
    return { location: t("settings.locationUnavailable"), ip: t("settings.ipUnavailable") };
  };

  const parseSessionUserAgent = (ua: string) => {
    if (!ua) return detectDeviceInfo();

    const isMobile = /mobile|android|iphone|ipad|ipod/i.test(ua);
    const os = /windows nt/i.test(ua)
      ? "Windows"
      : /mac os x/i.test(ua)
        ? "macOS"
        : /android/i.test(ua)
          ? "Android"
          : /iphone|ipad|ipod/i.test(ua)
            ? "iOS"
            : "Sistema desconhecido";

    const browser = /edg\//i.test(ua)
      ? "Edge"
      : /chrome\//i.test(ua) && !/edg\//i.test(ua)
        ? "Chrome"
        : /safari\//i.test(ua) && !/chrome\//i.test(ua)
          ? "Safari"
          : /firefox\//i.test(ua)
            ? "Firefox"
            : "Navegador desconhecido";

    return {
      os,
      browser,
      type: isMobile ? ("mobile" as const) : ("desktop" as const),
      device: isMobile ? "Dispositivo móvel" : "Computador",
    };
  };

  const buildActiveSession = async (session: Session): Promise<ActiveSession> => {
    const deviceInfo = detectDeviceInfo();
    const { location, ip } = await fetchLocationInfo();

    return {
      id: `${session.user.id}-current`,
      device: deviceInfo.device,
      browser: deviceInfo.browser,
      os: deviceInfo.os,
      location,
      ip,
      type: deviceInfo.type,
      current: true,
    };
  };

  const fetchActiveSessions = useCallback(async () => {
    setIsLoadingSessions(true);
    try {
      const {
        data: { session: authSession },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        throw error;
      }

      if (!authSession) {
        setSessions([]);
        return;
      }

      const { data, error: fnError } = await supabase.functions.invoke("list-sessions", {
        headers: {
          Authorization: `Bearer ${authSession.access_token}`,
        },
      });

      if (fnError) {
        throw fnError;
      }

      const sessionsFromFn =
        (data?.sessions as Array<{ id: string; user_agent?: string | null; ip?: string | null }>) ?? [];

      const currentUA = typeof navigator !== "undefined" ? navigator.userAgent : "";

      const mappedSessions: ActiveSession[] = sessionsFromFn.map((s) => {
        const info = parseSessionUserAgent(s.user_agent || "");
        const isCurrent = !!currentUA && !!s.user_agent && s.user_agent === currentUA;

        return {
          id: s.id,
          device: info.device,
          browser: info.browser,
          os: info.os,
          location: t("settings.locationUnavailable"),
          ip: s.ip || t("settings.ipUnavailable"),
          type: info.type,
          current: isCurrent,
        };
      });

      if (mappedSessions.length === 0) {
        const currentSession = await buildActiveSession(authSession);
        setSessions([currentSession]);
      } else {
        // Se nenhuma sessão veio marcada como atual, marque a mais recente como fallback
        const anyCurrent = mappedSessions.some((s) => s.current);
        if (!anyCurrent && mappedSessions.length > 0) {
          mappedSessions[0].current = true;
        }
        setSessions(mappedSessions);
      }
    } catch (error) {
      console.error("Erro ao carregar sessões ativas:", error);
      toast.error("Não foi possível carregar as sessões ativas.");
      setSessions([]);
    } finally {
      setIsLoadingSessions(false);
    }
  }, [t]);

  const handleRevokeSession = async (sessionId: string, isCurrent: boolean) => {
    try {
      setRevokingSessionId(sessionId);

      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error || !session) {
        throw new Error("Sessão atual não encontrada");
      }

      const { error: revokeError } = await supabase.functions.invoke("revoke-session", {
        body: { sessionId },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (revokeError) {
        throw revokeError;
      }

      toast.success("Sessão revogada");

      if (isCurrent) {
        await supabase.auth.signOut();
        return;
      }

      await fetchActiveSessions();
    } catch (err: any) {
      console.error("Erro ao revogar sessão:", err);
      toast.error("Não foi possível revogar a sessão.");
    } finally {
      setRevokingSessionId(null);
    }
  };

  const validateAndSetLogoFile = (file: File) => {
    if (!ACCEPTED_LOGO_TYPES.includes(file.type)) {
      toast.error("Formato de imagem não suportado", {
        description: "Envie um arquivo PNG, JPG ou SVG.",
      });
      return;
    }

    if (file.size > MAX_LOGO_SIZE_BYTES) {
      toast.error("O logo deve ter no máximo 2MB.");
      return;
    }

    if (logoPreviewUrl) {
      URL.revokeObjectURL(logoPreviewUrl);
    }

    const previewUrl = URL.createObjectURL(file);
    setSelectedLogoFile(file);
    setLogoPreviewUrl(previewUrl);
  };

  const handleLogoInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      validateAndSetLogoFile(file);
    }
    event.target.value = "";
  };

  const handleLogoUpload = async (file: File): Promise<string | null> => {
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) {
        toast.error("Não foi possível autenticar para enviar o logo.");
        return null;
      }

      const { data: userRow, error: userError } = await supabase
        .from("users")
        .select("client_id")
        .eq("id", user.id)
        .maybeSingle();

      if (userError || !userRow?.client_id) {
        toast.error("Não foi possível obter a empresa para salvar o logo.");
        return null;
      }

      const clientId = userRow.client_id;
      const ext = file.name.split(".").pop() || "png";
      const path = `${clientId}/logo-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("logos")
        .upload(path, file, {
          contentType: file.type,
          upsert: true,
        });

      if (uploadError) {
        console.error("Erro ao fazer upload do logo:", uploadError);
        toast.error("Falha ao enviar logo. Tente novamente.");
        return null;
      }

      const { data: publicUrlData } = supabase.storage.from("logos").getPublicUrl(path);
      const publicUrl = publicUrlData?.publicUrl || null;
      if (!publicUrl) {
        toast.error("Não foi possível obter a URL pública do logo.");
        return null;
      }

      setCurrentLogoUrl(publicUrl);
      return publicUrl;
    } catch (err) {
      console.error("Erro inesperado ao enviar logo:", err);
      toast.error("Falha ao enviar logo.");
      return null;
    }
  };

  // Sincronizar dados do hook com o formulário
  useEffect(() => {
    if (!userDataLoading) {
      form.reset({
        nomeEmpresa: storeName || "",
        emailContato: email || "",
        nomeCompleto: userName || "",
        telefone: phone || "",
        currency: "usd",
      });
    }
  }, [userName, storeName, email, phone, userDataLoading, form]);

  useEffect(() => {
    fetchTeamMembers();
    fetch2FAStatus();
  }, []);

  useEffect(() => {
    fetchActiveSessions();

    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      fetchActiveSessions();
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [fetchActiveSessions]);

  useEffect(() => {
    const loadBranding = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: userRow, error: userError } = await supabase
          .from("users")
          .select("client_id")
          .eq("id", user.id)
          .maybeSingle();

        if (userError || !userRow?.client_id) {
          console.error("Erro ao buscar client_id para branding:", userError);
          return;
        }

        const selectExtended = "brand_color, brand_text_color, support_url, refund_policy_url, logo_url, nome_empresa, sender_from_name, sender_reply_to_email, sender_email_footer";
        const selectFallback = "nome_empresa";

        const { data, error } = await supabase
          .from("clients")
          .select(selectExtended)
          .eq("id", userRow.client_id)
          .maybeSingle();

        let brandingData: any = data as any;
        if (error && error.message?.toLowerCase().includes("brand_color")) {
          brandingColumnsAvailable.current = false;
          if (!brandingWarningShown.current) {
            brandingWarningShown.current = true;
            toast.warning("Branding columns missing in database", {
              description: "Run the migration to add brand_color, brand_text_color, support_url, refund_policy_url, logo_url.",
              duration: 8000,
            });
          }
          const { data: fbData, error: fbError } = await supabase
            .from("clients")
            .select(selectFallback)
            .eq("id", userRow.client_id)
            .maybeSingle();
          brandingData = fbData as any;
          if (fbError) {
            console.error("Erro ao carregar branding (fallback):", fbError);
          }
        } else if (error) {
          console.error("Erro ao carregar branding:", error);
          return;
        }

        if (brandingData?.brand_color) {
          setBrandColor(brandingData.brand_color);
          initialBrandColorRef.current = brandingData.brand_color;
        }
        if (brandingData?.brand_text_color) {
          setBrandTextColor(brandingData.brand_text_color);
          initialBrandTextColorRef.current = brandingData.brand_text_color;
        }
        if (brandingData?.support_url) {
          setSupportUrl(brandingData.support_url);
          initialPolicySupportRef.current.supportUrl = brandingData.support_url;
        }
        if (brandingData?.refund_policy_url) {
          setRefundPolicyUrl(brandingData.refund_policy_url);
          initialPolicySupportRef.current.refundPolicyUrl = brandingData.refund_policy_url;
        }
        if (brandingData?.logo_url) {
          setCurrentLogoUrl(brandingData.logo_url);
        }
        if (brandingData?.sender_from_name) {
          setFromName(brandingData.sender_from_name);
          initialSenderSettingsRef.current.fromName = brandingData.sender_from_name;
        }
        if (brandingData?.sender_reply_to_email) {
          setReplyToEmail(brandingData.sender_reply_to_email);
          initialSenderSettingsRef.current.replyToEmail = brandingData.sender_reply_to_email;
        }
        if (brandingData?.sender_email_footer) {
          setEmailFooter(brandingData.sender_email_footer);
          initialSenderSettingsRef.current.emailFooter = brandingData.sender_email_footer;
        }
      } catch (err) {
        console.error("Erro ao carregar branding:", err);
      }
    };

    loadBranding();
  }, []);

  const fetch2FAStatus = async () => {
    try {
      setIsLoading2FA(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: clientData, error } = await supabase
        .from("clients")
        .select("two_factor_enabled, two_factor_secret")
        .eq("id", user.id)
        .single();

      // Se der erro 406 ou campos não existirem, desabilitar 2FA temporariamente
      if (error) {
        console.warn("2FA fields may not exist yet, disabling 2FA UI:", error);
        setTwoFactorEnabled(false);
        return;
      }

      if (clientData) {
        setTwoFactorEnabled(clientData.two_factor_enabled || false);
      }
    } catch (error) {
      console.error("Error fetching 2FA status:", error);
      setTwoFactorEnabled(false);
    } finally {
      setIsLoading2FA(false);
    }
  };

  const handleEnable2FA = () => {
    // Generate a new TOTP secret using browser-compatible otpauth library
    const secret = new OTPAuth.Secret({ size: 20 });
    setTwoFactorSecret(secret.base32);
    setShowTwoFactorSetup(true);
    setVerificationCode("");
  };

  const handleVerifyAndActivate2FA = async () => {
    if (!twoFactorSecret || verificationCode.length !== 6) {
      toast.error(t("settings.enterValidCode"));
      return;
    }

    setIsVerifying2FA(true);

    try {
      // Verify the code against the secret using otpauth library
      const totp = new OTPAuth.TOTP({
        issuer: "ChargeMind",
        label: contactEmail || "user",
        algorithm: "SHA1",
        digits: 6,
        period: 30,
        secret: twoFactorSecret,
      });

      const delta = totp.validate({ token: verificationCode, window: 1 });
      const isValid = delta !== null;

      if (!isValid) {
        toast.error(t("settings.invalidCode"));
        setIsVerifying2FA(false);
        return;
      }

      // Save to database
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase
        .from("clients")
        .update({
          two_factor_secret: twoFactorSecret,
          two_factor_enabled: true,
          two_factor_enabled_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;

      setTwoFactorEnabled(true);
      setShowTwoFactorSetup(false);
      setTwoFactorSecret(null);
      setVerificationCode("");
      toast.success(t("settings.twoFactorActivated"));
    } catch (error) {
      console.error("Error activating 2FA:", error);
      toast.error(t("settings.twoFactorError"));
    } finally {
      setIsVerifying2FA(false);
    }
  };

  const handleDisable2FA = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("clients")
        .update({
          two_factor_secret: null,
          two_factor_enabled: false,
          two_factor_enabled_at: null,
        })
        .eq("id", user.id);

      if (error) throw error;

      setTwoFactorEnabled(false);
      setShowTwoFactorSetup(false);
      toast.success(t("settings.twoFactorDisabled"));
    } catch (error) {
      console.error("Error disabling 2FA:", error);
      toast.error(t("settings.twoFactorError"));
    }
  };

  const copySecretToClipboard = () => {
    if (twoFactorSecret) {
      navigator.clipboard.writeText(twoFactorSecret);
      setSecretCopied(true);
      setTimeout(() => setSecretCopied(false), 2000);
      toast.success(t("settings.secretCopied"));
    }
  };

  const getOtpAuthUrl = () => {
    if (!twoFactorSecret || !contactEmail) return "";
    const totp = new OTPAuth.TOTP({
      issuer: "ChargeMind",
      label: contactEmail,
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret: twoFactorSecret,
    });
    return totp.toString();
  };

  const fetchTeamMembers = async () => {
    try {
      setIsLoadingTeam(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error(t("settings.userNotAuthenticated"));
      }

      const { data: currentUser, error: currentUserError } = await supabase
        .from("users")
        .select("client_id, user_level")
        .eq("id", user.id)
        .single();

      if (currentUserError || !currentUser?.client_id) {
        console.error("Error fetching client_id:", currentUserError);
        setTeamMembers([]);
        return;
      }

      // Armazenar informações do usuário atual
      setCurrentUserLevel(currentUser.user_level);
      setCurrentUserId(user.id);
      
      console.log("👤 Informações do usuário logado:", {
        userId: user.id,
        userLevel: currentUser.user_level,
        canManageTeam: currentUser.user_level === "admin",
      });

      // Carregar membros do time (sem coluna 'active' nesta base)
      const { data: usersData, error: usersErr } = await supabase
        .from("users")
        .select("id, nome, email, user_level, created_at")
        .eq("client_id", currentUser.client_id)
        .order("created_at", { ascending: false });

      const users = (usersData ?? []).map((u) => ({ ...u, active: true }));
      const usersError = usersErr;

      if (usersError) {
        console.error("Error fetching users:", usersError);
        toast.error(t("settings.errorLoadingTeam"), {
          description: t("settings.couldNotLoadTeamMembers"),
        });
        return;
      }

      console.log("📊 Team members carregados:", users?.map(u => ({ 
        nome: u.nome, 
        active: u.active 
      })));

      setTeamMembers(users || []);
    } catch (error) {
      console.error("Error fetching team members:", error);
      toast.error(t("settings.error"), {
        description: t("settings.couldNotLoadTeamData"),
      });
    } finally {
      setIsLoadingTeam(false);
    }
  };

  const handleSaveSettings = async (
    data: SettingsFormData,
    options?: { skipLoadingState?: boolean; overrideLogoUrl?: string | null },
  ) => {
    const shouldSkipLoadingState = options?.skipLoadingState;

    if (!shouldSkipLoadingState) {
      setIsSavingSettings(true);
    }

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error(t("settings.userNotAuthenticated"));
      }

      const { data: currentUser, error: currentUserError } = await supabase
        .from("users")
        .select("client_id, email")
        .eq("id", user.id)
        .maybeSingle();

      if (currentUserError) {
        throw new Error(t("settings.errorFetchingUserData"));
      }

      const targetClientId = currentUser?.client_id;
      if (!targetClientId) {
        throw new Error(t("settings.userWithoutCompany"));
      }

      // Buscar dados atuais para fallback e evitar sobrescrever com vazio
      const selectExtended =
        "nome, nome_empresa, email, telefone, settings_updated_at, shopify_connected_at, brand_color, brand_text_color, support_url, refund_policy_url, logo_url";
      const selectFallback = "nome, nome_empresa, email, telefone, settings_updated_at, shopify_connected_at";

      let clientData;
      let clientFetchError;

      const { data: clientDataExt, error: clientFetchErrorExt } = await supabase
        .from("clients")
        .select(selectExtended)
        .eq("id", targetClientId)
        .maybeSingle();

      if (clientFetchErrorExt && clientFetchErrorExt.message?.toLowerCase().includes("brand_color")) {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from("clients")
          .select(selectFallback)
          .eq("id", targetClientId)
          .maybeSingle();
        clientData = fallbackData;
        clientFetchError = fallbackError;
        console.warn("Branding columns not found, using fallback select.");
      } else {
        clientData = clientDataExt;
        clientFetchError = clientFetchErrorExt;
      }

      if (clientFetchError) {
        console.error("Erro ao buscar dados atuais do cliente:", clientFetchError);
      }

      // Evitar sobrescrever com valores vazios: usar fallback nos dados atuais
      const updateDataBase = {
        nome_empresa: data.nomeEmpresa?.trim() || storeName || clientData?.nome_empresa || null,
        email: data.emailContato?.trim() || currentUser?.email || user.email || clientData?.email || "",
        nome: data.nomeCompleto?.trim() || userName || clientData?.nome || null,
        telefone: data.telefone?.trim() || phone || clientData?.telefone || null,
        settings_updated_at: new Date().toISOString(),
      };
      const effectiveLogoUrl =
        options?.overrideLogoUrl ??
        currentLogoUrl ??
        clientData?.logo_url ??
        null;

      // Garante que valores vazios sejam salvos como null, não como fallback
      const updateDataBrand = {
        brand_color: brandColor && brandColor.trim() !== "" ? brandColor.trim() : null,
        brand_text_color: brandTextColor && brandTextColor.trim() !== "" ? brandTextColor.trim() : null,
        support_url: supportUrl && supportUrl.trim() !== "" ? supportUrl.trim() : null,
        refund_policy_url: refundPolicyUrl && refundPolicyUrl.trim() !== "" ? refundPolicyUrl.trim() : null,
        logo_url: effectiveLogoUrl,
      };
      
      console.log("💾 Salvando branding:", {
        brand_color: updateDataBrand.brand_color,
        brand_text_color: updateDataBrand.brand_text_color,
        support_url: updateDataBrand.support_url,
        refund_policy_url: updateDataBrand.refund_policy_url,
        logo_url: updateDataBrand.logo_url,
      });

      const updateDataSender = {
        sender_from_name: fromName || clientData?.sender_from_name || null,
        sender_reply_to_email: replyToEmail || clientData?.sender_reply_to_email || null,
        sender_email_footer: emailFooter || clientData?.sender_email_footer || null,
      };

      const updateData = { ...updateDataBase, ...updateDataBrand, ...updateDataSender };

      const tryUpdate = async (payload: Record<string, any>) =>
        supabase.from("clients").update(payload).eq("id", targetClientId).select("id");

      let updatedRows;
      let updateError;

      ({ data: updatedRows, error: updateError } = await tryUpdate(updateData));

      const isMissingBrandColumns =
        updateError?.message && /brand_color|brand_text_color|support_url|refund_policy_url|logo_url/i.test(updateError.message);

      if (updateError && isMissingBrandColumns) {
        console.warn("Branding columns not found on update, retrying without them.");
        brandingColumnsAvailable.current = false;
        if (!brandingWarningShown.current) {
          brandingWarningShown.current = true;
          toast.warning("Branding columns missing in database", {
            description: "Run the migration to add brand_color, brand_text_color, support_url, refund_policy_url, logo_url.",
            duration: 8000,
          });
        }
        ({ data: updatedRows, error: updateError } = await tryUpdate(updateDataBase));
      }

      if (updateError) {
        console.error("❌ Erro ao salvar branding:", updateError);
        throw updateError;
      }

      if (!updatedRows || updatedRows.length === 0) {
        console.error("❌ Nenhum registro foi atualizado");
        throw new Error(t("settings.noRecordUpdated"));
      }

      // Atualizar dados em toda a aplicação
      await refreshUserData();

      // Resetar o estado isDirty do formulário
      form.reset(data);

      toast.success("Settings updated successfully!");
    } catch (error: any) {
      console.error("Error saving data:", error);
      toast.error(error.message || "Failed to update settings");
    } finally {
      if (!shouldSkipLoadingState) {
        setIsSavingSettings(false);
      }
    }
  };

  const handleSaveAll = async (data: SettingsFormData) => {
    setIsSavingSettings(true);
    try {
      let uploadedLogoUrl: string | null = null;
      if (selectedLogoFile) {
        uploadedLogoUrl = await handleLogoUpload(selectedLogoFile);
        if (uploadedLogoUrl) {
          setCurrentLogoUrl(uploadedLogoUrl);
        }
      }
      await handleSaveSettings(data, {
        skipLoadingState: true,
        overrideLogoUrl: uploadedLogoUrl,
      });
      setSelectedLogoFile(null);
      // TODO: Persist brandColor when backend is ready
      initialBrandColorRef.current = brandColor;
      // TODO: Persist brandTextColor when backend is ready
      initialBrandTextColorRef.current = brandTextColor;
      // TODO: Persist sender settings when backend is ready
      initialSenderSettingsRef.current = {
        fromName,
        replyToEmail,
        emailFooter,
      };
      // TODO: Persist policy/support links when backend is ready
      initialPolicySupportRef.current = {
        refundPolicyUrl,
        supportUrl,
      };
    } catch (error) {
      console.error("Erro ao salvar configurações e logo:", error);
      toast.error("Não foi possível salvar todas as alterações.");
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleDiscardChanges = () => {
    if (logoPreviewUrl) {
      URL.revokeObjectURL(logoPreviewUrl);
    }
    setLogoPreviewUrl(null);
    setSelectedLogoFile(null);
    setBrandColor(initialBrandColorRef.current);
    setBrandTextColor(initialBrandTextColorRef.current);
    setFromName(initialSenderSettingsRef.current.fromName);
    setReplyToEmail(initialSenderSettingsRef.current.replyToEmail);
    setEmailFooter(initialSenderSettingsRef.current.emailFooter);
    setRefundPolicyUrl(initialPolicySupportRef.current.refundPolicyUrl);
    setSupportUrl(initialPolicySupportRef.current.supportUrl);
    form.reset();
    toast.info("Changes discarded");
  };

  const handleCreateUser = async () => {
    if (!newUserNome.trim() || !newUserEmail.trim()) {
      toast.error(t("settings.requiredFields"), {
        description: t("settings.fillNameAndEmail"),
      });
      return;
    }

    try {
      setIsCreatingUser(true);

      const { data, error } = await supabase.functions.invoke("create-team-member", {
        body: {
          nome: newUserNome,
          email: newUserEmail,
          user_level: newUserFuncao,
        },
      });

      if (error) {
        throw error;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      toast.success(t("settings.userCreated"), {
        description: t("settings.newUserAdded"),
      });

      setNewUserNome("");
      setNewUserEmail("");
      setNewUserFuncao("user");
      setNewUserStatus(true);
      setIsModalOpen(false);

      fetchTeamMembers();
    } catch (error: any) {
      console.error("Error creating user:", error);
      toast.error(t("settings.errorCreatingUser"), {
        description: error.message || t("settings.couldNotCreateUser"),
      });
    } finally {
      setIsCreatingUser(false);
    }
  };
 
  const canManageTeam = () => {
    return currentUserLevel === "admin" || currentUserLevel === "owner";
  };

  const handleToggleMember = async () => {
    if (!memberToToggle || !canManageTeam()) {
      toast.error(t("settings.noPermission"), {
        description: t("settings.noPermissionToManageTeam"),
      });
      return;
    }

    // Nesta base, não existe coluna 'active' nem user_level 'owner'
    toast.error(t("settings.error"), {
      description: "A ativação/desativação de membros não está disponível nesta versão.",
    });
  };

  // Password strength calculation
  const calculatePasswordStrength = (pwd: string) => {
    if (pwd.length === 0) return { strength: 0, label: "", message: "" };

    let strength = 0;
    if (pwd.length >= 6) strength += 25;
    if (pwd.length >= 10) strength += 25;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength += 25;
    if (/[0-9]/.test(pwd)) strength += 15;
    if (/[^a-zA-Z0-9]/.test(pwd)) strength += 10;

    if (strength >= 75) return { strength, label: "Strong", message: "Your password is great. Good job!" };
    if (strength >= 50) return { strength, label: "Medium", message: "Your password is good, but could be better." };
    return { strength, label: "Weak", message: "Your password needs to be stronger." };
  };

  const passwordStrength = calculatePasswordStrength(newPassword);

  const handleRemoveMember = async () => {
    if (!memberToRemove || !canManageTeam()) {
      toast.error(t("settings.noPermission"), {
        description: t("settings.noPermissionToManageTeam"),
      });
      return;
    }

    // Não pode remover o owner
    if (memberToRemove.user_level === "owner") {
      toast.error(t("settings.cannotRemoveOwner"));
      setMemberToRemove(null);
      setConfirmEmail("");
      return;
    }

    // Verificar se é admin e se tem confirmação de email
    if (
      (memberToRemove.user_level === "admin" || memberToRemove.user_level === "owner") &&
      confirmEmail !== memberToRemove.email
    ) {
      toast.error(t("settings.emailMismatch"));
      return;
    }

    // Verificar se é o último admin
    const adminCount = teamMembers.filter(
      (m) => (m.user_level === "admin" || m.user_level === "owner") && m.id !== memberToRemove.id
    ).length;

    if (
      (memberToRemove.user_level === "admin" || memberToRemove.user_level === "owner") &&
      adminCount === 0
    ) {
      toast.error(t("settings.cannotRemoveLastAdmin"), {
        description: t("settings.promoteAnotherAdmin"),
      });
      return;
    }

    try {
      setIsRemovingMember(true);

      console.log("🗑️ Removing member:", {
        memberId: memberToRemove.id,
        memberName: memberToRemove.nome,
      });

      const { error } = await supabase.from("users").delete().eq("id", memberToRemove.id);

      console.log("✅ Delete result:", { error });

      if (error) throw error;

      // Atualizar o estado local removendo o membro
      setTeamMembers((prev) => prev.filter((m) => m.id !== memberToRemove.id));

      toast.success(t("settings.memberRemoved"));
      setMemberToRemove(null);
      setConfirmEmail("");
    } catch (error: any) {
      console.error("❌ Error removing member:", error);
      toast.error(t("settings.errorSaving"), {
        description: error.message || t("settings.couldNotSaveInfo"),
      });
    } finally {
      setIsRemovingMember(false);
    }
  };

  const handleChangePassword = async () => {
    // Validações
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error(t("settings.fillAllPasswordFields"));
      return;
    }

    if (newPassword.length < 6) {
      toast.error(t("settings.passwordTooShort"));
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error(t("settings.passwordsDoNotMatch"));
      return;
    }

    try {
      setIsChangingPassword(true);

      // Primeiro, reautenticar o usuário com a senha atual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        throw new Error(t("settings.userNotAuthenticated"));
      }

      // Tentar fazer login com a senha atual para verificar
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) {
        toast.error(t("settings.incorrectCurrentPassword"));
        setIsChangingPassword(false);
        return;
      }

      // Atualizar para a nova senha
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      // Limpar os campos
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      toast.success(t("settings.passwordChanged"), {
        description: t("settings.passwordChangedDesc"),
      });
    } catch (error: any) {
      console.error("Error changing password:", error);
      toast.error(t("settings.errorChangingPassword"), {
        description: error.message || t("settings.couldNotChangePassword"),
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true);

    // Função que executa o processo de desinstalação
    const uninstallPromise = async () => {
      // Obter o token de autenticação
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("User not authenticated");
      }

      // Chamar a Edge Function app-uninstall
      const { data, error } = await supabase.functions.invoke("app-uninstall", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error("Error calling app-uninstall:", error);
        throw new Error(error.message || "Failed to uninstall app");
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      console.log("✅ App uninstalled successfully:", data);

      // Fechar o modal
      setShowDeleteAccountDialog(false);

      // Fazer logout
      await supabase.auth.signOut();

      // Aguardar um momento antes do redirecionamento para garantir que o toast seja exibido
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Redirecionar para a home da Shopify
      // Usando window.open com _top para garantir que toda a janela seja redirecionada
      window.open("https://admin.shopify.com", "_top");

      return data;
    };

    // Usar toast.promise do Sonner para feedback visual
    const tPromise = toast.promise(uninstallPromise(), {
      loading: "Uninstalling app...",
      success: "App uninstalled successfully. Redirecting to Shopify...",
      error: (err) => {
        const errorMessage = err instanceof Error ? err.message : "Failed to uninstall app. Please contact support.";
        return errorMessage;
      },
    });

    // toast.promise retorna um objeto com unwrap(); garantimos o finally no Promise real
    await tPromise.unwrap().finally(() => {
      setIsDeletingAccount(false);
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader title={t("settings.title")} subtitle={t("settings.subtitle")} />

        <Tabs defaultValue="general" className="space-y-6">
          <div className="border-b border-border">
            <TabsList className="bg-transparent h-auto p-0 space-x-6 overflow-x-auto">
              <TabsTrigger
                value="general"
                className="border-b-[3px] border-transparent data-[state=active]:border-[#38CC92] rounded-none bg-transparent pb-3"
              >
                {t("settings.generalTab", { defaultValue: "General" })}
              </TabsTrigger>
              <TabsTrigger
                value="branding"
                className="border-b-[3px] border-transparent data-[state=active]:border-[#38CC92] rounded-none bg-transparent pb-3"
              >
                {t("settings.brandingTab", { defaultValue: "Branding" })}
              </TabsTrigger>
              <TabsTrigger
                value="team"
                className="border-b-[3px] border-transparent data-[state=active]:border-[#38CC92] rounded-none bg-transparent pb-3"
              >
                {t("settings.teamTab", { defaultValue: "Team" })}
              </TabsTrigger>
              <TabsTrigger
                value="security"
                className="border-b-[3px] border-transparent data-[state=active]:border-[#38CC92] rounded-none bg-transparent pb-3"
              >
                {t("settings.securityTab", { defaultValue: "Security" })}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="general" className="space-y-6 pb-24">
            {/* Company Details Section */}
            <Card className="p-0 overflow-hidden">
              <div className="px-4 py-4 bg-[#F9F9F9] border-b border-[#E5E7EB]">
                <div className="flex items-center gap-3">
                  <div className="p-2 border border-[#E5E7EB] rounded-lg bg-white">
                    <Building2 className="h-5 w-5 text-[#9CA3AF]" />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-medium text-[#1A1A1A]">{t("settings.companyDetails")}</h3>
                    <p className="text-[13px] font-normal mt-1 text-muted-foreground">
                      {t("settings.companyDetailsDesc")}
                    </p>
                  </div>
                </div>
              </div>
              <CardContent className="p-4 space-y-5">
                <div className="grid md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="company-name" className="text-[#1F2937] font-medium">
                      {t("settings.companyName")}
                    </Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
                      <Input
                        id="company-name"
                        placeholder="My Store"
                        className="pl-10 border-[#DEDEDE] focus:border-[#19976F] focus:ring-[#19976F]"
                        {...form.register("nomeEmpresa")}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-email" className="text-[#1F2937] font-medium">
                      {t("settings.contactEmail")}
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
                      <Input
                        id="contact-email"
                        type="email"
                        placeholder="support@mystore.com"
                        className="pl-10 border-[#DEDEDE] focus:border-[#19976F] focus:ring-[#19976F]"
                        {...form.register("emailContato")}
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="full-name" className="text-[#1F2937] font-medium">
                    {t("settings.fullName")}
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
                    <Input
                      id="full-name"
                      placeholder="Store Owner"
                      className="pl-10 border-[#DEDEDE] focus:border-[#19976F] focus:ring-[#19976F]"
                      {...form.register("nomeCompleto")}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            {/* Account Details Section */}
            <Card className="p-0 overflow-hidden">
              <div className="px-4 py-4 bg-[#F9F9F9] border-b border-[#E5E7EB]">
                <div className="flex items-center gap-3">
                  <div className="p-2 border border-[#E5E7EB] rounded-lg bg-white">
                    <SettingsIcon className="h-5 w-5 text-[#9CA3AF]" />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-medium text-[#1A1A1A]">{t("settings.accountDetails")}</h3>
                    <p className="text-[13px] font-normal mt-1 text-muted-foreground">
                      {t("settings.accountDetailsDesc")}
                    </p>
                  </div>
                </div>
              </div>
              <CardContent className="p-4 space-y-5">
                <div className="grid md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-[#1F2937] font-medium">
                      {t("settings.phoneNumber")}
                    </Label>
                    <Controller
                      name="telefone"
                      control={form.control}
                      render={({ field }) => (
                        <PhoneInput
                          value={field.value as any}
                          onChange={field.onChange}
                          placeholder="555 123 4567"
                        />
                      )}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency" className="text-[#1F2937] font-medium">
                      {t("settings.currency")}
                    </Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF] z-10" />
                      <Select defaultValue="usd">
                        <SelectTrigger id="currency" className="pl-10 border-[#DEDEDE]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="usd" className="focus:bg-[#F9F9F9] focus:text-[#1F2937] cursor-pointer">
                            USD - United States Dollar
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Danger Zone - Deactivate Account Section */}
            <Card className="p-0 overflow-hidden border border-gray-200 bg-white">
              <div className="px-4 py-4 border-b border-gray-200 bg-white">
                <div className="flex items-center gap-3">
                  <div className="p-2 border border-gray-200 rounded-lg bg-white">
                    <AlertCircle className="h-4 w-4 text-gray-500" />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-medium text-[#1A1A1A]">
                      {t("settings.deactivateAccount")}
                    </h3>
                    <p className="text-[13px] font-normal mt-1 text-muted-foreground">
                      {t("settings.deactivateDesc")}
                    </p>
                  </div>
                </div>
              </div>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-sm text-gray-500">
                      Once you delete your account, there is no going back. Please be certain.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setShowDeleteAccountDialog(true)}
                    className="border-red-200 text-red-600 hover:bg-red-600 hover:text-white hover:border-red-600 shrink-0"
                  >
                    {t("settings.deleteAccount", { defaultValue: "Delete Account" })}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="branding" className="space-y-6 pb-24">
            {/* Visual Identity */}
            <Card className="p-0 overflow-hidden">
              <div className="px-4 py-4 bg-[#F9F9F9] border-b border-[#E5E7EB]">
                <div className="flex items-center gap-3">
                  <div className="p-2 border border-[#E5E7EB] rounded-lg bg-white">
                    <Palette className="h-5 w-5 text-[#9CA3AF]" />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-medium text-[#1A1A1A]">Visual Identity</h3>
                    <p className="text-[13px] font-normal mt-1 text-muted-foreground">
                      Configure branding for Automated Emails and the Resolution Hub. Consistent branding builds trust and reduces disputes.
                    </p>
                  </div>
                </div>
              </div>
              <CardContent className="p-4 space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div
                    className="relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#E5E7EB] bg-white px-6 py-8 text-center transition hover:border-[#19976F]/70 hover:bg-[#F9FDFB] cursor-pointer"
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => {
                      event.preventDefault();
                      const file = event.dataTransfer.files?.[0];
                      if (file) {
                        validateAndSetLogoFile(file);
                      }
                    }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={ACCEPTED_LOGO_TYPES.join(",")}
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                      onChange={handleLogoInputChange}
                    />
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex items-center justify-center h-12 w-12 rounded-full bg-[#F3F4F6]">
                        <UploadCloud className="h-6 w-6 text-[#6B7280]" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-[#1F2937]">
                          Drag & drop your logo here or click to browse
                        </p>
                        <p className="text-xs text-[#6B7280]">PNG, JPG or SVG • Max 2MB</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-4">
                      Recommended logo size: 240×80px (PNG, JPG, or SVG).
                    </p>
                  </div>

                  <div className="space-y-3 rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="text-sm font-medium text-[#1F2937]">Accent Color</Label>
                        <p className="text-xs text-muted-foreground">
                            This color drives your CTAs across Automated Emails and the Resolution Hub.
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3 items-center">
                      <input
                        type="color"
                        value={brandColor}
                        onChange={(e) => setBrandColor(e.target.value)}
                        className="h-12 w-12 rounded border border-gray-200 p-1 shadow-sm"
                        aria-label="Select brand color"
                      />
                      <Input
                        value={brandColor}
                        onChange={(e) => setBrandColor(e.target.value)}
                        className="max-w-xs"
                        aria-label="Brand color HEX code"
                      />
                    </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-[#1F2937]">Text Color</Label>
                        <div className="flex flex-wrap gap-3 items-center">
                          <input
                            type="color"
                            value={brandTextColor}
                            onChange={(e) => setBrandTextColor(e.target.value)}
                            className="h-12 w-12 rounded border border-gray-200 p-1 shadow-sm"
                            aria-label="Select brand text color"
                          />
                          <Input
                            value={brandTextColor}
                            onChange={(e) => setBrandTextColor(e.target.value)}
                            className="max-w-xs"
                            aria-label="Brand text color HEX code"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Adjust link/button text color to ensure readability on your brand background.
                        </p>
                      </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-[#1F2937]">Customer View Preview</h4>
                  </div>
                  <div className="w-full rounded-xl bg-gray-100 border border-gray-200 p-5 shadow-sm">
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-3">
                        {logoPreviewUrl || currentLogoUrl ? (
                          <img
                            src={logoPreviewUrl || currentLogoUrl || ""}
                            alt="Logo preview"
                            className="h-12 w-32 object-contain rounded-md bg-white border border-gray-200"
                          />
                        ) : (
                          <div className="h-12 w-32 rounded-md bg-gray-200 border border-gray-300" />
                        )}
                      </div>
                      <div className="space-y-2">
                        <div className="h-4 w-3/4 rounded bg-gray-200" />
                        <div className="h-4 w-2/3 rounded bg-gray-200" />
                        <div className="h-4 w-1/2 rounded bg-gray-200" />
                      </div>
                      <div className="space-y-1">
                        <button
                          type="button"
                          className="px-4 py-2 text-sm font-medium rounded-md shadow-sm text-white transition"
                          style={{ backgroundColor: brandColor || "#000000", color: brandTextColor || "#FFFFFF" }}
                        >
                          Need help with your order?
                        </button>
                        <p className="text-xs text-gray-600">Exchanges, returns, and support</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sender Settings */}
            <Card className="p-0 overflow-hidden">
              <div className="px-4 py-4 bg-[#F9F9F9] border-b border-[#E5E7EB]">
                <div className="flex items-center gap-3">
                  <div className="p-2 border border-[#E5E7EB] rounded-lg bg-white">
                    <Send className="h-5 w-5 text-[#9CA3AF]" />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-medium text-[#1A1A1A]">Sender Settings</h3>
                    <p className="text-[13px] font-normal mt-1 text-muted-foreground">
                      Define sender details for Automated Emails and the Resolution Hub to keep messages trusted and recognizable.
                    </p>
                  </div>
                </div>
              </div>
              <CardContent className="p-4 space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-[#1F2937]">From Name</Label>
                  <Input
                    value={fromName}
                    onChange={(e) => setFromName(e.target.value)}
                    placeholder='E.g., "My Store Team"'
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-[#1F2937]">Reply-To Email</Label>
                  <Input
                    type="email"
                    value={replyToEmail}
                    onChange={(e) => setReplyToEmail(e.target.value)}
                    placeholder="support@mystore.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-[#1F2937]">Email Footer</Label>
                  <Textarea
                    value={emailFooter}
                    onChange={(e) => setEmailFooter(e.target.value)}
                    placeholder="Address, social links, or legal text."
                    className="min-h-[110px]"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Policy & Support */}
            <Card className="p-0 overflow-hidden">
              <div className="px-4 py-4 bg-[#F9F9F9] border-b border-[#E5E7EB]">
                <div className="flex items-center gap-3">
                  <div className="p-2 border border-[#E5E7EB] rounded-lg bg-white">
                    <Shield className="h-5 w-5 text-[#9CA3AF]" />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-medium text-[#1A1A1A]">Policy & Support</h3>
                    <p className="text-[13px] font-normal mt-1 text-muted-foreground">
                      Key links shown in the Resolution Hub footer to build trust and strengthen dispute outcomes.
                    </p>
                  </div>
                </div>
              </div>
              <CardContent className="p-4 space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-[#1F2937]">Refund Policy URL</Label>
                  <Input
                    type="url"
                    value={refundPolicyUrl}
                    onChange={(e) => setRefundPolicyUrl(e.target.value)}
                    placeholder="https://yourstore.com/refund-policy"
                  />
                  <p className="text-xs text-muted-foreground">
                    Link to your store's refund policy. Essential for dispute evidence.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-[#1F2937]">Support / Contact URL</Label>
                  <Input
                    type="url"
                    value={supportUrl}
                    onChange={(e) => setSupportUrl(e.target.value)}
                    placeholder="https://yourstore.com/support"
                  />
                  <p className="text-xs text-muted-foreground">
                    Where should customers go if they decline the offer? (e.g., Help Center link, WhatsApp link, or Contact Page).
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="team" className="space-y-6 pb-24">
            {/* Team Management Section */}
            <Card className="p-0 overflow-hidden">
              <div className="px-4 py-4 bg-[#F9F9F9] border-b border-[#E5E7EB]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 border border-[#E5E7EB] rounded-lg bg-white">
                      <Users className="h-5 w-5 text-[#9CA3AF]" />
                    </div>
                    <div>
                      <h3 className="text-[15px] font-medium text-[#1A1A1A]">{t("settings.teamManagement")}</h3>
                      <p className="text-[13px] font-normal mt-1 text-muted-foreground">
                        {t("settings.teamManagementDesc")}
                      </p>
                    </div>
                  </div>
                  <Button
                    className="bg-white hover:bg-[#f1f1f1] text-[#1F2937] border border-[#DEDEDE]"
                    size="sm"
                    onClick={() => setIsModalOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {t("settings.addUser")}
                  </Button>
                </div>
              </div>
              <CardContent className="p-4">
                <div className="border border-[#E5E7EB] rounded-md overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-white hover:bg-white">
                        <TableHead className="text-[#1F2937] font-semibold normal-case">{t("settings.name")}</TableHead>
                        <TableHead className="text-[#1F2937] font-semibold normal-case">{t("settings.email")}</TableHead>
                        <TableHead className="text-[#1F2937] font-semibold normal-case">{t("settings.role")}</TableHead>
                        <TableHead className="text-[#1F2937] font-semibold normal-case">
                          {t("settings.createdDate")}
                        </TableHead>
                        <TableHead className="text-[#1F2937] font-semibold normal-case">{t("settings.status")}</TableHead>
                        <TableHead className="text-[#1F2937] font-semibold normal-case text-right">{t("settings.actions")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoadingTeam ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8">
                            <div className="flex items-center justify-center gap-2 text-[#6B7280]">
                              <Loader2 className="h-5 w-5 animate-spin" />
                              {t("settings.loadingUsers")}
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : teamMembers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-[#6B7280]">
                            {t("settings.noUsers")}
                          </TableCell>
                        </TableRow>
                      ) : (
                        teamMembers.map((member) => {
                          const isOwner = member.user_level === "owner";
                          // Garantir que active seja tratado como booleano verdadeiro
                          const isActive = member.active === true;
                          const canManage = canManageTeam() && !isOwner && member.id !== currentUserId;

                          return (
                            <TableRow key={member.id} className="hover:bg-[#F9F9F9]">
                              <TableCell className="font-medium text-[#1F2937]">
                                <div className="flex items-center gap-2">
                                  {member.nome}
                                  {isOwner && (
                                    <Badge variant="secondary" className="text-xs">
                                      {t("settings.owner")}
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-[#6B7280]">{member.email}</TableCell>
                              <TableCell>
                                <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-[#F0FDF4] text-[#19976F]">
                                  {member.user_level === "admin"
                                    ? t("settings.administrator")
                                    : member.user_level === "owner"
                                      ? t("settings.owner")
                                      : member.user_level === "manager"
                                        ? t("settings.manager")
                                        : t("settings.user")}
                                </span>
                              </TableCell>
                              <TableCell className="text-[#6B7280]">
                                {new Date(member.created_at).toLocaleDateString(
                                  t("header.language") === "English" ? "en-US" : "pt-BR",
                                  {
                                    day: "2-digit",
                                    month: "long",
                                    year: "numeric",
                                  }
                                )}
                              </TableCell>
                              <TableCell>
                                <span
                                  className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                                    isActive
                                      ? "bg-[#F0FDF4] text-[#19976F]"
                                      : "bg-gray-100 text-gray-600"
                                  }`}
                                >
                                  {isActive ? t("settings.active") : t("settings.inactive")}
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                {canManage ? (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0"
                                        aria-label={t("settings.actions")}
                                      >
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem
                                        onClick={() => {
                                          console.log("🔵 Clicou em desativar/ativar:", {
                                            memberId: member.id,
                                            memberName: member.nome,
                                            isActive,
                                            active: member.active
                                          });
                                          setMemberToToggle(member);
                                        }}
                                        className="cursor-pointer"
                                      >
                                        {isActive ? (
                                          <>
                                            <UserX className="mr-2 h-4 w-4" />
                                            {t("settings.deactivate")}
                                          </>
                                        ) : (
                                          <>
                                            <UserCheck className="mr-2 h-4 w-4" />
                                            {t("settings.reactivate")}
                                          </>
                                        )}
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => setMemberToRemove(member)}
                                        className="cursor-pointer text-red-600 focus:text-red-600"
                                      >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        {t("settings.remove")}
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                ) : (
                                  <span className="text-xs text-gray-400">-</span>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>

                <p className="text-sm text-[#6B7280] mt-4">
                  {t("settings.showing")} {teamMembers.length} {t("settings.of")} {teamMembers.length}{" "}
                  {t("settings.users")}
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6 pb-24">
            {/* Change Password Section */}
            <Card className="p-0 overflow-hidden">
              <div className="px-4 py-4 bg-[#F9F9F9] border-b border-[#E5E7EB]">
                <div className="flex items-center gap-3">
                  <div className="p-2 border border-[#E5E7EB] rounded-lg bg-white">
                    <Key className="h-5 w-5 text-[#9CA3AF]" />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-medium text-[#1A1A1A]">
                      {t("settings.changePassword")}
                    </h3>
                    <p className="text-[13px] font-normal mt-1 text-muted-foreground">
                      {t("settings.changePasswordDesc")}
                    </p>
                  </div>
                </div>
              </div>
              <CardContent className="p-4 space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  {/* Current Password */}
                  <div className="space-y-2">
                    <Label htmlFor="current-password" className="text-[#1F2937] font-medium">
                      {t("settings.currentPassword")}
                    </Label>
                    <div className="relative">
                      <Input
                        id="current-password"
                        type={showCurrentPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="pr-10 border-[#DEDEDE] focus:border-[#19976F] focus:ring-[#19976F]"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#1F2937]"
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div className="space-y-2">
                    <Label htmlFor="new-password" className="text-[#1F2937] font-medium">
                      {t("settings.newPassword")}
                    </Label>
                    <div className="relative">
                      <Input
                        id="new-password"
                        type={showNewPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="pr-10 border-[#DEDEDE] focus:border-[#19976F] focus:ring-[#19976F]"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#1F2937]"
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    
                    {/* Password strength bar */}
                    {newPassword.length > 0 && (
                      <div className="space-y-2">
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              passwordStrength.strength >= 75
                                ? "bg-[#19976F]"
                                : passwordStrength.strength >= 50
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                            }`}
                            style={{ width: `${passwordStrength.strength}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span
                            className={
                              passwordStrength.strength >= 75
                                ? "text-[#19976F]"
                                : passwordStrength.strength >= 50
                                  ? "text-yellow-600"
                                  : "text-red-600"
                            }
                          >
                            {passwordStrength.message}
                          </span>
                          <span
                            className={
                              passwordStrength.strength >= 75
                                ? "text-[#19976F] font-medium"
                                : passwordStrength.strength >= 50
                                  ? "text-yellow-600 font-medium"
                                  : "text-red-600 font-medium"
                            }
                          >
                            {passwordStrength.label}
                          </span>
                        </div>
                      </div>
                    )}
                    <p className="text-xs text-[#6B7280]">
                      {t("settings.passwordRequirement")}
                    </p>
                  </div>

                  {/* Confirm New Password */}
                  <div className="flex flex-col">
                    <div className="space-y-2">
                      <Label htmlFor="confirm-new-password" className="text-[#1F2937] font-medium">
                        {t("settings.confirmNewPassword")}
                      </Label>
                      <div className="relative">
                        <Input
                          id="confirm-new-password"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="••••••••"
                          className="pr-10 border-[#DEDEDE] focus:border-[#19976F] focus:ring-[#19976F]"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#1F2937]"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    
                    {/* Update Password Button */}
                    <div className="mt-auto pt-4 flex justify-end">
                      <Button
                        className="bg-white hover:bg-[#f1f1f1] text-[#1F2937] border border-[#DEDEDE]"
                        size="sm"
                        onClick={handleChangePassword}
                        disabled={isChangingPassword}
                      >
                        {isChangingPassword ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            {t("settings.changingPassword")}
                          </>
                        ) : (
                          t("settings.updatePassword")
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Two-Factor Authentication Section */}
            <Card className="p-0 overflow-hidden">
              <div className="px-4 py-4 bg-[#F9F9F9] border-b border-[#E5E7EB]">
                <div className="flex items-center gap-3">
                  <div className="p-2 border border-[#E5E7EB] rounded-lg bg-white">
                    <Shield className="h-5 w-5 text-[#9CA3AF]" />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-medium text-[#1A1A1A]">{t("settings.twoFactorAuth")}</h3>
                    <p className="text-[13px] font-normal mt-1 text-muted-foreground">
                      {t("settings.twoFactorAuthDesc")}
                    </p>
                  </div>
                </div>
              </div>
              <CardContent className="p-4">
                {isLoading2FA ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-[#19976F]" />
                  </div>
                ) : !twoFactorEnabled && !showTwoFactorSetup ? (
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5 pl-4">
                      <p className="text-[14px] font-medium text-[#1F2937]">{t("settings.enable2FA")}</p>
                      <p className="text-sm text-[#6B7280]">{t("settings.enable2FADesc")}</p>
                    </div>
                    <Button
                      onClick={handleEnable2FA}
                      className="bg-white hover:bg-[#f1f1f1] text-[#1F2937] border border-[#DEDEDE]"
                    >
                      {t("settings.activate")}
                    </Button>
                  </div>
                ) : twoFactorEnabled && !showTwoFactorSetup ? (
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5 pl-4">
                      <div className="flex items-center gap-2">
                        <p className="text-[14px] font-medium text-[#1F2937]">{t("settings.twoFactorActive")}</p>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {t("settings.twoFactorActiveStatus")}
                        </span>
                      </div>
                      <p className="text-sm text-[#6B7280]">{t("settings.twoFactorActiveDesc")}</p>
                    </div>
                    <Button
                      onClick={handleDisable2FA}
                      variant="outline"
                      className="border-red-200 text-red-600 hover:bg-red-50"
                    >
                      {t("settings.disable")}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex flex-col items-center justify-center p-6 bg-white border border-[#E5E7EB] rounded-lg">
                      <div className="p-4 bg-white rounded-lg shadow-sm border border-[#E5E7EB]">
                        <QRCodeSVG
                          value={getOtpAuthUrl()}
                          size={180}
                          level="M"
                          includeMargin={true}
                        />
                      </div>
                      <p className="mt-4 text-sm text-center text-[#6B7280] max-w-md">
                        {t("settings.scanQRCode")}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-[#1F2937]">
                        {t("settings.manualEntryKey")}
                      </Label>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 p-3 bg-[#F9F9F9] rounded-lg border border-[#E5E7EB] font-mono text-sm text-[#1F2937] break-all">
                          {twoFactorSecret}
                        </div>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={copySecretToClipboard}
                          className="shrink-0"
                        >
                          {secretCopied ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="verification-code" className="text-sm font-medium text-[#1F2937]">
                        {t("settings.verificationCode")}
                      </Label>
                      <Input
                        id="verification-code"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={6}
                        placeholder="000000"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                        className="text-center text-lg font-mono tracking-widest"
                      />
                    </div>

                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowTwoFactorSetup(false);
                          setTwoFactorSecret(null);
                          setVerificationCode("");
                        }}
                        className="flex-1"
                      >
                        {t("settings.cancel")}
                      </Button>
                      <Button
                        onClick={handleVerifyAndActivate2FA}
                        disabled={verificationCode.length !== 6 || isVerifying2FA}
                        className="flex-1 bg-[#19976F] hover:bg-[#157a58] text-white"
                      >
                        {isVerifying2FA ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            {t("settings.verifying")}
                          </>
                        ) : (
                          t("settings.verifyAndActivate")
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Active Sessions */}
            <Card className="p-0 overflow-hidden">
              <div className="px-4 py-4 bg-[#F9F9F9] border-b border-[#E5E7EB]">
                <div className="flex items-center gap-3">
                  <div className="p-2 border border-[#E5E7EB] rounded-lg bg-white">
                    <MonitorSmartphone className="h-5 w-5 text-[#9CA3AF]" />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-medium text-[#1A1A1A]">Active Sessions</h3>
                    <p className="text-[13px] font-normal mt-1 text-muted-foreground">
                      Manage devices logged into your account
                    </p>
                  </div>
                </div>
              </div>
              <CardContent className="p-4 space-y-4">
                <div className="divide-y divide-[#E5E7EB] border border-[#E5E7EB] rounded-lg bg-white">
                  {isLoadingSessions ? (
                    <div className="flex items-center gap-2 px-4 py-6">
                      <Loader2 className="h-4 w-4 animate-spin text-[#19976F]" />
                      <span className="text-sm text-[#6B7280]">Carregando sessões...</span>
                    </div>
                  ) : sessions.length === 0 ? (
                    <div className="px-4 py-6 text-sm text-[#6B7280]">
                      Nenhuma sessão ativa encontrada.
                    </div>
                  ) : (
                    sessions.map((session) => (
                      <div key={session.id} className="flex flex-wrap items-center justify-between gap-4 px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg border border-[#E5E7EB] bg-[#F9F9F9]">
                            {session.type === "mobile" ? (
                              <Smartphone className="h-5 w-5 text-[#19976F]" />
                            ) : (
                              <Monitor className="h-5 w-5 text-[#19976F]" />
                            )}
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-[#1F2937]">
                              {session.browser} on {session.os}
                            </p>
                            <div className="flex items-center gap-2 text-sm text-[#6B7280]">
                              <MapPin className="h-4 w-4" />
                              <span>
                                {session.location} • {session.ip}
                              </span>
                            </div>
                          </div>
                        </div>
                        {session.current ? (
                          <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-50 hover:text-emerald-700 cursor-default">
                            Current Session
                          </Badge>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-[#DEDEDE]"
                            disabled={revokingSessionId === session.id}
                            onClick={() => handleRevokeSession(session.id, session.current)}
                          >
                            {revokingSessionId === session.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              "Revoke"
                            )}
                          </Button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

          </TabsContent>
        </Tabs>

        {/* Modal para adicionar usuário */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-[#1F2937]">{t("settings.addNewUser")}</DialogTitle>
              <DialogDescription className="text-[#6B7280]">{t("settings.addNewUserDesc")}</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nome" className="text-[#1F2937] font-medium">
                  {t("settings.nameLabel")}
                </Label>
                <Input
                  id="nome"
                  placeholder={t("settings.enterFullName")}
                  value={newUserNome}
                  onChange={(e) => setNewUserNome(e.target.value)}
                  className="border-[#DEDEDE] focus:border-[#19976F] focus:ring-[#19976F]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-[#1F2937] font-medium">
                  {t("settings.emailLabel")}
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t("settings.enterEmail")}
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="border-[#DEDEDE] focus:border-[#19976F] focus:ring-[#19976F]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="funcao" className="text-[#1F2937] font-medium">
                  {t("settings.function")}
                </Label>
                <Select value={newUserFuncao} onValueChange={(value: "admin" | "user") => setNewUserFuncao(value)}>
                  <SelectTrigger id="funcao" className="border-[#DEDEDE]">
                    <SelectValue placeholder={t("settings.selectFunction")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">{t("settings.user")}</SelectItem>
                    <SelectItem value="admin">{t("settings.administrator")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between p-4 bg-[#F9F9F9] rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="status" className="text-[#1F2937] font-medium">
                    {t("settings.statusLabel")}
                  </Label>
                  <p className="text-sm text-[#6B7280]">
                    {newUserStatus ? t("settings.active") : t("settings.inactive")}
                  </p>
                </div>
                <Switch
                  id="status"
                  checked={newUserStatus}
                  onCheckedChange={setNewUserStatus}
                  className="data-[state=checked]:bg-[#19976F]"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                disabled={isCreatingUser}
                className="border-[#DEDEDE]"
              >
                {t("settings.cancel")}
              </Button>
              <Button
                onClick={handleCreateUser}
                disabled={isCreatingUser}
                className="bg-[#19976F] hover:bg-[#148a64] text-white"
              >
                {isCreatingUser ? t("settings.creating") : t("settings.createUser")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal para desativar/ativar membro */}
        <Dialog open={!!memberToToggle} onOpenChange={(open) => !open && setMemberToToggle(null)}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-[#1F2937]">
                {memberToToggle?.active !== false
                  ? t("settings.confirmDeactivate")
                  : t("settings.confirmReactivate")}
              </DialogTitle>
              <DialogDescription className="text-[#6B7280]">
                {memberToToggle?.active !== false
                  ? t("settings.deactivateMemberDesc")
                  : t("settings.reactivateMemberDesc")}{" "}
                <strong>{memberToToggle?.nome}</strong>?
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <p className="text-sm text-[#6B7280]">
                {memberToToggle?.active !== false
                  ? t("settings.deactivateMemberConsequence")
                  : t("settings.reactivateMemberConsequence")}
              </p>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setMemberToToggle(null)}
                disabled={isTogglingMember}
                className="border-[#DEDEDE]"
              >
                {t("settings.cancel")}
              </Button>
              <Button
                onClick={() => {
                  console.log("🟢 Clicou em confirmar toggle no modal");
                  handleToggleMember();
                }}
                disabled={isTogglingMember}
                className={
                  memberToToggle?.active !== false
                    ? "bg-orange-600 hover:bg-orange-700 text-white"
                    : "bg-[#19976F] hover:bg-[#148a64] text-white"
                }
              >
                {isTogglingMember ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {memberToToggle?.active !== false
                      ? t("settings.deactivating")
                      : t("settings.activating")}
                  </>
                ) : memberToToggle?.active !== false ? (
                  t("settings.deactivate")
                ) : (
                  t("settings.reactivate")
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal para remover membro */}
        <Dialog
          open={!!memberToRemove}
          onOpenChange={(open) => {
            if (!open) {
              setMemberToRemove(null);
              setConfirmEmail("");
            }
          }}
        >
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-[#1F2937]">{t("settings.confirmRemove")}</DialogTitle>
              <DialogDescription className="text-[#6B7280]">
                {t("settings.removeMemberDesc")} <strong>{memberToRemove?.nome}</strong>?
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{t("settings.removeMemberConsequence")}</p>
              </div>

              {(memberToRemove?.user_level === "admin" || memberToRemove?.user_level === "owner") && (
                <div className="space-y-2">
                  <Label htmlFor="confirm-email" className="text-[#1F2937] font-medium">
                    {t("settings.removeMemberAdminWarning")}
                  </Label>
                  <Input
                    id="confirm-email"
                    type="email"
                    placeholder={t("settings.typeEmailToConfirm")}
                    value={confirmEmail}
                    onChange={(e) => setConfirmEmail(e.target.value)}
                    className="border-[#DEDEDE] focus:border-red-500 focus:ring-red-500"
                  />
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setMemberToRemove(null);
                  setConfirmEmail("");
                }}
                disabled={isRemovingMember}
                className="border-[#DEDEDE]"
              >
                {t("settings.cancel")}
              </Button>
              <Button
                onClick={handleRemoveMember}
                disabled={
                  isRemovingMember ||
                  ((memberToRemove?.user_level === "admin" || memberToRemove?.user_level === "owner") &&
                    confirmEmail !== memberToRemove?.email)
                }
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isRemovingMember ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("settings.removing")}
                  </>
                ) : (
                  t("settings.remove")
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* AlertDialog para deletar conta - Shopify App Store Requirements */}
        <AlertDialog open={showDeleteAccountDialog} onOpenChange={setShowDeleteAccountDialog}>
          <AlertDialogContent className="sm:max-w-[500px]">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl font-bold text-[#1F2937]">
                Deactivate and Uninstall?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-[#6B7280] text-base leading-relaxed">
                This will cancel your subscription immediately, remove your account data, and uninstall the app from your store. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="sm:space-x-2">
              <AlertDialogCancel 
                disabled={isDeletingAccount}
                className="border-[#DEDEDE] hover:bg-[#F9F9F9] focus:ring-2 focus:ring-offset-2 focus:ring-[#19976F]"
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  handleDeleteAccount();
                }}
                disabled={isDeletingAccount}
                className="bg-red-600 hover:bg-red-700 text-white focus:ring-red-600"
              >
                {isDeletingAccount ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uninstalling...
                  </>
                ) : (
                  "Uninstall App & Delete Data"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Save Bar - rodapé fixo enterprise clean */}
      <SaveBar
        isOpen={
          form.formState.isDirty ||
          !!selectedLogoFile ||
          brandColor !== initialBrandColorRef.current ||
          brandTextColor !== initialBrandTextColorRef.current ||
          fromName !== initialSenderSettingsRef.current.fromName ||
          replyToEmail !== initialSenderSettingsRef.current.replyToEmail ||
          emailFooter !== initialSenderSettingsRef.current.emailFooter ||
          refundPolicyUrl !== initialPolicySupportRef.current.refundPolicyUrl ||
          supportUrl !== initialPolicySupportRef.current.supportUrl
        }
        isLoading={isSavingSettings}
        onSave={form.handleSubmit(handleSaveAll)}
        onDiscard={handleDiscardChanges}
      />
    </DashboardLayout>
  );
}
