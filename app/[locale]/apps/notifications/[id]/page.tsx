import MainLayout from "@/components/shared/MainLayout";
import BreadCrumb from "@/components/shared/BreadCrumb";
import { Flash, Rotate, Shapes, Trash } from "@/public/SVG";
import { Button } from "@/components/ui/button";
import GoBack from "@/components/shared/GoBack";
import { fetcher } from "@/lib/fetcher";
import { BrandResponse } from "@/lib/types/responseTypes";
import DeleteDialog from "@/components/Authorization/DeleteDialog";
import StatusCell from "@/components/shared/TableCellComponents/StatusCell";
import TitleAndSubTitle from "@/components/shared/TitleAndSubTitle";

const Page = async ({ params }: { params: { id: string } }) => {
  const data = await fetcher<BrandResponse>(`/brands/${params.id}`);
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
            label: "الإشعارات",
          },
          {
            icon: <Flash className="w-5 text-textSubTextDarker" />,
            label: "تفاصيل الإشعار",
          },
        ]}
      />
      <GoBack />
      <div className="flex flex-col gap-5 p-4 border border-gray200 rounded-12 bg-white">
        <div className="flex items-center justify-between flex-wrap gap-5">
          <h2 className="text-20 text-textMain font-[700]">تفاصيل الإشعار</h2>
          <div className=" flex items-center gap-4">
            <Button variant={"primary"} asChild>
              <div>
                إعادة إرسال
                <Rotate className="w-10 text-white" />
              </div>
            </Button>
            <DeleteDialog
              trigger={
                <button className=" bg-accentDangerLight px-4 py-1.5 rounded-6 text-accentDanger flex items-center justify-center gap-3">
                  حذف الإشعار
                  <Trash className="w-5 text-accentDanger" />
                </button>
              }
              id={data.data.brand.id}
              url="brands"
              title="هل أنت متأكد من حذف الإشعار؟"
              description="سيتم حذف هذا الإشعار نهائيًا ولن يظهر للمستخدمين بعد الآن.
هل تريد المتابعة؟"
              redirect="apps/notifications"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3  gap-5 border border-gray200 rounded-6 p-5">
          <TitleAndSubTitle
            title="العنوان بالعربية"
            subTitle={data.data.brand.name_ar}
          />
          <TitleAndSubTitle
            title="العنوان بالإنجليزية"
            subTitle={data.data.brand.name_en}
          />
          <div>
            <p className="text-gray600 text-16 font-[600] mb-2">الحالة</p>
            <StatusCell
              text={data.data.brand.is_active === 1 ? "مفعل" : "غير مفعل"}
              green={data.data.brand.is_active === 1 ? true : false}
            />
          </div>
          <TitleAndSubTitle
            title="المحتوى بالعربية"
            subTitle={data.data.brand.name_en}
          />
          <TitleAndSubTitle
            title="المحتوى بالإنجليزية"
            subTitle={data.data.brand.name_en}
          />
          <TitleAndSubTitle
            title="تاريخ الإرسال"
            subTitle={data.data.brand.name_en}
          />
          <TitleAndSubTitle
            title="نوع المستخدمين"
            subTitle={data.data.brand.name_en}
          />
          <TitleAndSubTitle
            title="التصنيفات"
            subTitle={data.data.brand.name_en}
          />
          <TitleAndSubTitle
            title="الأرقام التعريفية"
            subTitle={data.data.brand.name_en}
          />
        </div>
      </div>
    </MainLayout>
  );
};

export default Page;
