import MainLayout from "@/components/shared/MainLayout";
import BreadCrumb from "@/components/shared/BreadCrumb";
import { Complaints, Edit2, Flash, Trash } from "@/public/SVG";
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
import ShowDescription from "@/components/shared/ShowDescription";
import { convertDateFormat } from "@/lib/helperFunctions";

const Page = async ({
  params,
}: {
  params: { locale: string; id: string; subId: string };
}) => {
  const data = await fetcher<ComplaintCategoryResponse>(
    `/complaintCategory/${params.subId}`
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
            icon: <Flash className="w-5 text-iconColor" />,
            label: "تفاصيل التصنيف",
          },
          {
            icon: <Flash className="w-5 text-textSubTextDarker" />,
            label: "تفاصيل نوع الشكوى",
          },
        ]}
      />
      <GoBack />
      <div className="flex flex-col gap-5 p-4 border border-gray200 rounded-12 bg-white">
        <div className="flex items-center justify-between flex-wrap gap-5">
          <h2 className="text-20 text-textMain font-[700]">
            تفاصيل نوع الشكوى
          </h2>
          <div className=" flex items-center gap-4">
            <Button variant={"primary"} asChild>
              <Link
                href={`/ar/complaintsManagement/categories/${params.subId}/editType`}
              >
                تعديل النوع <Edit2 className="w-4 text-white" />
              </Link>
            </Button>
            <DeleteDialog
              trigger={
                <button className=" bg-accentDangerLight px-4 py-1.5 rounded-6 text-accentDanger flex items-center justify-center gap-3">
                  حذف النوع
                  <Trash className="w-5 text-accentDanger" />
                </button>
              }
              id={data.data.complaint_category.id}
              url="complaintCategory"
              title="هل أنت متأكد من حذف النوع؟"
              description="هذا النوع مرتبط بشكاوى مسجلة سابقًا.
قد يؤدي حذفه إلى ظهور الشكاوى المرتبطة بدون تصنيف دقيق.
للحفاظ على سلامة البيانات، يُفضل تعطيله بدلاً من حذفه نهائيًا."
              redirect={`complaintsManagement/categories/${params.id}`}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4  gap-5 border border-gray200 rounded-6 p-5">
          <TitleAndSubTitle
            title="الاسم بالعربية"
            subTitle={data.data.complaint_category.title_ar}
          />
          <TitleAndSubTitle
            title="الاسم بالإنجليزية"
            subTitle={data.data.complaint_category.title_en}
          />
          <TitleAndSubTitle
            title="نوع التطبيق"
            subTitle={
              data.data.complaint_category.app
                ?.map((item) => item)
                .join(" , ") || ""
            }
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

          <ShowDescription
            title="الوصف بالعربية"
            subTitle={data.data.complaint_category.description_ar}
          />
          <ShowDescription
            title="الوصف بالإنجليزية"
            subTitle={data.data.complaint_category.description_en}
          />
          <TitleAndSubTitle
            title="المرفقات"
            subTitle={
              data.data.complaint_category.attachments_types
                ?.map((item) => item)
                .join(" , ") || ""
            }
          />
          <TitleAndSubTitle
            title="نوع الخدمة"
            subTitle={
              data.data.complaint_category.services
                ?.map((item) => item)
                .join(" , ") || ""
            }
          />
          <TitleAndSubTitle
            title="الفريق المسؤول"
            subTitle={data.data.complaint_category?.team
              ?.map((item) => item.title_ar)
              .join(" , ")}
          />
          <TitleAndSubTitle
            title="الإرتباط برحلة"
            subTitle={
              data.data.complaint_category.ride_related === true
                ? "مرتبطة برحلة"
                : "غير مرتبطة برحلة"
            }
          />
          <TitleAndSubTitle
            title="توقيت ظهور الشكوى"
            subTitle={convertDateFormat(
              data.data.complaint_category.created_at
            )}
          />
        </div>
        <DataTable
          columns={columns}
          data={data.data.complaint_category.displinaryActions}
          heading="الإجراءات المقترنة"
        />
      </div>
    </MainLayout>
  );
};

export default Page;
