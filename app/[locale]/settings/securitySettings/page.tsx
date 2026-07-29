"use client";

import { useState } from "react";
import MainLayout from "@/components/shared/MainLayout";
import FullPageHead from "@/components/shared/FullPageHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Smartphone, Clock } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useTranslations } from "next-intl";

function ToggleSwitch({ enabled, onChange }: { enabled: boolean; onChange: () => void }) {
  return <Switch checked={enabled} onCheckedChange={onChange} />;
}

export default function SecuritySettingsPage() {
  const t = useTranslations("SecuritySettings");
  const [twoFactor, setTwoFactor] = useState(false);
  const [loginAlerts, setLoginAlerts] = useState(true);
  const [autoLogout, setAutoLogout] = useState(false);
  const [autoLogoutTime, setAutoLogoutTime] = useState("30");

  return (
    <MainLayout>
      <div className="p-6 space-y-6 min-h-screen">
        <FullPageHead
          head={t("title")}
          description={t("description")}
          Icon={<Shield className="w-7 h-7" />}
        />

        <Card className="border-0 shadow-lg bg-card animate-slide-up">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-destructive flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-primary-foreground" />
              </div>
              <CardTitle className="text-lg font-bold text-foreground">{t("twoFactor")}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
              <div>
                <p className="text-sm font-medium text-foreground">{t("requireTwoFactor")}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("requireTwoFactorDescription")}
                </p>
              </div>
              <ToggleSwitch enabled={twoFactor} onChange={() => setTwoFactor(!twoFactor)} />
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
              <div>
                <p className="text-sm font-medium text-foreground">{t("loginAlerts")}</p>
                <p className="text-xs text-muted-foreground mt-1">{t("loginAlertsDescription")}</p>
              </div>
              <ToggleSwitch enabled={loginAlerts} onChange={() => setLoginAlerts(!loginAlerts)} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-card animate-slide-up">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <CardTitle className="text-lg font-bold text-foreground">
                {t("sessionManagement")}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
              <div>
                <p className="text-sm font-medium text-foreground">{t("autoLogout")}</p>
                <p className="text-xs text-muted-foreground mt-1">{t("autoLogoutDescription")}</p>
              </div>
              <ToggleSwitch enabled={autoLogout} onChange={() => setAutoLogout(!autoLogout)} />
            </div>

            {autoLogout && (
              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                <div>
                  <p className="text-sm font-medium text-foreground">{t("sessionDuration")}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t("sessionDurationDescription")}
                  </p>
                </div>
                <select
                  value={autoLogoutTime}
                  onChange={(e) => setAutoLogoutTime(e.target.value)}
                  className="border border-input rounded-lg px-3 py-2 bg-transparent bg-card text-muted-foreground text-sm"
                >
                  <option value="15">{t("15minutes")}</option>
                  <option value="30">{t("30minutes")}</option>
                  <option value="60">{t("1hour")}</option>
                  <option value="120">{t("2hours")}</option>
                </select>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
