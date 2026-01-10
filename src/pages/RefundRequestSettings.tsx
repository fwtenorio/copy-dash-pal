import { DashboardLayout } from "@/components/DashboardLayout";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Palette,
  Send,
  Shield,
  UploadCloud,
  Loader2,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import { supabase } from "@/integrations/supabase/safeClient";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { SaveBar } from "@/components/SaveBar";
import { EvidenceFieldEditor } from "@/components/EvidenceFieldEditor";

export default function RefundRequestSettings() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [isSaving, setIsSaving] = useState(false);
  const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [currentLogoUrl, setCurrentLogoUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const initialBrandColorRef = useRef("#10B981");
  const [brandColor, setBrandColor] = useState(initialBrandColorRef.current);
  const initialBrandTextColorRef = useRef("#FFFFFF");
  const [brandTextColor, setBrandTextColor] = useState(initialBrandTextColorRef.current);

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

  const MAX_LOGO_SIZE_BYTES = 2 * 1024 * 1024;
  const ACCEPTED_LOGO_TYPES = ["image/png", "image/jpeg", "image/svg+xml"];

  // Load branding data
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
          console.error("Error fetching client_id:", userError);
          return;
        }

        const { data, error } = await supabase
          .from("clients")
          .select("brand_color, brand_text_color, support_url, refund_policy_url, logo_url, sender_from_name, sender_reply_to_email, sender_email_footer")
          .eq("id", userRow.client_id)
          .maybeSingle();

        if (error) {
          console.error("Error loading branding:", error);
          return;
        }

        if (data?.brand_color) {
          setBrandColor(data.brand_color);
          initialBrandColorRef.current = data.brand_color;
        }
        if (data?.brand_text_color) {
          setBrandTextColor(data.brand_text_color);
          initialBrandTextColorRef.current = data.brand_text_color;
        }
        if (data?.support_url) {
          setSupportUrl(data.support_url);
          initialPolicySupportRef.current.supportUrl = data.support_url;
        }
        if (data?.refund_policy_url) {
          setRefundPolicyUrl(data.refund_policy_url);
          initialPolicySupportRef.current.refundPolicyUrl = data.refund_policy_url;
        }
        if (data?.logo_url) {
          setCurrentLogoUrl(data.logo_url);
        }
        if (data?.sender_from_name) {
          setFromName(data.sender_from_name);
          initialSenderSettingsRef.current.fromName = data.sender_from_name;
        }
        if (data?.sender_reply_to_email) {
          setReplyToEmail(data.sender_reply_to_email);
          initialSenderSettingsRef.current.replyToEmail = data.sender_reply_to_email;
        }
        if (data?.sender_email_footer) {
          setEmailFooter(data.sender_email_footer);
          initialSenderSettingsRef.current.emailFooter = data.sender_email_footer;
        }
      } catch (err) {
        console.error("Error loading branding:", err);
      }
    };

    loadBranding();
  }, []);

  const validateAndSetLogoFile = (file: File) => {
    if (!ACCEPTED_LOGO_TYPES.includes(file.type)) {
      toast.error("Unsupported image format", {
        description: "Please upload a PNG, JPG or SVG file.",
      });
      return;
    }

    if (file.size > MAX_LOGO_SIZE_BYTES) {
      toast.error("Logo must be under 2MB.");
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
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        toast.error("Could not authenticate to upload logo.");
        return null;
      }

      const { data: userRow, error: userError } = await supabase
        .from("users")
        .select("client_id")
        .eq("id", user.id)
        .maybeSingle();

      if (userError || !userRow?.client_id) {
        toast.error("Could not find company to save logo.");
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
        console.error("Error uploading logo:", uploadError);
        toast.error("Failed to upload logo. Please try again.");
        return null;
      }

      const { data: publicUrlData } = supabase.storage.from("logos").getPublicUrl(path);
      const publicUrl = publicUrlData?.publicUrl || null;
      if (!publicUrl) {
        toast.error("Could not get public URL for logo.");
        return null;
      }

      setCurrentLogoUrl(publicUrl);
      return publicUrl;
    } catch (err) {
      console.error("Unexpected error uploading logo:", err);
      toast.error("Failed to upload logo.");
      return null;
    }
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error("User not authenticated");
      }

      const { data: currentUser, error: currentUserError } = await supabase
        .from("users")
        .select("client_id")
        .eq("id", user.id)
        .maybeSingle();

      if (currentUserError || !currentUser?.client_id) {
        throw new Error("Could not find user company");
      }

      let uploadedLogoUrl: string | null = null;
      if (selectedLogoFile) {
        uploadedLogoUrl = await handleLogoUpload(selectedLogoFile);
        if (uploadedLogoUrl) {
          setCurrentLogoUrl(uploadedLogoUrl);
        }
      }

      const effectiveLogoUrl = uploadedLogoUrl ?? currentLogoUrl ?? null;

      const updateData = {
        brand_color: brandColor?.trim() || null,
        brand_text_color: brandTextColor?.trim() || null,
        support_url: supportUrl?.trim() || null,
        refund_policy_url: refundPolicyUrl?.trim() || null,
        logo_url: effectiveLogoUrl,
        sender_from_name: fromName?.trim() || null,
        sender_reply_to_email: replyToEmail?.trim() || null,
        sender_email_footer: emailFooter?.trim() || null,
        settings_updated_at: new Date().toISOString(),
      };

      const { error: updateError } = await supabase
        .from("clients")
        .update(updateData)
        .eq("id", currentUser.client_id);

      if (updateError) {
        throw updateError;
      }

      // Reset dirty state
      setSelectedLogoFile(null);
      initialBrandColorRef.current = brandColor;
      initialBrandTextColorRef.current = brandTextColor;
      initialSenderSettingsRef.current = { fromName, replyToEmail, emailFooter };
      initialPolicySupportRef.current = { refundPolicyUrl, supportUrl };

      toast.success("Settings saved successfully!");
    } catch (error: any) {
      console.error("Error saving settings:", error);
      toast.error(error.message || "Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscardChanges = () => {
    setBrandColor(initialBrandColorRef.current);
    setBrandTextColor(initialBrandTextColorRef.current);
    setFromName(initialSenderSettingsRef.current.fromName);
    setReplyToEmail(initialSenderSettingsRef.current.replyToEmail);
    setEmailFooter(initialSenderSettingsRef.current.emailFooter);
    setRefundPolicyUrl(initialPolicySupportRef.current.refundPolicyUrl);
    setSupportUrl(initialPolicySupportRef.current.supportUrl);
    setSelectedLogoFile(null);
    if (logoPreviewUrl) {
      URL.revokeObjectURL(logoPreviewUrl);
      setLogoPreviewUrl(null);
    }
  };

  const isDirty =
    !!selectedLogoFile ||
    brandColor !== initialBrandColorRef.current ||
    brandTextColor !== initialBrandTextColorRef.current ||
    fromName !== initialSenderSettingsRef.current.fromName ||
    replyToEmail !== initialSenderSettingsRef.current.replyToEmail ||
    emailFooter !== initialSenderSettingsRef.current.emailFooter ||
    refundPolicyUrl !== initialPolicySupportRef.current.refundPolicyUrl ||
    supportUrl !== initialPolicySupportRef.current.supportUrl;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/refund-request")}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <PageHeader
            title="Refund Request Settings"
            subtitle="Configure branding and evidence requirements for the Resolution Hub"
          />
        </div>

        <Tabs defaultValue="branding" className="space-y-6">
          <div className="border-b border-border">
            <TabsList className="bg-transparent h-auto p-0 space-x-6">
              <TabsTrigger
                value="branding"
                className="border-b-[3px] border-transparent data-[state=active]:border-primary rounded-none bg-transparent pb-3"
              >
                Branding
              </TabsTrigger>
              <TabsTrigger
                value="evidence"
                className="border-b-[3px] border-transparent data-[state=active]:border-primary rounded-none bg-transparent pb-3"
              >
                Evidence Requirements
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="branding" className="space-y-6 pb-24">
            {/* Visual Identity */}
            <Card className="p-0 overflow-hidden">
              <div className="px-4 py-4 bg-muted/50 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="p-2 border border-border rounded-lg bg-background">
                    <Palette className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-medium text-foreground">Visual Identity</h3>
                    <p className="text-[13px] font-normal mt-1 text-muted-foreground">
                      Configure branding for Automated Emails and the Resolution Hub. Consistent branding builds trust and reduces disputes.
                    </p>
                  </div>
                </div>
              </div>
              <CardContent className="p-4 space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div
                    className="relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-background px-6 py-8 text-center transition hover:border-primary/70 hover:bg-primary/5 cursor-pointer"
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
                      <div className="flex items-center justify-center h-12 w-12 rounded-full bg-muted">
                        <UploadCloud className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-foreground">
                          Drag & drop your logo here or click to browse
                        </p>
                        <p className="text-xs text-muted-foreground">PNG, JPG or SVG • Max 2MB</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-4">
                      Recommended logo size: 240×80px (PNG, JPG, or SVG).
                    </p>
                  </div>

                  <div className="space-y-3 rounded-xl border border-border bg-background p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="text-sm font-medium text-foreground">Accent Color</Label>
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
                        className="h-12 w-12 rounded border border-border p-1 shadow-sm"
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
                      <Label className="text-sm font-medium text-foreground">Text Color</Label>
                      <div className="flex flex-wrap gap-3 items-center">
                        <input
                          type="color"
                          value={brandTextColor}
                          onChange={(e) => setBrandTextColor(e.target.value)}
                          className="h-12 w-12 rounded border border-border p-1 shadow-sm"
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
                    <h4 className="text-sm font-semibold text-foreground">Customer View Preview</h4>
                  </div>
                  <div className="w-full rounded-xl bg-muted border border-border p-5 shadow-sm">
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-3">
                        {logoPreviewUrl || currentLogoUrl ? (
                          <img
                            src={logoPreviewUrl || currentLogoUrl || ""}
                            alt="Logo preview"
                            className="h-12 w-32 object-contain rounded-md bg-background border border-border"
                          />
                        ) : (
                          <div className="h-12 w-32 rounded-md bg-muted-foreground/20 border border-border" />
                        )}
                      </div>
                      <div className="space-y-2">
                        <div className="h-4 w-3/4 rounded bg-muted-foreground/20" />
                        <div className="h-4 w-2/3 rounded bg-muted-foreground/20" />
                        <div className="h-4 w-1/2 rounded bg-muted-foreground/20" />
                      </div>
                      <div className="space-y-1">
                        <button
                          type="button"
                          className="px-4 py-2 text-sm font-medium rounded-md shadow-sm transition"
                          style={{ backgroundColor: brandColor || "#10B981", color: brandTextColor || "#FFFFFF" }}
                        >
                          Need help with your order?
                        </button>
                        <p className="text-xs text-muted-foreground">Exchanges, returns, and support</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sender Settings */}
            <Card className="p-0 overflow-hidden">
              <div className="px-4 py-4 bg-muted/50 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="p-2 border border-border rounded-lg bg-background">
                    <Send className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-medium text-foreground">Sender Settings</h3>
                    <p className="text-[13px] font-normal mt-1 text-muted-foreground">
                      Define sender details for Automated Emails and the Resolution Hub to keep messages trusted and recognizable.
                    </p>
                  </div>
                </div>
              </div>
              <CardContent className="p-4 space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">From Name</Label>
                  <Input
                    value={fromName}
                    onChange={(e) => setFromName(e.target.value)}
                    placeholder='E.g., "My Store Team"'
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">Reply-To Email</Label>
                  <Input
                    type="email"
                    value={replyToEmail}
                    onChange={(e) => setReplyToEmail(e.target.value)}
                    placeholder="support@mystore.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">Email Footer</Label>
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
              <div className="px-4 py-4 bg-muted/50 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="p-2 border border-border rounded-lg bg-background">
                    <Shield className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-medium text-foreground">Policy & Support</h3>
                    <p className="text-[13px] font-normal mt-1 text-muted-foreground">
                      Key links shown in the Resolution Hub footer to build trust and strengthen dispute outcomes.
                    </p>
                  </div>
                </div>
              </div>
              <CardContent className="p-4 space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">Refund Policy URL</Label>
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
                  <Label className="text-sm font-medium text-foreground">Support / Contact URL</Label>
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

          <TabsContent value="evidence" className="space-y-6 pb-24">
            <EvidenceFieldEditor />
          </TabsContent>
        </Tabs>
      </div>

      <SaveBar
        isOpen={isDirty}
        isLoading={isSaving}
        onSave={handleSaveAll}
        onDiscard={handleDiscardChanges}
      />
    </DashboardLayout>
  );
}
