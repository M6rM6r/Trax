"use client";
import MainLayout from "@/components/shared/MainLayout";
import BreadCrumb from "@/components/shared/BreadCrumb";
import {
  CallOutgoing,
  Complaints,
  Edit2,
  Flash,
  Location,
  Message,
  RecordCircle,
  SelectArrow,
  ServicesTrue,
} from "@/public/SVG";
import GoBack from "@/components/shared/GoBack";
import CopyText from "@/components/shared/CopyText";
import { Badge } from "@/components/ui/badge";
import CustomDialog, { Colors } from "@/components/shared/CustomDialog";
import { Button } from "@/components/ui/button";
import AvatarWithRating from "@/components/shared/AvatarWithRating";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetcher } from "@/lib/fetcher";
import { ComplaintHistory, ComplaintResponse } from "@/lib/types/responseTypes";
import RejectComplaint from "@/components/Complaints/RejectComplaint";
import ComplaintAssignedTo from "@/components/Complaints/ComplaintAssignedTo";
import TitleAndSubTitleWithFiles from "@/components/shared/TitleAndSubTitleWithFiles";
import NotesTab from "@/components/Complaints/NotesTab";
import StartProcess from "@/components/Complaints/StartProcess";
import Link from "next/link";
import NotificationsTab from "@/components/Complaints/NotificationsTab";
import ActionsTab from "@/components/Complaints/ActionsTab";
import ChangeComplaintPriority from "@/components/Complaints/ChangeComplaintPriority";

import { ChangeComplaintPriorityRef } from "@/components/Complaints/ChangeComplaintPriority";
import { useEffect, useRef, useState } from "react";
import { fetcherClient } from "@/lib/fetcherClient";
import { useResponseToast } from "@/lib/toastUtils";

