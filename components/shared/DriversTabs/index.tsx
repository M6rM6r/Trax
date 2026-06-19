/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import { useLocale } from "next-intl";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

interface LinkItem {
  text: string;
  link: string;
  active: boolean;
  disabled?: boolean;
  subItems: LinkItem[];
}

const Index = () => {
  const [api, setApi] = useState<CarouselApi>();
  const pathname = usePathname();
  const locale = useLocale();

  const basePath = `/${locale}/drivers`;

  // -----------------------
  // MAIN LINKS
  // -----------------------
  const links: LinkItem[] = [
    {
      text: "كل الخدمات",
      link: `${basePath}`,
      active: pathname === `${basePath}`,
      disabled: false,
      subItems: [],
    },
    {
      text: "سيارة تاكسي",
      link: `${basePath}/taxi`,
      active: pathname.includes("/taxi"),
      disabled: false,
      subItems: [],
    },
    {
      text: "النقل الخفيف",
      link: `${basePath}/lightTransportation`,
      active: pathname.includes("/lightTransportation"),
      disabled: false,
      subItems: [],
    },
    {
      text: "سطحات ودينات ",
      link: `${basePath}/wensh`,
      active: pathname.includes("/wensh"),
      disabled: false,
      subItems: [],
    },
    {
      text: "وايت ماء",
      link: `${basePath}/fontas`,
      active: pathname.includes("/fontas"),
      disabled: false,
      subItems: [],
    },
    {
      text: "سائق بدون سيارة",
      link: `${basePath}/driversWithoutCar`,
      active: pathname.includes("/driversWithoutCar"),
      disabled: false,
      subItems: [],
    },
    {
      text: "مواعيد مهمة",
      link: `${basePath}/importantDates`,
      active: pathname.includes("/importantDates"),
      disabled: false,
      subItems: [],
    },

    {
      text: "العطالات",
      link: `${basePath}/outages`,
      active: pathname.includes("/outages"),
      disabled: false,

      subItems: [
        {
          text: "كل العطالات ",
          link: `${basePath}/outages`,
          active: pathname === `${basePath}/outages`,
          disabled: false,
          subItems: [],
        },
        {
          text: "عطالات الوقود ",
          link: `${basePath}/outages/fuel`,
          active: pathname.includes("/fuel"),
          disabled: false,
          subItems: [],
        },
        {
          text: "عطالات الإطارات",
          link: `${basePath}/outages/tires`,
          active: pathname.includes("/tires"),
          disabled: false,
          subItems: [],
        },
        {
          text: "عطالات السحب",
          link: `${basePath}/outages/towing`,
          active: pathname.includes("/towing"),
          disabled: false,
          subItems: [],
        },
      ],
    },
  ];

  // Scroll to active item
  useEffect(() => {
    const activeIndex = links.findIndex((l) => l.active);
    if (api && activeIndex !== -1) {
      api.scrollTo(activeIndex);
    }
  }, [api, pathname]);

  return (
    <div className="space-y-4">
      {/* MAIN TABS */}
      <Carousel
        setApi={setApi}
        className="max-w-full"
        opts={{
          direction: locale === "ar" ? "rtl" : "ltr",
        }}
      >
        <CarouselContent className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {links.map((link, index) => (
            <CarouselItem key={index} className="w-full">
              <a
                href={link.disabled ? undefined : link.link}
                aria-disabled={link.disabled}
                className={cn(
                  "text-14 rounded-6 block text-center py-2",
                  link.active
                    ? "text-white bg-primaryColor"
                    : "text-textMain bg-textBG",
                  link.disabled && "opacity-50 cursor-not-allowed"
                )}
              >
                {link.text}
              </a>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      {links[links.length - 1].active &&
        links[links.length - 1].subItems.length > 0 && (
          <div className="rounded-xl border p-6 bg-white shadow-md">
            <div className="flex flex-wrap gap-4 justify-start">
              {links[links.length - 1].subItems.map((sub, i) => (
                <a
                  key={i}
                  href={sub.disabled ? undefined : sub.link}
                  aria-disabled={sub.disabled}
                  className={cn(
                    "px-6 py-3 rounded-xl text-base font-semibold transition-all min-w-[140px] text-center",
                    sub.active
                      ? "bg-primaryColor text-white shadow"
                      : "bg-textBG text-textMain",
                    sub.disabled && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {sub.text}
                </a>
              ))}
            </div>
          </div>
        )}
    </div>
  );
};

export default Index;
