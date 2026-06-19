import MainLayout from "@/components/shared/MainLayout";
import BreadCrumb from "@/components/shared/BreadCrumb";
import { Driving, Edit2, Flash, Trash } from "@/public/SVG";
import { Button } from "@/components/ui/button";
import GoBack from "@/components/shared/GoBack";
import Link from "next/link";
import { fetcher } from "@/lib/fetcher";
import { UnitResponse } from "@/lib/types/responseTypes";
import DeleteDialog from "@/components/Authorization/DeleteDialog";
import StatusCell from "@/components/shared/TableCellComponents/StatusCell";
import TitleAndSubTitle from "@/components/shared/TitleAndSubTitle";

const Page = async ({ params }: { params: { id: string } }) => {
  const data = await fetcher<UnitResponse>(`/fontasUnits/${params.id}`);
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
            label: "وحدات الفونتاس",
          },
          {
            icon: <Flash className="w-5 text-textSubTextDarker" />,
            label: "تفاصيل وحدات الفونتاس",
          },
        ]}
      />
      <GoBack />
      <div className="flex flex-col gap-5 p-4 border border-gray200 rounded-12 bg-white">
        <div className="flex items-center justify-between flex-wrap gap-5">
          <h2 className="text-20 text-textMain font-[700]">
            تفاصيل وحدات الفونتاس
          </h2>
          <div className=" flex items-center gap-4">
            <Button variant={"primary"} asChild>
              <Link
                href={`/ar/vehicles/units/${data.data.fontas_unit.id}/edit`}
              >
                تعديل الوحدة
                <Edit2 className="w-4 text-white" />
              </Link>
            </Button>
            <DeleteDialog
              trigger={
                <button className=" bg-accentDangerLight px-4 py-1.5 rounded-6 text-accentDanger flex items-center justify-center gap-3">
                  حذف الوحدة
                  <Trash className="w-5 text-accentDanger" />
                </button>
              }
              id={data.data.fontas_unit.id}
              url="fontasUnits"
              title="هل أنت متأكد من حذف وحدة الفونتاس؟"
              description="سيؤدي ذلك إلى إزالة جميع المهام والمحتوى المرتبط بها.
لا يمكن التراجع عن هذا الإجراء بعد تأكيد الحذف."
              redirect="vehicles/units"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4  gap-5 border border-gray200 rounded-6 p-5">
          <TitleAndSubTitle
            title="النوع"
            subTitle={data.data.fontas_unit.type}
          />
          <TitleAndSubTitle
            title="وحدة"
            subTitle={data.data.fontas_unit.unit}
          />
          <TitleAndSubTitle
            title="القيمة"
            subTitle={data.data.fontas_unit.value}
          />
          <div>
            <p className="text-gray600 text-16 font-[600] mb-2">الحالة</p>
            <StatusCell
              text={data.data.fontas_unit.is_active ? "مفعل" : "غير مفعل"}
              green={data.data.fontas_unit.is_active ? true : false}
            />
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Page;
