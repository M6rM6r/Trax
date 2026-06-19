import MainLayout from "@/components/shared/MainLayout";
import BreadCrumb from "@/components/shared/BreadCrumb";
import DriversTabs from "@/components/shared/DriversTabs";
import AddDriver from "@/components/shared/AddDriver";
import { DataTable } from "@/components/shared/DataTable/data-table";
import { Flash, Star } from "@/public/SVG";
import { columns } from "@/components/Drivers/DriversTableColumns";
import { fetcher } from "@/lib/fetcher";
import { TaxiResponse } from "@/lib/types/responseTypes";
import { EVehicleType } from "@/lib/types/enums";
import FilterDialog from "@/components/Drivers/FilterDialog";
import DriverSortingComponent from "@/components/Drivers/DriverSortingComponent";

const Page = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string };
}) => {
  const params = new URLSearchParams(searchParams);
  const data = await fetcher<TaxiResponse>(
    `/drivers?filters[vehicles][vehicle_type]=wensh&${params.toString()}`,
    { cache: "no-store" }
  );

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
      <DataTable
        columns={columns}
        data={data.data.records}
        heading="سطحات ودينات "
        currentPage={data.data.pagination_data.current_page}
        totalPages={data.data.pagination_data.total_pages}
        filterDialog={<FilterDialog />}
        sortingComponent={<DriverSortingComponent />}
        topComponent={<AddDriver vehicleType={EVehicleType.wensh} />}
        exportLink="drivers"
        linkToDeleteAll="drivers"
      />
    </MainLayout>
  );
};

export default Page;
