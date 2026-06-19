import MainLayout from "@/components/shared/MainLayout";
import BreadCrumb from "@/components/shared/BreadCrumb";
import { Flash, Shapes } from "@/public/SVG";
import GoBack from "@/components/shared/GoBack";
import { fetcher } from "@/lib/fetcher";
import { LogResponse } from "@/lib/types/responseTypes";
import TitleAndSubTitle from "@/components/shared/TitleAndSubTitle";

const Page = async ({ params }: { params: { id: string } }) => {
  const data = await fetcher<LogResponse>(`/activityLogs/${params.id}`);
  return (
    <MainLayout showSidebar={false}>
      <BreadCrumb
        labels={[
          {
            icon: <Shapes className="w-5 text-iconColor" />,
            label: "إدارة التطبيقات",
          },
          {
            icon: <Flash className="w-5 text-iconColor" />,
            label: "سجلات النشاط",
          },
          {
            icon: <Flash className="w-5 text-textSubTextDarker" />,
            label: "تفاصيل السجل",
          },
        ]}
      />
      <GoBack />
      <div className="flex flex-col gap-5 p-4 border border-gray200 rounded-12 bg-white">
        <div className="flex items-center justify-between flex-wrap gap-5">
          <h2 className="text-20 text-textMain font-[700]">تفاصيل السجل</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3  gap-5 border border-gray200 rounded-6 p-5">
          <TitleAndSubTitle title="#" subTitle={data.data.activity_log.id} />
          <TitleAndSubTitle
            title="اسم المسار"
            subTitle={data.data.activity_log.route_name}
          />
          <TitleAndSubTitle
            title="الرابط"
            subTitle={data.data.activity_log.url}
          />
          {/* <TitleAndSubTitle
            title="الطريقة"
            subTitle={
              data.data.activity_log.method == "PUT"
                ? "تعديل"
                : data.data.activity_log.method == "DELETE"
                ? "حذف"
                : "اضافة"
            }
          /> */}
          <TitleAndSubTitle
            title="نوع الإجراء"
            subTitle={
              data.data.activity_log.method == "PUT"
                ? "تعديل"
                : data.data.activity_log.method == "DELETE"
                ? "حذف"
                : "اضافة"
            }
          />
          <TitleAndSubTitle
            title="تم بواسطة"
            subTitle={data.data.activity_log.user_name}
          />
          <TitleAndSubTitle
            title="تاريخ الإنشاء"
            subTitle={data.data.activity_log.created_at}
          />
          {/* <TitleAndSubTitle
            title="النموذج"
            subTitle={data.data.activity_log.name_en}
          /> */}
          {/* <TitleAndSubTitle
            title="التغييرات"
            subTitle={data.data.activity_log.name_en}
          /> */}
          <TitleAndSubTitle
            title="عنوان Ip"
            subTitle={data.data.activity_log.ip}
          />
          {/* <TitleAndSubTitle
            title="وكيل المستخدم"
            subTitle={data.data.activity_log.name_en}
          /> */}
        </div>
      </div>
    </MainLayout>
  );
};

export default Page;
