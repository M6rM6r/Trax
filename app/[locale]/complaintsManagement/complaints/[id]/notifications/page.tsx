import MainLayout from "@/components/shared/MainLayout";
import BreadCrumb from "@/components/shared/BreadCrumb";
import { Complaints, Flash } from "@/public/SVG";
import GoBack from "@/components/shared/GoBack";
import CopyText from "@/components/shared/CopyText";
import { fetcher } from "@/lib/fetcher";
import { ComplaintResponse } from "@/lib/types/responseTypes";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import SendNotifications from "@/components/Complaints/SendNotifications";

const Page = async ({ params }: { params: { locale: string; id: string } }) => {
  const data = await fetcher<ComplaintResponse>(`/complaints/${params.id}`);

  const complaintOpenedDays = data.data.complaint.opened_since_days;

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
              label={"اشعارات اطراف  شكوى رقم"}
            />
            <p className="text-16 text-textSubText">
              بتاريخ:{" "}
              <span className="text-18 text-textMain font-[700] ml-2">
                {data.data.complaint.created_at.slice(0, 10)}
              </span>
              {"  "}
              {`مفتوحة منذ ${complaintOpenedDays} ${
                complaintOpenedDays === 1 || complaintOpenedDays > 10
                  ? "يوم"
                  : complaintOpenedDays === 2
                  ? "يومين"
                  : "أيام"
              }`}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant={"primary"}
              className=" px-8"
              type="submit"
              form="notifications"
            >
              حفظ وارسال الاشعار
            </Button>
            <Link href={`/ar/complaintsManagement/complaints/${params.id}`}>
              <Button variant={"primaryLight"} className=" px-8">
                إلغاء
              </Button>
            </Link>
          </div>
        </div>
        <SendNotifications data={data} />
      </div>
    </MainLayout>
  );
};

export default Page;
