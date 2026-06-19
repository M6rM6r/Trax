import MainLayout from "@/components/shared/MainLayout";
import BreadCrumb from "@/components/shared/BreadCrumb";
import { Edit2, Flash, ShieldTick, Trash } from "@/public/SVG";
import { Button } from "@/components/ui/button";
import GoBack from "@/components/shared/GoBack";
import Link from "next/link";
import { fetcher } from "@/lib/fetcher";
import { LabelResponse } from "@/lib/types/responseTypes";
import DeleteDialog from "@/components/Authorization/DeleteDialog";
import StatusCell from "@/components/shared/TableCellComponents/StatusCell";
import TitleAndSubTitle from "@/components/shared/TitleAndSubTitle";
import ShowDescription from "@/components/shared/ShowDescription";

const Page = async ({ params }: { params: { id: string } }) => {
  const data = await fetcher<LabelResponse>(`/labels/${params.id}`);

  return (
    <MainLayout showSidebar={false}>
      <BreadCrumb
        labels={[
          {
            icon: <ShieldTick className="w-5 text-iconColor" />,
            label: "الصلاحيات",
          },
          {
            icon: <Flash className="w-5 text-textSubTextDarker" />,
            label: "التصنيفات",
          },
          {
            icon: <Flash className="w-5 text-textSubTextDarker" />,
            label: "تفاصيل التصنيف",
          },
        ]}
      />
      <GoBack />
      <div className="flex flex-col gap-5 p-4 border border-gray200 rounded-12 bg-white">
        <div className="flex items-center justify-between flex-wrap gap-5">
          <h2 className="text-20 text-textMain font-[700]">تفاصيل التصنيف</h2>
          <div className=" flex items-center gap-4">
            <Button variant={"primary"} asChild>
              <Link href={`/ar/categories/${data.data.label.id}/edit`}>
                تعديل التصنيف <Edit2 className="w-4 text-white" />
              </Link>
            </Button>
            <DeleteDialog
              trigger={
                <button className=" bg-accentDangerLight px-4 py-1.5 rounded-6 text-accentDanger flex items-center justify-center gap-3">
                  حذف التصنيف
                  <Trash className="w-5 text-accentDanger" />
                </button>
              }
              id={data.data.label.id}
              url="labels"
              title="هل أنت متأكد من حذف التصنيف؟"
              description="سيتم حذف هذا التصنيف نهائيًا من النظام، ولا يمكن التراجع عن هذا الإجراء."
              redirect="categories"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4  gap-5 border border-gray200 rounded-6 p-5">
          <TitleAndSubTitle
            title="الاسم بالعربية"
            subTitle={data.data.label.title_ar}
          />
          <TitleAndSubTitle
            title="الاسم بالإنجليزية"
            subTitle={data.data.label.title_en}
          />
          <div>
            <p className="text-gray600 text-16 font-[600] mb-2">اللون</p>
            <div
              className="h-4 w-4 shadow rounded-1 "
              style={{ backgroundColor: data.data.label.color }}
            ></div>
          </div>
          <div>
            <p className="text-gray600 text-16 font-[600] mb-2">الحالة</p>
            <StatusCell
              text={data.data.label.is_active ? "مفعل" : "غير مفعل"}
              green={data.data.label.is_active ? true : false}
            />
          </div>
        </div>
        <ShowDescription
          title="الوصف بالعربية"
          subTitle={data.data.label.description_ar}
        />
        <ShowDescription
          title="الوصف بالإنجليزية"
          subTitle={data.data.label.description_en}
        />
      </div>
    </MainLayout>
  );
};

export default Page;
