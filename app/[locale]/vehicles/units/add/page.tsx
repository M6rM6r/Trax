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
import { validationForUnits } from "@/lib/types/validationTypes";
import { useRouter } from "next/navigation";
import { allEnumsData } from "@/lib/types/enums";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const CustomSelect = dynamic(
  () => import("@/components/shared/form/CustomSelect")
);

const Page = ({ params }: { params: { locale: string } }) => {
  const { showResponseToast } = useResponseToast();
  const router = useRouter();
  const [showWarningDialog, setShowWarningDialog] = useState(false);

  // Map Arabic values from API to English values for comparison
  const mapArabicToEnglish = (arabicValue: string, type: 'type' | 'unit') => {
    if (type === 'type') {
      // Handle both full and short versions from API
      if (arabicValue === 'صالح للشرب' || arabicValue === 'صالح') return 'valid';
      if (arabicValue === 'غير صالح للشرب' || arabicValue === 'غير صالح') return 'invalid';
    }
    if (type === 'unit') {
      if (arabicValue === 'طن') return 'ton';
      if (arabicValue === 'جالون') return 'gallon';
    }
    return arabicValue; // fallback to original value
  };

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
            label: "وحدات الفونتاس",
          },
          {
            icon: <Flash className="w-5 text-textSubTextDarker" />,
            label: "إنشاء وحدة فونتاس",
          },
        ]}
      />
      <GoBack />
      <Formik<{
        type: string;
        unit: string;
        value: number;
        basic_price: number;
        is_active: string;
      }>
        initialValues={{
          type: "",
          unit: "",
          value: 0,
          basic_price: 0,
          is_active: "0",
        }}
        validationSchema={validationForUnits}
        onSubmit={async (values, { setSubmitting }) => {
          try {
            // Check if a unit with same data already exists
            const existingUnits = await fetcherClient<any>("/fontasUnits?itemPerPage=50");

            // Find matching unit with same type, unit, and value
            const duplicateUnit = existingUnits?.data?.records?.find(
              (unit: any) => {
                const mappedType = mapArabicToEnglish(unit.type, 'type');
                const mappedUnit = mapArabicToEnglish(unit.unit, 'unit');

                return mappedType === values.type &&
                       mappedUnit === values.unit &&
                       parseFloat(unit.value) === parseFloat(values.value.toString());
              }
            );

            if (duplicateUnit) {
              if (duplicateUnit.is_active === 1) {
                // Case 1: Unit exists and is active
                showResponseToast({
                  success: false,
                  message: "الوحدة موجودة بالفعل ومفعّلة",
                });
              } else {
                // Case 2: Unit exists but is inactive
                showResponseToast({
                  success: false,
                  message: "الوحدة موجودة مسبقاً ولكن غير مفعّلة، يُرجى تفعيلها من صفحة التعديل",
                });
              }
              setSubmitting(false);
              return; // Stop submission
            }

            // Case 3: No duplicate found, proceed with creation
            const formdata: any = new FormData();
            formdata.append("type", values.type);
            formdata.append("unit", values.unit);
            formdata.append("value", values.value.toString());
            formdata.append("basic_price", values.basic_price.toString());
            formdata.append("is_active", values.is_active.toString());

            await fetcherClient<any>("/fontasUnits", {
              method: "POST",
              body: formdata,
            });

            setShowWarningDialog(true);
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
                إنشاء وحدة فونتاس
              </h2>
              <Button
                variant={"primary"}
                type="submit"
                disabled={props.isSubmitting}
              >
                انشىء الوحدة
              </Button>
            </div>
            <div className="flex flex-col gap-5 p-4 border border-gray200 rounded-6">
              <p className="text-16 text-textMain font-[600]">تفاصيل الوحدة</p>
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
                />
                <CustomInput
                  type="number"
                  name="value"
                  placeholder="القيمة"
                  label="القيمة"
                />
              </div>
            </div>
          </Form>
        )}
      </Formik>

      <Dialog open={showWarningDialog} onOpenChange={setShowWarningDialog}>
        <DialogContent className="max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-center text-24 text-textMain font-[700] mb-4">
              تنبيه هام
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 p-4">
            <div className="bg-accentWarningLight border border-accentWarning rounded-6 p-4">
              <p className="text-18 text-textMain font-[600] mb-3">
                ✓ تم إنشاء وحدة الفونتاس بنجاح
              </p>
              <div className="space-y-3 text-16 text-textMain">
                <p className="font-[600]">يُرجى الانتباه للنقاط التالية:</p>
                <ul className="list-disc list-inside space-y-2 pr-2">
                  <li>
                    الوحدة المُنشأة <span className="font-[600]">غير مفعّلة</span> افتراضياً
                  </li>
                  <li>
                    قبل التفعيل، يجب ضبط <span className="font-[600]">إعدادات الأسعار</span> الخاصة بالوحدة من صفحة التعديل
                  </li>
                  <li>
                    بمجرد ربط سائق بهذه الوحدة، <span className="font-[600]">لن يمكنك حذفها أو تعطيلها</span>
                  </li>
                </ul>
              </div>
            </div>
            <Button
              variant="primary"
              onClick={() => {
                setShowWarningDialog(false);
                router.push(`/${params.locale}/vehicles/units`);
              }}
              className="w-full"
            >
              فهمت، انتقل إلى قائمة الوحدات
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default Page;
