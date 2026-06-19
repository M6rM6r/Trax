import MainLayout from "@/components/shared/MainLayout";
import BreadCrumb from "@/components/shared/BreadCrumb";
import { Complaints, EyeB, Flash } from "@/public/SVG";
import GoBack from "@/components/shared/GoBack";
import { fetcher } from "@/lib/fetcher";
import { DataTable } from "@/components/shared/DataTable/data-table";
import { columns } from "./columns";
import UserInformation from "@/components/shared/UserInformation";
import { ClientResponse } from "@/lib/types/responseTypes";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const Page = async ({ params }: { params: { locale: string; id: string } }) => {
  const profile = await fetcher<any>(`/drivers/${params.id}`);
  const clientResponse = await fetcher<ClientResponse>(
    `/showCustomerComplaint?type=driver&id=${params.id}`
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
            label: "السائقين",
          },
          {
            icon: <Flash className="w-5 text-textSubTextDarker" />,
            label: "معلومات المستخدم",
          },
        ]}
      />
      <GoBack />
      <div className="flex flex-col gap-5 p-4 border border-gray200 rounded-12 bg-white">
        <div className="flex items-center justify-between flex-wrap gap-5">
          <h2 className="text-20 text-textMain font-[700]">معلومات المستخدم</h2>
          <div className="flex items-center gap-4">
            <Button variant={"primaryLight"} asChild>
              <Link
                href={`/${params.locale}/drivers/${profile?.data?.driver?.vehicle_data?.vehicle_type}/${params.id}/profile`}
              >
                <span> عرض الملف الشخصي</span>
                <EyeB />
              </Link>
            </Button>
          </div>
        </div>

        <UserInformation
          image={profile.data.driver.profile_image}
          name={profile.data.driver.name}
          gender={profile.data.driver.gender === "male" ? "ذكر" : "انثى"}
          is_online={Boolean(profile.data.driver.is_online)}
          created_at={profile.data.driver.created_at}
          email={profile.data.driver.email}
          countryCode={profile.data.driver.country_code}
          mobile={profile.data.driver.mobile}
          identity_number={profile.data.driver.identity_number}
          date_of_birth={profile.data.driver.date_of_birth}
          driving_license_type={profile.data.driver.driving_license_type}
          driving_license_number={profile.data.driver.driving_license_number}
          driving_license_expiration_date={
            profile.data.driver.driving_license_expiration_date
          }
        />
        <DataTable
          columns={columns}
          data={clientResponse.data}
          heading={`سجل الشكاوى ( ${clientResponse.data.length} شكوي )`}
        />
      </div>
    </MainLayout>
  );
};

export default Page;
