"use client";
import MainLayout from "@/components/shared/MainLayout";
import BreadCrumb from "@/components/shared/BreadCrumb";
import { Flash, Shapes } from "@/public/SVG";
import { Button } from "@/components/ui/button";
import GoBack from "@/components/shared/GoBack";
import { Form, Formik } from "formik";
import CustomInput from "@/components/shared/form/CustomInput";
import dynamic from "next/dynamic";
import { useResponseToast } from "@/lib/toastUtils";
import { fetcherClient } from "@/lib/fetcherClient";
import { validationForNotifications } from "@/lib/types/validationTypes";
import { useRouter } from "next/navigation";
import RichTextEditor from "@/components/shared/RichTextEditor";
const CustomSelect = dynamic(
  () => import("@/components/shared/form/CustomSelect")
);
const Page = () => {
  const { showResponseToast } = useResponseToast();
  const router = useRouter();

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
            label: "الإشعارات",
          },
          {
            icon: <Flash className="w-5 text-textSubTextDarker" />,
            label: "إنشاء إشعار",
          },
        ]}
      />
      <GoBack />
      <Formik<{
        user_type: string;
        ids: string;
        title: string;
        body: string;
      }>
        initialValues={{
          user_type: "",
          ids: "",
          title: "",
          body: "",
        }}
        validationSchema={validationForNotifications}
        onSubmit={async (values, { setSubmitting }) => {
          const formdata: any = new FormData();
          formdata.append("user_type", values.user_type);
          values.user_type === "driver" || values.user_type === "customer"
            ? formdata.append("ids", values.ids)
            : values.ids
                ?.split(",")
                .map((id: string) => formdata.append("label_ids[]", id));
          formdata.append("title", values.title);
          formdata.append("body", values.body);
          try {
            const response = await fetcherClient<any>("/notifications/send", {
              method: "POST",
              body: formdata,
            });
            showResponseToast(response);
            router.refresh();
          } catch (error: any) {
            showResponseToast(error.info);
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {(props) => (
          <Form className="flex flex-col gap-5 p-4 border border-gray200 rounded-12 bg-white">
            <div className="flex items-center justify-between flex-wrap gap-5">
              <h2 className="text-20 text-textMain font-[700]">إنشاءِ إشعار</h2>
              <Button
                variant={"primary"}
                type="submit"
                disabled={props.isSubmitting}
              >
                إرسال
              </Button>
            </div>
            <div className="flex flex-col gap-5 p-4 border border-gray200 rounded-6">
              <p className="text-16 text-textMain font-[600]">تفاصيل الإشعار</p>
              <div className=" grid grid-cols-1 md:grid-cols-2 gap-5">
                <CustomSelect
                  name="user_type"
                  title="نوع المستخدمين"
                  placeholder="- اختر ـ"
                  options={[
                    { label: "سائق", value: "driver" },
                    { label: "مستخدم", value: "customer" },
                    { label: "تصنيف", value: "label" },
                  ]}
                  formikProps={props}
                  label="label"
                  value="value"
                  className="md:col-span-2"
                />
                <CustomInput
                  type="text"
                  name="ids"
                  placeholder="--"
                  label="الأرقام التعريفية"
                  containerClassName="md:col-span-2"
                />
                <CustomInput
                  type="text"
                  name="title"
                  placeholder="العنوان "
                  label="العنوان "
                  containerClassName="md:col-span-2"
                />
                {/* <CustomInput
                  type="text"
                  name="title_en"
                  placeholder="العنوان بالانجليزية"
                  label="العنوان بالانجليزية"
                /> */}
                <RichTextEditor
                  name="body"
                  label="المحتوى"
                  formikProps={props}
                  className="md:col-span-2"
                />
                {/* <RichTextEditor
                  name="description_en"
                  label="الوصف بالانجليزية"
                  formikProps={props}
                /> */}
                {/* <CustomSelect
                  name="is_active"
                  title="الحالة"
                  placeholder="- اختر ـ"
                  options={[
                    { label: "مفعل", value: "1" },
                    { label: "غير مفعل", value: "0" },
                  ]}
                  formikProps={props}
                  label="label"
                  value="value"
                  className="md:col-span-2"
                /> */}
              </div>
            </div>
          </Form>
        )}
      </Formik>
    </MainLayout>
  );
};

export default Page;
