import { DataTable } from "@/components/shared/DataTable/data-table";
import MainLayout from "@/components/shared/MainLayout";
import BreadCrumb from "@/components/shared/BreadCrumb";
import { Add, Flash, ShieldTick } from "@/public/SVG";
import { columns } from "./columns";
import { fetcher } from "@/lib/fetcher";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { UsersResponse } from "@/lib/types/responseTypes";
import dynamic from "next/dynamic";

const LazyTopComponent = dynamic(() =>
  Promise.resolve(function TopComponent({
    params,
  }: {
    params: { locale: string };
  }) {
    return (
      <Button variant="primary" size="lg" asChild>
        <Link
          prefetch
          href={`/${params.locale}/moderators/add`}
          className="text-18 text-white font-[600] flex items-center gap-2"
        >
          إنشاء مشرف
          <Add className="w-6 text-white" />
        </Link>
      </Button>
    );
  })
);

const Page = async ({
  params,
  searchParams,
}: {
  params: { locale: string };
  searchParams: { [key: string]: string };
}) => {
  const urlParams = new URLSearchParams(searchParams);
  const data = await fetcher<UsersResponse>(`/users?${urlParams.toString()}`, {
    next: { revalidate: 300 },
  });

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
            label: "المشرفين",
          },
        ]}
      />
      <DataTable
        columns={columns}
        data={data.data.records}
        heading="المشرفين"
        currentPage={data.data.pagination_data.current_page}
        totalPages={data.data.pagination_data.total_pages}
        topComponent={<LazyTopComponent params={params} />}
      />
    </MainLayout>
  );
};

export default Page;
