import MainLayout from "@/components/shared/MainLayout";
import BreadCrumb from "@/components/shared/BreadCrumb";
import { Routing } from "@/public/SVG";
import { columns } from "./columns";
import { fetcher } from "@/lib/fetcher";
import { CustomersResponse } from "@/lib/types/responseTypes";
import dynamic from "next/dynamic";
import DataTableWrapper from "@/components/shared/DataTableWrapper";

const LazyTripsSortingComponent = dynamic(
  () => import("@/components/Trips/TripsSortingComponent"),
  {
    ssr: false,
    loading: () => (
      <div className="animate-pulse h-32 bg-gray-200 rounded-lg" />
    ),
  }
);

const LazyTripsFilter = dynamic(
  () => import("@/components/Trips/TripsFilter"),
  {
    ssr: false,
    loading: () => (
      <div className="animate-pulse h-32 bg-gray-200 rounded-lg" />
    ),
  }
);

const Page = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string };
}) => {
  const params = new URLSearchParams(searchParams);
  const url = `/rides?${params.toString()}`;

  const data = await fetcher<CustomersResponse>(url);

  return (
    <MainLayout>
      <BreadCrumb
        labels={[
          {
            icon: <Routing className="w-5 text-iconColor" />,
            label: "الرحلات",
          },
        ]}
      />
      <DataTableWrapper
        columns={columns}
        data={data.data.records}
        heading="الرحلات"
        currentPage={data.data.pagination_data.current_page}
        totalPages={data.data.pagination_data.total_pages}
        sortingComponent={<LazyTripsSortingComponent />}
        filterComponent={<LazyTripsFilter />}
      />
    </MainLayout>
  );
};

export default Page;
