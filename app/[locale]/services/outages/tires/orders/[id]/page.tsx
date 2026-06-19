import MainLayout from "@/components/shared/MainLayout";
import BreadCrumb from "@/components/shared/BreadCrumb";
import { Danger, Flash, Star } from "@/public/SVG";
import { Button } from "@/components/ui/button";
import GoBack from "@/components/shared/GoBack";
import { Checkbox } from "@/components/ui/checkbox";
import TitleAndSubTitle from "@/components/shared/TitleAndSubTitle";
import { fetcher } from "@/lib/fetcher";
import UserInformation from "@/components/shared/UserInformation";
import { FuelOrderResponse } from "@/lib/types/responseTypes";
import Documents from "@/components/shared/Documents";
import RefuseRequstDialog from "@/components/shared/RefuseRequstDialog";
import { Badge } from "@/components/ui/badge";
import AcceptOrder from "@/components/Services/Fuel/AcceptOrder";
import AttachmentCard from "@/components/shared/AttachmentCard";
const Page = async ({ params }: { params: { id: string } }) => {
  const data = await fetcher<FuelOrderResponse>(
    `/services/tires/orders/${params.id}`
  );
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
          {data.data.message?.status === "جديد" ? (
            <div className="flex items-center gap-4">
              <AcceptOrder orderId={params.id} />
              <RefuseRequstDialog id={params.id} serviceName="tires" />
            </div>
          ) : data.data.message?.status === "مقبول" ? (
            <Badge variant={"success"}>مقبول</Badge>
          ) : (
            <Badge variant={"refused"}>مرفوض</Badge>
          )}
        </div>
        <UserInformation
          image={data.data.message?.driver?.profile_image}
          name={data.data.message?.driver?.name}
          gender={data.data.message?.driver?.gender}
          is_online={Boolean(data.data.message?.driver?.is_online)}
          created_at={data.data.message?.driver?.created_at}
          email={data.data.message?.driver?.email}
          countryCode={data.data.message?.driver?.country_code}
          mobile={data.data.message?.driver?.mobile}
          identity_number={data.data.message?.driver?.identity_number}
          date_of_birth={data.data.message?.driver?.date_of_birth}
          driving_license_number={
            data.data.message?.driver.driving_license_number
          }
          driving_license_type={data.data.message?.driver.driving_license_type}
          driving_license_expiration_date={
            data.data.message?.driver.driving_license_expiration_date
          }
        />
        <h2 className="text-20 text-textMain font-[700]">المستندات</h2>
        <Documents
          front_side_identity={data.data.message?.driver?.front_side_identity}
          front_side_license={data.data.message?.driver?.front_side_license}
          front_side_vehicle_form={
            data.data.message?.driver?.front_side_vehicle_form
          }
        />
        {!Array.isArray(data?.data?.message?.driver?.vehicle_data) && (
          <>
            <h2 className="text-20 text-textMain font-[700]">
              معلومات المركبة
            </h2>
            <div className=" grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="border border-gray200 rounded-6 p-3 grid grid-cols-1 md:grid-cols-4 gap-5">
                <TitleAndSubTitle
                  title="نوع المركبة"
                  subTitle={data.data.message?.driver?.vehicle_data?.brand}
                />
                <TitleAndSubTitle
                  title="طراز المركبة"
                  subTitle={data.data.message?.driver?.vehicle_data?.car_model}
                />
                {data.data.message?.driver?.vehicle_data?.vehicle_type ===
                "light_transportation" ? (
                  <TitleAndSubTitle
                    title="عدد الكبائن"
                    subTitle={
                      data.data.message?.driver?.vehicle_data
                        ?.light_transportation_type
                    }
                  />
                ) : (
                  <>
                    <TitleAndSubTitle
                      title="لون المركبة"
                      subTitle={
                        data.data.message?.driver?.vehicle_data?.color_name
                      }
                    />
                    <TitleAndSubTitle
                      title="عدد المقاعد"
                      subTitle={
                        data.data.message?.driver?.vehicle_data?.seats_number
                      }
                    />
                  </>
                )}
              </div>
              <div className="border border-gray200 rounded-6 p-3 grid grid-cols-1 md:grid-cols-4 gap-5">
                {data.data.message?.driver?.vehicle_data?.rules?.map(
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
            <div className=" grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="border border-gray200 rounded-6 p-3 grid grid-cols-1 md:grid-cols-3 gap-5">
                <TitleAndSubTitle
                  title="نوع اللوحة"
                  subTitle={data.data.message?.driver?.vehicle_data?.plate_type}
                />
                <TitleAndSubTitle
                  title="رقم التسلسل"
                  subTitle={
                    data.data.message?.driver?.vehicle_data?.sequence_number
                  }
                />
                <TitleAndSubTitle
                  title="رقم لوحة السيارة"
                  subTitle={
                    data.data.message?.driver?.vehicle_data?.plate_number
                  }
                />
              </div>
              <div className="border border-gray200 rounded-6 p-3 grid grid-cols-1 md:grid-cols-3 gap-5">
                <TitleAndSubTitle
                  title=" حرف اللوحة الأيمن"
                  subTitle={
                    data.data.message?.driver?.vehicle_data?.plate_letter_right
                  }
                />
                <TitleAndSubTitle
                  title="حرف اللوحة الأوسط"
                  subTitle={
                    data.data.message?.driver?.vehicle_data?.plate_letter_middle
                  }
                />
                <TitleAndSubTitle
                  title=" حرف اللوحة الأيسر"
                  subTitle={
                    data.data.message?.driver?.vehicle_data?.plate_letter_left
                  }
                />
              </div>
            </div>
          </>
        )}
      </div>
      <div className="border border-gray200 rounded-6 p-3 flex flex-col gap-5">
        <h2 className="text-20 text-textMain font-[700] ">المرفقات</h2>
        {data.data.message?.status === "مرفوض" && (
          <div className="border border-accentDanger bg-accentDangerLight rounded-6 p-3 flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <Danger />
              <p className=" text-20 text-accentDanger font-[600]">
                سبب الرفض:
              </p>
            </div>
            <ul className=" flex flex-col list-disc list-inside">
              {data.data.message?.tools?.map(
                (tool) =>
                  tool?.rejection_reason != null && (
                    <>
                      <li className="text-16 text-textMain font-[600]">
                        {tool.tool?.title_ar}
                      </li>
                      <li className="text-16 text-textMain font-[600]">
                        <span className="text-textSubTextDarker">ملحوظات:</span>
                        {tool?.rejection_reason}
                      </li>
                    </>
                  )
              )}
            </ul>
          </div>
        )}
        <div className=" grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.data.message?.tools?.map((tool: any, index: number) => (
            <AttachmentCard
              key={index}
              title={tool?.tool?.title_ar || "مرفق"}
              image={tool?.image || ""}
              rejectionReason={tool?.rejection_reason}
            />
          ))}
        </div>
      </div>
    </MainLayout>
  );
};

export default Page;
