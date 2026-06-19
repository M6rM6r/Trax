import MainLayout from "@/components/shared/MainLayout";
import BreadCrumb from "@/components/shared/BreadCrumb";
import { Flash, ShieldTick, Trash } from "@/public/SVG";
import GoBack from "@/components/shared/GoBack";
import { fetcher } from "@/lib/fetcher";
import DeleteDialog from "@/components/Authorization/DeleteDialog";
import TitleAndSubTitle from "@/components/shared/TitleAndSubTitle";
import StatusCell from "@/components/shared/TableCellComponents/StatusCell";

const Page = async ({ params }: { params: { locale: string; id: string } }) => {
  const data = await fetcher<any>(`/colors/${params.id}`);
  // 
  return (
    <MainLayout showSidebar={false}>
      <BreadCrumb
        labels={[
          {
            icon: <ShieldTick className="w-5 text-iconColor" />,
            label: "الصلاحيات",
          },
          {
            icon: <Flash className="w-5 text-iconColor" />,
            label: "إدارة فرق الشكاوى",
          },
          {
            icon: <Flash className="w-5 text-textSubTextDarker" />,
            label: "أعضاء الفريق",
          },
        ]}
      />
      <GoBack />
      <div className="flex flex-col gap-5 p-4 border border-gray200 rounded-12 bg-white">
        <div className="flex items-center justify-between flex-wrap gap-5">
          <h2 className="text-20 text-textMain font-[700]">معلومات العضو</h2>
          <DeleteDialog
            trigger={
              <button className=" bg-accentDangerLight px-4 py-1.5 rounded-6 text-accentDanger flex items-center justify-center gap-3">
                حذف المستخدم
                <Trash className="w-5 text-accentDanger" />
              </button>
            }
            id={data.data.color.id}
            url="colors"
            title="هل أنت متأكد من حذف الفريق؟"
            description="سيتم حذف هذا الفريق بشكل نهائي من النظام.
لن يكون بمقدورك استرجاع بياناته أو استخدامه في تعيين المهام."
            redirect="vehicles/colors"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2  gap-5 border border-gray200 rounded-6 p-5">
          <TitleAndSubTitle title="الاسم" subTitle={data.data.color.name_ar} />
          <TitleAndSubTitle
            title="البريد الإلكتروني"
            subTitle={data.data.color.name_en}
          />
          <TitleAndSubTitle title="الدور" subTitle={data.data.color.name_en} />
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
