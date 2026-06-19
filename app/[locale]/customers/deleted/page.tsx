import { DataTable } from "@/components/shared/DataTable/data-table";
import MainLayout from "@/components/shared/MainLayout";
import BreadCrumb from "@/components/shared/BreadCrumb";
import { Flash, Star } from "@/public/SVG";
import { columns } from "./columns";
import { fetcher } from "@/lib/fetcher";
import { CustomersResponse } from "@/lib/types/responseTypes";
import Link from "next/link";

const Page = async ({
  searchParams,
  params,
}: {
  searchParams: { [key: string]: string };
  params: { locale: string };
}) => {
  const paramss = new URLSearchParams(searchParams);
  const data = await fetcher<CustomersResponse>(
    `/customers?onlyTrashed=1&${paramss.toString()}`
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
            label: "العملاء الموقوفون",
          },
        ]}
      />
      <div className=" flex items-center">
        <Link
          href={`/${params.locale}/customers/blocked`}
          className=" grow text-18 font-[600] text-textSubTextDarker border-b-2 border-iconColor pb-2 text-center"
        >
          الغير نشطون
        </Link>
        <Link
          href={`/${params.locale}/customers/deleted`}
          className=" grow text-18 font-[600] text-primaryColor border-b-2 border-primaryColor pb-2 text-center"
        >
          المحذوفون
        </Link>
      </div>
      <DataTable
        columns={columns}
        data={data.data.records}
        heading="العملاء المحذوفون "
        currentPage={data.data.pagination_data.current_page}
        totalPages={data.data.pagination_data.total_pages}
      />
    </MainLayout>
  );
};

export default Page;
