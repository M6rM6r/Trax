import { DataTable } from "@/components/shared/DataTable/data-table";
import MainLayout from "@/components/shared/MainLayout";
import BreadCrumb from "@/components/shared/BreadCrumb";
import { EyeActionWhite, Flash, Star } from "@/public/SVG";
import { fetcher } from "@/lib/fetcher";
import { CustomersResponse } from "@/lib/types/responseTypes";
import FilterComponent from "@/components/invite-rewards/users/showInvitees/FilterComponent";
import { columns } from "./columns";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const Page = async ({
  searchParams,
  params,
}: {
  searchParams: { [key: string]: string };
  params: { id: string };
}) => {
  const paramsSearch = new URLSearchParams(searchParams);
  const url = `/referral/customers/${params.id}?${paramsSearch.toString()}`;

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
          {
            icon: <Flash className="w-5 text-iconColor" />,
            label: "المدعوين",
          },
        ]}
      />
      <DataTable
        columns={columns}
        data={data.data.records}
        heading="المدعوين"
        currentPage={data.data.pagination_data.current_page}
        totalPages={data.data.pagination_data.total_pages}
        filterComponent={<FilterComponent />}
        exportLink="customers"
        linkToDeleteAll="customers"
        topComponent={
          <Link
            href={
              searchParams.userkey === "driver"
                ? `/ar/drivers/fontas/${params?.id}/profile`
                : `/ar/customers/${params?.id}/profile`
            }
          >
            <Button variant="primary" size="lg">
              عرض الملف الشخصي <EyeActionWhite />
            </Button>
          </Link>
        }
      />
    </MainLayout>
  );
};

export default Page;
