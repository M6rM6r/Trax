import MainLayout from "@/components/shared/MainLayout";
import BreadCrumb from "@/components/shared/BreadCrumb";
import { Edit2, Flash, Shapes, Trash } from "@/public/SVG";
import { Button } from "@/components/ui/button";
import GoBack from "@/components/shared/GoBack";
import Link from "next/link";
import { fetcher } from "@/lib/fetcher";
import { PageResponse } from "@/lib/types/responseTypes";
import DeleteDialog from "@/components/Authorization/DeleteDialog";
import StatusCell from "@/components/shared/TableCellComponents/StatusCell";
import TitleAndSubTitle from "@/components/shared/TitleAndSubTitle";
import TitleAndSubTitleWithFiles from "@/components/shared/TitleAndSubTitleWithFiles";
import ShowDescription from "@/components/shared/ShowDescription";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Globe, Smartphone, Calendar } from "lucide-react";

const Page = async ({ params }: { params: { id: string } }) => {
  const data = await fetcher<PageResponse>(`/infoPages/${params.id}`);
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
            label: "الصفحات",
          },
          {
            icon: <Flash className="w-5 text-textSubTextDarker" />,
            label: "تفاصيل الصفحة",
          },
        ]}
      />
      <GoBack />

      {/* Enhanced Header Card */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-blue-50/30 mb-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between flex-wrap gap-5">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl text-textMain font-bold">
                  {data.data.info_page.title_ar}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <p className="text-sm text-gray-600">
                    تم الإنشاء: {data.data.info_page.created_at}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant={"primary"} asChild className="shadow-md hover:shadow-lg transition-shadow">
                <Link href={`/ar/apps/pages/${data.data.info_page.id}/edit`}>
                  <Edit2 className="w-4 text-white ml-2" />
                  تعديل الصفحة
                </Link>
              </Button>
              <DeleteDialog
                trigger={
                  <button className="bg-red-50 hover:bg-red-100 px-4 py-2.5 rounded-lg text-red-600 flex items-center justify-center gap-2 border border-red-200 transition-colors shadow-sm hover:shadow-md">
                    <Trash className="w-4 text-red-600" />
                    حذف الصفحة
                  </button>
                }
                id={data.data.info_page.id}
                url="infoPages"
                title="هل أنت متأكد من حذف الصفحة؟"
                description="سيتم حذف هذه الصفحة نهائيًا ولا يمكن التراجع عن هذا الإجراء. هل ترغب في المتابعة؟"
                redirect="apps/pages"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main Information Card */}
        <Card className="xl:col-span-2 border-0 shadow-lg bg-white">
          <CardHeader className="pb-4 border-b border-gray-100">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Globe className="w-5 h-5 text-purple-600" />
              </div>
              المعلومات الأساسية
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <p className="text-sm text-gray-600 font-semibold flex items-center gap-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  الاسم بالعربية
                </p>
                <p className="text-base text-gray-900 font-medium pr-4">
                  {data.data.info_page.title_ar}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-600 font-semibold flex items-center gap-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  الاسم بالإنجليزية
                </p>
                <p className="text-base text-gray-900 font-medium pr-4">
                  {data.data.info_page.title_en}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-600 font-semibold flex items-center gap-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  نوع الصفحة
                </p>
                <p className="text-base text-gray-900 font-medium pr-4">
                  {data.data.info_page.type}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-600 font-semibold flex items-center gap-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  نوع التطبيق
                </p>
                <div className="pr-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg border border-blue-200">
                    <Smartphone className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-700">
                      {data.data.info_page.app}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status & Files Card */}
        <div className="space-y-6">
          {/* Status Card */}
          <Card className="border-0 shadow-lg bg-white">
            <CardHeader className="pb-4 border-b border-gray-100">
              <CardTitle className="flex items-center gap-3 text-lg">
                <div className="p-2 bg-green-100 rounded-lg">
                  <FileText className="w-4 h-4 text-green-600" />
                </div>
                الحالة
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex justify-center">
                <StatusCell
                  text={data.data.info_page.is_active === 1 ? "مفعل" : "غير مفعل"}
                  green={data.data.info_page.is_active === 1 ? true : false}
                />
              </div>
            </CardContent>
          </Card>

          {/* Files Card */}
          <Card className="border-0 shadow-lg bg-white">
            <CardHeader className="pb-4 border-b border-gray-100">
              <CardTitle className="flex items-center gap-3 text-lg">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <FileText className="w-4 h-4 text-amber-600" />
                </div>
                الملفات
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <TitleAndSubTitleWithFiles
                title=""
                files={data.data.info_page.files}
                showImages={true}
              />
            </CardContent>
          </Card>
        </div>

        {/* Description Cards - Full Width */}
        <Card className="xl:col-span-2 border-0 shadow-lg bg-white">
          <CardHeader className="pb-4 border-b border-gray-100">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <FileText className="w-5 h-5 text-indigo-600" />
              </div>
              الوصف بالعربية
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div
              className="prose prose-sm max-w-none text-gray-700 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: data.data.info_page.description_ar }}
            />
          </CardContent>
        </Card>

        <Card className="xl:col-span-2 border-0 shadow-lg bg-white">
          <CardHeader className="pb-4 border-b border-gray-100">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <FileText className="w-5 h-5 text-indigo-600" />
              </div>
              الوصف بالإنجليزية
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div
              className="prose prose-sm max-w-none text-gray-700 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: data.data.info_page.description_en }}
            />
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Page;
