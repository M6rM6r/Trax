import MainLayout from "@/components/shared/MainLayout";
import BreadCrumb from "@/components/shared/BreadCrumb";
import { Driving, Edit2, Flash, Trash } from "@/public/SVG";
import { Button } from "@/components/ui/button";
import GoBack from "@/components/shared/GoBack";
import Link from "next/link";
import { fetcher } from "@/lib/fetcher";
import { ModelResponse } from "@/lib/types/responseTypes";
import DeleteDialog from "@/components/Authorization/DeleteDialog";
import StatusCell from "@/components/shared/TableCellComponents/StatusCell";
import TitleAndSubTitle from "@/components/shared/TitleAndSubTitle";

const Page = async ({ params }: { params: { id: string } }) => {
  const data = await fetcher<ModelResponse>(`/carModels/${params.id}`);
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
            label: "موديلات السيارة",
          },
          {
            icon: <Flash className="w-5 text-textSubTextDarker" />,
            label: "تفاصيل الموديل",
          },
        ]}
      />
      <GoBack />
      <div className="flex flex-col gap-5 p-4 border border-gray200 rounded-12 bg-white">
        <div className="flex items-center justify-between flex-wrap gap-5">
          <h2 className="text-20 text-textMain font-[700]">تفاصيل الموديل</h2>
          <div className=" flex items-center gap-4">
            <Button variant={"primary"} asChild>
              <Link href={`/ar/vehicles/models/${data.data.car_model.id}/edit`}>
                تعديل الموديل
                <Edit2 className="w-4 text-white" />
              </Link>
            </Button>
            <DeleteDialog
              trigger={
                <button className=" bg-accentDangerLight px-4 py-1.5 rounded-6 text-accentDanger flex items-center justify-center gap-3">
                  حذف الموديل
                  <Trash className="w-5 text-accentDanger" />
                </button>
              }
              id={data.data.car_model.id}
              url="carModels"
              title="هل أنت متأكد من حذف الموديل؟"
              description="سيؤدي حذفها إلى إزالة جميع الموديلات المرتبطة بها، مما قد يؤثر على البيانات المسجلة لدى المستخدمين والسائقين."
              redirect="vehicles/models"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5  gap-5 border border-gray200 rounded-6 p-5">
          <TitleAndSubTitle
            title="الاسم بالعربية"
            subTitle={data.data.car_model.name_ar}
          />
          <TitleAndSubTitle
            title="الاسم بالإنجليزية"
            subTitle={data.data.car_model.name_en}
          />
          <TitleAndSubTitle
            title="العلامة التجارية"
            subTitle={data.data.car_model.brand.name_ar}
          />
          <TitleAndSubTitle title="يكتب" subTitle={data.data.car_model.type} />
          <div>
            <p className="text-gray600 text-16 font-[600] mb-2">الحالة</p>
            <StatusCell
              text={data.data.car_model.is_active === 1 ? "مفعل" : "غير مفعل"}
              green={data.data.car_model.is_active === 1 ? true : false}
            />
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Page;
