"use client";
import CopyText from "@/components/shared/CopyText";
import CustomFileInput from "@/components/shared/CustomFileInput";
import CustomInput from "@/components/shared/form/CustomInput";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DialogClose } from "@/components/ui/dialog";
import { useFetchEnums } from "@/hooks/useAllEnums";
import { fetcherClient } from "@/lib/fetcherClient";
import { convertDateFormat } from "@/lib/helperFunctions";
import { useResponseToast } from "@/lib/toastUtils";
import { ComplaintResponse } from "@/lib/types/responseTypes";
import { Form, Formik } from "formik";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
const CustomSelect = dynamic(
  () => import("@/components/shared/form/CustomSelect")
);
const Index = ({ data }: { data: ComplaintResponse }) => {
  const { data: dataEnums } = useFetchEnums();
  const { showResponseToast } = useResponseToast();
  const router = useRouter();

  return (
    <Formik
      initialValues={{
        complaint_id: data.data.complaint.id,
        reason: "",
        files: [],
        note: "",
      }}
      onSubmit={async (values) => {
        const formdata = new FormData();
        formdata.append("complaint_id", values.complaint_id.toString());
        formdata.append("reason", values.reason);
        formdata.append("note", values.note);
        values.files.forEach((file: any) => {
          formdata.append("files[]", file);
        });
        try {
          const response = await fetcherClient<any>(`/reject/complaints`, {
            method: "POST",
            body: formdata,
          });

          showResponseToast(response);
          router.refresh();
        } catch (error: any) {
          showResponseToast(error.info);
        }
      }}
    >
      {(props) => (
        <Form className="flex flex-col gap-5 pt-0">
          <div className="flex items-center justify-between flex-wrap gap-5">
            <div>
              <CopyText
                text={`#${data.data.complaint.id}`}
                label={"شكوى رقم"}
              />
              <p className="text-16 text-textSubText mt-2">
                بتاريخ:{" "}
                <span className="text-18 text-textMain font-[600]">
                  {convertDateFormat(data.data.complaint.created_at)}
                </span>{" "}
                مفتوحة لمدة
                <span className="text-18 text-textMain font-[600] mx-1">
                  {data.data.complaint.opened_since_days}
                </span>
                يوم
              </p>
            </div>
            <Badge variant={"warning"}>
              {data.data.complaint.status?.label}
            </Badge>
          </div>
          <div className="flex flex-col gap-3">
            <CustomSelect
              name="reason"
              title="السبب"
              placeholder="- اختر ـ"
              options={
                dataEnums?.RejectComplaintReasons
                  ? Object.entries(dataEnums?.RejectComplaintReasons?.ar).map(
                      ([key, value]) => ({ label: value, value: key })
                    )
                  : []
              }
              formikProps={props}
              label="label"
              value="value"
            />
            <CustomFileInput
              name="files"
              label="أرفق ملف (الرد أو الأدلة)"
              formikProps={props}
            />
            <CustomInput
              name="note"
              type={"text"}
              as="textarea"
              label="اضف ملاحظة"
              placeholder={"الملاحظة"}
              className="h-5"
              containerClassName="min-h-6"
            />
            <div className=" flex justify-between gap-5">
              <Button type="submit" variant={"primary"} className="w-40">
                حفظ
              </Button>
              <DialogClose asChild>
                <Button variant={"primaryLight"} className="w-40">
                  إلغاء
                </Button>
              </DialogClose>
            </div>
          </div>
        </Form>
      )}
    </Formik>
  );
};

export default Index;
