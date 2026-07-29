"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Shield, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuthStore } from "@/stores/useAuthStore";
import { toastError, toastSuccess } from "@/hooks/use-toast";
import { auth, db, isFirebaseConfigured } from "@/lib/config/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  browserSessionPersistence,
  setPersistence,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

const MASTERMIND_EMAIL = "mastermind@trax.com";
const MASTERMIND_PASSWORD = "mastermind123";

export default function MastermindLoginPage() {
  const t = useTranslations("MasterMind");
  const locale = useLocale();
  const router = useRouter();
  const { setUser } = useAuthStore();

  const [email, setEmail] = useState(MASTERMIND_EMAIL);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Hardcoded gate — test environment only
    if (email.trim().toLowerCase() !== MASTERMIND_EMAIL || password !== MASTERMIND_PASSWORD) {
      toastError(t("loginError"));
      setIsLoading(false);
      return;
    }

    if (!isFirebaseConfigured || !auth || !db) {
      toastError("Firebase is not configured.");
      setIsLoading(false);
      return;
    }

    try {
      await setPersistence(auth, browserSessionPersistence);
      let credential;
      try {
        credential = await signInWithEmailAndPassword(auth, MASTERMIND_EMAIL, MASTERMIND_PASSWORD);
      } catch {
        // User does not exist — auto-create mastermind admin
        credential = await createUserWithEmailAndPassword(
          auth,
          MASTERMIND_EMAIL,
          MASTERMIND_PASSWORD
        );
        await updateProfile(credential.user, { displayName: "MasterMind" });
        await setDoc(doc(db, "users", credential.user.uid), {
          id: credential.user.uid,
          email: MASTERMIND_EMAIL,
          name: "MasterMind",
          role: "mastermind",
          company_id: null,
          company: null,
          createdAt: serverTimestamp(),
        });
      }

      setUser(
        {
          id: 0,
          email: MASTERMIND_EMAIL,
          name: "MasterMind",
          role: "mastermind",
          employee_id: null,
          assigned_geofence_id: null,
          permissions: [],
          created_at: new Date().toISOString(),
          profile_image: credential.user.photoURL ?? "",
        },
        await credential.user.getIdToken(),
        "mastermind",
        undefined,
        "Trax Platform"
      );

      toastSuccess("Logged in as MasterMind");
      router.push(`/${locale}/mastermind/companies`);
    } catch (err) {
      console.error("[mastermind login] failed:", err);
      toastError(err instanceof Error ? err.message : t("loginError"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <Card className="w-full max-w-md border border-border shadow-xl">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">{t("loginTitle")}</CardTitle>
          <CardDescription>{t("loginDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t("emailLabel")}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("passwordLabel")}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full gap-2" disabled={isLoading}>
              {isLoading ? (
                <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
              ) : (
                <LogIn className="w-4 h-4" />
              )}
              {t("loginButton")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
