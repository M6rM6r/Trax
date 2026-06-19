import MainLayout from "@/components/shared/MainLayout";
import BreadCrumb from "@/components/shared/BreadCrumb";
import { Driving, Edit2, Flash, Trash } from "@/public/SVG";
import { Button } from "@/components/ui/button";
import GoBack from "@/components/shared/GoBack";
import Link from "next/link";
import { fetcher } from "@/lib/fetcher";
import { ColorResponse } from "@/lib/types/responseTypes";
import DeleteDialog from "@/components/Authorization/DeleteDialog";
import StatusCell from "@/components/shared/TableCellComponents/StatusCell";
import TitleAndSubTitle from "@/components/shared/TitleAndSubTitle";

const Page = async ({ params }: { params: { id: string } }) => {
  const data = await fetcher<ColorResponse>(`/colors/${params.id}`);
  //
  return (
    <MainLayout showSidebar={false}>
      <BreadCrumb
        labels={[
          {
            icon: <Driving className="w-5 text-iconColor" />,
            label: "بيانات المركبات",
          },
          {
            icon: <Flash className="w-5 text-iconColor" />,
            label: "الألوان",
          },
          {
            icon: <Flash className="w-5 text-textSubTextDarker" />,
            label: "تفاصيل اللون",
          },
        ]}
      />
      <GoBack />
      <div className="flex flex-col gap-5 p-4 border border-gray200 rounded-12 bg-white">
        <div className="flex items-center justify-between flex-wrap gap-5">
          <h2 className="text-20 text-textMain font-[700]">تفاصيل اللون</h2>
          <div className=" flex items-center gap-4">
            <Button variant={"primary"} asChild>
              <Link href={`/ar/vehicles/colors/${data.data.color.id}/edit`}>
                تعديل اللون <Edit2 className="w-4 text-white" />
              </Link>
            </Button>
            <DeleteDialog
              trigger={
                <button className=" bg-accentDangerLight px-4 py-1.5 rounded-6 text-accentDanger flex items-center justify-center gap-3">
                  حذف اللون
                  <Trash className="w-5 text-accentDanger" />
                </button>
              }
              id={data.data.color.id}
              url="colors"
              title="هل أنت متأكد من حذف اللون؟"
              description="سيتم حذف اللون من قائمة الاختيارات ولن يكون متاحًا للاستخدام.
هذا الإجراء لا يمكن التراجع عنه بعد التأكيد."
              redirect="vehicles/colors"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4  gap-5 border border-gray200 rounded-6 p-5">
          <TitleAndSubTitle
            title="الاسم بالعربية"
            subTitle={data.data.color.name_ar}
          />
          <TitleAndSubTitle
            title="الاسم بالإنجليزية"
            subTitle={data.data.color.name_en}
          />
          <div>
            <p className="text-gray600 text-16 font-[600] mb-2">اللون</p>
            <div
              className="h-4 w-4 shadow rounded-1 "
              style={{ backgroundColor: data.data.color.hex }}
            ></div>
          </div>
          <div>
            <p className="text-gray600 text-16 font-[600] mb-2">الحالة</p>
            <StatusCell
              text={data.data.color.is_active ? "مفعل" : "غير مفعل"}
              green={data.data.color.is_active ? true : false}
            />
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Page;
