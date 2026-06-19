import MainLayout from "@/components/shared/MainLayout";
import BreadCrumb from "@/components/shared/BreadCrumb";
import { Dot, Edit2, Flash, ShieldTick, Trash } from "@/public/SVG";
import { Button } from "@/components/ui/button";
import GoBack from "@/components/shared/GoBack";
import TitleAndSubTitle from "@/components/shared/TitleAndSubTitle";
import Link from "next/link";
import { fetcher } from "@/lib/fetcher";
import { UserResponse } from "@/lib/types/responseTypes";
import { groupByGroupToArray } from "@/lib/helperFunctions";
import DeleteDialog from "@/components/Authorization/DeleteDialog";

const Page = async ({ params }: { params: { id: string } }) => {
  const data = await fetcher<UserResponse>(`/users/${params.id}`);
  const groupedPermissions = groupByGroupToArray(data.data.user.permissions);
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
            label: "المشرفين",
          },
          {
            icon: <Flash className="w-5 text-textSubTextDarker" />,
            label: "معلومات المشرف",
          },
        ]}
      />
      <GoBack />
      <div className="flex flex-col gap-5 p-4 border border-gray200 rounded-12 bg-white">
        <div className="flex items-center justify-between flex-wrap gap-5">
          <h2 className="text-20 text-textMain font-[700]">معلومات المشرف</h2>
          <div className=" flex items-center gap-4">
            <Button variant={"primary"} asChild>
              <Link href={`/ar/moderators/${data.data.user.id}/edit`}>
                تعديل المشرف <Edit2 className="w-4 text-white" />
              </Link>
            </Button>
            <DeleteDialog
              trigger={
                <button className=" bg-accentDangerLight px-4 py-1.5 rounded-6 text-accentDanger flex items-center justify-center gap-3">
                  حذف المستخدم
                  <Trash className="w-5 text-accentDanger" />
                </button>
              }
              id={data.data.user.id}
              url="users"
              title="هل أنت متأكد من حذف المستخدم؟"
              description="أنت على وشك حذف هذا المستخدم من النظام. هذا الإجراء لا يمكن التراجع عنه، وستفقد جميع البيانات المرتبطة بهذا المستخدم بشكل دائم."
              redirect="moderators"
            />
          </div>
        </div>
        <div className="flex flex-col gap-5 ">
          <p className="text-16 text-textMain font-[600]">بيانات المستخدم</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 border border-gray200 rounded-6 p-5">
            <TitleAndSubTitle title="الاسم" subTitle={data.data.user.name} />
            <TitleAndSubTitle
              title="البريد الإلكتروني"
              subTitle={data.data.user.email}
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
