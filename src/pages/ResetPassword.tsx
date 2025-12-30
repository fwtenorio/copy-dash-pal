import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import AuthAnimation from "@/components/AuthAnimation";

// Schema de validação Zod
const resetPasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Password must be at least 8 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

const ResetPassword = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const password = watch("password", "");

  // Password strength calculation
  const calculatePasswordStrength = (pwd: string) => {
    if (pwd.length === 0) return { strength: 0, label: "", message: "" };

    let strength = 0;
    if (pwd.length >= 8) strength += 25;
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
    // Check if user has a valid session (came from email link)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        toast.error("Invalid or expired link", {
          description: "Please request a new password reset link.",
        });
        navigate("/auth");
      }
    });
  }, [navigate]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: data.password,
      });

      if (error) {
        toast.error("Error updating password", {
          description: error.message,
        });
      } else {
        toast.success("Password updated successfully!", {
          description: "Redirecting to dashboard...",
        });
        
        // Redirecionar após 2 segundos
        setTimeout(() => {
          navigate("/");
        }, 2000);
      }
    } catch (error) {
      toast.error("Error", {
        description: "An error occurred while updating your password.",
      });
    } finally {
      setIsLoading(false);
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
              Set new password
            </h1>
            <p className="text-sm text-[#6B7280]">
              Must be at least 8 characters.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-[#1F2937]">
                Password*
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  {...register("password")}
                  className={`h-12 text-sm pr-12 ${errors.password ? "border-red-500" : ""}`}
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
              {errors.password && (
                <p className="text-xs text-red-600">{errors.password.message}</p>
              )}
              {password.length > 0 && (
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

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-[#1F2937]">
                Confirm Password*
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  {...register("confirmPassword")}
                  className={`h-12 text-sm pr-12 ${errors.confirmPassword ? "border-red-500" : ""}`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <Eye className="h-5 w-5 text-muted-foreground" />
                  )}
                </Button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-[#19976F] hover:bg-[#19976F]/90 text-white text-sm font-medium"
              disabled={isLoading}
            >
              {isLoading ? "Resetting password..." : "Reset Password"}
            </Button>
          </form>

          {/* Back to Login link */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => navigate("/auth")}
              className="text-sm text-[#6B7280] hover:text-[#19976F] hover:underline font-medium"
            >
              Back to Login
            </button>
          </div>
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
    </div>
  );
};

export default ResetPassword;
