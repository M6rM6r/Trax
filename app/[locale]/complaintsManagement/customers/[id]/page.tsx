import MainLayout from "@/components/shared/MainLayout";
import BreadCrumb from "@/components/shared/BreadCrumb";
import { Complaints, EyeB, Flash } from "@/public/SVG";
import GoBack from "@/components/shared/GoBack";
import { fetcher } from "@/lib/fetcher";
import { DataTable } from "@/components/shared/DataTable/data-table";
import { columns } from "./columns";
import AvatarWithName from "@/components/shared/TableCellComponents/AvatarWithName";
import TitleAndSubTitle from "@/components/shared/TitleAndSubTitle";
import { convertDateFormat } from "@/lib/helperFunctions";
import { ClientResponse } from "@/lib/types/responseTypes";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const Page = async ({ params }: { params: { locale: string; id: string } }) => {
  const profile = await fetcher<any>(`/customers/${params.id}`);
  const clientResponse = await fetcher<ClientResponse>(
    `/showCustomerComplaint?type=customer&id=${params.id}`
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
            label: "العملاء",
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
              <Link href={`/${params.locale}/customers/${params.id}/profile`}>
                <span> عرض الملف الشخصي</span>
                <EyeB />
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div className="border border-gray200 rounded-6 p-3 grid grid-cols-2 gap-5">
            <div className=" flex items-center   gap-2">
              <AvatarWithName
                image={profile.data.customer.profile_image}
                name={profile.data.customer.name}
                isActive={profile.data.customer.is_active}
                gender={
                  profile.data.customer.gender === "male" ? "ذكر" : "انثى"
                }
                online={false}
              />
            </div>
            <TitleAndSubTitle
              title="تاريخ الإنضمام"
              subTitle={convertDateFormat(profile.data.customer.created_at)}
            />
          </div>
          <div className="border border-gray200 rounded-6 p-3 grid grid-cols-2  gap-5">
            <TitleAndSubTitle
              title="البريد الإلكتروني"
              subTitle={profile.data.customer.email}
            />
            <TitleAndSubTitle
              title="الجوال"
              subTitle={
                profile.data.customer.country_code +
                profile.data.customer.mobile +
                "+"
              }
            />
          </div>
          <div className="border border-gray200 rounded-6 p-3 grid grid-cols-2 gap-5">
            <TitleAndSubTitle
              title="عدد الرحلات اللي تمت"
              subTitle={profile.data.customer.rides_count}
            />
            <TitleAndSubTitle
              title="اجمالي المبالغ المدفوعه"
              subTitle={profile.data.customer.rides_amount}
            />
          </div>
        </div>

        <DataTable
          columns={columns}
          data={clientResponse.data}
          heading="سجل الشكاوى"
        />
      </div>
    </MainLayout>
  );
};

export default Page;
