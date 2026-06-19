import MainLayout from "@/components/shared/MainLayout";
import BreadCrumb from "@/components/shared/BreadCrumb";
import { Add, Complaints, Edit2, Flash, Trash } from "@/public/SVG";
import { Button } from "@/components/ui/button";
import GoBack from "@/components/shared/GoBack";
import Link from "next/link";
import { fetcher } from "@/lib/fetcher";
import { ComplaintCategoryResponse } from "@/lib/types/responseTypes";
import DeleteDialog from "@/components/Authorization/DeleteDialog";
import StatusCell from "@/components/shared/TableCellComponents/StatusCell";
import TitleAndSubTitle from "@/components/shared/TitleAndSubTitle";
import { DataTable } from "@/components/shared/DataTable/data-table";
import { columns } from "./columns";

const Page = async ({ params }: { params: { locale: string; id: string } }) => {
  const data = await fetcher<ComplaintCategoryResponse>(
    `/complaintCategory/${params.id}`
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
            label: "إدارة تصنيفات الشكاوى",
          },
          {
            icon: <Flash className="w-5 text-textSubTextDarker" />,
            label: "تفاصيل التصنيف",
          },
        ]}
      />
      <GoBack />
      <div className="flex flex-col gap-5 p-4 border border-gray200 rounded-12 bg-white">
        <div className="flex items-center justify-between flex-wrap gap-5">
          <h2 className="text-20 text-textMain font-[700]">تفاصيل التصنيف</h2>
          <div className=" flex items-center gap-4">
            <Button variant="primary" size="lg" asChild>
              <Link
                href={`/${params.locale}/complaintsManagement/categories/${data.data.complaint_category.id}/addType`}
                className=" text-18 text-white font-[600] flex items-center gap-2 "
              >
                أضف نوع شكوى للتصنيف
                <Add className="w-6 text-white" />
              </Link>
            </Button>
            <Button variant={"primaryLight"} asChild>
              <Link
                href={`/ar/complaintsManagement/categories/${data.data.complaint_category.id}/edit`}
              >
                تعديل التصنيف <Edit2 className="w-4 text-primaryColor" />
              </Link>
            </Button>
            <DeleteDialog
              trigger={
                <button className=" bg-accentDangerLight px-4 py-1.5 rounded-6 text-accentDanger flex items-center justify-center gap-3">
                  حذف التصنيف
                  <Trash className="w-5 text-accentDanger" />
                </button>
              }
              id={data.data.complaint_category.id}
              url="complaintCategory"
              title="هل أنت متأكد من حذف التصنيف؟"
              description="سيؤثر حذف هذا النوع على جميع الشكاوى المرتبطة به.
قد تظهر بعض الشكاوى القديمة بدون تصنيف واضح بعد الحذف.
ننصح بمراجعة الشكاوى المرتبطة قبل تأكيد الحذف."
              redirect="complaintsManagement/categories"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3  gap-5 border border-gray200 rounded-6 p-5">
          <TitleAndSubTitle
            title="الاسم بالعربية"
            subTitle={data.data.complaint_category.title_ar}
          />
          <TitleAndSubTitle
            title="الاسم بالإنجليزية"
            subTitle={data.data.complaint_category.title_en}
          />
          <div>
            <p className="text-gray600 text-16 font-[600] mb-2">الحالة</p>
            <StatusCell
              text={
                data.data.complaint_category.is_active ? "مفعل" : "غير مفعل"
              }
              green={data.data.complaint_category.is_active ? true : false}
            />
          </div>
        </div>
        <DataTable
          columns={columns}
          data={data.data.complaint_category.subcategories}
          heading="أنواع الشكاوى المرتبطة"
        />
      </div>
    </MainLayout>
  );
};

export default Page;
