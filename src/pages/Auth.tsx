import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff, Shield } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import AuthAnimation from "@/components/AuthAnimation";
import { PhoneInput } from "@/components/ui/phone-input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import * as OTPAuth from "otpauth";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [step, setStep] = useState(1); // 1: email/senha, 2: dados adicionais
  const [nome, setNome] = useState("");
  const [nomeEmpresa, setNomeEmpresa] = useState("");
  const [telefone, setTelefone] = useState("");
  
  // 2FA States
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [twoFactorSecret, setTwoFactorSecret] = useState("");
  const [verifying2FA, setVerifying2FA] = useState(false);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  
  const navigate = useNavigate();

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

  const passwordStrength = calculatePasswordStrength(password);

  useEffect(() => {
    // Check if user is already logged in (only if not showing 2FA modal)
    if (!show2FAModal) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session && !show2FAModal) {
          // Check if this is a pending 2FA verification
          checkAndNavigate(session.user.id);
        }
      });
    }

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // Only auto-navigate if not in 2FA flow
      if (session && !show2FAModal && !pendingUserId) {
        checkAndNavigate(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, show2FAModal, pendingUserId]);

  const checkAndNavigate = async (userId: string) => {
    try {
      const { data: clientData } = await supabase
        .from("clients")
        .select("two_factor_enabled")
        .eq("id", userId)
        .single();
      
      // If 2FA is not enabled, navigate directly
      if (!clientData?.two_factor_enabled) {
        navigate("/");
      }
      // If 2FA is enabled, we stay on auth page (modal should be shown)
    } catch (error) {
      // If we can't check, navigate anyway
      navigate("/");
    }
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            nome: nome,
            nome_empresa: nomeEmpresa,
            telefone: telefone,
          },
        },
      });

      if (error) {
        if (error.message.includes("already registered")) {
          toast.error("Email already registered", {
            description: "This email is already registered. Please sign in.",
          });
        } else {
          toast.error("Error creating account", {
            description: error.message,
          });
        }
      } else {
        toast.success("Account created successfully!", {
          description: "You can now access the system.",
        });
      }
    } catch (error) {
      toast.error("Error", {
        description: "An error occurred while creating your account.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast.error("Invalid credentials", {
            description: "Email or password is incorrect.",
          });
        } else {
          toast.error("Error signing in", {
            description: error.message,
          });
        }
        setLoading(false);
        return;
      }

      // Check if user has 2FA enabled
      if (data.user) {
        const { data: clientData } = await supabase
          .from("clients")
          .select("two_factor_enabled, two_factor_secret")
          .eq("id", data.user.id)
          .single();

        if (clientData?.two_factor_enabled && clientData?.two_factor_secret) {
          // Show 2FA modal instead of navigating
          setPendingUserId(data.user.id);
          setTwoFactorSecret(clientData.two_factor_secret);
          setShow2FAModal(true);
          setLoading(false);
          return;
        }

        // No 2FA, save login to notifications_menu and proceed with navigation
        await saveLoginToNotificationsMenu(data.user.id);
        
        toast.success("Signed in!", {
          description: "Welcome back.",
        });
        navigate("/");
      }
    } catch (error) {
      toast.error("Error", {
        description: "An error occurred while signing in.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Function to save login to notifications_menu
  const saveLoginToNotificationsMenu = async (userId: string) => {
    try {
      // Buscar baseline anterior (fallback para disputes)
      const { data: existingRow } = await supabase
        .from("notifications_menu")
        .select("disputes")
        .eq("user_id", userId)
        .maybeSingle();

      const previousBaseline = existingRow?.disputes ?? 0;

      // Contar disputas atuais via função (pode falhar se não houver Shopify conectada)
      let currentDisputes = 0;
      try {
        const { data: disputesData, error: disputesError } = await supabase.functions.invoke("shopify-disputes", {
          body: {},
        });
        if (disputesError) {
          throw disputesError;
        }
        currentDisputes = disputesData?.rawData?.disputes?.length ?? 0;
        console.log("Disputes no login:", currentDisputes);
      } catch (err: any) {
        // Log detalhado, mas não bloquear o fluxo de login
        try {
          const respText = await err?.context?.response?.text?.();
          if (respText) {
            console.error("Resposta completa shopify-disputes:", respText);
          }
        } catch {
          /* ignore */
        }
        console.error("Erro ao contar disputas no login:", err);
        // fallback: não altera baseline; mantém currentDisputes = 0 para não gerar delta negativo
        currentDisputes = previousBaseline;
      }

      // Calcula delta apenas se houver aumento em relação ao baseline
      let deltaDisputes = 0;
      if (currentDisputes > previousBaseline) {
        deltaDisputes = currentDisputes - previousBaseline;
      }

      // Try to upsert (insert or update) the notifications_menu record
      const { error } = await supabase
        .from("notifications_menu")
        .upsert(
          {
            user_id: userId,
            last_login: new Date().toISOString(),
            disputes: deltaDisputes,   // valor a exibir (novas disputas)
            disputes_old: currentDisputes, // baseline para o próximo login
          },
          {
            onConflict: "user_id",
          }
        );
      
      if (error) {
        console.error("Error saving login to notifications_menu:", error);
      }

      // Sinaliza para a UI que notificações foram atualizadas (para sidebar/badges)
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("notifications-menu-updated", { detail: { userId } }));
      }
    } catch (error) {
      console.error("Error saving login to notifications_menu:", error);
    }
  };

  const handleVerify2FA = async () => {
    if (twoFactorCode.length !== 6) {
      toast.error("Invalid code", {
        description: "Please enter the 6-digit code.",
      });
      return;
    }

    setVerifying2FA(true);

    try {
      // Verify the TOTP code
      const totp = new OTPAuth.TOTP({
        issuer: "ChargeMind",
        label: email,
        algorithm: "SHA1",
        digits: 6,
        period: 30,
        secret: twoFactorSecret,
      });

      const delta = totp.validate({ token: twoFactorCode, window: 1 });
      const isValid = delta !== null;

      if (!isValid) {
        toast.error("Incorrect code", {
          description: "The code you entered is incorrect. Please try again.",
        });
        setTwoFactorCode("");
        setVerifying2FA(false);
        return;
      }

      // Save login to notifications_menu
      if (pendingUserId) {
        await saveLoginToNotificationsMenu(pendingUserId);
      }

      // Code is valid, proceed with navigation
      toast.success("Signed in!", {
        description: "Welcome back.",
      });
      setShow2FAModal(false);
      navigate("/");
    } catch (error) {
      toast.error("Error", {
        description: "An error occurred while verifying the code.",
      });
    } finally {
      setVerifying2FA(false);
    }
  };

  const handleCancel2FA = async () => {
    // Sign out the user since they didn't complete 2FA
    await supabase.auth.signOut();
    setShow2FAModal(false);
    setTwoFactorCode("");
    setTwoFactorSecret("");
    setPendingUserId(null);
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });

      if (error) {
        toast.error("Error signing in with Google", {
          description: error.message,
        });
      }
    } catch (error) {
      toast.error("Error", {
        description: "An error occurred while signing in with Google.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error("Email required", {
        description: "Please enter your email address.",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        toast.error("Error", {
          description: error.message,
        });
      } else {
        toast.success("Email sent!", {
          description: "Check your email for a password reset link.",
        });
        setIsForgotPassword(false);
        setEmail("");
      }
    } catch (error) {
      toast.error("Error", {
        description: "An error occurred while sending the reset email.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          <div className="flex justify-start">
            <img src="/logo.png" alt="chargemind" className="h-7" />
          </div>

          {/* Title and description */}
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-[#1F2937]">
              {isForgotPassword
                ? "Reset your password"
                : isSignUp
                  ? step === 1
                    ? "Create an account"
                    : "Store information"
                  : "Sign in to your existing account."}
            </h1>
            <p className="text-sm text-[#6B7280]">
              {isForgotPassword
                ? "Enter your email address and we'll send you a link to reset your password."
                : isSignUp
                  ? step === 1
                    ? "Let's set up your Chargemind account."
                    : "Take a moment to fill in some information, as this will help us personalize your Chargemind experience."
                  : "Don't have a Chargemind account? "}
              {!isSignUp && !isForgotPassword && (
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(true);
                    setStep(1);
                  }}
                  className="text-[#19976F] hover:underline font-medium"
                >
                  Sign up
                </button>
              )}
            </p>
          </div>

          {/* Form */}
          <form
            onSubmit={isForgotPassword ? handleForgotPassword : isSignUp && step === 1 ? handleNextStep : isSignUp ? handleSignUp : handleSignIn}
            className="space-y-6"
          >
            {isForgotPassword ? (
              // Forgot Password Form
              <>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-[#1F2937]">
                    Email*
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12 text-sm"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-[#19976F] hover:bg-[#19976F]/90 text-white text-sm font-medium"
                  disabled={loading}
                >
                  {loading ? "Sending..." : "Send reset link"}
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(false);
                      setEmail("");
                    }}
                    className="text-sm text-[#19976F] hover:underline font-medium"
                  >
                    Back to sign in
                  </button>
                </div>
              </>
            ) : isSignUp && step === 2 ? (
              // Step 2: Dados adicionais
              <>
                <div className="space-y-2">
                  <Label htmlFor="nome" className="text-sm font-medium text-[#1F2937]">
                    Name
                  </Label>
                  <Input
                    id="nome"
                    type="text"
                    placeholder="Enter your name"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="h-12 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nomeEmpresa" className="text-sm font-medium text-[#1F2937]">
                    Store name*
                  </Label>
                  <Input
                    id="nomeEmpresa"
                    type="text"
                    placeholder="Enter your store name"
                    value={nomeEmpresa}
                    onChange={(e) => setNomeEmpresa(e.target.value)}
                    required
                    className="h-12 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefone" className="text-sm font-medium text-[#1F2937]">
                    Phone number (optional)
                  </Label>
                  <PhoneInput
                    value={telefone as any}
                    onChange={(value) => setTelefone(value || "")}
                    placeholder="555 123 4567"
                    className="h-12 text-sm"
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                    // AQUI: Usamos hover:bg-transparent e hover:text-inherit para anular o efeito
                    className="w-1/3 h-12 hover:bg-transparent hover:text-inherit"
                    disabled={loading}
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    className="w-2/3 h-12 bg-[#19976F] hover:bg-[#19976F]/90 text-white text-sm font-medium"
                    disabled={loading}
                  >
                    {loading ? "Creating account..." : "Continue"}
                  </Button>
                </div>
              </>
            ) : (
              // Step 1: Email e senha (ou login)
              <>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-[#1F2937]">
                    Email*
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-[#1F2937]">
                    Password*
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="h-12 text-sm pr-12"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <Eye className="h-5 w-5 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  {isSignUp && password.length > 0 && (
                    <div className="space-y-2">
                      {/* Password strength bar */}
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
                      {/* Password strength message */}
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
                </div>

                {!isSignUp && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setIsForgotPassword(true)}
                      className="text-sm text-[#19976F] hover:underline font-medium -mt-5"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-12 bg-[#19976F] hover:bg-[#19976F]/90 text-white text-sm font-medium"
                  disabled={loading}
                >
                  {loading ? (isSignUp ? "Validating..." : "Signing in...") : isSignUp ? "Continue" : "Sign in"}
                </Button>
              </>
            )}
          </form>

          {/* Divider and Google Sign In - only show on step 1 or login */}
          {!isForgotPassword && (!isSignUp || step === 1) && (
            <>
              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-background px-2 text-[#6B7280]">or</span>
                </div>
              </div>

              {/* Google Sign In */}
              <Button
                type="button"
                variant="outline"
                className="w-full h-12 border-border hover:bg-[#F9F9F9] hover:text-foreground text-sm font-medium"
                onClick={handleGoogleSignIn}
                disabled={loading}
              >
                <FcGoogle className="h-5 w-5 mr-2" />
                Sign in with Google
              </Button>
            </>
          )}

          {/* Bottom link for signup - only show on step 1 */}
          {!isForgotPassword && isSignUp && step === 1 && (
            <p className="text-center text-sm text-[#6B7280]">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(false);
                  setStep(1);
                }}
                className="text-[#19976F] hover:underline font-medium"
              >
                Sign in
              </button>
            </p>
          )}
        </div>
      </div>

      {/* Right side - Gradient background with animation */}
      <div 
        className="hidden lg:block lg:w-1/2 relative overflow-hidden"
        style={{
          background: "linear-gradient(180deg, #18976f 0%, #097754 100%)"
        }}
      >
        <AuthAnimation />
      </div>

      {/* 2FA Verification Modal */}
      <Dialog open={show2FAModal} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-[#19976F]/10 rounded-full flex items-center justify-center mb-4">
              <Shield className="h-6 w-6 text-[#19976F]" />
            </div>
            <DialogTitle className="text-xl font-semibold text-center">
              Two-Factor Authentication
            </DialogTitle>
            <DialogDescription className="text-center text-muted-foreground">
              Enter the 6-digit code from your authenticator app to continue.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center space-y-6 py-4">
            <InputOTP
              maxLength={6}
              value={twoFactorCode}
              onChange={(value) => setTwoFactorCode(value)}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>

            <div className="flex gap-3 w-full">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel2FA}
                className="flex-1"
                disabled={verifying2FA}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleVerify2FA}
                className="flex-1 bg-[#19976F] hover:bg-[#19976F]/90 text-white"
                disabled={verifying2FA || twoFactorCode.length !== 6}
              >
                {verifying2FA ? "Verifying..." : "Verify"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Auth;
