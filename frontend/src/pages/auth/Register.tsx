import * as React from "react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/atoms/Button";
import { Input } from "@/components/ui/atoms/Input";
import { FormField } from "@/components/ui/molecules/form-field";
import { Stack } from "@/components/layout/primitives/Stack";
import { api } from "@/services/api";
import type { UserRole } from "@/types/user";

const Register: React.FC = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("donor");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    fullName?: string;
    email?: string;
    password?: string;
    phoneNumber?: string;
    licenseNumber?: string;
  }>({});

  const navigate = useNavigate();

  const validateFullName = (val: string) => {
    if (!val) {
      setFieldErrors((prev) => ({ ...prev, fullName: "Full name is required" }));
      return false;
    }
    if (val.trim().length < 3) {
      setFieldErrors((prev) => ({ ...prev, fullName: "Full name must be at least 3 characters" }));
      return false;
    }
    setFieldErrors((prev) => {
      const copy = { ...prev };
      delete copy.fullName;
      return copy;
    });
    return true;
  };

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

  const validatePhoneNumber = (val: string) => {
    if (!val) {
      setFieldErrors((prev) => {
        const copy = { ...prev };
        delete copy.phoneNumber;
        return copy;
      });
      return true;
    }
    const regex = /^\+?[0-9\-\s()]{7,15}$/;
    if (!regex.test(val)) {
      setFieldErrors((prev) => ({ ...prev, phoneNumber: "Invalid phone number format" }));
      return false;
    }
    setFieldErrors((prev) => {
      const copy = { ...prev };
      delete copy.phoneNumber;
      return copy;
    });
    return true;
  };

  const validateLicenseNumber = (val: string, currentRole: string) => {
    if (currentRole !== "hospital" && currentRole !== "blood_bank") {
      setFieldErrors((prev) => {
        const copy = { ...prev };
        delete copy.licenseNumber;
        return copy;
      });
      return true;
    }
    if (!val) {
      setFieldErrors((prev) => ({ ...prev, licenseNumber: "Medical license is required for this role" }));
      return false;
    }
    if (val.trim().length < 5) {
      setFieldErrors((prev) => ({ ...prev, licenseNumber: "License must be at least 5 characters" }));
      return false;
    }
    setFieldErrors((prev) => {
      const copy = { ...prev };
      delete copy.licenseNumber;
      return copy;
    });
    return true;
  };

  const handleFullNameChange = (val: string) => {
    setFullName(val);
    validateFullName(val);
  };

  const handleEmailChange = (val: string) => {
    setEmail(val);
    validateEmail(val);
  };

  const handlePasswordChange = (val: string) => {
    setPassword(val);
    validatePassword(val);
  };

  const handlePhoneChange = (val: string) => {
    setPhoneNumber(val);
    validatePhoneNumber(val);
  };

  const handleLicenseChange = (val: string) => {
    setLicenseNumber(val);
    validateLicenseNumber(val, role);
  };

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    validateLicenseNumber(licenseNumber, newRole);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const isNameValid = validateFullName(fullName);
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    const isPhoneValid = validatePhoneNumber(phoneNumber);
    const isLicenseValid = validateLicenseNumber(licenseNumber, role);

    if (!isNameValid || !isEmailValid || !isPasswordValid || !isPhoneValid || !isLicenseValid) {
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        email,
        password,
        full_name: fullName,
        role,
        phone_number: phoneNumber || undefined,
        address: address || undefined,
        license_number:
          (role === "hospital" || role === "blood_bank") && licenseNumber
            ? licenseNumber
            : undefined,
      };

      await api.post("/auth/register", payload);
      navigate("/login", { state: { registered: true } });
    } catch (err: any) {
      console.error(err);
      let errorMessage = "Registration failed. Please try again.";
      if (err.response?.data?.detail) {
        const detail = err.response.data.detail;
        if (Array.isArray(detail)) {
          errorMessage = detail.map((d: any) => `${d.loc?.[d.loc.length - 1] || ""}: ${d.msg}`).join(", ");
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
      <div className="w-full max-w-lg bg-surface p-8 rounded-lg shadow-card border border-border">
        <form onSubmit={handleSubmit}>
          <Stack gap="lg">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-primary tracking-tight">
                Create Account
              </h1>
              <p className="text-sm text-text-secondary mt-2">
                Join BloodLink AI to coordinate emergency blood supply
              </p>
            </div>

            {error && (
              <div
                className="p-3 text-sm text-danger bg-danger/10 border border-danger/25 rounded-md"
                role="alert"
              >
                {error}
              </div>
            )}

            <Stack gap="md">
              <FormField label="Full Name" required error={fieldErrors.fullName}>
                <Input
                  required
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => handleFullNameChange(e.target.value)}
                  disabled={isLoading}
                />
              </FormField>

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

              <FormField label="I am registering as a..." required>
                <select
                  required
                  value={role}
                  onChange={(e) => handleRoleChange(e.target.value as any)}
                  disabled={isLoading}
                  className="w-full h-12 rounded-md border border-border bg-surface text-text-primary px-4 font-sans text-base transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary disabled:opacity-50 disabled:bg-border/10 disabled:cursor-not-allowed cursor-pointer font-semibold"
                >
                  <option value="donor">Donor (Individual)</option>
                  <option value="hospital">Hospital (Requesting blood)</option>
                  <option value="blood_bank">
                    Blood Bank (Managing inventory)
                  </option>
                  <option value="admin">System Administrator</option>
                </select>
              </FormField>

              <FormField label="Phone Number" error={fieldErrors.phoneNumber}>
                <Input
                  placeholder="+1 (555) 000-0000"
                  value={phoneNumber}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  disabled={isLoading}
                />
              </FormField>

              <FormField label="Address">
                <Input
                  placeholder="123 Medical Way, City, State"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  disabled={isLoading}
                />
              </FormField>

              {(role === "hospital" || role === "blood_bank") && (
                <FormField label="Medical License / Registry Number" required error={fieldErrors.licenseNumber}>
                  <Input
                    required
                    placeholder="LIC-987654"
                    value={licenseNumber}
                    onChange={(e) => handleLicenseChange(e.target.value)}
                    disabled={isLoading}
                  />
                </FormField>
              )}
            </Stack>

            <Button 
              type="submit" 
              className="w-full font-bold h-11" 
              loading={isLoading}
              disabled={
                isLoading ||
                !!(fieldErrors.fullName || fieldErrors.email || fieldErrors.password || fieldErrors.phoneNumber || fieldErrors.licenseNumber) ||
                !fullName || !email || !password ||
                ((role === "hospital" || role === "blood_bank") && !licenseNumber)
              }
            >
              Register
            </Button>

            <p className="text-center text-xs text-text-secondary">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-primary hover:underline font-semibold"
              >
                Sign In here
              </Link>
            </p>
          </Stack>
        </form>
      </div>
    </div>
  );
};

export { Register };
