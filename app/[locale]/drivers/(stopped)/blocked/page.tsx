import { DataTable } from "@/components/shared/DataTable/data-table";
import MainLayout from "@/components/shared/MainLayout";
import BreadCrumb from "@/components/shared/BreadCrumb";
import { Flash, Star } from "@/public/SVG";
import { columns } from "./columns";
import { fetcher } from "@/lib/fetcher";
import { CustomersResponse } from "@/lib/types/responseTypes";
import StoppedDriversTabs from "@/components/Drivers/StoppedDriversTabs";

const Page = async ({
  searchParams,
  params,
}: {
  searchParams: { [key: string]: string };
  params: { locale: string };
}) => {
  const data = await fetcher<CustomersResponse>(
    `/drivers?page=${searchParams.page || 1}&filters[is_active]=0`,
    { cache: "no-store" }
  );

  return (
    <MainLayout>
      <BreadCrumb
        labels={[
          {
            icon: <Star className="w-5 text-iconColor" />,
            label: "العملاء",
          },
          {
            icon: <Flash className="w-5 text-iconColor" />,
            label: "السائقون الموقوفون",
          },
        ]}
      />
      <StoppedDriversTabs locale={params.locale} />
      <DataTable
        columns={columns}
        data={data.data.records}
        heading="السائقون الغير نشطون"
        currentPage={data.data.pagination_data.current_page}
        totalPages={data.data.pagination_data.total_pages}
        linkToDeleteAll="drivers"
      />
    </MainLayout>
  );
};

export default Page;
