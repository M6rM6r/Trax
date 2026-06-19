import { DataTable } from "@/components/shared/DataTable/data-table";
import MainLayout from "@/components/shared/MainLayout";
import BreadCrumb from "@/components/shared/BreadCrumb";
import { Eye, Flash, Star, User } from "@/public/SVG";
import { buttonVariants } from "@/components/ui/button";
import { columns } from "./columns";
import GoBack from "@/components/shared/GoBack";
import CustomLink from "@/components/shared/CustomLink";
import { cn } from "@/lib/utils";
import { fetcher } from "@/lib/fetcher";
import { DriverProfileResponse } from "@/lib/types/responseTypes";
const Page = async ({ params }: { params: { id: string } }) => {
  const profile = await fetcher<DriverProfileResponse>(`/drivers/${params.id}`);
  return (
    <MainLayout showSidebar={false}>
      <BreadCrumb
        labels={[
          {
            icon: <Star className="w-5 text-iconColor" />,
            label: "السائقين",
          },
          {
            icon: <Flash className="w-5 text-iconColor" />,
            label: "جميع السائقين",
          },
          {
            icon: <User className="w-5 text-iconColor" />,
            label: profile.data.driver.name,
          },
        ]}
      />
      <GoBack />
      <DataTable
        columns={columns}
        data={profile.data.driver.rides}
        heading="الرحلات"
        topComponent={
          <CustomLink
            href={`/drivers/fontas/${params.id}/profile`}
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
