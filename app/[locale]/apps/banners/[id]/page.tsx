import MainLayout from "@/components/shared/MainLayout";
import BreadCrumb from "@/components/shared/BreadCrumb";
import { Edit2, Flash, Shapes, Trash } from "@/public/SVG";
import { Button } from "@/components/ui/button";
import GoBack from "@/components/shared/GoBack";
import Link from "next/link";
import { fetcher } from "@/lib/fetcher";
import { BannerResponse } from "@/lib/types/responseTypes";
import DeleteDialog from "@/components/Authorization/DeleteDialog";
import StatusCell from "@/components/shared/TableCellComponents/StatusCell";
import TitleAndSubTitle from "@/components/shared/TitleAndSubTitle";
import TitleAndSubTitleWithFiles from "@/components/shared/TitleAndSubTitleWithFiles";

const Page = async ({ params }: { params: { id: string } }) => {
  const data = await fetcher<BannerResponse>(`/banners/${params.id}`, {
    cache: "no-store",
  });
  return (
    <MainLayout showSidebar={false}>
      <BreadCrumb
        labels={[
          {
            icon: <Shapes className="w-5 text-iconColor" />,
            label: "إدارة التطبيقات",
          },
          {
            icon: <Flash className="w-5 text-iconColor" />,
            label: "اللافتات",
          },
          {
            icon: <Flash className="w-5 text-textSubTextDarker" />,
            label: "تفاصيل اللافتة",
          },
        ]}
      />
      <GoBack />
      <div className="flex flex-col gap-5 p-4 border border-gray200 rounded-12 bg-white">
        <div className="flex items-center justify-between flex-wrap gap-5">
          <h2 className="text-20 text-textMain font-[700]">تفاصيل اللافتة</h2>
          <div className=" flex items-center gap-4">
            <Button variant={"primary"} asChild>
              <Link href={`/ar/apps/banners/${data.data.banner.id}/edit`}>
                تعديل اللافتة <Edit2 className="w-4 text-white" />
              </Link>
            </Button>
            <DeleteDialog
              trigger={
                <button className=" bg-accentDangerLight px-4 py-1.5 rounded-6 text-accentDanger flex items-center justify-center gap-3">
                  حذف اللافتة
                  <Trash className="w-5 text-accentDanger" />
                </button>
              }
              id={data.data.banner.id}
              url="banners"
              title="هل أنت متأكد من حذف اللافتة؟"
              description="سيتم حذف هذه اللافتة نهائيًا من التطبيق، ولن تكون مرئية للمستخدمين بعد الآن. هل ترغب في المتابعة؟"
              redirect="apps/banners"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3  gap-5 border border-gray200 rounded-6 p-5">
          <TitleAndSubTitle
            title="العنوان بالعربية"
            subTitle={data.data.banner.title_ar}
          />
          <TitleAndSubTitle
            title="العنوان بالإنجليزية"
            subTitle={data.data.banner.title_en}
          />
          <div>
            <p className="text-gray600 text-16 font-[600] mb-2">الحالة</p>
            <StatusCell
              text={data.data.banner.is_active === 1 ? "مفعل" : "غير مفعل"}
              green={data.data.banner.is_active === 1 ? true : false}
            />
          </div>
          <TitleAndSubTitle
            title="عنوان الهدف"
            subTitle={data.data.banner.target_url}
          />
          <TitleAndSubTitle title="الترتيب" subTitle={data.data.banner.order} />
          <TitleAndSubTitle
            title="نوع التطبيق"
            subTitle={data.data.banner.app}
          />
          <TitleAndSubTitleWithFiles
            title="اللافتة بالعربية"
            files={[
              {
                id: data.data.banner.id.toString(),
                name: data.data.banner.banner_ar,
              },
            ]}
          />
          <TitleAndSubTitleWithFiles
            title="اللافتة بالإنجليزية"
            files={[
              {
                id: data.data.banner.id.toString(),
                name: data.data.banner.banner_en,
              },
            ]}
          />
        </div>
      </div>
    </MainLayout>
  );
};

export default Page;
