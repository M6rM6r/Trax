import { DataTable } from "@/components/shared/DataTable/data-table";
import MainLayout from "@/components/shared/MainLayout";
import BreadCrumb from "@/components/shared/BreadCrumb";
import { Eye, Flash, Star, User } from "@/public/SVG";
import { buttonVariants } from "@/components/ui/button";
import GoBack from "@/components/shared/GoBack";
import CustomLink from "@/components/shared/CustomLink";
import { cn } from "@/lib/utils";
import { fetcher } from "@/lib/fetcher";
import { CustomerProfileResponse } from "@/lib/types/responseTypes";
import { columns } from "../../trips/columns";
const Page = async ({ params }: { params: { id: string } }) => {
  const profile = await fetcher<CustomerProfileResponse>(
    `/customers/${params.id}`
  );

  return (
    <MainLayout showSidebar={false}>
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
          {
            icon: <User className="w-5 text-iconColor" />,
            label: profile.data.customer.name,
          },
        ]}
      />
      <GoBack />
      <DataTable
        columns={columns}
        data={profile.data.customer.rides}
        heading="الرحلات"
        topComponent={
          <CustomLink
            href={`/customers/${params.id}/profile`}
            className={cn(
              buttonVariants({ variant: "primaryLight", size: "lg" })
            )}
          >
            عرض الملف الشخصي <Eye className="w-8 text-primaryColor" />
          </CustomLink>
        }
      />
    </MainLayout>
  );
};

export default Page;
