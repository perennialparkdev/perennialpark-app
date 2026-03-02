"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { Loader2, Plus, Trash2 } from "lucide-react";
import {
  checkUnitAccess,
  login,
  signUp,
  completeProfile,
  setStoredToken,
  setStoredUnitId,
  setStoredRole,
  setStoredUserInfo,
  getOwnerDisplayName,
  getStoredToken,
  type CompleteProfilePayload,
  requestPasswordReset,
} from "@/lib/api/owners";

type Step = "login" | "firstLogin" | "completeProfile" | "forgotPassword";

function isUnitNumber(value: string): boolean {
  return !value.includes("@");
}

export default function SignInPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [resetEmail, setResetEmail] = useState("");
  const [resetMessage, setResetMessage] = useState("");

  const [unitNumber, setUnitNumber] = useState<string | null>(null);

  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [profileUnit, setProfileUnit] = useState({
    unit_number: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    notes: "",
  });
  const [profileLastName, setProfileLastName] = useState("");
  const [profileHusband, setProfileHusband] = useState({
    husband_first: "",
    husband_email: "",
    husband_phone: "",
    password: "",
  });
  const [profileWife, setProfileWife] = useState({
    wife_first: "",
    wife_email: "",
    wife_phone: "",
    password: "",
  });
  const [profileChildren, setProfileChildren] = useState<
    Array<{ name: string; age: number; gender: string }>
  >([]);

  const handlePasswordRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResetMessage("");

    if (!resetEmail.trim()) {
      setError("Email is required");
      return;
    }

    setLoading(true);
    try {
      const result = await requestPasswordReset(resetEmail.trim());
      if (result.success) {
        router.push("/home");
      } else {
        setError(result.message ?? "Failed to send reset email");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isUnitNumber(username.trim())) {
        const result = await checkUnitAccess(username.trim());
        if (result.success && result.data) {
          setUnitNumber(result.data.unit_number);
          setStep("firstLogin");
        } else {
          setError(result.message ?? "Request failed");
        }
      } else {
        const result = await login(username.trim(), password);
        console.log("result login page", result);
        if (result.success && result.data?.token) {
          setStoredToken(result.data.token);
          if (result.data.unit?.unitId) setStoredUnitId(result.data.unit.unitId);
          setStoredRole(result.data.owner?.role);
          setStoredUserInfo({
            unitNumber: result.data.unit?.unit_number,
            email: result.data.email,
            displayName: getOwnerDisplayName(result.data.owner),
          });
          router.push("/home");
        } else {
          setError(result.message ?? "Login failed");
        }
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleFirstLoginSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!newEmail.trim()) {
      setError("Email is required");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const signUpResult = await signUp(newEmail.trim(), newPassword);
      if (!signUpResult.success) {
        setError(signUpResult.message ?? "Sign up failed");
        setLoading(false);
        return;
      }

      const loginResult = await login(newEmail.trim(), newPassword);
      if (!loginResult.success || !loginResult.data?.token) {
        setError(loginResult.message ?? "Login failed after sign up");
        setLoading(false);
        return;
      }

      setStoredToken(loginResult.data.token);
      setStoredRole(loginResult.data.owner?.role);
      setStoredUserInfo({
        unitNumber: unitNumber ?? loginResult.data.unit?.unit_number,
        email: loginResult.data.email,
        displayName: getOwnerDisplayName(loginResult.data.owner),
      });
      setProfileUnit((prev) => ({ ...prev, unit_number: unitNumber ?? "" }));
      setProfileHusband((prev) => ({
        ...prev,
        husband_email: newEmail.trim(),
        password: newPassword,
      }));
      setStep("completeProfile");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!profileHusband.husband_first.trim()) {
      setError("First name is required");
      return;
    }
    if (!profileLastName.trim()) {
      setError("Last name is required");
      return;
    }

    const token = getStoredToken();
    if (!token) {
      setError("Session expired. Please sign in again.");
      return;
    }

    const payload: CompleteProfilePayload = {
      unit: {
        unit_number: profileUnit.unit_number || (unitNumber ?? ""),
        address: profileUnit.address || undefined,
        city: profileUnit.city || undefined,
        state: profileUnit.state || undefined,
        zip: profileUnit.zip || undefined,
        colony_name: "Perennial Park",
        notes: profileUnit.notes || undefined,
      },
      husband: {
        husband_first: profileHusband.husband_first.trim(),
        husband_email: profileHusband.husband_email.trim(),
        husband_phone: profileHusband.husband_phone.trim(),
        last_name: profileLastName.trim(),
        password: profileHusband.password,
      },
      children:
        profileChildren.length > 0
          ? profileChildren.map((c) => ({
              name: c.name,
              age: c.age,
              genre: c.gender,
            }))
          : undefined,
    };

    if (
      profileWife.wife_first.trim() ||
      profileWife.wife_email.trim()
    ) {
      payload.wife = {
        wife_first: profileWife.wife_first.trim(),
        wife_email: profileWife.wife_email.trim(),
        wife_phone: profileWife.wife_phone.trim(),
        last_name: profileLastName.trim(),
        password: profileWife.password,
      };
    }

    setLoading(true);
    try {
      const result = await completeProfile(token, payload);
      if (result.success) {
        if (result.data?.unitId) setStoredUnitId(result.data.unitId);
        router.push("/home");
      } else {
        setError(result.message ?? "Failed to complete profile");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const addChild = () => {
    setProfileChildren((prev) => [...prev, { name: "", age: 0, gender: "Boy" }]);
  };

  const removeChild = (index: number) => {
    setProfileChildren((prev) => prev.filter((_, i) => i !== index));
  };

  const updateChild = (
    index: number,
    field: "name" | "age" | "gender",
    value: string | number
  ) => {
    setProfileChildren((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [field]: value } : c))
    );
  };

  if (step === "login") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-emerald-50 to-sky-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="mb-4 text-center">
              <h1 className="text-3xl font-bold text-emerald-700">
                Perennial Park
              </h1>
            </div>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>Enter your credentials</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="01"
                  required
                />
              </div>
              <PasswordInput
                id="password"
                label="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                required
              />
              {error && (
                <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                {loading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  "Sign In"
                )}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                New member?{" "}
                <Link
                  href="/register"
                  className="font-medium text-emerald-600 hover:text-emerald-700"
                >
                  Register
                </Link>
              </p>
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setResetMessage("");
                  setResetEmail(username.includes("@") ? username : "");
                  setStep("forgotPassword");
                }}
                className="mx-auto block cursor-pointer text-sm text-emerald-600 hover:text-emerald-700"
              >
                Forgot your password?
              </button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === "firstLogin") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-emerald-50 to-sky-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Complete Your Setup</CardTitle>
            <CardDescription>
              Set your email and password for your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleFirstLoginSetup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                />
              </div>
              <PasswordInput
                id="new-password"
                label="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••"
                required
              />
              <PasswordInput
                id="confirm-password"
                label="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••"
                required
              />
              {error && (
                <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                {loading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  "Complete Setup"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === "forgotPassword") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-emerald-50 to-sky-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Reset password</CardTitle>
            <CardDescription>
              Enter your email to receive a password reset link
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordRequest} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset_email">Email Address</Label>
                <Input
                  id="reset_email"
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                />
              </div>
              {error && (
                <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}
              {resetMessage && (
                <div className="rounded border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                  {resetMessage}
                </div>
              )}
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                {loading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  "Send reset link"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  setError("");
                  setResetMessage("");
                  setStep("login");
                }}
              >
                Back to sign in
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === "completeProfile") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-sky-100 p-4 py-8">
        <div className="mx-auto max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Complete Your Profile</CardTitle>
              <CardDescription>
                Fill in your unit and household information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={handleCompleteProfile}
                className="flex flex-col gap-8"
              >
                <section className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="unit_number">Unit number</Label>
                      <Input
                        id="unit_number"
                        value={profileUnit.unit_number}
                        disabled
                        placeholder="101"
                        className="bg-muted cursor-not-allowed"
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        value={profileUnit.address}
                        onChange={(e) =>
                          setProfileUnit((p) => ({
                            ...p,
                            address: e.target.value,
                          }))
                        }
                        placeholder="123 Main Street"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={profileUnit.city}
                        onChange={(e) =>
                          setProfileUnit((p) => ({
                            ...p,
                            city: e.target.value,
                          }))
                        }
                        placeholder="Brooklyn"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        value={profileUnit.state}
                        onChange={(e) =>
                          setProfileUnit((p) => ({
                            ...p,
                            state: e.target.value,
                          }))
                        }
                        placeholder="NY"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zip">ZIP</Label>
                      <Input
                        id="zip"
                        value={profileUnit.zip}
                        onChange={(e) =>
                          setProfileUnit((p) => ({
                            ...p,
                            zip: e.target.value,
                          }))
                        }
                        placeholder="11201"
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="notes">Notes</Label>
                      <Input
                        id="notes"
                        value={profileUnit.notes}
                        onChange={(e) =>
                          setProfileUnit((p) => ({
                            ...p,
                            notes: e.target.value,
                          }))
                        }
                        placeholder="e.g. Second floor"
                      />
                    </div>
                  </div>
                </section>

                <div className="border-t border-border" />

                <section>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="husband_name">Husband name</Label>
                      <Input
                        id="husband_name"
                        value={profileHusband.husband_first}
                        onChange={(e) =>
                          setProfileHusband((p) => ({
                            ...p,
                            husband_first: e.target.value,
                          }))
                        }
                        placeholder="John"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="wife_name">Wife name</Label>
                      <Input
                        id="wife_name"
                        value={profileWife.wife_first}
                        onChange={(e) =>
                          setProfileWife((p) => ({
                            ...p,
                            wife_first: e.target.value,
                          }))
                        }
                        placeholder="Mary"
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="last_name">Last name</Label>
                      <Input
                        id="last_name"
                        value={profileLastName}
                        onChange={(e) => setProfileLastName(e.target.value)}
                        placeholder="Smith"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="husband_email">Husband email</Label>
                      <Input
                        id="husband_email"
                        type="email"
                        value={profileHusband.husband_email}
                        onChange={(e) =>
                          setProfileHusband((p) => ({
                            ...p,
                            husband_email: e.target.value,
                          }))
                        }
                        placeholder="john@example.com"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="wife_email">Wife email</Label>
                      <Input
                        id="wife_email"
                        type="email"
                        value={profileWife.wife_email}
                        onChange={(e) =>
                          setProfileWife((p) => ({
                            ...p,
                            wife_email: e.target.value,
                          }))
                        }
                        placeholder="mary@example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="husband_phone">Husband phone</Label>
                      <Input
                        id="husband_phone"
                        type="tel"
                        value={profileHusband.husband_phone}
                        onChange={(e) =>
                          setProfileHusband((p) => ({
                            ...p,
                            husband_phone: e.target.value,
                          }))
                        }
                        placeholder="+1 555 123 4567"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="wife_phone">Wife phone</Label>
                      <Input
                        id="wife_phone"
                        type="tel"
                        value={profileWife.wife_phone}
                        onChange={(e) =>
                          setProfileWife((p) => ({
                            ...p,
                            wife_phone: e.target.value,
                          }))
                        }
                        placeholder="+1 555 987 6543"
                      />
                    </div>
                  </div>
                </section>

                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold text-foreground">
                      How many children do you have on ground?
                    </Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addChild}
                    >
                      <Plus className="size-4" />
                      Add child
                    </Button>
                  </div>
                  {profileChildren.length > 0 && (
                    <ul className="space-y-4">
                      {profileChildren.map((child, index) => (
                        <li
                          key={index}
                          className="flex flex-wrap items-end gap-4 rounded-lg border p-4"
                        >
                          <div className="flex-1 space-y-2 min-w-[120px]">
                            <Label>Name</Label>
                            <Input
                              value={child.name}
                              onChange={(e) =>
                                updateChild(index, "name", e.target.value)
                              }
                              placeholder="Emma"
                            />
                          </div>
                          <div className="w-24 space-y-2">
                            <Label>Age</Label>
                            <Input
                              type="number"
                              min={0}
                              value={child.age || ""}
                              onChange={(e) =>
                                updateChild(
                                  index,
                                  "age",
                                  parseInt(e.target.value, 10) || 0
                                )
                              }
                              placeholder="0"
                            />
                          </div>
                          <div className="w-28 space-y-2">
                            <Label>Gender</Label>
                            <select
                              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                              value={child.gender}
                              onChange={(e) =>
                                updateChild(index, "gender", e.target.value)
                              }
                            >
                              <option value="Boy">Boy</option>
                              <option value="Girl">Girl</option>
                            </select>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeChild(index)}
                            aria-label="Remove child"
                          >
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                {error && (
                  <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                >
                  {loading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    "Complete profile"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return null;
}
