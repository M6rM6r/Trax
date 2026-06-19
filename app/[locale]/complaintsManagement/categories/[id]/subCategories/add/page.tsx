"use client";
import MainLayout from "@/components/shared/MainLayout";
import BreadCrumb from "@/components/shared/BreadCrumb";
import { Complaints, Flash } from "@/public/SVG";
import { Button } from "@/components/ui/button";
import GoBack from "@/components/shared/GoBack";
import { Form, Formik } from "formik";
import CustomInput from "@/components/shared/form/CustomInput";
import dynamic from "next/dynamic";
import { useResponseToast } from "@/lib/toastUtils";
import { fetcherClient } from "@/lib/fetcherClient";
import { validationForLabels } from "@/lib/types/validationTypes";
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
            icon: <Complaints className="w-5 text-iconColor" />,
            label: "إدارة الشكاوى",
          },
          {
            icon: <Flash className="w-5 text-iconColor" />,
            label: "إدارة تصنيفات الشكاوى",
          },
          {
            icon: <Flash className="w-5 text-iconColor" />,
            label: "أنواع الشكوى المرتبطة بالتصنيف",
          },
          {
            icon: <Flash className="w-5 text-textSubTextDarker" />,
            label: "أضف نوع",
          },
        ]}
      />
      <GoBack />
      <Formik<{
        title_ar: string;
        title_en: string;
        description_ar: string;
        description_en: string;
        files: File[];
        service_type: string;
        app_type: string;
        is_active: string;
        time: string;
      }>
        initialValues={{
          title_ar: "",
          title_en: "",
          description_ar: "",
          description_en: "",
          files: [],
          service_type: "",
          app_type: "",
          is_active: "",
          time: "",
        }}
        validationSchema={validationForLabels}
        onSubmit={async (values, { setSubmitting }) => {
          // 
          const formdata: any = new FormData();
          formdata.append("title_ar", values.title_ar);
          formdata.append("title_en", values.title_en);
          formdata.append("description_ar", values.description_ar);
          formdata.append("description_en", values.description_en);
          formdata.append("is_active", values.is_active.toString());
          try {
            const response = await fetcherClient<any>("/labels", {
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
              <h2 className="text-20 text-textMain font-[700]">أضف نوع</h2>
              <Button
                variant={"primary"}
                type="submit"
                disabled={props.isSubmitting}
              >
                أضف نوع
              </Button>
            </div>
            <div className="flex flex-col gap-5 p-4 border border-gray200 rounded-6">
              <p className="text-16 text-textMain font-[600]">تفاصيل النوع</p>
              <div className=" grid grid-cols-1 md:grid-cols-2 gap-5">
                <CustomInput
                  type="text"
                  name="title_ar"
                  placeholder="الاسم بالعربية"
                  label="الاسم بالعربية"
                />
                <CustomInput
                  type="text"
                  name="title_en"
                  placeholder='"الاسم بالإنجليزية"'
                  label="الاسم بالإنجليزية"
                />
                <RichTextEditor
                  label="الوصف بالعربية"
                  name="description_ar"
                  formikProps={props}
                  className="md:col-span-2"
                />
                <RichTextEditor
                  label="الوصف بالإنجليزية"
                  name="description_en"
                  formikProps={props}
                  className="md:col-span-2"
                />
                <CustomSelect
                  name="files"
                  title="المرفقات"
                  placeholder="- اختر ـ"
                  options={[
                    { label: "خدمة", value: "service" },
                    { label: "تطبيق", value: "app" },
                  ]}
                  formikProps={props}
                  label="label"
                  value="value"
                />
                <CustomSelect
                  name="service_type"
                  title="نوع الخدمة"
                  placeholder="- اختر ـ"
                  options={[
                    { label: "خدمة", value: "service" },
                    { label: "تطبيق", value: "app" },
                  ]}
                  formikProps={props}
                  label="label"
                  value="value"
                />
                <CustomSelect
                  name="app_type"
                  title="نوع التطبيق"
                  placeholder="- اختر ـ"
                  options={[
                    { label: "خدمة", value: "service" },
                    { label: "تطبيق", value: "app" },
                  ]}
                  formikProps={props}
                  label="label"
                  value="value"
                />
                <CustomSelect
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
                />
              </div>
            </div>
          </Form>
        )}
      </Formik>
    </MainLayout>
  );
};

export default Page;
