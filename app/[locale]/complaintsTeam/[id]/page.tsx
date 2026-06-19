import MainLayout from "@/components/shared/MainLayout";
import BreadCrumb from "@/components/shared/BreadCrumb";
import { Edit2, Flash, ShieldTick, Trash } from "@/public/SVG";
import { Button } from "@/components/ui/button";
import GoBack from "@/components/shared/GoBack";
import Link from "next/link";
import { fetcher } from "@/lib/fetcher";
import { DataTable } from "@/components/shared/DataTable/data-table";
import { columns, TeamPerson } from "./columns";
import DeleteDialog from "@/components/Authorization/DeleteDialog";
import TitleAndSubTitle from "@/components/shared/TitleAndSubTitle";
import StatusCell from "@/components/shared/TableCellComponents/StatusCell";
import { TeamResponse } from "@/lib/types/responseTypes";

const Page = async ({ params }: { params: { locale: string; id: string } }) => {
  const data = await fetcher<TeamResponse>(`/teams/${params.id}`);
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
          <h2 className="text-20 text-textMain font-[700]">تفاصيل الفريق</h2>
          <div className=" flex items-center gap-4">
            <Button variant={"primaryLight"} asChild>
              <Link href={`/ar/complaintsTeam/${data.data.team.id}/edit`}>
                تعديل الفريق <Edit2 className="w-4 text-primaryColor" />
              </Link>
            </Button>
            <DeleteDialog
              trigger={
                <button className=" bg-accentDangerLight px-4 py-1.5 rounded-6 text-accentDanger flex items-center justify-center gap-3">
                  حذف الفريق
                  <Trash className="w-5 text-accentDanger" />
                </button>
              }
              id={data.data.team.id}
              url="teams"
              title="هل أنت متأكد من حذف الفريق؟"
              description="سيتم حذف هذا الفريق بشكل نهائي من النظام.
لن يكون بمقدورك استرجاع بياناته أو استخدامه في تعيين المهام."
              redirect="complaintsTeam"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3  gap-5 border border-gray200 rounded-6 p-5">
          <TitleAndSubTitle
            title="الاسم بالعربية"
            subTitle={data.data.team.title_ar}
          />
          <TitleAndSubTitle
            title="الاسم بالإنجليزية"
            subTitle={data.data.team.title_en}
          />
          <div>
            <p className="text-gray600 text-16 font-[600] mb-2">الحالة</p>
            <StatusCell
              text={data.data.team.is_active ? "مفعل" : "غير مفعل"}
              green={data.data.team.is_active ? true : false}
            />
          </div>
          <TitleAndSubTitle
            title="الربط بتصنيف شكوى"
            subTitle={data?.data?.team?.categories
              .map((item) => item?.title_ar)
              .join(", ")}
          />
          <TitleAndSubTitle
            title="مدير الفريق"
            subTitle={data?.data?.team?.manager?.name}
          />
        </div>
        <DataTable<TeamPerson, unknown>
          columns={columns}
          data={[
            ...(data.data.team?.manager
              ? [{ ...data.data.team.manager, is_manager: 1 }]
              : []),
            ...(data.data.team?.members?.map((m) => ({
              ...m,
              is_manager: 0,
            })) ?? []),
          ]}
          heading={`أعضاء الفريق (${data.data.team.members.length} اعضاء)`}
        />
      </div>
    </MainLayout>
  );
};

export default Page;
