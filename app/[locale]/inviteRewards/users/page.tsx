import { DataTable } from "@/components/shared/DataTable/data-table";
import MainLayout from "@/components/shared/MainLayout";
import BreadCrumb from "@/components/shared/BreadCrumb";
import { Flash, Star } from "@/public/SVG";
import { columns } from "./columns";
import { fetcher } from "@/lib/fetcher";
import { CustomersResponse } from "@/lib/types/responseTypes";

import FilterComponent from "@/components/invite-rewards/users/FilterComponent";

const Page = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string };
}) => {
  const params = new URLSearchParams(searchParams);
  const url = `/referral/customers?${params.toString()}`;

  const data = await fetcher<CustomersResponse>(url);

  return (
    <MainLayout>
      <BreadCrumb
        labels={[
          {
            icon: <Star className="w-5 text-iconColor" />,
            label: "الدعوات والمكآفأت",
          },
          {
            icon: <Flash className="w-5 text-iconColor" />,
            label: "المستخدمين",
          },
        ]}
      />
      <DataTable
        columns={columns}
        data={data.data.records}
        heading="المستخدمين"
        currentPage={data.data.pagination_data.current_page}
        totalPages={data.data.pagination_data.total_pages}
        filterComponent={<FilterComponent />}
        exportLink="customers"
        linkToDeleteAll="customers"
      />
    </MainLayout>
  );
};

export default Page;
