import MainLayout from "@/components/shared/MainLayout";
import BreadCrumb from "@/components/shared/BreadCrumb";
import { EyeWhite, Flash, Star, User } from "@/public/SVG";
import { Button } from "@/components/ui/button";
import GoBack from "@/components/shared/GoBack";
import TitleAndSubTitle from "@/components/shared/TitleAndSubTitle";
import { fetcher } from "@/lib/fetcher";
import { CustomerProfileResponse } from "@/lib/types/responseTypes";
import WalletTable from "@/components/shared/WalletTable";
import AvatarWithName from "@/components/shared/TableCellComponents/AvatarWithName";
import { convertDateFormat } from "@/lib/helperFunctions";
import EditCustomer from "@/components/Customers/EditCustomer";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
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
      <div className="flex flex-col gap-5 p-4 border border-gray200 rounded-12 bg-white">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-5">
            <h2 className="text-xl font-semibold text-gray-900">
              معلومات المستخدم
            </h2>

            <div className="flex items-center gap-3">
              <Button variant="primary" asChild>
                <Link href={`/ar/customers/${params.id}`}>
                  <span>عرض رحلات العميل</span>
                  <EyeWhite />
                </Link>
              </Button>

              <EditCustomer profileData={profile.data.customer} />
            </div>
          </div>

          {/* Cards Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1 — Profile */}
            <Card className="border border-gray-200 bg-white rounded-2xl shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <AvatarWithName
                    image={profile.data.customer.profile_image}
                    name={profile.data.customer.name}
                    gender={
                      profile.data.customer.gender === "male" ? "ذكر" : "انثى"
                    }
                    online={false}
                  />
                </div>

                <div className="mt-4">
                  <TitleAndSubTitle
                    title="تاريخ الإنضمام"
                    subTitle={convertDateFormat(
                      profile.data.customer.created_at
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Card 2 — Contact Info */}
            <Card className="border border-gray-200 bg-white rounded-2xl shadow-sm">
              <CardContent className="p-6 grid grid-cols-1 gap-6">
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
              </CardContent>
            </Card>

            {/* Card 3 — Rides Info */}
            <Card className="border border-gray-200 bg-white rounded-2xl shadow-sm">
              <CardContent className="p-6 grid grid-cols-1 gap-6">
                <TitleAndSubTitle
                  title="عدد الرحلات اللي تمت"
                  subTitle={profile.data.customer.rides_count}
                />

                <TitleAndSubTitle
                  title="اجمالي المبالغ المدفوعه"
                  subTitle={profile.data.customer.rides_amount}
                />
              </CardContent>
            </Card>
          </div>
        </div>

        <WalletTable wallet={profile.data.customer.wallet} />
      </div>
    </MainLayout>
  );
};

export default Page;
