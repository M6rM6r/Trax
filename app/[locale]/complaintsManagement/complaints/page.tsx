import { DataTable } from "@/components/shared/DataTable/data-table";
import MainLayout from "@/components/shared/MainLayout";
import BreadCrumb from "@/components/shared/BreadCrumb";
import { Add, Complaints, Flash } from "@/public/SVG";
import { columns } from "./columns";
import { fetcher } from "@/lib/fetcher";
import { complaintsResponse } from "@/lib/types/responseTypes";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import FilterDialog from "@/components/Complaints/FilterDialog";
import ComplaintsSortingDialog from "@/components/Complaints/ComplaintsSortingDialog";

const Page = async ({
  params,
  searchParams,
}: {
  params: { locale: string };
  searchParams: { [key: string]: string };
}) => {
  const urlParams = new URLSearchParams(searchParams);
  const data = await fetcher<complaintsResponse>(
    `/complaints?${urlParams.toString()}`
  );

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
            label: "الشكاوى",
          },
        ]}
      />

      <DataTable
        columns={columns}
        data={data.data.records}
        heading="الشكاوى"
        currentPage={data.data.pagination_data.current_page}
        totalPages={data.data.pagination_data.total_pages}
        filterDialog={<FilterDialog />}
        sortingComponent={<ComplaintsSortingDialog />} // ✅ added
        exportLink="complaints"
        linkToDeleteAll="complaints"
        topComponent={
          <Button variant="primary" size="lg" asChild>
            <Link
              href={`/${params.locale}/complaintsManagement/complaints/add`}
              className=" text-18 text-white font-[600] flex items-center gap-2 "
            >
              إنشاء شكوى
              <Add className="w-5" />
            </Link>
          </Button>
        }
      />
    </MainLayout>
  );
};

export default Page;
