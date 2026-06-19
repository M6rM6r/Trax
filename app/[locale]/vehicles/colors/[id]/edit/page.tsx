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
import { validationForColors } from "@/lib/types/validationTypes";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ColorResponse } from "@/lib/types/responseTypes";
import CustomInputColor from "@/components/shared/form/CustomInputColor";
const CustomSelect = dynamic(
  () => import("@/components/shared/form/CustomSelect")
);
const Page = ({ params }: { params: { id: string } }) => {
  const [data, setData] = useState<ColorResponse>({} as ColorResponse);
  const [loading, setLoading] = useState(true);
  const { showResponseToast } = useResponseToast();
  const router = useRouter();
  useEffect(() => {
    const getRule = async () => {
      try {
        const response = await fetcherClient<ColorResponse>(
          `/colors/${params.id}`
        );
        setData(response);
        setLoading(false);
      } catch (error) {
        
      }
    };
    getRule();
  }, [params.id]);
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
            label: "الألوان",
          },
          {
            icon: <Flash className="w-5 text-textSubTextDarker" />,
            label: "تعديل اللون",
          },
        ]}
      />
      <GoBack />
      {!loading && (
        <Formik<{
          name_ar: string;
          name_en: string;
          hex: string;
          is_active: string;
        }>
          initialValues={{
            name_ar: data.data.color.name_ar,
            name_en: data.data.color.name_en,
            hex: data.data.color.hex,
            is_active: data.data.color.is_active.toString(),
          }}
          validationSchema={validationForColors}
          onSubmit={async (values, { setSubmitting }) => {
            // 
            const formdata: any = new FormData();
            formdata.append("name_ar", values.name_ar);
            formdata.append("name_en", values.name_en);
            formdata.append("hex", values.hex);
            formdata.append("is_active", values.is_active.toString());
            formdata.append("_method", "put");
            try {
              const response = await fetcherClient<any>(
                `/colors/${params.id}`,
                {
                  method: "POST",
                  body: formdata,
                }
              );
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
                  تعديل اللون
                </h2>
                <Button
                  variant={"primary"}
                  type="submit"
                  disabled={props.isSubmitting}
                >
                  حفظ التعديلات
                </Button>
              </div>
              <div className="flex flex-col gap-5 p-4 border border-gray200 rounded-6">
                <p className="text-16 text-textMain font-[600]">
                  تفاصيل القاعدة
                </p>
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
                  <CustomInputColor
                    name="hex"
                    placeholder=""
                    label="اللون"
                    containerClassName="md:col-span-2"
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
                    initialValue={props.values.is_active}
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
