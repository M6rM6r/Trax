import { DataTable } from "@/components/shared/DataTable/data-table";
import MainLayout from "@/components/shared/MainLayout";
import BreadCrumb from "@/components/shared/BreadCrumb";
import { Add, Flash, ShieldTick } from "@/public/SVG";
import { columns } from "./columns";
import { fetcher } from "@/lib/fetcher";
import { RolesResponse } from "@/lib/types/responseTypes";
import { Button } from "@/components/ui/button";
import Link from "next/link";
const Page = async ({
  params,
  searchParams,
}: {
  params: { locale: string };
  searchParams: { [key: string]: string };
}) => {
  const urlParams = new URLSearchParams(searchParams);
  const data = await fetcher<RolesResponse>(`/roles?${urlParams.toString()}`);
  //
  return (
    <MainLayout>
      <BreadCrumb
        labels={[
          {
            icon: <ShieldTick className="w-5 text-iconColor" />,
            label: "صلاحيات المشرفين",
          },
          {
            icon: <Flash className="w-5 text-textSubTextDarker" />,
            label: "الأدوار",
          },
        ]}
      />
      <DataTable
        columns={columns}
        data={data.data.records}
        heading="الأدوار"
        currentPage={data.data.pagination_data.current_page}
        totalPages={data.data.pagination_data.total_pages}
        topComponent={
          <Button variant="primary" size="lg" asChild>
            <Link
              href={`/${params.locale}/roles/add`}
              className=" text-18 text-white font-[600] flex items-center gap-2 "
            >
              إنشاء دور
              <Add className="w-6 text-white" />
            </Link>
          </Button>
        }
      />
    </MainLayout>
  );
};

export default Page;
