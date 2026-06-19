import MainLayout from "@/components/shared/MainLayout";
import BreadCrumb from "@/components/shared/BreadCrumb";
import { Complaints, Edit2, Flash } from "@/public/SVG";
import { Button } from "@/components/ui/button";
import GoBack from "@/components/shared/GoBack";
import Link from "next/link";
import { fetcher } from "@/lib/fetcher";
import { ActionResponse } from "@/lib/types/responseTypes";
import StatusCell from "@/components/shared/TableCellComponents/StatusCell";
import TitleAndSubTitle from "@/components/shared/TitleAndSubTitle";

const Page = async ({ params }: { params: { id: string } }) => {
  const data = await fetcher<ActionResponse>(
    `/disciplinaryAction/${params.id}`
  );

  return (
    <MainLayout showSidebar={false}>
      <BreadCrumb
        labels={[
          {
            icon: <Complaints className="w-5 text-iconColor" />,
            label: "إدارة الشكاوى",
          },
          {
            icon: <Flash className="w-5 text-iconColor" />,
            label: "إدراة الإجراءات",
          },
          {
            icon: <Flash className="w-5 text-textSubTextDarker" />,
            label: "تفاصيل الاجراء",
          },
        ]}
      />
      <GoBack />
      <div className="flex flex-col gap-5 p-4 border border-gray200 rounded-12 bg-white">
        <div className="flex items-center justify-between flex-wrap gap-5">
          <h2 className="text-20 text-textMain font-[700]">تفاصيل الإجراء</h2>
          <div className=" flex items-center gap-4">
            <Button variant={"primary"} asChild>
              <Link
                href={`/ar/complaintsManagement/actions/${data.data.disciplinary_action.id}/edit`}
              >
                تعديل الإجراء <Edit2 className="w-4 text-white" />
              </Link>
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3  gap-5 border border-gray200 rounded-6 p-5">
          <TitleAndSubTitle
            title="العنوان بالعربية"
            subTitle={data.data.disciplinary_action.name_ar}
          />
          <TitleAndSubTitle
            title="الاسم بالإنجليزية"
            subTitle={data.data.disciplinary_action.name_en}
          />
          <div>
            <p className="text-gray600 text-16 font-[600] mb-2">الحالة</p>
            <StatusCell
              text={
                data.data.disciplinary_action.is_active === 1
                  ? "مفعل"
                  : "غير مفعل"
              }
              green={
                data.data.disciplinary_action.is_active === 1 ? true : false
              }
            />
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Page;
