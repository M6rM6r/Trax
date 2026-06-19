import MainLayout from "@/components/shared/MainLayout";
import BreadCrumb from "@/components/shared/BreadCrumb";
import { Edit2, Flash, ShieldTick, Trash } from "@/public/SVG";
import { Button } from "@/components/ui/button";
import GoBack from "@/components/shared/GoBack";
import Link from "next/link";
import { fetcher } from "@/lib/fetcher";
import { RuleResponse } from "@/lib/types/responseTypes";
import DeleteDialog from "@/components/Authorization/DeleteDialog";
import StatusCell from "@/components/shared/TableCellComponents/StatusCell";

const Page = async ({ params }: { params: { id: string } }) => {
  const data = await fetcher<RuleResponse>(`/rules/${params.id}`);
  return (
    <MainLayout showSidebar={false}>
      <BreadCrumb
        labels={[
          {
            icon: <ShieldTick className="w-5 text-iconColor" />,
            label: "السائقين",
          },
          {
            icon: <Flash className="w-5 text-iconColor" />,
            label: "قواعد السائقين",
          },
          {
            icon: <Flash className="w-5 text-textSubTextDarker" />,
            label: "تفاصيل القاعدة",
          },
        ]}
      />
      <GoBack />
      <div className="flex flex-col gap-5 p-4 border border-gray200 rounded-12 bg-white">
        <div className="flex items-center justify-between flex-wrap gap-5">
          <h2 className="text-20 text-textMain font-[700]">تفاصيل القاعدة</h2>
          <div className=" flex items-center gap-4">
            <Button variant={"primary"} asChild>
              <Link href={`/ar/drivers/rules/${data.data.rule.id}/edit`}>
                تعديل القاعدة <Edit2 className="w-4 text-white" />
              </Link>
            </Button>
            <DeleteDialog
              trigger={
                <button className=" bg-accentDangerLight px-4 py-1.5 rounded-6 text-accentDanger flex items-center justify-center gap-3">
                  حذف القاعدة
                  <Trash className="w-5 text-accentDanger" />
                </button>
              }
              id={data.data.rule.id}
              url="rules"
              title="هل أنت متأكد من حذف القاعدة؟"
              description="هل أنت متأكد من حذف هذه القاعدة؟ سيؤدي حذف القاعدة إلى إيقاف تطبيقها على النظام وقد يؤثر على أداء السائقين المرتبطين بها. هذا الإجراء نهائي ولا يمكن التراجع عنه."
              redirect="drivers/rules"
            />
          </div>
        </div>
        <div className="flex flex-col gap-5 border border-gray200 rounded-6 p-5 overflow-hidden">
          <p className="text-16 text-gray600 font-[600]">
            الاسم بالعربية:
            <span className="text-18 text-textMain font-[600] ms-2">
              {data.data.rule.title_ar}
            </span>
          </p>
          <p className="text-16 text-gray600 font-[600] ">
            الاسم بالإنجليزية:
            <span className="text-18 text-textMain font-[600] ms-2">
              {data.data.rule.title_en}
            </span>
          </p>
          <p className="text-16 text-gray600 font-[600] ">
            الوصف بالعربية:
            <span className="text-18 text-textMain font-[600] ms-2">
              {data.data.rule.description_ar}
            </span>
          </p>
          <p className="text-16 text-gray600 font-[600] ">
            الوصف بالإنجليزية:
            <span className="text-18 text-textMain font-[600] ms-2">
              {data.data.rule.description_en}
            </span>
          </p>
          <div className="text-16 text-gray600 font-[600] flex items-center gap-2">
            الحالة:
            <StatusCell
              text={data.data.rule.is_active ? "مفعل" : "غير مفعل"}
              green={Boolean(data.data.rule.is_active)}
            />
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Page;
