"use client";
import MainLayout from "@/components/shared/MainLayout";
import BreadCrumb from "@/components/shared/BreadCrumb";
import { Driving, Flash } from "@/public/SVG";
import { Button } from "@/components/ui/button";
import GoBack from "@/components/shared/GoBack";
import { Form, Formik } from "formik";
import CustomInput from "@/components/shared/form/CustomInput";
import dynamic from "next/dynamic";
import { useResponseToast } from "@/lib/toastUtils";
import { fetcherClient } from "@/lib/fetcherClient";
import { validationForBrands } from "@/lib/types/validationTypes";
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
            icon: <Driving className="w-5 text-iconColor" />,
            label: "بيانات المركبات",
          },
          {
            icon: <Flash className="w-5 text-iconColor" />,
            label: "ماركة السيارة",
          },
          {
            icon: <Flash className="w-5 text-textSubTextDarker" />,
            label: "إنشاء ماركة",
          },
        ]}
      />
      <GoBack />
      <Formik<{
        name_ar: string;
        name_en: string;
        is_active: string;
      }>
        initialValues={{
          name_ar: "",
          name_en: "",
          is_active: "",
        }}
        validationSchema={validationForBrands}
        onSubmit={async (values, { setSubmitting }) => {
          // 
          const formdata: any = new FormData();
          formdata.append("name_ar", values.name_ar);
          formdata.append("name_en", values.name_en);
          formdata.append("is_active", values.is_active.toString());
          try {
            const response = await fetcherClient<any>("/brands", {
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
              <h2 className="text-20 text-textMain font-[700]">إنشاء ماركة</h2>
              <Button variant={"primary"} disabled={props.isSubmitting}>
                انشىء ماركة
              </Button>
            </div>
            <div className="flex flex-col gap-5 p-4 border border-gray200 rounded-6">
              <p className="text-16 text-textMain font-[600]">تفاصيل الماركة</p>
              <div className=" grid grid-cols-1 md:grid-cols-2 gap-5">
                <CustomInput
                  type="text"
                  name="name_ar"
                  placeholder="اسم الماركة باللغة العربية"
                  label="الاسم بالعربية"
                />
                <CustomInput
                  type="text"
                  name="name_en"
                  placeholder="اسم الماركة باللغة الانجليزية"
                  label="الاسم بالإنجليزية"
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
