import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useNavigate, Link } from "react-router-dom";

export default function ForgotPassword() {
  const [step, setStep] = useState(1); // 1 = Email, 2 = Verify/Reset
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const navigate = useNavigate();

  /* ---------------- STEP 1: SEND OTP ---------------- */
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");

    try {
      const res = await fetch("http://127.0.0.1:8000/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setStep(2);
        setMsg("✅ OTP sent! Check your email.");
      } else {
        setMsg("❌ Failed to send OTP.");
      }
    } catch {
      setMsg("Connection error.");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- STEP 2: VERIFY & RESET ---------------- */
  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");

    try {
      const res = await fetch("http://127.0.0.1:8000/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, new_password: newPassword }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("Password Reset Successfully! Please Login.");
        navigate("/login");
      } else {
        setMsg(`❌ ${data.detail || "Error resetting password"}`);
      }
    } catch {
      setMsg("Connection error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4 py-6">
      <Card className="w-full max-w-md shadow-lg">
        {/* HEADER */}
        <CardHeader className="space-y-1">
          <CardTitle className="text-lg sm:text-xl text-blue-700">
            Reset Password
          </CardTitle>
          <CardDescription className="text-sm">
            {step === 1
              ? "Enter your email to receive a code."
              : `Enter the code sent to ${email}`}
          </CardDescription>
        </CardHeader>

        {/* CONTENT */}
        <CardContent className="space-y-4">
          {step === 1 ? (
            /* FORM 1: EMAIL */
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value.toLowerCase())
                }
                required
              />
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? "Sending..." : "Send OTP"}
              </Button>
            </form>
          ) : (
            /* FORM 2: OTP + NEW PASSWORD */
            <form onSubmit={handleReset} className="space-y-4">
              <Input
                type="text"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
              />
              <Input
                type="password"
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <Button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={loading}
              >
                {loading ? "Resetting..." : "Set New Password"}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full text-xs text-slate-500"
                onClick={() => setStep(1)}
              >
                Change Email
              </Button>
            </form>
          )}

          {msg && (
            <p className="text-center text-sm font-medium mt-2">
              {msg}
            </p>
          )}

          <div className="text-center pt-2">
            <Link
              to="/login"
              className="text-sm text-blue-600 hover:underline"
            >
              Back to Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