const Page = ({ params }: { params: { locale: string; id: string } }) => {
  const priorityFormRef = useRef<ChangeComplaintPriorityRef>(null);
  const [data, setData] = useState<ComplaintResponse | null>(null);
  const [isEditingPriority, setIsEditingPriority] = useState(false);

  const { showResponseToast } = useResponseToast();

  useEffect(() => {
    const getData = async () => {
      const res = await fetcherClient<ComplaintResponse>(
        `/complaints/${params.id}`
      );
      setData(res);
    };
    getData();
  }, [params.id]);

  const updateComplaint = async (priority: string) => {
    try {
      // Send PUT request to update priority
      const response = await fetcherClient<any>(`/complaints/${params.id}`, {
        method: "PUT",
        body: JSON.stringify({
          priority,
        }),
      });

      showResponseToast(response);

      // Always make a GET request to get the updated complaint data
      const updatedData = await fetcherClient<ComplaintResponse>(
        `/complaints/${params.id}`
      );

      // Update state with the fresh data from GET request
      setData(updatedData);

      // Exit edit mode
      setIsEditingPriority(false);

      return response;
    } catch (error) {
      // Handle error
      // Don't exit edit mode on error so user can retry
      throw error;
    }
  };

  const HistoryDescription = ({ item }: { item: ComplaintHistory }) => {
    const text = item.description;

    // Extract the username from the text
    // Usernam is between "بواسطة" and "إلى" Or after "بواسطة" if "إلى" not included
    const historyUser = text.match(/بواسطة\s+(.+?)(?:\s+إلى|$)/);

    let coloredText;

    if (historyUser) {
      const userName = historyUser[1];

      coloredText = text.replace(
        userName,
        `<span class='font-semibold text-black'>${userName}</span>`
      );
    } else {
      coloredText = text;
    }

    return (
      <p
        className="text-primaryColor"
        dangerouslySetInnerHTML={{ __html: coloredText }}
      ></p>
    );
  };

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
              text={`#${data?.data?.complaint?.id}`}
              label={"شكوى رقم"}
            />
            <p className="text-16 text-textSubText mt-2">
              بتاريخ:{" "}
              <span className="text-18 text-textMain font-[600]">
                {data?.data?.complaint?.created_at?.slice(0, 10)}
              </span>
            </p>
          </div>
          <Badge variant={"warning"}>
            {data?.data?.complaint.status?.label}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-6 ">
          <div className=" grow flex flex-col gap-4">
            <p className="text-16 text-textMain font-[600]">محتوى الشكوى</p>
            <div className=" flex items-center justify-between">
              <p className="text-20 text-textMain font-[700]">شكوى سلوكية</p>
              <p className="tetx-16 text-textSubTextDarker">
                مصدر الشكوى: {data?.data?.complaint.complaint_source?.label}
              </p>
            </div>

            {/* Priority Field - Read-only or Edit mode */}
            <div className={`flex flex-col gap-2 relative`}>
              <div className="flex items-center justify-between">
                <p className="text-16 text-primarySlate700 font-[600]">
                  الأولوية
                </p>
                {!isEditingPriority && (
                  <Button
                    variant="primaryLight"
                    size="sm"
                    onClick={() => setIsEditingPriority(true)}
                    className="flex items-center gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    تعديل
                  </Button>
                )}
              </div>
              {isEditingPriority ? (
                <div className="flex flex-col gap-3">
                  <ChangeComplaintPriority
                    ref={priorityFormRef}
                    initialPriority={data?.data?.complaint?.priority?.key ?? ""}
                    updateComplaint={updateComplaint}
                  />
                  <div className="flex items-center gap-3 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditingPriority(false)}
                    >
                      إلغاء
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => priorityFormRef.current?.submitForm()}
                    >
                      حفظ
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between gap-5 h-[48px] border border-textBorder rounded-6 items-center px-4">
                  <p className="text-16 text-textMain font-[600]">
                    {data?.data?.complaint?.priority?.label || "غير محدد"}
                  </p>
                  <SelectArrow />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className={`flex flex-col gap-2 relative `}>
                <p className="text-16 text-primarySlate700 font-[600]">
                  تصنيف الشكوى
                </p>
                <div className="flex justify-between gap-5 h-[48px] border border-textBorder rounded-6 items-center px-4">
                  <p className="text-16 text-textMain font-[600]">
                    {data?.data?.complaint.category?.name_ar}
                  </p>
                  <SelectArrow />
                </div>
              </div>
              <div className={`flex flex-col gap-2 relative `}>
                <p className="text-16 text-primarySlate700 font-[600]">
                  نوع الشكوى
                </p>
                <div className="flex justify-between gap-5 h-[48px] border border-textBorder rounded-6 items-center px-4">
                  <p className="text-16 text-textMain font-[600]">
                    {data?.data?.complaint?.category?.parent_name_ar}
                  </p>
                  <SelectArrow />
                </div>
              </div>
            </div>
            <div className=" flex flex-col gap-2">
              <p className="text-16 text-primarySlate700 font-[600]">
                وصف الشكوى
              </p>
              <p className="text-18 text-textMain font-[600] border border-textBorder rounded-6 p-4">
                {data?.data?.complaint?.description}
              </p>
            </div>
            <TitleAndSubTitleWithFiles
              title={"المرفقات"}
              files={data?.data?.complaint?.files ?? []}
              showImages
            />
            <Tabs dir="rtl" defaultValue="notes" className="w-full">
              <TabsList className="w-full bg-transparent">
                <TabsTrigger
                  value="notes"
                  className=" grow border-b-[2px] border-b-iconColor pb-2  "
                >
                  الملاحظات
                </TabsTrigger>
                <TabsTrigger
                  value="notifications"
                  className=" grow border-b-[2px] border-b-iconColor pb-2  "
                >
                  الإشعارات
                </TabsTrigger>
                <TabsTrigger
                  value="actions"
                  className=" grow border-b-[2px] border-b-iconColor pb-2  "
                >
                  الإجراء المُتخذ
                </TabsTrigger>
                <TabsTrigger
                  value="reportLog"
                  className=" grow border-b-[2px] border-b-iconColor pb-2"
                >
                  سجل الشكوى
                </TabsTrigger>
              </TabsList>
              <TabsContent
                value="notifications"
                className=" flex flex-col gap-3"
              >
                <NotificationsTab notifications={[]} />
              </TabsContent>
              <TabsContent value="actions" className=" flex flex-col gap-3">
                <ActionsTab actions={data?.data?.complaint?.actions ?? []} />
              </TabsContent>
              <TabsContent value="notes" className=" flex flex-col gap-3">
                {data ? (
                  <NotesTab
                    complaint_id={Number(data.data.complaint.id)}
                    notes={data.data.complaint.notes ?? []}
                  />
                ) : (
                  <p className="text-center text-gray-500 py-4">
                    جارٍ تحميل البيانات...
                  </p>
                )}
              </TabsContent>
              <TabsContent value="reportLog" className=" flex flex-col gap-3">
                <div className=" flex items-center justify-between gap-5 mb-5">
                  <p className="text-16 text-textSubTextDarker font-[600]">
                    <span className="text-textMain">
                      {data?.data?.complaint.history?.length}
                    </span>{" "}
                    حدث
                  </p>
                  <p className="text-16 text-primaryColor font-[600]">
                    اقرأ التفاصيل
                  </p>
                </div>
                <ol className="relative space-y-8 before:absolute before:-ml-px before:h-full before:w-0.5 before:rounded-full before:bg-textBorder ms-20">
                  {data?.data?.complaint?.history?.map((item: any) => (
                    <li
                      key={item.id}
                      className="relative -ms-2 flex items-start gap-4"
                    >
                      <span className="size-3 shrink-0 rounded-full bg-textSubText"></span>

                      <div className="-mt-2 bg-sidebar-primary-foreground">
                        <time className="text-xs/none font-medium text-gray-700 -ms-28 size-1">
                          {item.created_at.slice(0, 10)}
                        </time>

                        <HistoryDescription item={item} />
                      </div>
                    </li>
                  ))}
                </ol>
              </TabsContent>
            </Tabs>
          </div>

          <div className=" basis-[483px] flex flex-col gap-6">
            {data?.data?.complaint?.status?.key === "unassigned" && (
              <div className=" flex items-center gap-4">
                <CustomDialog
                  title="إسناد الشكوى إلى موظف"
                  color={Colors.primary}
                  trigger={
                    <Button variant="primary" size="lg" className=" grow">
                      إسناد الشكوى
                    </Button>
                  }
                  content={
                    <ComplaintAssignedTo
                      team_members={data?.data?.complaint?.team}
                      id={data?.data?.complaint?.assigned_to?.id}
                      complaint_id={data?.data?.complaint?.id}
                    />
                  }
                />
                <CustomDialog
                  title="رفض الشكوى"
                  color={Colors.primary}
                  trigger={
                    <Button variant="dangerLight" size="lg" className=" grow">
                      رفض الشكوى
                    </Button>
                  }
                  content={<RejectComplaint data={data} />}
                />
              </div>
            )}
            {data?.data?.complaint?.status?.key === "assigned" && (
              <StartProcess
                complaint_id={data?.data?.complaint?.id}
                text="بدء المعالجة"
                variant={"primary"}
              />
            )}
            {data?.data?.complaint?.status?.key === "in_progress" && (
              <div className=" flex items-center gap-4">
                <Button
                  variant={"primary"}
                  size="lg"
                  onClick={() => priorityFormRef.current?.submitForm()}
                >
                  حفظ التعديلات
                </Button>
                <CustomDialog
                  title="انهاء التحقيق بدون اجراء"
                  color={Colors.primary}
                  trigger={
                    <Button variant="warningLight" size="lg" className=" grow">
                      إنهاء بدون إجراء
                    </Button>
                  }
                  content={<RejectComplaint data={data} />}
                />
                <Link
                  href={`/ar/complaintsManagement/complaints/${data?.data?.complaint?.id}/actions`}
                  className=" grow block"
                >
                  <Button variant="primary" size="lg" className=" w-full">
                    إتخاذ إجراء
                  </Button>
                </Link>
              </div>
            )}
            {data?.data?.complaint?.status?.key === "action_taken" && (
              <div className=" flex items-center gap-4">
                <Link
                  href={`/ar/complaintsManagement/complaints/${data?.data?.complaint?.id}/notifications`}
                  className=" grow block"
                >
                  <Button variant="primary" size="lg" className=" w-full">
                    تأكيد الإجراء وإشعار الأطراف
                  </Button>
                </Link>
                <StartProcess
                  complaint_id={data?.data?.complaint?.id}
                  text="إرجاع إلى قيد المعالجة"
                  variant={"primaryLight"}
                />
              </div>
            )}
            <div className="flex flex-col gap-5 border border-gray200 rounded-6 p-4">
              <p className="text-16 text-textMain font-[600]">
                بيانات أطراف الشكوى
              </p>
              <div className=" flex flex-col gap-3">
                <p className="text-14 text-textSubTextDarker font-[600]">
                  مقدم الشكوى{" "}
                  <span className="text-textMain">
                    ({data?.data?.complaint.complainant?.type})
                  </span>
                </p>
                <div className="flex items-center gap-4 justify-between">
                  <AvatarWithRating
                    image={data?.data?.complaint.complainant?.image ?? ""}
                    name={data?.data?.complaint.complainant?.name ?? ""}
                    rating={Number(
                      data?.data?.complaint.complainant?.rating ?? ""
                    )}
                    gender={data?.data?.complaint.complainant?.gender ?? ""}
                  />
                  <div className="flex items-center gap-3">
                    <Message />
                    <CallOutgoing />
                  </div>
                </div>
              </div>
              <Separator className="h-[1px]" />
              <div className=" flex flex-col gap-3">
                <p className="text-14 text-textSubTextDarker font-[600]">
                  الطرف المقدم ضده الشكوى{" "}
                  <span className="text-textMain">
                    ({data?.data?.complaint.against?.type})
                  </span>
                </p>
                <div className="flex items-center gap-4 justify-between">
                  <AvatarWithRating
                    image={data?.data?.complaint.against?.image ?? ""}
                    name={data?.data?.complaint.against?.name ?? ""}
                    rating={Number(data?.data?.complaint.against?.rating) || 0}
                    gender={data?.data?.complaint.against?.gender ?? ""}
                  />
                  <div className="flex items-center gap-3">
                    <Message />
                    <CallOutgoing />
                  </div>
                </div>
              </div>
            </div>
            <div className=" border border-gray200 rounded-6 p-4">
              <Tabs dir="rtl" defaultValue="summary" className="w-full">
                <TabsList className="w-full bg-transparent">
                  <TabsTrigger
                    value="summary"
                    className=" grow border-b-[2px] border-b-iconColor pb-2  "
                  >
                    ملخص الرحلة
                  </TabsTrigger>
                  <TabsTrigger
                    value="details"
                    className=" grow border-b-[2px] border-b-iconColor pb-2"
                  >
                    مواصفات المركبة
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="summary" className=" flex flex-col gap-3">
                  <CopyText
                    text={`#${data?.data?.complaint?.ride?.id}`}
                    label={"رحلة رقم"}
                  />
                  <p className="text-16 text-textSubText">
                    بتاريخ:{" "}
                    <span className="text-18 text-textMain font-[600]">
                      {data?.data?.complaint.ride?.ride_date?.slice(0, 10)}
                    </span>
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="bg-[#EBEBEC] flex items-center justify-center gap-3 py-1 rounded-full w-[150px]">
                      {data?.data?.complaint.ride?.vehicle}
                      <ServicesTrue />
                    </div>
                    <Badge variant={"error"}>
                      {data?.data?.complaint.ride?.status}
                    </Badge>
                  </div>
                  <div className=" flex flex-col gap-4 relative before:content-[''] before:w-[1px] before:h-[60%] before:right-2 before:absolute before:border before:border-dashed before:border-[#F1F4F4]">
                    <div className="flex gap-2 z-10">
                      <RecordCircle className=" shrink-0" />
                      <div>
                        <p className="text-16 text-textMain mb-1">
                          موقع الإلتقاء
                        </p>
                        <p className="text-18 text-textSubTextDarker">
                          {data?.data?.complaint.ride?.pickup?.address}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 z-10">
                      <Location className=" shrink-0" />
                      <div>
                        <p className="text-16 text-textMain mb-1">
                          موقع الوصول
                        </p>
                        <p className="text-18 text-textSubTextDarker">
                          {data?.data?.complaint.ride?.destination?.address}
                        </p>
                      </div>
                    </div>
                  </div>
                  <p className="text-14 text-textSubText">
                    التكلفة الأولية للرحلة:{" "}
                    <span className="text-18 text-textMain font-[600]">
                      {data?.data?.complaint.ride?.final_price
                        ? data?.data?.complaint.ride?.final_price +
                        data?.data?.complaint.ride?.price
                        : data?.data?.complaint.ride?.price}{" "}
                      ريال
                    </span>
                  </p>
                </TabsContent>
                <TabsContent value="details" className=" flex flex-col gap-3">
                  <p className="text-14 text-textSubTextDarker font-[600]">
                    لون المركبة :{" "}
                    <span className="text-textMain">
                      {data?.data?.complaint.ride?.color_name ?? "غير محدد"}
                    </span>
                  </p>
                  <p className="text-14 text-textSubTextDarker font-[600]">
                    عدد المقاعد :{" "}
                    <span className="text-textMain">
                      {data?.data?.complaint.ride?.seats_number ?? "غير محدد"}
                    </span>
                  </p>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Page;
