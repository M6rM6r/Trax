import MainLayout from "@/components/shared/MainLayout";
import BreadCrumb from "@/components/shared/BreadCrumb";
import { Add, Complaints, Flash } from "@/public/SVG";
import { Button } from "@/components/ui/button";
import GoBack from "@/components/shared/GoBack";
import Link from "next/link";
import { DataTable } from "@/components/shared/DataTable/data-table";
import { columns } from "./columns";
import { ComplaintCategoriesResponse } from "@/lib/types/responseTypes";
import { fetcher } from "@/lib/fetcher";

const Page = async ({
  params,
  searchParams,
}: {
  params: { locale: string; id: string };
  searchParams: { [key: string]: string };
}) => {
  const urlParams = new URLSearchParams(searchParams);
  const data = await fetcher<ComplaintCategoriesResponse>(
    `/complaintCategory?filters[parent_id]=${params.id}&${urlParams.toString()}`
  );
  return (
    <MainLayout showSidebar={false}>
      <BreadCrumb
        labels={[
          {
            icon: <Complaints className="w-5 text-iconColor" />,
            label: "إدارة الشكاوى",
          },
          {
            icon: <Flash className="w-5 text-iconColor" />,
            label: "إدارة تصنيفات الشكاوى",
          },
          {
            icon: <Flash className="w-5 text-textSubTextDarker" />,
            label: "أنواع الشكوى المرتبطة بالتصنيف",
          },
        ]}
      />
      <GoBack />
      <DataTable
        columns={columns}
        data={data.data.records}
        heading="أنواع الشكوى المرتبطة بالتصنيف"
        topComponent={
          <Button variant="primary" size="lg" asChild>
            <Link
              href={`/${params.locale}/complaintsManagement/categories/${params.id}/addType`}
              className=" text-18 text-white font-[600] flex items-center gap-2 "
            >
              أضف نوع
              <Add className="w-6 text-white" />
            </Link>
          </Button>
        }
      />
    </MainLayout>
  );
};

export default Page;
