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
import { validationForModels } from "@/lib/types/validationTypes";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BrandsResponse } from "@/lib/types/responseTypes";
import { useLocale } from "next-intl";
import { EVehicleType } from "@/lib/types/enums";
const CustomSelect = dynamic(
  () => import("@/components/shared/form/CustomSelect")
);
const Page = () => {
  const [data, setData] = useState<BrandsResponse>({} as BrandsResponse);
  const [loading, setLoading] = useState(true);
  const { showResponseToast } = useResponseToast();
  const router = useRouter();
  const locale = useLocale();
  useEffect(() => {
    const getBrands = async () => {
      try {
        const response = await fetcherClient<BrandsResponse>(`/brands`);
        setData(response);
        setLoading(false);
      } catch (error) {
        
      }
    };
    getBrands();
  }, []);
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
            label: "موديلات السيارة",
          },
          {
            icon: <Flash className="w-5 text-textSubTextDarker" />,
            label: "إنشاء موديل",
          },
        ]}
      />
      <GoBack />
      {!loading && (
        <Formik<{
          name_ar: string;
          name_en: string;
          brand_id: number;
          type: string;
          is_active: string;
        }>
          initialValues={{
            name_ar: "",
            name_en: "",
            brand_id: 0,
            type: "",
            is_active: "",
          }}
          validationSchema={validationForModels}
          onSubmit={async (values, { setSubmitting }) => {
            // 
            const formdata: any = new FormData();
            formdata.append("name_ar", values.name_ar);
            formdata.append("name_en", values.name_en);
            formdata.append("brand_id", values.brand_id.toString());
            formdata.append("type", values.type);
            formdata.append("is_active", values.is_active.toString());
            try {
              const response = await fetcherClient<any>("/carModels", {
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
                <h2 className="text-20 text-textMain font-[700]">
                  إنشاء موديل
                </h2>
                <Button variant={"primary"} disabled={props.isSubmitting}>
                  انشىء الموديل
                </Button>
              </div>
              <div className="flex flex-col gap-5 p-4 border border-gray200 rounded-6">
                <p className="text-16 text-textMain font-[600]">
                  تفاصيل الموديل
                </p>
                <div className=" grid grid-cols-1 md:grid-cols-2 gap-5">
                  <CustomInput
                    type="text"
                    name="name_ar"
                    placeholder="اسم الموديل باللغة العربية"
                    label="الاسم بالعربية"
                  />
                  <CustomInput
                    type="text"
                    name="name_en"
                    placeholder="اسم الموديل باللغة الانجليزية"
                    label="الاسم بالإنجليزية"
                  />
                  <CustomSelect
                    name="brand_id"
                    title="الماركة"
                    placeholder="- اختر ـ"
                    options={[
                      ...data.data.records.map((item) => ({
                        label: locale === "en" ? item.name_en : item.name_ar,
                        value: item.id,
                      })),
                    ]}
                    formikProps={props}
                    label="label"
                    value="value"
                  />
                  <CustomSelect
                    name="type"
                    title="نوع الموديل"
                    placeholder="- اختر ـ"
                    options={[
                      { label: "سياره تاكسي", value: EVehicleType.taxi },
                      {
                        label: "وايت ماء",
                        value: EVehicleType.fontas,
                      },
                      {
                        label: "واينش",
                        value: EVehicleType.wensh,
                      },
                      {
                        label: "النقل الخفيف",
                        value: EVehicleType.light_transportation,
                      },
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
                    className="md:col-span-2"
                  />
                </div>
              </div>
            </Form>
          )}
        </Formik>
      )}
    </MainLayout>
  );
};

export default Page;
