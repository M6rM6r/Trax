import { DataTable } from "@/components/shared/DataTable/data-table";
import MainLayout from "@/components/shared/MainLayout";
import BreadCrumb from "@/components/shared/BreadCrumb";
import { Add, Flash, Shapes } from "@/public/SVG";
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

  return (
    <MainLayout>
      <BreadCrumb
        labels={[
          {
            icon: <Shapes className="w-5 text-iconColor" />,
            label: "إدارة التطبيقات",
          },
          {
            icon: <Flash className="w-5 text-textSubTextDarker" />,
            label: "الإشعارات",
          },
        ]}
      />
      <DataTable
        columns={columns}
        data={Array.from({ length: 10 }, () => ({
          title_ar: "اشعار خصم",
          title_en: "Discount Notifications",
          user_type: "العملاء",
          date: "29/11/2023",
        }))}
        heading="الإشعارات"
        currentPage={data.data.pagination_data.current_page}
        totalPages={data.data.pagination_data.total_pages}
        topComponent={
          <Button variant="primary" size="lg" asChild>
            <Link
              href={`/${params.locale}/apps/notifications/add`}
              className=" text-18 text-white font-[600] flex items-center gap-2 "
            >
              إنشاء إشعار
              <Add className="w-6 text-white" />
            </Link>
          </Button>
        }
      />
    </MainLayout>
  );
};

export default Page;
