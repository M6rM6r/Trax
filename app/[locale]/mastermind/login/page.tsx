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
      sessionStorage.setItem("mastermind_uid", credential.user.uid);
      router.push("/ar/mastermind/dashboard");
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <Card className="w-full max-w-md bg-background border-border">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center mb-4">
            <Brain className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl text-foreground">MasterMind</CardTitle>
          <CardDescription className="text-muted-foreground/70">Super admin access required</CardDescription>
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
                className="bg-background border-border"
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
                className="bg-background border-border"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
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
