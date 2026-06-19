"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { FC } from "react";

interface IProps {
  locale: string;
}

const StoppedDriversTabs: FC<IProps> = ({ locale }) => {
  const pathname = usePathname();

  const tabs = [
    {
      title: "الغير نشطون",
      href: `/${locale}/drivers/blocked`,
    },
    {
      title: "المحذوفون",
      href: `/${locale}/drivers/deleted`,
    },
  ];

  return (
    <div className="flex items-center border-b border-gray-200">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`
              grow text-18 font-[600] text-center pb-2
              border-b-2
              ${
                isActive
                  ? "border-primaryColor text-primaryColor"
                  : "border-transparent text-textSubTextDarker"
              }
            `}
          >
            {tab.title}
          </Link>
        );
      })}
    </div>
  );
};

export default StoppedDriversTabs;
