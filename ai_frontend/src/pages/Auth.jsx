import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNavigate, Link } from "react-router-dom";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const { language, setLanguage } = useApp();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const success = await login(email, password);
    if (success) navigate("/setup");

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4 py-6">
      <Card className="w-full max-w-md shadow-lg">
        {/* HEADER */}
        <CardHeader className="space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-xl sm:text-2xl font-bold text-blue-700">
              Gen-Vidhik
            </CardTitle>

            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-full sm:w-[120px]">
                <SelectValue placeholder="Language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <CardDescription className="text-sm">
            Enter your email to access your legal dashboard.
          </CardDescription>
        </CardHeader>

        {/* FORM */}
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            {/* EMAIL */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value.toLowerCase())}
                required
              />
            </div>

            {/* PASSWORD */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-blue-600 hover:underline"
                  tabIndex={-1}
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>

          {/* FOOTER */}
          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>

            <div className="text-center text-sm text-slate-600">
              Don&apos;t have an account?{" "}
              <Link
                to="/register"
                className="font-semibold text-blue-600 hover:underline"
              >
                Sign up
              </Link>
            </div>

            <p className="text-xs text-center text-slate-500 leading-relaxed">
              🔒 Your data is encrypted. We do not share case details with third
              parties.
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
