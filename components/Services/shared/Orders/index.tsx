import { DataTable } from "@/components/shared/DataTable/data-table";
import { columnFuel } from "./columnFuel";
import { columnTires } from "./columnTires";
import { columnTowing } from "./columnTowing";
import { fetcher } from "@/lib/fetcher";
import { FuelsOrdersResponse } from "@/lib/types/responseTypes";
import { columnFastSupport } from "./columnFastSupport";
const Index = async ({
  params,
  urlParams,
  serviceName,
}: {
  params: { [key: string]: string };
  urlParams: any;
  serviceName: string;
}) => {
  // TODO: UPDATE FETCH URL TO THE FAST_SUPPORT ONE WHEN ITS EP IS READY
  const data = await fetcher<FuelsOrdersResponse>(
    `/services/${serviceName}/orders?${urlParams.toString()}`
  );

  // Ensure records is always an array
  const records = Array.isArray(data?.data?.records) ? data.data.records : [];

  return (
    <DataTable
      columns={
        (serviceName === "fuel" && columnFuel) ||
        (serviceName === "tires" && columnTires) ||
        (serviceName === "towing" && columnTowing) ||
        columnFastSupport
      }
      currentPage={data?.data?.pagination_data?.current_page || 1}
      totalPages={data?.data?.pagination_data?.total_pages || 1}
      data={records}
      heading="طلبات السائقين"
    />
  );
};

export default Index;
