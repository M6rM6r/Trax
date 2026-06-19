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
import { validationForUnits } from "@/lib/types/validationTypes";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { UnitResponse } from "@/lib/types/responseTypes";
import { allEnumsData } from "@/lib/types/enums";

const CustomSelect = dynamic(
  () => import("@/components/shared/form/CustomSelect")
);

const Page = ({ params: routeParams }: { params: { id: string; locale: string } }) => {
  const [data, setData] = useState<UnitResponse>({} as UnitResponse);
  const [loading, setLoading] = useState(true);
  const { showResponseToast } = useResponseToast();
  const router = useRouter();

  // Map Arabic values from API to English values for form
  const mapArabicToEnglish = (arabicValue: string, type: 'type' | 'unit') => {
    if (type === 'type') {
      if (arabicValue === allEnumsData.FontasTypes.ar.valid) return 'valid';
      if (arabicValue === allEnumsData.FontasTypes.ar.invalid) return 'invalid';
    }
    if (type === 'unit') {
      if (arabicValue === allEnumsData.FontasUnits.ar.ton) return 'ton';
      if (arabicValue === allEnumsData.FontasUnits.ar.gallon) return 'gallon';
    }
    return arabicValue; // fallback to original value
  };

  useEffect(() => {
    const getRule = async () => {
      try {
        const response = await fetcherClient<UnitResponse>(
          `/fontasUnits/${routeParams.id}`
        );
        setData(response);
        setLoading(false);
      } catch (error: any) {
        setLoading(false);
        showResponseToast(error.info);
        router.push(`/${routeParams.locale}/vehicles/units`);
      }
    };
    getRule();
  }, [routeParams.id]);
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
            label: "وحدات الفونتاس",
          },
          {
            icon: <Flash className="w-5 text-textSubTextDarker" />,
            label: "تعديل وحدات الفونتاس",
          },
        ]}
      />
      <GoBack />
      {!loading && data?.data?.fontas_unit && (
        <Formik<{
          type: string;
          unit: string;
          value: number;
          basic_price: number;
          is_active: string;
        }>
          initialValues={{
            type: mapArabicToEnglish(data.data.fontas_unit.type, 'type'),
            unit: mapArabicToEnglish(data.data.fontas_unit.unit, 'unit'),
            value: data.data.fontas_unit.value,
            basic_price: data.data.fontas_unit.basic_price,
            is_active: data.data.fontas_unit.is_active.toString(),
          }}
          validationSchema={validationForUnits}
          onSubmit={async (values, { setSubmitting }) => {
            // Check if trying to deactivate unit with active drivers
            if (
              data.data.fontas_unit.is_active === 1 &&
              values.is_active === "0" &&
              data.data.fontas_unit.active_drivers_count > 0
            ) {
              showResponseToast({
                success: false,
                message: "لا يمكن تعطيل وحدة الفونتاس لأن هناك سائقين نشطين مرتبطين بها",
              });
              setSubmitting(false);
              return;
            }

            const formdata: any = new FormData();
            formdata.append("type", values.type);
            formdata.append("unit", values.unit);
            formdata.append("value", values.value.toString());
            formdata.append("basic_price", values.basic_price.toString());
            formdata.append("is_active", values.is_active.toString());
            formdata.append("_method", "put");
            try {
              const response = await fetcherClient<any>(
                `/fontasUnits/${routeParams.id}`,
                {
                  method: "POST",
                  body: formdata,
                }
              );
              showResponseToast(response);
              router.push(`/${routeParams.locale}/vehicles/units`);
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
                  تعديل وحدات الفونتاس
                </h2>
                <Button
                  variant={"primary"}
                  type="submit"
                  disabled={props.isSubmitting}
                >
                  حفظ التعديلات
                </Button>
              </div>

              {data.data.fontas_unit.is_active === 0 && (
                <div className="bg-accentWarningLight border border-accentWarning rounded-6 p-4">
                  <p className="text-16 text-textMain font-[600] mb-2">⚠️ تنبيه هام</p>
                  <ul className="list-disc list-inside space-y-2 text-14 text-textMain pr-2">
                    <li>
                      قبل التفعيل، يجب ضبط <span className="font-[600]">إعدادات الأسعار</span> الخاصة بالوحدة من صفحة التعديل
                    </li>
                    <li>
                      بمجرد ربط سائق بهذه الوحدة، <span className="font-[600]">لن يمكنك حذفها أو تعطيلها</span>
                    </li>
                  </ul>
                </div>
              )}

              <div className="flex flex-col gap-5 p-4 border border-gray200 rounded-6">
                <p className="text-16 text-textMain font-[600]">
                  تفاصيل الوحدة
                </p>
                <div className=" grid grid-cols-1 md:grid-cols-2 gap-5">
                  <CustomSelect
                    name="type"
                    title="النوع"
                    placeholder="- اختر ـ"
                    options={[
                      {
                        value: "valid",
                        label: allEnumsData.FontasTypes.ar.valid,
                      },
                      {
                        value: "invalid",
                        label: allEnumsData.FontasTypes.ar.invalid,
                      },
                    ]}
                    formikProps={props}
                    label="label"
                    value="value"
                    initialValue={props.values.type}
                  />
                  <CustomSelect
                    name="unit"
                    title="وحدة"
                    placeholder="- اختر ـ"
                    options={[
                      {
                        value: "ton",
                        label: allEnumsData.FontasUnits.ar.ton,
                      },
                      {
                        value: "gallon",
                        label: allEnumsData.FontasUnits.ar.gallon,
                      },
                    ]}
                    formikProps={props}
                    label="label"
                    value="value"
                    initialValue={props.values.unit}
                  />
                  <CustomInput
                    type="number"
                    name="value"
                    placeholder="القيمة"
                    label="القيمة"
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
