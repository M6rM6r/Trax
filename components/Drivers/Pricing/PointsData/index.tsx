import { DataTable } from "@/components/shared/DataTable/data-table";
import { columns } from "./columns";
import { fetcher } from "@/lib/fetcher";
import AddPoint from "./AddPoint";

const Index = async () => {
  const data = await fetcher<any>(`/getSurfaceWithPoints`);

  // Ensure data is always an array
  const pointsData = Array.isArray(data.data) ? data.data : [];

  return (
    <DataTable
      columns={columns}
      data={pointsData}
      heading="النقاط"
      topComponent={<AddPoint />}
    />
  );
};

export default Index;
