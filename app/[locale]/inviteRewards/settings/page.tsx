// app/invite-rewards/settings/page.tsx  <-- Server Component

import BreadCrumb from "@/components/shared/BreadCrumb";
import MainLayout from "@/components/shared/MainLayout";
import { Flash } from "@/public/SVG";
import { Star } from "lucide-react";
import { fetcher } from "@/lib/fetcher"; // ده السيرفر سايد fetcher
import ServiceToggleCardClient from "@/components/invite-rewards/settings/ServiceToggleCardClient";

export default async function ServiceToggleCard() {
  const response = await fetcher<{ success: boolean; data: any[] }>(
    `/referralSettings?isPaginate=0`
  );

  const data = response.data;

  const enabledValue = data.find((d: any) => d.key === "enabled")?.value;
  const isActive = enabledValue === "1";

  const initialValues = {
    inviter_driver_reward:
      data.find((d) => d.key === "driver_referrer_reward")?.value || "",
    inviter_rider_reward:
      data.find((d) => d.key === "customer_referrer_reward")?.value || "",
    invitee_driver_reward:
      data.find((d) => d.key === "driver_referee_reward")?.value || "",
    invitee_rider_reward:
      data.find((d) => d.key === "customer_referee_reward")?.value || "",
    inviter_driver_trips:
      data.find((d) => d.key === "driver_referrer_required_rides")?.value || "",
    inviter_rider_trips:
      data.find((d) => d.key === "customer_referrer_required_rides")?.value ||
      "",
    invitee_driver_trips:
      data.find((d) => d.key === "driver_referee_required_rides")?.value || "",
    invitee_rider_trips:
      data.find((d) => d.key === "customer_referee_required_rides")?.value ||
      "",
  };

  return (
    <MainLayout>
      <BreadCrumb
        labels={[
          {
            icon: <Star className="w-5 text-iconColor" />,
            label: "الدعوات والمكآفأت",
          },
          {
            icon: <Flash className="w-5 text-iconColor" />,
            label: "الإعدادات",
          },
        ]}
      />

      <ServiceToggleCardClient
        isActiveFromServer={isActive}
        initialValuesFromServer={initialValues}
      />
    </MainLayout>
  );
}
