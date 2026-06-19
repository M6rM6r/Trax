import { DataTable } from "@/components/shared/DataTable/data-table";
import MainLayout from "@/components/shared/MainLayout";
import BreadCrumb from "@/components/shared/BreadCrumb";
import { Complaints, Flash } from "@/public/SVG";
import { columns } from "./columns";
import { fetcher } from "@/lib/fetcher";
import { ActionsResponse } from "@/lib/types/responseTypes";
const Page = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string };
}) => {
  const urlParams = new URLSearchParams(searchParams);
  const data = await fetcher<ActionsResponse>(
    `/disciplinaryAction?${urlParams.toString()}`
  );
  // 

  return (
    <MainLayout>
      <BreadCrumb
        labels={[
          {
            icon: <Complaints className="w-5 text-iconColor" />,
            label: "إدارة الشكاوى",
          },
          {
            icon: <Flash className="w-5 text-textSubTextDarker" />,
            label: "إدراة الإجراءات",
          },
        ]}
      />
      <DataTable
        columns={columns}
        data={data.data.records}
        heading="إدراة الإجراءات"
        currentPage={data.data.pagination_data.current_page}
        totalPages={data.data.pagination_data.total_pages}
      />
    </MainLayout>
  );
};

export default Page;
