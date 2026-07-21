"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Brain, Loader2 } from "lucide-react";
import { toastError } from "@/hooks/use-toast";
import { httpClient } from "@/lib/services/httpClient";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/config/firebase";

export default function MastermindLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!auth) {
        throw new Error("Firebase not configured");
      }

      const credential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await credential.user.getIdToken();

      const res = await httpClient.post<{
        success: boolean;
        message?: string;
        data?: { email: string; role: string };
      }>("/mastermind/login", { id_token: idToken });

      if (!res.success) {
        throw new Error(res.message || "Login failed");
      }

      sessionStorage.setItem("mastermind_token", idToken);
      router.push("/ar/mastermind/dashboard");
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-slate-950">
      <Card className="w-full max-w-md bg-slate-900 border-slate-800">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-4">
            <Brain className="h-6 w-6 text-emerald-400" />
          </div>
          <CardTitle className="text-2xl text-slate-100">MasterMind</CardTitle>
          <CardDescription className="text-slate-500">Super admin access required</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="mastermind@trax.com"
                required
                className="bg-slate-950 border-slate-700"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                required
                className="bg-slate-950 border-slate-700"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Authenticate
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
