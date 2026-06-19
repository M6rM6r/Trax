import MainLayout from "@/components/shared/MainLayout";
import BreadCrumb from "@/components/shared/BreadCrumb";
import { Complaints, Flash } from "@/public/SVG";
import GoBack from "@/components/shared/GoBack";
import CopyText from "@/components/shared/CopyText";
import { fetcher } from "@/lib/fetcher";
import { ComplaintResponse } from "@/lib/types/responseTypes";
import { Button } from "@/components/ui/button";
import AvatarWithRating from "@/components/shared/AvatarWithRating";
import TakeAction from "@/components/Complaints/TakeAction";
import { DataTable } from "@/components/shared/DataTable/data-table";
import { columns } from "./columns";
import Link from "next/link";
import ApplyActions from "@/components/Complaints/ApplyActions";

const Page = async ({ params }: { params: { locale: string; id: string } }) => {
  const data = await fetcher<ComplaintResponse>(`/complaints/${params.id}`);

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
            label: "الشكاوى",
          },
          {
            icon: <Flash className="w-5 text-textSubTextDarker" />,
            label: "عرض الشكوى",
          },
        ]}
      />
      <GoBack />
      <div className="flex flex-col gap-5 p-4 border border-gray200 rounded-12 bg-white">
        <div className="flex items-center justify-between flex-wrap gap-5">
          <div>
            <CopyText
              text={`#${data.data.complaint.id}`}
              label={"الإجراءات المتخذة ضد شكوى رقم"}
            />
            <p className="text-16 text-textSubText mt-2">
              بتاريخ:{" "}
              <span className="text-18 text-textMain font-[600]">
                {data.data.complaint.created_at.slice(0, 10)}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-4">
            <ApplyActions complaint_id={data.data.complaint.id} />
            <Link href={`/ar/complaintsManagement/complaints/${params.id}`}>
              <Button variant={"primaryLight"} className=" px-8">
                إلغاء
              </Button>
            </Link>
          </div>
        </div>
        <div className=" grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="border border-gray200 rounded-6 p-4 flex flex-col gap-5">
            <div className=" flex flex-col gap-4">
              <p className="text-18 text-textMain font-[600]">
                الطرف مقدم الشكوى
              </p>
              <AvatarWithRating
                image={data.data.complaint?.complainant?.image}
                name={data.data.complaint?.complainant?.name}
                rating={data.data.complaint?.complainant?.rating}
                gender={`${data.data.complaint?.complainant?.type}`}
              />
              <TakeAction
                category_id={data.data.complaint?.category?.id}
                complaint_id={data.data.complaint?.id}
                customerable_type={data.data.complaint?.complainant?.key}
                customerable_id={data.data.complaint?.complainant?.id}
              />
              <DataTable
                columns={columns}
                data={
                  data.data.complaint?.actions?.filter(
                    (item) =>
                      item.customerable_type?.toLowerCase() ==
                      data.data.complaint?.complainant?.key
                  ) || []
                }
                heading="الإجراءات المتخذة "
                searchParamKey="complainantSearch"
              />
            </div>
          </div>
          <div className="border border-gray200 rounded-6 p-4 flex flex-col gap-5">
            <div className=" flex flex-col gap-4">
              <p className="text-18 text-textMain font-[600]">
                الطرف المقدم ضده الشكوى
              </p>
              <AvatarWithRating
                image={data.data.complaint?.against?.image}
                name={data.data.complaint?.against?.name}
                rating={data.data.complaint?.against?.rating}
                gender={`${data.data.complaint?.against?.type}`}
              />
              <TakeAction
                category_id={data.data.complaint?.category?.id}
                complaint_id={data.data.complaint?.id}
                customerable_type={data.data.complaint?.against?.key}
                customerable_id={data.data.complaint?.against?.id}
              />
              <DataTable
                columns={columns}
                data={
                  data.data.complaint?.actions?.filter(
                    (item) =>
                      item.customerable_type?.toLowerCase() ==
                      data.data.complaint?.against?.key
                  ) || []
                }
                heading="الإجراءات المتخذة "
                searchParamKey="againstSearch"
              />
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Page;
