import { DataTable } from "@/components/shared/DataTable/data-table";
import MainLayout from "@/components/shared/MainLayout";
import BreadCrumb from "@/components/shared/BreadCrumb";
import { Add, Driving, Flash } from "@/public/SVG";
import { columns } from "./columns";
import { fetcher } from "@/lib/fetcher";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { BrandsResponse } from "@/lib/types/responseTypes";
const Page = async ({
  params,
  searchParams,
}: {
  params: { locale: string };
  searchParams: { [key: string]: string };
}) => {
  const urlParams = new URLSearchParams(searchParams);
  const data = await fetcher<BrandsResponse>(`/brands?${urlParams.toString()}`);
  //

  return (
    <MainLayout>
      <BreadCrumb
        labels={[
          {
            icon: <Driving className="w-5 text-iconColor" />,
            label: "بيانات المركبات",
          },
          {
            icon: <Flash className="w-5 text-textSubTextDarker" />,
            label: "ماركة السيارة",
          },
        ]}
      />
      <DataTable
        columns={columns}
        data={data?.data?.records}
        heading="ماركة السيارة"
        currentPage={data.data.pagination_data.current_page}
        totalPages={data.data.pagination_data.total_pages}
        topComponent={
          <Button variant="primary" size="lg" asChild>
            <Link
              href={`/${params.locale}/vehicles/brands/add`}
              className=" text-18 text-white font-[600] flex items-center gap-2 "
            >
              إنشاء ماركة
              <Add className="w-6 text-white" />
            </Link>
          </Button>
        }
      />
    </MainLayout>
  );
};

export default Page;
