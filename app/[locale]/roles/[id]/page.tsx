import MainLayout from "@/components/shared/MainLayout";
import BreadCrumb from "@/components/shared/BreadCrumb";
import { Dot, Edit2, Flash, ShieldTick, Trash } from "@/public/SVG";
import { Button } from "@/components/ui/button";
import GoBack from "@/components/shared/GoBack";
import TitleAndSubTitle from "@/components/shared/TitleAndSubTitle";
import Link from "next/link";
import { fetcher } from "@/lib/fetcher";
import { RoleResponse } from "@/lib/types/responseTypes";
import { groupByGroupToArray } from "@/lib/helperFunctions";
import DeleteDialog from "@/components/Authorization/DeleteDialog";

const Page = async ({ params }: { params: { id: string } }) => {
  const data = await fetcher<RoleResponse>(`/roles/${params.id}`);
  const groupedPermissions = groupByGroupToArray(data.data.role.permissions);
  //

  return (
    <MainLayout showSidebar={false}>
      <BreadCrumb
        labels={[
          {
            icon: <ShieldTick className="w-5 text-iconColor" />,
            label: "صلاحيات المشرفين",
          },
          {
            icon: <Flash className="w-5 text-iconColor" />,
            label: "الأدوار",
          },
          {
            icon: <Flash className="w-5 text-textSubTextDarker" />,
            label: "صلاحيات الدور",
          },
        ]}
      />
      <GoBack />
      <div className="flex flex-col gap-5 p-4 border border-gray200 rounded-12 bg-white">
        <div className="flex items-center justify-between flex-wrap gap-5">
          <h2 className="text-20 text-textMain font-[700]">صلاحيات الدور</h2>
          <div className=" flex items-center gap-4">
            <Button variant={"primary"} asChild>
              <Link href={`/ar/roles/${data.data.role.id}/edit`}>
                تعديل الدور <Edit2 className="w-4 text-white" />
              </Link>
            </Button>
            <DeleteDialog
              trigger={
                <button className=" bg-accentDangerLight px-4 py-1.5 rounded-6 text-accentDanger flex items-center justify-center gap-3">
                  حذف الدور
                  <Trash className="w-5 text-accentDanger" />
                </button>
              }
              id={data.data.role.id}
              url="roles"
              title="هل أنت متأكد من حذف الدور؟"
              description="هل أنت متأكد أنك تريد حذف هذا الدور؟ حذف الدور سيزيل جميع الصلاحيات المعينة له وقد يؤثر على المستخدمين المرتبطين به. هذا الإجراء لا يمكن التراجع عنه."
              redirect="roles"
            />
          </div>
        </div>
        <div className="flex flex-col gap-5 ">
          <div className="grid grid-cols-1 md:grid-cols-2  gap-5 border border-gray200 rounded-6 p-5">
            <TitleAndSubTitle
              title="الاسم بالعربية"
              subTitle={data.data.role.title_ar}
            />
            <TitleAndSubTitle
              title="الاسم بالإنجليزية"
              subTitle={data.data.role.title_en}
            />
          </div>
          <h2 className="text-20 text-textMain font-[700]">الصلاحيات</h2>
          <div className=" grid grid-cols-1 md:grid-cols-2 gap-5">
            {groupedPermissions?.map((item, index) => (
              <div
                key={index}
                className=" flex flex-col gap-5 rounded-6 p-5 border border-gray200"
              >
                <p className="text-16 text-textMain font-[600]">
                  {item.group_ar}
                </p>
                {item?.items?.map((item2: any) => (
                  <div key={item2.id} className="flex items-center gap-3">
                    <Dot />
                    <label className="text-14 text-textMain font-[600]">
                      {item2.title}
                    </label>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Page;
