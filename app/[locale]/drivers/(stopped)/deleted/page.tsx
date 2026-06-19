import MainLayout from "@/components/shared/MainLayout";
import BreadCrumb from "@/components/shared/BreadCrumb";
import { Flash, Star } from "@/public/SVG";
import { columns } from "./columns";
import { fetcher } from "@/lib/fetcher";
import { CustomersResponse } from "@/lib/types/responseTypes";
import StoppedDriversTabs from "@/components/Drivers/StoppedDriversTabs";
import DataTableWrapper from "@/components/shared/DataTableWrapper";

const Page = async ({
  searchParams,
  params,
}: {
  searchParams: { [key: string]: string };
  params: { locale: string };
}) => {
  // TODO: Replace with actual API endpoint when available
  // const data = await fetcher<CustomersResponse>(
  //   `/drivers?page=${searchParams.page || 1}&onlyTrashed=1`,
  //   { cache: "no-store" }
  // );

  return (
    <MainLayout>
      <BreadCrumb
        labels={[
          {
            icon: <Star className="w-5 text-iconColor" />,
            label: "السائقين",
          },
          {
            icon: <Flash className="w-5 text-iconColor" />,
            label: "السائقون المحذوفون",
          },
        ]}
      />
      <StoppedDriversTabs locale={params.locale} />
      <DataTableWrapper
        columns={columns}
        data={[]}
        heading="السائقون المحذوفون"
        currentPage={1}
        totalPages={1}
      />
    </MainLayout>
  );
};

export default Page;
