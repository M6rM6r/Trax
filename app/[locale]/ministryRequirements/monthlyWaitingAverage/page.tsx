import MainLayout from "@/components/shared/MainLayout";
import BreadCrumb from "@/components/shared/BreadCrumb";
import { Flash, ShieldTick } from "@/public/SVG";
import dynamic from "next/dynamic";

const LazyMonthlyWaitingFilter = dynamic(
  () => import("@/components/MinistryRequirements/MonthlyWaitingFilter"),
  {
    ssr: false,
    loading: () => (
      <div className="animate-pulse h-32 bg-gray-200 rounded-lg" />
    ),
  }
);

const Page = async () => {
  return (
    <MainLayout>
      <BreadCrumb
        labels={[
          {
            icon: <ShieldTick className="w-4 text-black" />,
            label: "متطلبات وزارة النقل",
          },
          {
            icon: <Flash className="w-4 text-black" />,
            label: "المتوسط الشهري للإنتظار",
          },
        ]}
      />

      {/* Filter Section */}
      <LazyMonthlyWaitingFilter />
    </MainLayout>
  );
};

export default Page;
