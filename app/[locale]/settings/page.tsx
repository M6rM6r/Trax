import { redirect } from "@/i18n/navigation";

export default function SettingsPage({ params }: { params: { locale: string } }) {
  redirect({ href: "/settings/company", locale: params.locale });
}
