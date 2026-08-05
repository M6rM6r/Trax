import { redirect } from "next/navigation";

export default function SettingsPage({ params }: { params: { locale: string } }) {
  redirect(`/${params.locale}/settings/company`);
}
