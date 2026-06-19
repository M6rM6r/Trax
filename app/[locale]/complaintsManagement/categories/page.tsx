import { DataTable } from "@/components/shared/DataTable/data-table";
import MainLayout from "@/components/shared/MainLayout";
import BreadCrumb from "@/components/shared/BreadCrumb";
import { Add, Complaints, Flash } from "@/public/SVG";
import { columns } from "./columns";
import { fetcher } from "@/lib/fetcher";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ComplaintCategoriesResponse } from "@/lib/types/responseTypes";
const Page = async ({
  params,
  searchParams,
}: {
  params: { locale: string };
  searchParams: { [key: string]: string };
}) => {
  const urlParams = new URLSearchParams(searchParams);
  const data = await fetcher<ComplaintCategoriesResponse>(
    `/complaintCategory?filters[parent_id]=null&${urlParams.toString()}`
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
            label: "إدارة تصنيفات الشكاوى",
          },
        ]}
      />
      <DataTable
        columns={columns}
        data={data.data.records}
        heading="إدارة تصنيفات الشكاوى"
        currentPage={data.data.pagination_data.current_page}
        totalPages={data.data.pagination_data.total_pages}
        topComponent={
          <Button variant="primary" size="lg" asChild>
            <Link
              href={`/${params.locale}/complaintsManagement/categories/add`}
              className=" text-18 text-white font-[600] flex items-center gap-2 "
            >
              انشىء تصنيف
              <Add className="w-6 text-white" />
            </Link>
          </Button>
        }
      />
    </MainLayout>
  );
};

export default Page;
