"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter, useSearchParams } from "next/navigation";
import { ReactNode, useCallback } from "react";

interface LightTransportationTabsProps {
  lightTransportationContent: ReactNode;
  lightTransportationGoodsContent: ReactNode;
}

const LightTransportationTabs = ({
  lightTransportationContent,
  lightTransportationGoodsContent,
}: LightTransportationTabsProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get current tab from URL or default to "light_transportation"
  const currentTab = searchParams.get("service_tab") || "light_transportation";

  const handleTabChange = useCallback((value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("service_tab", value);

    // Build the new URL with all existing params
    const newUrl = `?${params.toString()}`;
    router.replace(newUrl, { scroll: false });
  }, [searchParams, router]);

  return (
    <Tabs
      dir="rtl"
      value={currentTab}
      onValueChange={handleTabChange}
      className="w-full"
    >
      <TabsList className="w-full bg-transparent">
        <TabsTrigger
          value="light_transportation"
          className="grow border-b-[2px] border-b-iconColor pb-2"
        >
          النقل الخفيف
        </TabsTrigger>
        <TabsTrigger
          value="light_transportation_goods"
          className="grow border-b-[2px] border-b-iconColor pb-2"
        >
          بضاعات النقل الخفيف
        </TabsTrigger>
      </TabsList>
      <TabsContent
        value="light_transportation"
        className="flex flex-col gap-3"
      >
        {lightTransportationContent}
      </TabsContent>
      <TabsContent
        value="light_transportation_goods"
        className="flex flex-col gap-3"
      >
        {lightTransportationGoodsContent}
      </TabsContent>
    </Tabs>
  );
};

export default LightTransportationTabs;
