import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
    
    if (success) {
      navigate("/setup"); 
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <div className="flex justify-between items-center mb-2">
            <CardTitle className="text-2xl font-bold text-blue-700">Gen-Vidhik</CardTitle>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="Language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <CardDescription>
            Enter your email to access your legal dashboard.
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="name@example.com" 
                value={email}
                // Forces lowercase input
                onChange={(e) => setEmail(e.target.value.toLowerCase())}
                required 
              />
            </div>
            <div className="space-y-2">
              {/* ✅ ADDED: Flex container to put Label and Link side-by-side */}
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link 
                  to="/forgot-password" 
                  className="text-xs font-medium text-blue-600 hover:underline"
                  tabIndex={-1} // Skip tab index so "Tab" goes to input box
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
          
          <CardFooter className="flex flex-col space-y-4">
            <Button className="w-full bg-blue-600 hover:bg-blue-700" type="submit" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
            
            <div className="text-center text-sm text-slate-600">
              Don't have an account?{" "}
              <Link to="/register" className="font-semibold text-blue-600 hover:underline">
                Sign up
              </Link>
            </div>

            <p className="text-xs text-center text-slate-500">
              🔒 Your data is encrypted. We do not share case details with third parties.
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}