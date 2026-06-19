"use client";
import { useLocale } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";

const Index = () => {
  const locale = useLocale();
  const pathname = usePathname();
  return (
    <div className=" flex items-center">
      <Link
        href={`/${locale}/services/fuel/settings`}
        className={` grow text-18 font-[600]  border-b-2  pb-2 text-center ${
          pathname.includes("settings")
            ? "text-primaryColor border-primaryColor"
            : "text-textSubTextDarker border-iconColor"
        }`}
      >
        الإعدادات
      </Link>
      <Link
        href={`/${locale}/services/fuel/orders`}
        className={` grow text-18 font-[600]  border-b-2  pb-2 text-center ${
          pathname.includes("orders")
            ? "text-primaryColor border-primaryColor"
            : "text-textSubTextDarker border-iconColor"
        }`}
      >
        الطلبات
      </Link>
      <Link
        href={`/${locale}/services/fuel/tools`}
        className={` grow text-18 font-[600]  border-b-2  pb-2 text-center ${
          pathname.includes("tools")
            ? "text-primaryColor border-primaryColor"
            : "text-textSubTextDarker border-iconColor"
        }`}
      >
        الأدوات
      </Link>
    </div>
  );
};

export default Index;
