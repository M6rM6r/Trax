import MainLayout from "@/components/shared/MainLayout";
import BreadCrumb from "@/components/shared/BreadCrumb";
import { Flash, Star } from "@/public/SVG";
import DriversTabs from "@/components/shared/DriversTabs";
import { columns } from "@/components/Drivers/DriversTableColumns";
import { fetcher } from "@/lib/fetcher";
import { TaxiResponse } from "@/lib/types/responseTypes";

import dynamic from "next/dynamic";
import DataTableWrapper from "@/components/shared/DataTableWrapper";

const LazyFilterDialog = dynamic(
  () => import("@/components/Drivers/FilterDialog"),
  {
    ssr: false,
    loading: () => (
      <div className="animate-pulse h-32 bg-gray-200 rounded-lg" />
    ),
  }
);

const LazyDriverSortingComponent = dynamic(
  () => import("@/components/Drivers/DriverSortingComponent"),
  {
    ssr: false,
    loading: () => (
      <div className="animate-pulse h-12 bg-gray-100 rounded-lg" />
    ),
  }
);

const Page = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string };
}) => {
  const params = new URLSearchParams(searchParams);
  const url = `/drivers?${params.toString()}`;

  const data = await fetcher<TaxiResponse>(url, { cache: "no-store" });

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
            label: "جميع السائقين",
          },
        ]}
      />
      <DriversTabs />
      <DataTableWrapper
        columns={columns}
        data={data.data.records}
        heading="جميع السائقين"
        currentPage={data.data.pagination_data.current_page}
        totalPages={data.data.pagination_data.total_pages}
        filterDialog={<LazyFilterDialog />}
        sortingComponent={<LazyDriverSortingComponent />}
        exportLink="drivers"
        linkToDeleteAll="drivers"
      />
    </MainLayout>
  );
};

export default Page;
