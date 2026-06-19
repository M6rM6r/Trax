"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RegionsData, RegionsResponse } from "@/lib/types/responseTypes";
import { fetcherClient } from "@/lib/fetcherClient";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const FilterTabs = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [regionsData, setRegionsData] = useState<RegionsData[]>([]);
  // نجيب القيمة من الـ URL لو موجودة، الافتراضي "all"
  const initialActive = searchParams.get("filter_date") || "all";
  const [active, setActive] = useState(initialActive);

  const tabs = [
    { key: "all", label: "الكل" },
    { key: "day", label: "يوم" },
    { key: "month", label: "شهر" },
    { key: "year", label: "سنة" },
  ];

  const handleTabClick = (key: string) => {
    setActive(key);

    const params = new URLSearchParams(window.location.search);
    params.set("filter_date", key);

    router.push(`?${params.toString()}`);
  };
  const fetchRegions = async () => {
    try {
      const response = await fetcherClient<RegionsResponse>("/getRegions");
      setRegionsData(response.data);
    } catch (err) {
      
    }
  };
  useEffect(() => {
    fetchRegions();
  }, []);
  return (
    <div className="flex justify-between gap-5 flex-wrap w-full">
      <Select
        dir="rtl"
        onValueChange={(e) => {
          const params = new URLSearchParams(searchParams.toString());
          params.set("region_id", e);
          router.replace(`?${params.toString()}`);
        }}
        // defaultValue={regionId.toString()}
      >
        <SelectTrigger className="w-[349px]">
          <SelectValue placeholder="المنطقة" />
        </SelectTrigger>
        <SelectContent>
          {regionsData?.map((region) => (
            <SelectItem key={region.id} value={region.id.toString()}>
              {region.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="flex items-center bg-gray-100 rounded-lg py-3 px-2">
        {tabs.map((tab, index) => (
          <div key={tab.key} className="flex items-center">
            <button
              onClick={() => handleTabClick(tab.key)}
              className={`py-1 px-4 text-lg rounded-md transition-colors
                ${
                  active === tab.key
                    ? "text-[#11489B] font-[600]"
                    : "text-gray-500 hover:text-black"
                }
              `}
            >
              {tab.label}
            </button>
            {index < tabs.length - 1 && (
              <span className="mx-2 text-gray-400">|</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FilterTabs;
