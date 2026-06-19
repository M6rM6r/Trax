"use client";
import MainLayout from "@/components/shared/MainLayout";
import BreadCrumb from "@/components/shared/BreadCrumb";
import { Flash, ShieldTick } from "@/public/SVG";
import { Button } from "@/components/ui/button";
import GoBack from "@/components/shared/GoBack";
import { Form, Formik } from "formik";
import CustomInput from "@/components/shared/form/CustomInput";
import dynamic from "next/dynamic";
import { useResponseToast } from "@/lib/toastUtils";
import { fetcherClient } from "@/lib/fetcherClient";
import { validationForRules } from "@/lib/types/validationTypes";
import { useRouter } from "next/navigation";
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
            icon: <ShieldTick className="w-5 text-iconColor" />,
            label: "السائقين",
          },
          {
            icon: <Flash className="w-5 text-iconColor" />,
            label: "قواعد السائقين",
          },
          {
            icon: <Flash className="w-5 text-textSubTextDarker" />,
            label: "إنشاء قاعدة",
          },
        ]}
      />
      <GoBack />
      <Formik<{
        title_ar: string;
        title_en: string;
        description_ar: string;
        description_en: string;
        is_active: string;
      }>
        initialValues={{
          title_ar: "",
          title_en: "",
          description_ar: "",
          description_en: "",
          is_active: "",
        }}
        validationSchema={validationForRules}
        onSubmit={async (values, { setSubmitting }) => {
          // 
          const formdata: any = new FormData();
          formdata.append("title_ar", values.title_ar);
          formdata.append("title_en", values.title_en);
          formdata.append("description_ar", values.description_ar);
          formdata.append("description_en", values.description_en);
          formdata.append("is_active", values.is_active.toString());
          try {
            const response = await fetcherClient<any>("/rules", {
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
              <h2 className="text-20 text-textMain font-[700]">إنشاء قاعدة</h2>
              <Button variant={"primary"} disabled={props.isSubmitting}>
                انشىء القاعدة
              </Button>
            </div>
            <div className="flex flex-col gap-5 p-4 border border-gray200 rounded-6">
              <p className="text-16 text-textMain font-[600]">تفاصيل القاعدة</p>
              <div className=" grid grid-cols-1 md:grid-cols-2 gap-5">
                <CustomInput
                  type="text"
                  name="title_ar"
                  placeholder="اسم القاعدة باللغة العربية"
                  label="الاسم بالعربية"
                />
                <CustomInput
                  type="text"
                  name="title_en"
                  placeholder="اسم القاعدة باللغة الانجليزية"
                  label="الاسم بالإنجليزية"
                />
                <CustomInput
                  type="text"
                  name="description_ar"
                  placeholder="وصف القاعدة باللغة العربية"
                  label="الوصف بالعربية"
                />
                <CustomInput
                  type="text"
                  name="description_en"
                  placeholder="وصف القاعدة باللغة الانجليزية"
                  label="الوصف بالإنجليزية"
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
                  className="md:col-span-2"
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
