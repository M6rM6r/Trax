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
import { validationForPages } from "@/lib/types/validationTypes";
import { useRouter } from "next/navigation";
import RichTextEditor from "@/components/shared/RichTextEditor";
import CustomFileInput from "@/components/shared/CustomFileInput";
import { AllEnums, InfoPagesTypes } from "@/lib/types/responseTypes";
import { useEffect, useState } from "react";
const CustomSelect = dynamic(
  () => import("@/components/shared/form/CustomSelect")
);
const Page = () => {
  const { showResponseToast } = useResponseToast();
  const router = useRouter();
  const [infoPages, setInfoPages] = useState<InfoPagesTypes | null>(null);
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
        setInfoPages(res.InfoPagesTypes);
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
            label: "إنشاء صفحة",
          },
        ]}
      />
      <GoBack />
      <Formik<{
        title_ar: string;
        title_en: string;
        description_en: string;
        description_ar: string;
        app: string;
        type: string;
        files: File[];
        is_active: string;
      }>
        initialValues={{
          title_ar: "",
          title_en: "",
          description_en: "",
          description_ar: "",
          app: "",
          type: "",
          files: [],
          is_active: "",
        }}
        validationSchema={validationForPages}
        onSubmit={async (values, { setSubmitting }) => {
          const formdata: any = new FormData();
          formdata.append("title_ar", values.title_ar);
          formdata.append("title_en", values.title_en);
          formdata.append("description_ar", values.description_ar);
          formdata.append("description_en", values.description_en);
          formdata.append("app", values.app);
          formdata.append("type", values.type);
          values.files.length > 0 &&
            values.files.forEach((file) => {
              formdata.append("files[]", file);
            });
          formdata.append("is_active", values.is_active.toString());
          try {
            const response = await fetcherClient<any>("/infoPages", {
              method: "POST",
              body: formdata,
            });
            showResponseToast(response);
            if (response.success) {
              router.push("/ar/apps/pages");
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
              <h2 className="text-20 text-textMain font-[700]">إنشاء صفحة</h2>
              <Button variant={"primary"} disabled={props.isSubmitting}>
                انشىء الصفحة
              </Button>
            </div>
            <div className="flex flex-col gap-5 p-4 border border-gray200 rounded-6">
              <p className="text-16 text-textMain font-[600]">تفاصيل الصفحة</p>
              <div className=" grid grid-cols-1 md:grid-cols-2 gap-5">
                <CustomInput
                  type="text"
                  name="title_ar"
                  placeholder="اسم الماركة باللغة العربية"
                  label="الاسم بالعربية"
                />
                <CustomInput
                  type="text"
                  name="title_en"
                  placeholder="اسم الماركة باللغة الانجليزية"
                  label="الاسم بالإنجليزية"
                />
                <RichTextEditor
                  name="description_ar"
                  label="الوصف بالعربية"
                  formikProps={props}
                  className="md:col-span-2"
                />
                <RichTextEditor
                  name="description_en"
                  label="الوصف بالانجليزية"
                  formikProps={props}
                  className="md:col-span-2"
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
                />
                <CustomSelect
                  name="type"
                  title="نوع الصفحة"
                  placeholder="- اختر ـ"
                  options={
                    infoPages
                      ? Object.entries(infoPages.ar).map(([key, value]) => ({
                          label: value,
                          value: key,
                        }))
                      : []
                  }
                  formikProps={props}
                  label="label"
                  value="value"
                />
                <CustomFileInput
                  name="files"
                  label="الملفات"
                  formikProps={props}
                  containerClassName="md:col-span-2"
                  acceptedTypes="image/*,.pdf,.doc,.docx"
                  maxFiles={5}
                  maxSize={5 * 1024 * 1024}
                  multiple={true}
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
