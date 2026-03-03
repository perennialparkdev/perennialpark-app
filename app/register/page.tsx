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
import { Loader2 } from "lucide-react";
import { checkPhoneLink } from "@/lib/api/owners";

const SECRET_CODE = "PP2026";

type Step = "code" | "verify" | "success";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("code");
  const [secretCode, setSecretCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");

  const [unitNumber, setUnitNumber] = useState<string | null>(null);
  const [linkedAsOwner, setLinkedAsOwner] = useState(false);

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (secretCode !== SECRET_CODE) {
      setError("Invalid secret code");
      return;
    }
    setError("");
    setStep("verify");
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) {
      setError("Phone number is required.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const response = await checkPhoneLink(phone.trim());
      if (response.success && response.data?.unit_number) {
        setUnitNumber(response.data.unit_number);
        setLinkedAsOwner(false);
        setStep("success");
        return;
      }
      if (response.success && response.data?.linkedAsOwner) {
        setUnitNumber(null);
        setLinkedAsOwner(true);
        setStep("success");
        return;
      }
      setError(response.message || "Your phone number is not linked to any unit.");
    } catch {
      setError("Error verifying unit. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoToSignIn = () => {
    router.push("/sign-in");
  };

  if (step === "code") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-emerald-50 to-sky-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="mb-4 text-center">
              <h1 className="text-3xl font-bold text-emerald-700">
                Perennial Park
              </h1>
            </div>
            <CardTitle>Registration</CardTitle>
            <CardDescription>Enter your secret code to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCodeSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="secret-code">Secret Code</Label>
                <Input
                  id="secret-code"
                  value={secretCode}
                  onChange={(e) => setSecretCode(e.target.value)}
                  placeholder="Enter code"
                  required
                />
              </div>
              {error && (
                <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}
              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                Continue
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Already registered?{" "}
                <Link
                  href="/sign-in"
                  className="font-medium text-emerald-600 hover:text-emerald-700"
                >
                  Sign in here
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === "verify") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-emerald-50 to-sky-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Verify Your Unit</CardTitle>
            <CardDescription>
              Enter your information to register
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVerifySubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="first-name">First Name</Label>
                <Input
                  id="first-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="John"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last-name">Last Name</Label>
                <Input
                  id="last-name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Smith"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(555) 123-4567"
                  required
                />
              </div>
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
                  "Verify"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === "success" && (unitNumber || linkedAsOwner)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-emerald-50 to-sky-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-green-600">
              {unitNumber ? "Unit Verified!" : "Already Registered"}
            </CardTitle>
            <CardDescription>
              {unitNumber ? `Unit #${unitNumber}` : "This phone is linked to a unit as owner."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-sm text-emerald-900">
                {unitNumber
                  ? "Your unit has been verified. You can now sign in and create your account."
                  : "This phone number is already linked to a unit as a registered owner. Sign in to access your account."}
              </p>
            </div>
            <Button
              type="button"
              onClick={handleGoToSignIn}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              Go to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
