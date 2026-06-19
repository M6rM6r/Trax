import MainLayout from "@/components/shared/MainLayout";
import BreadCrumb from "@/components/shared/BreadCrumb";
import { Danger, Flash, Star } from "@/public/SVG";
import { Button } from "@/components/ui/button";
import GoBack from "@/components/shared/GoBack";
import { Checkbox } from "@/components/ui/checkbox";
import TitleAndSubTitle from "@/components/shared/TitleAndSubTitle";
import { fetcher } from "@/lib/fetcher";
import UserInformation from "@/components/shared/UserInformation";
import { DriverProfileResponse } from "@/lib/types/responseTypes";
import Documents from "@/components/shared/Documents";
import Image from "next/image";
import tool1 from "@/public/images/tool1.png";
import tool2 from "@/public/images/tool2.png";
import RefuseRequstDialog from "@/components/shared/RefuseRequstDialog";
const Page = async ({ params }: { params: { id: string } }) => {
  const profile = await fetcher<DriverProfileResponse>(`/drivers/${params.id}`);
  return (
    <MainLayout showSidebar={false}>
      <BreadCrumb
        labels={[
          {
            icon: <Star className="w-5 text-iconColor" />,
            label: "الخدمات",
          },
          {
            icon: <Flash className="w-5 text-iconColor" />,
            label: "الإطارات",
          },
          {
            icon: <Flash className="w-5 text-iconColor" />,
            label: "تفاصيل الطلب",
          },
        ]}
      />
      <GoBack />
      <div className="flex flex-col gap-5 p-4 border border-gray200 rounded-12 bg-white">
        <div className="flex items-center justify-between flex-wrap gap-5">
          <h2 className="text-20 text-textMain font-[700]">تفاصيل الطلب</h2>
          <div className="flex items-center gap-4">
            <Button variant={"success"}>قبول الطلب</Button>
            <RefuseRequstDialog id={params.id} />
          </div>
        </div>
        <UserInformation
          image={profile.data.driver.profile_image}
          name={profile.data.driver.name}
          gender={profile.data.driver.gender}
          is_online={Boolean(profile.data.driver.is_online)}
          created_at={profile.data.driver.created_at}
          email={profile.data.driver.email}
          countryCode={profile.data.driver.country_code}
          mobile={profile.data.driver.mobile}
          identity_number={profile.data.driver.identity_number}
          date_of_birth={profile.data.driver.date_of_birth}
          driving_license_number={profile.data.driver.driving_license_number}
          driving_license_type={profile.data.driver.driving_license_type}
          driving_license_expiration_date={
            profile.data.driver.driving_license_expiration_date
          }
        />
        <h2 className="text-20 text-textMain font-[700]">المستندات</h2>
        <Documents
          front_side_identity={profile.data.driver.front_side_identity}
          front_side_license={profile.data.driver.front_side_license}
          front_side_vehicle_form={profile.data.driver.front_side_vehicle_form}
        />
        <h2 className="text-20 text-textMain font-[700]">معلومات المركبة</h2>
        <div className=" grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="border border-gray200 rounded-6 p-3 grid grid-cols-1 md:grid-cols-4 gap-5">
            <TitleAndSubTitle
              title="نوع المركبة"
              subTitle={profile.data.driver.vehicle_data.brand}
            />
            <TitleAndSubTitle
              title="طراز المركبة"
              subTitle={profile.data.driver.vehicle_data.car_model}
            />
            <TitleAndSubTitle
              title="لون المركبة"
              subTitle={profile.data.driver.vehicle_data.color_name}
            />
            <TitleAndSubTitle
              title="عدد المقاعد"
              subTitle={profile.data.driver.vehicle_data.seats_number}
            />
          </div>
          <div className="border border-gray200 rounded-6 p-3 grid grid-cols-1 md:grid-cols-4 gap-5">
            {profile.data.driver.vehicle_data.rules?.map(
              (rule: any, index: number) => (
                <div
                  key={index}
                  className=" flex flex-col gap-2 items-center justify-center"
                >
                  <Checkbox checked={rule?.is_assigned} />
                  <p className="text-14 text-center text-textMain font-[600]">
                    {rule.title}
                  </p>
                </div>
              )
            )}
          </div>
        </div>
        <h2 className="text-20 text-textMain font-[700]">معلومات الخدمة</h2>
        <div className=" grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="border border-gray200 rounded-6 p-3 grid grid-cols-1 md:grid-cols-3 gap-5">
            <TitleAndSubTitle
              title="نوع اللوحة"
              subTitle={profile.data.driver.vehicle_data.plate_type}
            />
            <TitleAndSubTitle
              title="رقم التسلسل"
              subTitle={profile.data.driver.vehicle_data.sequence_number}
            />
            <TitleAndSubTitle
              title="رقم لوحة السيارة"
              subTitle={profile.data.driver.vehicle_data.plate_number}
            />
          </div>
          <div className="border border-gray200 rounded-6 p-3 grid grid-cols-1 md:grid-cols-3 gap-5">
            <TitleAndSubTitle
              title=" حرف اللوحة الأيمن"
              subTitle={profile.data.driver.vehicle_data.plate_letter_right}
            />
            <TitleAndSubTitle
              title="حرف اللوحة الأوسط"
              subTitle={profile.data.driver.vehicle_data.plate_letter_middle}
            />
            <TitleAndSubTitle
              title=" حرف اللوحة الأيسر"
              subTitle={profile.data.driver.vehicle_data.plate_letter_left}
            />
          </div>
        </div>
      </div>
      <div className="border border-gray200 rounded-6 p-3 flex flex-col gap-5">
        <h2 className="text-20 text-textMain font-[700] ">المرفقات</h2>
        <div className="border border-accentDanger bg-accentDangerLight rounded-6 p-3 flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <Danger />
            <p className=" text-20 text-accentDanger font-[600]">سبب الرفض:</p>
          </div>
          <ul className=" flex flex-col list-disc list-inside">
            <li className="text-16 text-textMain font-[600]">
              أدوات لرفع الإطار مع قفازات مخصصة
            </li>
            <li className="text-16 text-textMain font-[600]">
              <span className="text-textSubTextDarker">ملحوظات: </span> لا يوجد
              قفازات
            </li>
          </ul>
        </div>
        <div className=" grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div className="border border-gray200 rounded-6 p-3">
            <p className="text-textMain text-16 font-[600] mb-3">
              أدوات لرفع الإطار مع قفازات مخصصة
            </p>
            <Image
              src={tool1}
              width={200}
              height={200}
              alt="tool1"
              className="w-[200px] h-[200px] object-contain"
            />
          </div>
          <div className="border border-gray200 rounded-6 p-3">
            <p className="text-textMain text-16 font-[600] mb-3">
              عدة كهربائية
            </p>
            <Image
              src={tool2}
              width={200}
              height={200}
              alt="tool2"
              className="w-[200px] h-[200px] object-contain"
            />
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Page;
