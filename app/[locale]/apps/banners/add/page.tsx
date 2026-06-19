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
import { validationForBanners } from "@/lib/types/validationTypes";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AllEnums } from "@/lib/types/responseTypes";
import CustomFileInput from "@/components/shared/CustomFileInput";
const CustomSelect = dynamic(
  () => import("@/components/shared/form/CustomSelect")
);
const Page = ({ params }: { params: { locale: string } }) => {
  const { showResponseToast } = useResponseToast();
  const router = useRouter();
  const [appTypes, setAppTypes] = useState<{
    en: any;
    ar: any;
  } | null>(null);
  useEffect(() => {
    const getAllEnums = async () => {
      try {
        const res = await fetcherClient<AllEnums>("/allEnums", {
          cache: "force-cache",
        });
        setAppTypes(res.AppTypes);
      } catch (error) {
        
      }
    };
    getAllEnums();
  }, []);
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
            label: "الصفحات",
          },
          {
            icon: <Flash className="w-5 text-textSubTextDarker" />,
            label: "إنشاء لافتة",
          },
        ]}
      />
      <GoBack />
      <Formik<{
        title_ar: string;
        title_en: string;
        target_url: string;
        order: string;
        banner_ar: File | "";
        banner_en: File | "";
        app: string;
        is_active: string;
      }>
        initialValues={{
          title_ar: "",
          title_en: "",
          target_url: "",
          order: "",
          banner_ar: "",
          banner_en: "",
          app: "",
          is_active: "",
        }}
        validationSchema={validationForBanners}
        onSubmit={async (values, { setSubmitting }) => {
          const formdata: any = new FormData();
          formdata.append("title_ar", values.title_ar);
          formdata.append("title_en", values.title_en);
          formdata.append("target_url", values.target_url);
          formdata.append("order", values.order);
          values.banner_ar && formdata.append("banner_ar", values.banner_ar);
          values.banner_en && formdata.append("banner_en", values.banner_en);
          formdata.append("app", values.app);
          formdata.append("is_active", values.is_active.toString());
          try {
            const response = await fetcherClient<any>("/banners", {
              method: "POST",
              body: formdata,
            });
            showResponseToast(response);
            if (response.success) {
              router.push(`/${params.locale}/apps/banners`);
            }
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
              <h2 className="text-20 text-textMain font-[700]">إنشاء لافتة</h2>
              <Button variant={"primary"} disabled={props.isSubmitting}>
                انشىء اللافتة
              </Button>
            </div>
            <div className="flex flex-col gap-5 p-4 border border-gray200 rounded-6">
              <p className="text-16 text-textMain font-[600]">تفاصيل اللافتة</p>
              <div className=" grid grid-cols-1 md:grid-cols-2 gap-5">
                <CustomInput
                  type="text"
                  name="title_ar"
                  placeholder="العنوان بالعربية"
                  label="العنوان بالعربية"
                />
                <CustomInput
                  type="text"
                  name="title_en"
                  placeholder="العنوان بالإنجليزية"
                  label="العنوان بالإنجليزية"
                />
                <CustomInput
                  type="url"
                  name="target_url"
                  placeholder="عنوان الهدف"
                  label="عنوان الهدف"
                />
                <CustomSelect
                  name="order"
                  title="الترتيب"
                  placeholder="- اختر ـ"
                  options={[
                    { label: "1", value: "1" },
                    { label: "2", value: "2" },
                    { label: "3", value: "3" },
                    { label: "4", value: "4" },
                    { label: "5", value: "5" },
                    { label: "6", value: "6" },
                    { label: "7", value: "7" },
                    { label: "8", value: "8" },
                    { label: "9", value: "9" },
                    { label: "10", value: "10" },
                  ]}
                  formikProps={props}
                  label="label"
                  value="value"
                />
                <CustomFileInput
                  name="banner_ar"
                  label="اللافتة بالعربية"
                  formikProps={props}
                  acceptedTypes="image/*"
                  maxFiles={5}
                  maxSize={5 * 1024 * 1024}
                  multiple={false}
                />
                <CustomFileInput
                  name="banner_en"
                  label="اللافتة بالإنجليزية"
                  formikProps={props}
                  acceptedTypes="image/*"
                  maxFiles={5}
                  maxSize={5 * 1024 * 1024}
                  multiple={false}
                />
                <CustomSelect
                  name="app"
                  title="نوع التطبيق"
                  placeholder="- اختر ـ"
                  options={
                    appTypes
                      ? Object.entries(appTypes.ar).map(([key, value]) => ({
                          label: value as string,
                          value: key,
                        }))
                      : []
                  }
                  formikProps={props}
                  label="label"
                  value="value"
                  className="md:col-span-2"
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
