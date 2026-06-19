"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useParams, useSearchParams } from "next/navigation";
import { fetcherClient } from "@/lib/fetcherClient";
import { RegionsResponse } from "@/lib/types/responseTypes";
import { useResponseToast } from "@/lib/toastUtils";

// Define city type
type City = {
  id: number;
  name: string;
  checked: boolean;
};

const Index = ({ serviceName }: { serviceName?: string }) => {
  const searchParams = useSearchParams();
  const params = useParams();
  const { showResponseToast } = useResponseToast();
  const [loadingSave, setLoadingSave] = useState(false);
  // Search states
  const [leftSearch, setLeftSearch] = useState("");
  const [rightSearch, setRightSearch] = useState("");

  // Select all states
  const [leftSelectAll, setLeftSelectAll] = useState(false);
  const [rightSelectAll, setRightSelectAll] = useState(false);

  // City lists
  const [leftCities, setLeftCities] = useState<City[]>([]);

  const [rightCities, setRightCities] = useState<City[]>([]);

  // Filtered city lists based on search
  const [filteredLeftCities, setFilteredLeftCities] =
    useState<City[]>(leftCities);
  const [filteredRightCities, setFilteredRightCities] =
    useState<City[]>(rightCities);

  // Update filtered lists when search changes
  useEffect(() => {
    setFilteredLeftCities(
      leftCities.filter((city) =>
        city.name.toLowerCase().includes(leftSearch.toLowerCase())
      )
    );
  }, [leftSearch, leftCities]);

  useEffect(() => {
    setFilteredRightCities(
      rightCities.filter((city) =>
        city.name.toLowerCase().includes(rightSearch.toLowerCase())
      )
    );
  }, [rightSearch, rightCities]);

  // Handle select all for left cities
  useEffect(() => {
    if (leftSelectAll) {
      setLeftCities(leftCities.map((city) => ({ ...city, checked: true })));
    } else {
      // Only update if any city is checked (to avoid unnecessary re-renders)
      if (leftCities.some((city) => city.checked)) {
        setLeftCities(leftCities.map((city) => ({ ...city, checked: false })));
      }
    } // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leftSelectAll]);

  // Handle select all for right cities
  useEffect(() => {
    if (rightSelectAll) {
      setRightCities(rightCities.map((city) => ({ ...city, checked: true })));
    } else {
      // Only update if any city is checked (to avoid unnecessary re-renders)
      if (rightCities.some((city) => city.checked)) {
        setRightCities(
          rightCities.map((city) => ({ ...city, checked: false }))
        );
      }
    } // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rightSelectAll]);

  // Toggle individual city selection in left list
  const toggleLeftCityCheck = (id: number) => {
    setLeftCities(
      leftCities.map((city) =>
        city.id === id ? { ...city, checked: !city.checked } : city
      )
    );
  };

  // Toggle individual city selection in right list
  const toggleRightCityCheck = (id: number) => {
    setRightCities(
      rightCities.map((city) =>
        city.id === id ? { ...city, checked: !city.checked } : city
      )
    );
  };

  // Transfer selected cities from right to left
  const transferToLeft = () => {
    const citiesToTransfer = rightCities.filter((city) => city.checked);

    if (citiesToTransfer.length === 0) return;

    // Add selected cities to left list with checked reset to false
    setLeftCities([
      ...leftCities,
      ...citiesToTransfer.map((city) => ({ ...city, checked: false })),
    ]);

    // Remove selected cities from right list
    setRightCities(rightCities.filter((city) => !city.checked));

    // Reset select all
    setRightSelectAll(false);
  };

  // Transfer selected cities from left to right
  const transferToRight = () => {
    const citiesToTransfer = leftCities.filter((city) => city.checked);
    if (citiesToTransfer.length === 0) return;

    // Add selected cities to right list with checked reset to false
    setRightCities([
      ...rightCities,
      ...citiesToTransfer.map((city) => ({ ...city, checked: false })),
    ]);

    // Remove selected cities from left list
    setLeftCities(leftCities.filter((city) => !city.checked));

    // Reset select all
    setLeftSelectAll(false);
  };
  // Save function
  const handleSave = async () => {
    setLoadingSave(true);
    // Here you would typically send this data to your backend
    const formdata: any = new FormData();
    formdata.append("type", serviceName);
    searchParams.get("subtype") &&
      formdata.append("subtype", searchParams.get("subtype"));
    searchParams.get("zone_id") &&
      formdata.append("zone_id", searchParams.get("zone_id"));
    leftCities.forEach((city) => {
      formdata.append("zone_ids[]", city.id.toString());
    });
    formdata.append(
      "tab",
      searchParams.get("tab") ? searchParams.get("tab") : "region"
    );
    try {
      const response: any = await fetcherClient(`/applyServiceSettings`, {
        method: "POST",
        body: formdata,
      });

      showResponseToast(response);
    } catch (error: any) {
      showResponseToast(error.info);
    } finally {
      setLoadingSave(false);
    }
  };
  const fetchRegions = async () => {
    try {
      const response = await fetcherClient<RegionsResponse>("/getRegions", {
        cache: "no-store", // Disable cache to see fresh data after refresh
      });

      // Filter out duplicates and null settings
      const uniqueRegions = response.data.filter(
        (region, index, self) =>
          index === self.findIndex((r) => r.id === region.id)
      );

      const left: any = [];
      const right: any = [];

      uniqueRegions.forEach((region: any) => {
        if (!region.settings) return; // Skip if no settings

        const city = { id: region.id, name: region.name, checked: false };
        if (
          params.serviceType === "light_transportation" ||
          params.serviceType === "wensh" ||
          params.serviceType === "fontas"
        ) {
          if (
            region.settings[`${params.serviceType}`][
              searchParams.get("subtype") || ""
            ]?.is_default === 0
          ) {
            right.push(city);
          } else {
            left.push(city);
          }
        } else {
          if (region.settings[`${serviceName}`]?.is_default === 0) {
            right.push(city);
          } else {
            left.push(city);
          }
        }
      });

      setLeftCities(left);
      setRightCities(right);
    } catch (err) {}
  };
  const getZoneChilds = async () => {
    try {
      const response = await fetcherClient<RegionsResponse>(
        `/getZoneChilds/${searchParams.get("zone_id")}`,
        {
          cache: "no-store", // Disable cache to see fresh data after refresh
        }
      );

      // Filter out duplicates and null settings
      const uniqueZoneChilds = response.data.filter(
        (zone, index, self) => index === self.findIndex((z) => z.id === zone.id)
      );

      const left: any = [];
      const right: any = [];

      uniqueZoneChilds.forEach((zone) => {
        if (!zone.settings) return; // Skip if no settings

        const city = { id: zone.id, name: zone.name, checked: false };
        if (zone.settings?.taxi?.is_default === 0) {
          right.push(city);
        } else {
          left.push(city);
        }
      });

      // Assuming you have state setters for zone childs similar to cities
      setLeftCities(left);
      setRightCities(right);
    } catch (err) {}
  };
  useEffect(() => {
    searchParams.get("zone_id") ? getZoneChilds() : fetchRegions(); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.get("zone_id"), searchParams.get("subtype")]);
  return (
    <div className="flex flex-col  gap-5 rounded-12 border border-gray200 p-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Right section - Cities not affected */}
        <div className="flex flex-col gap-5 border border-gray200 rounded-6 p-5">
          <h2 className="text-20 text-textMain font-[600]">
            المناطق التي لن تتاثر بهذا التعديل
          </h2>
          <div className="flex items-center gap-5">
            <div className="h-11 rounded-8 flex items-center gap-5 border border-border px-3">
              <Checkbox
                id="right-select-all"
                checked={rightSelectAll}
                onCheckedChange={() => setRightSelectAll(!rightSelectAll)}
              />
              <label
                htmlFor="right-select-all"
                className="text-16 text-iconColor cursor-pointer"
              >
                تحديد الكل
              </label>
            </div>
            <div className="relative flex-1 h-11 rounded-8 flex items-center gap-5 border border-border px-3">
              <div className="absolute start-3 top-1/2 transform -translate-y-1/2">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <Input
                type="text"
                placeholder="بحث"
                className="px-6 py-2 w-full h-full border-0 focus:ring-0 focus:outline-none focus-visible:ring-0"
                value={rightSearch}
                onChange={(e) => setRightSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col gap-4">
            {filteredRightCities.map((city) => (
              <div
                key={city.id}
                className="flex items-center space-x-2 space-x-reverse"
              >
                <Checkbox
                  id={`right-city-${city.id}`}
                  checked={city.checked}
                  onCheckedChange={() => toggleRightCityCheck(city.id)}
                />
                <label
                  htmlFor={`right-city-${city.id}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {city.name}
                </label>
              </div>
            ))}
            {filteredRightCities.length === 0 && rightSearch && (
              <div className="text-center text-gray-500 py-2">
                غير مطابق للبحث
              </div>
            )}
          </div>

          <Button
            variant="primaryLight"
            className="w-full text-wrap p-2 min-h-fit"
            onClick={transferToLeft}
            disabled={!rightCities.some((city) => city.checked)}
          >
            نقل المحدد إلى المناطق التي سيطبق عليها التعديل اجباريا
          </Button>
        </div>

        {/* Left section - Cities affected */}
        <div className="flex flex-col gap-5 border border-gray200 rounded-6 p-5">
          <h2 className="text-20 text-textMain font-[600]">
            المناطق التي سيطبق عليها التعديل اجباريا
          </h2>

          <div className="flex items-center gap-5">
            <div className="h-11 rounded-8 flex items-center gap-5 border border-border px-3">
              <Checkbox
                id="left-select-all"
                checked={leftSelectAll}
                onCheckedChange={() => setLeftSelectAll(!leftSelectAll)}
              />
              <label
                htmlFor="left-select-all"
                className="text-16 text-iconColor cursor-pointer"
              >
                تحديد الكل
              </label>
            </div>
            <div className="relative flex-1 h-11 rounded-8 flex items-center gap-5 border border-border px-3">
              <div className="absolute start-3 top-1/2 transform -translate-y-1/2">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <Input
                type="text"
                placeholder="بحث"
                className="px-6 py-2 w-full h-full border-0 focus:ring-0 focus:outline-none focus-visible:ring-0"
                value={leftSearch}
                onChange={(e) => setLeftSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {filteredLeftCities.map((city) => (
              <div
                key={city.id}
                className="flex items-center space-x-2 space-x-reverse"
              >
                <Checkbox
                  id={`left-city-${city.id}`}
                  checked={city.checked}
                  onCheckedChange={() => toggleLeftCityCheck(city.id)}
                />
                <label
                  htmlFor={`left-city-${city.id}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {city.name}
                </label>
              </div>
            ))}
            {filteredLeftCities.length === 0 && leftSearch && (
              <div className="text-center text-gray-500 py-2">
                غير مطابق للبحث
              </div>
            )}
          </div>

          <Button
            variant="primaryLight"
            className="w-full text-wrap p-2 min-h-fit"
            onClick={transferToRight}
            disabled={!leftCities.some((city) => city.checked)}
          >
            نقل المحدد إلى المناطق التي لن تتأثر بهذا التعديل
          </Button>
        </div>
      </div>

      <Button
        variant={"primary"}
        onClick={handleSave}
        className="w-fit px-8"
        disabled={loadingSave}
      >
        حفظ
      </Button>
    </div>
  );
};
export default Index;
