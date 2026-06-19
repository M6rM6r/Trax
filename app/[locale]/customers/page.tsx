import MainLayout from "@/components/shared/MainLayout";
import BreadCrumb from "@/components/shared/BreadCrumb";
import { Flash, Star } from "@/public/SVG";
import { columns } from "./columns";
import { fetcher } from "@/lib/fetcher";
import { CustomersResponse } from "@/lib/types/responseTypes";

import dynamic from "next/dynamic";
import DataTableWrapper from "@/components/shared/DataTableWrapper";

const LazyAddCustomerDialog = dynamic(
  () => import("@/components/Customers/AddCustomerDialog"),
  {
    ssr: false,
  }
);

const LazyFilterComponent = dynamic(
  () => import("@/components/Customers/FilterComponent"),
  {
    ssr: false,
    loading: () => (
      <div className="animate-pulse h-12 bg-gray-100 rounded-lg" />
    ),
  }
);

const Page = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string };
}) => {
  const params = new URLSearchParams(searchParams);
  const url = `/customers?${params.toString()}`;

  const data = await fetcher<CustomersResponse>(url, {
    next: { revalidate: 30 }, // Revalidate every 30 seconds (instead of 5 minutes)
  });

  // Considerations of usung no-cache:
  // - Every page load hits the server (slower page loads)
  // - Increased server load
  // - Higher bandwidth usage
  // - Loses benefits of Next.js caching/ISR

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
            label: "جميع العملاء",
          },
        ]}
      />
      <DataTableWrapper
        columns={columns}
        data={data.data.records}
        heading="جميع العملاء"
        currentPage={data.data.pagination_data.current_page}
        totalPages={data.data.pagination_data.total_pages}
        topComponent={<LazyAddCustomerDialog />}
        filterComponent={<LazyFilterComponent />}
        exportLink="customers"
        linkToDeleteAll="customers"
      />
    </MainLayout>
  );
};

export default Page;
