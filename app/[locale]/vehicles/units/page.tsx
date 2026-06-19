import { DataTable } from "@/components/shared/DataTable/data-table";
import MainLayout from "@/components/shared/MainLayout";
import BreadCrumb from "@/components/shared/BreadCrumb";
import { Add, Driving, Flash } from "@/public/SVG";
import { columns } from "./columns";
import { fetcher } from "@/lib/fetcher";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { UnitsResponse } from "@/lib/types/responseTypes";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const Page = async ({
  params,
  searchParams,
}: {
  params: { locale: string };
  searchParams: { [key: string]: string };
}) => {
  const urlParams = new URLSearchParams(searchParams);
  const data = await fetcher<UnitsResponse>(
    `/fontasUnits?${urlParams.toString()}`,
    { cache: 'no-store' }
  );
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
            label: "وحدات الفونتاس",
          },
        ]}
      />
      <DataTable
        columns={columns}
        data={data?.data?.records}
        heading="وحدات الفونتاس"
        currentPage={data.data.pagination_data.current_page}
        totalPages={data.data.pagination_data.total_pages}
        topComponent={
          <Button variant="primary" size="lg" asChild>
            <Link
              href={`/${params.locale}/vehicles/units/add`}
              className=" text-18 text-white font-[600] flex items-center gap-2 "
            >
              انشىء وحدة
              <Add className="w-6 text-white" />
            </Link>
          </Button>
        }
      />
    </MainLayout>
  );
};

export default Page;
