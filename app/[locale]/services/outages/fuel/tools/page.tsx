import BreadCrumb from "@/components/shared/BreadCrumb";
import MainLayout from "@/components/shared/MainLayout";
import { Flash, Star } from "@/public/SVG";

import ServicesTabsHeader from "@/components/Services/shared/ServicesTabsHeader";
import Tools from "@/components/Services/shared/Tools";
const Page = async ({
  params,
  searchParams,
}: {
  params: { locale: string; serviceType: string };
  searchParams: { [key: string]: string };
}) => {
  return (
    <MainLayout>
      <BreadCrumb
        labels={[
          {
            icon: <Star className="w-5 text-iconColor" />,
            label: "الخدمات",
          },
          {
            icon: <Star className="w-5 text-iconColor" />,
            label: "العطالات",
          },
          {
            icon: <Flash className="w-5 text-iconColor" />,
            label: "الوقود",
          },
        ]}
      />
      <ServicesTabsHeader serviceName="fuel" />
      <Tools serviceName="fuel" />
    </MainLayout>
  );
};

export default Page;
