/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { Button } from "@/components/ui/button";
import { fetcherClient } from "@/lib/fetcherClient";
import { RegionsData, RegionsResponse } from "@/lib/types/responseTypes";
import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter, useSearchParams } from "next/navigation";

const Index = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize state from URL parameters
  const getInitialSelected = () => {
    const tab = searchParams.get("tab");
    if (!tab) return 0;
    switch (tab) {
      case "city": return 1;
      case "district": return 2;
      case "surface_with_points": return 3;
      case "points": return 4;
      default: return 0;
    }
  };

  const [regionsData, setRegionsData] = useState<RegionsData[]>([]);
  const [zoneChilds, setZoneChilds] = useState<RegionsData[]>([]);
  const [district, setDistrict] = useState<RegionsData[]>([]);
  const [points, setPoints] = useState<RegionsData[]>([]);
  const [regionId, setRegionId] = useState(0);
  const [zoneId, setZoneId] = useState(0);
  const [districtId, setDistrictId] = useState(0);
  const [pointId, setPointId] = useState(0);
  const [selected, setSelected] = useState(getInitialSelected);

  const handleClick = (index: number) => {
    setSelected(index);
  };
  const fetchRegions = async () => {
    try {
      const response = await fetcherClient<RegionsResponse>("/getRegions");
      setRegionsData(response.data);
    } catch (err) {
      
    }
  };
  const getZoneChilds = async () => {
    try {
      const response = await fetcherClient<RegionsResponse>(
        `/getZoneChilds/${regionId}`
      );

      setZoneChilds(response.data);
    } catch (err) {
      
    }
  };
  const getDistrict = async () => {
    try {
      const response = await fetcherClient<RegionsResponse>(
        `/getZoneChilds/${zoneId}`
      );

      setDistrict(response.data);
    } catch (err) {
      
    }
  };
  const getPoints = async () => {
    try {
      const response = await fetcherClient<RegionsResponse>(
        `/getZoneChilds/${districtId}`
      );

      setPoints(response.data);
    } catch (err) {
      
    }
  };
  // Initialize data on mount if URL has parameters set
  useEffect(() => {
    const zoneIdParam = searchParams.get("zone_id");
    if (zoneIdParam && selected >= 1) {
      fetchRegions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selected === 0) {
      // When resetting to "كامل المملكة", preserve other URL params (like subtype, service_tab) but remove zone/tab params
      const params = new URLSearchParams(searchParams.toString());
      params.delete("zone_id");
      params.delete("zone_name");
      params.delete("tab");
      // Don't delete subtype - keep the selected service type
      const newUrl = params.toString() ? `?${params.toString()}` : "?";
      router.replace(newUrl);
    }
    if (selected >= 1) {
      fetchRegions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);
  useEffect(() => {
    getZoneChilds(); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [regionId]);
  useEffect(() => {
    getDistrict(); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoneId]);
  useEffect(() => {
    getPoints(); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [districtId]);
  return (
    <div className=" flex flex-col gap-5">
      <div>
        <h2 className="text-20 text-textMain font-[700] mb-8">
          التحكم حسب الموقع
        </h2>
        <div className=" flex gap-5 flex-wrap">
          <Button
            variant={selected === 0 ? "primary" : "primaryLight"}
            className="grow px-8"
            onClick={() => handleClick(0)}
          >
            كامل المملكة
          </Button>
          <Button
            variant={selected === 1 ? "primary" : "primaryLight"}
            className="grow px-8"
            onClick={() => handleClick(1)}
          >
            المنطقة
          </Button>
          <Button
            variant={selected === 2 ? "primary" : "primaryLight"}
            className="grow px-8"
            onClick={() => handleClick(2)}
          >
            المدينة
          </Button>
          <Button
            variant={selected === 3 ? "primary" : "primaryLight"}
            className="grow px-8"
            onClick={() => handleClick(3)}
          >
            الحي
          </Button>
          <Button
            variant={selected === 4 ? "primary" : "primaryLight"}
            className="grow px-8"
            onClick={() => handleClick(4)}
          >
            مسطح محدد بنقاط
          </Button>
        </div>
      </div>

      {selected > 0 && (
        <Select
          dir="rtl"
          onValueChange={(e) => {
            setRegionId(parseInt(e));
            const params = new URLSearchParams(searchParams.toString());
            params.set("tab", "city");
            params.set("zone_id", e);
            const region = regionsData.find((r) => r.id.toString() === e);
            if (region) params.set("zone_name", region.name);
            router.replace(`?${params.toString()}`);
          }}
          defaultValue={searchParams.get("tab") === "city" && searchParams.get("zone_id") ? searchParams.get("zone_id")! : undefined}
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
      )}
      {selected > 1 && (
        <Select
          dir="rtl"
          onValueChange={(e) => {
            setZoneId(parseInt(e));
            const params = new URLSearchParams(searchParams.toString());
            params.set("tab", "district");
            params.set("zone_id", e);
            const zone = zoneChilds.find((z) => z.id.toString() === e);
            if (zone) params.set("zone_name", zone.name);
            router.replace(`?${params.toString()}`);
          }}
          defaultValue={searchParams.get("tab") === "district" && searchParams.get("zone_id") ? searchParams.get("zone_id")! : undefined}
        >
          <SelectTrigger className="w-[349px]">
            <SelectValue placeholder="المدينة" />
          </SelectTrigger>
          <SelectContent>
            {zoneChilds?.map((zone) => (
              <SelectItem key={zone.id} value={zone.id.toString()}>
                {zone.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {selected > 2 && (
        <Select
          dir="rtl"
          onValueChange={(e) => {
            setDistrictId(parseInt(e));
            const params = new URLSearchParams(searchParams.toString());
            params.set("tab", "surface_with_points");
            params.set("zone_id", e);
            const d = district.find((z) => z.id.toString() === e);
            if (d) params.set("zone_name", d.name);
            router.replace(`?${params.toString()}`);
          }}
          defaultValue={searchParams.get("tab") === "surface_with_points" && searchParams.get("zone_id") ? searchParams.get("zone_id")! : undefined}
        >
          <SelectTrigger className="w-[349px]">
            <SelectValue placeholder="الحي" />
          </SelectTrigger>
          <SelectContent>
            {district?.map((zone) => (
              <SelectItem key={zone.id} value={zone.id.toString()}>
                {zone.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {selected > 3 && (
        <Select
          dir="rtl"
          onValueChange={(e) => {
            setPointId(parseInt(e));
            const params = new URLSearchParams(searchParams.toString());
            params.set("tab", "points");
            params.set("zone_id", e);
            const p = points.find((z) => z.id.toString() === e);
            if (p) params.set("zone_name", p.name);
            router.replace(`?${params.toString()}`);
          }}
          defaultValue={searchParams.get("tab") === "points" && searchParams.get("zone_id") ? searchParams.get("zone_id")! : undefined}
        >
          <SelectTrigger className="w-[349px]">
            <SelectValue placeholder="النقاط" />
          </SelectTrigger>
          <SelectContent>
            {points?.map((zone) => (
              <SelectItem key={zone.id} value={zone.id.toString()}>
                {zone.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
};

export default Index;
