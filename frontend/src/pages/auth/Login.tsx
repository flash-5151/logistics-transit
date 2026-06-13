import * as React from "react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/atoms/Button";
import { Input } from "@/components/ui/atoms/Input";
import { FormField } from "@/components/ui/molecules/form-field";
import { Stack } from "@/components/layout/primitives/Stack";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/services/api";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  const loginStore = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const validateEmail = (val: string) => {
    if (!val) {
      setFieldErrors((prev) => ({ ...prev, email: "Email address is required" }));
      return false;
    }
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(val)) {
      setFieldErrors((prev) => ({ ...prev, email: "Please enter a valid email address" }));
      return false;
    }
    setFieldErrors((prev) => {
      const copy = { ...prev };
      delete copy.email;
      return copy;
    });
    return true;
  };

  const validatePassword = (val: string) => {
    if (!val) {
      setFieldErrors((prev) => ({ ...prev, password: "Password is required" }));
      return false;
    }
    if (val.length < 8) {
      setFieldErrors((prev) => ({ ...prev, password: "Password must be at least 8 characters" }));
      return false;
    }
    setFieldErrors((prev) => {
      const copy = { ...prev };
      delete copy.password;
      return copy;
    });
    return true;
  };

  const handleEmailChange = (val: string) => {
    setEmail(val);
    validateEmail(val);
  };

  const handlePasswordChange = (val: string) => {
    setPassword(val);
    validatePassword(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    if (!isEmailValid || !isPasswordValid) return;

    setIsLoading(true);

    try {
      const params = new URLSearchParams();
      params.append("username", email);
      params.append("password", password);

      const res = await api.post("/auth/login", params, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      const { access_token } = res.data;

      // Fetch user details
      const userRes = await api.get("/auth/me", {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });

      const userData = userRes.data;
      const mappedUser = {
        ...userData,
        name: userData.full_name || userData.name || "User",
      };

      // Login to store
      loginStore(access_token, mappedUser);
      navigate("/");
    } catch (err: any) {
      console.error(err);
      let errorMessage = "Invalid email or password. Please try again.";
      if (err.response?.data?.detail) {
        const detail = err.response.data.detail;
        if (Array.isArray(detail)) {
          errorMessage = detail.map((d: any) => d.msg).join(", ");
        } else if (typeof detail === "string") {
          errorMessage = detail;
        }
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md bg-surface p-8 rounded-lg shadow-card border border-border">
        <form onSubmit={handleSubmit}>
          <Stack gap="lg">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-primary tracking-tight">BloodLink AI</h1>
              <p className="text-sm text-text-secondary mt-2">
                Emergency Blood Supply & Logistics Coordination
              </p>
            </div>

            {error && (
              <div className="p-3 text-sm text-danger bg-danger/10 border border-danger/25 rounded-md" role="alert">
                {error}
              </div>
            )}

            <Stack gap="md">
              <FormField label="Email address" required error={fieldErrors.email}>
                <Input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  disabled={isLoading}
                />
              </FormField>

              <FormField label="Password" required error={fieldErrors.password}>
                <Input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  disabled={isLoading}
                />
              </FormField>
            </Stack>

            <Button 
              type="submit" 
              className="w-full font-bold h-11" 
              loading={isLoading}
              disabled={isLoading || !!(fieldErrors.email || fieldErrors.password) || !email || !password}
            >
              Sign In
            </Button>

            <p className="text-center text-xs text-text-secondary">
              Don't have an account?{" "}
              <Link to="/register" className="text-primary hover:underline font-semibold">
                Register here
              </Link>
            </p>

          </Stack>
        </form>
      </div>
    </div>
  );
};

export { Login };
