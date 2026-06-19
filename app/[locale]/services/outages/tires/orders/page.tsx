import BreadCrumb from "@/components/shared/BreadCrumb";
import MainLayout from "@/components/shared/MainLayout";
import { Flash, Star } from "@/public/SVG";
import Orders from "@/components/Services/shared/Orders";
import ServicesTabsHeader from "@/components/Services/shared/ServicesTabsHeader";
const Page = async ({
  params,
  searchParams,
}: {
  params: { locale: string; serviceType: string };
  searchParams: { [key: string]: string };
}) => {
  const urlParams = new URLSearchParams(searchParams);
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
            label: "الاطارات",
          },
        ]}
      />
      <ServicesTabsHeader serviceName="tires" />
      <Orders params={params} urlParams={urlParams} serviceName="tires" />
    </MainLayout>
  );
};

export default Page;
