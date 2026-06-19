"use client";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { fetcherClient } from "@/lib/fetcherClient";
import {
  BrandModelResponse,
  CarModelResponse,
  ColorModelResponse,
} from "@/lib/types/responseTypes";
import { FormikProps } from "formik";
import dynamic from "next/dynamic";
import { useState, useEffect } from "react";

const CustomSelect = dynamic(
  () => import("@/components/shared/form/CustomSelect")
);

const Step2 = ({ formikProps }: { formikProps: FormikProps<any> }) => {
  const [brands, setBrands] = useState<BrandModelResponse | null>(null);
  const [carModel, setCarModel] = useState<CarModelResponse | null>(null);
  const [colorModel, setColorModel] = useState<ColorModelResponse | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const brandPromise = fetcherClient<BrandModelResponse>(
          "/modelDDLList?model_name=Brand",
          {
            cache: "force-cache",
            next: { revalidate: 300 },
          }
        );
        const carModelPromise = fetcherClient<CarModelResponse>(
          "/modelDDLList?model_name=CarModel",
          {
            cache: "force-cache",
            next: { revalidate: 300 },
          }
        );
        const colorModelPromise = fetcherClient<ColorModelResponse>(
          "/modelDDLList?model_name=Color",
          {
            cache: "force-cache",
            next: { revalidate: 300 },
          }
        );

        const [brandModelData, carModelData, colorModelData] =
          await Promise.all([brandPromise, carModelPromise, colorModelPromise]);

        setBrands(brandModelData);
        setCarModel(carModelData);
        setColorModel(colorModelData);
      } catch (err) {}
    };

    fetchData();
  }, []);

  const brandModelOptions =
    brands?.data?.records?.map((brand) => ({
      label: brand.name_ar,
      value: brand.id,
    })) || [];
  const vehicleModelOptions =
    carModel?.data?.records?.map((model) => ({
      label: model.name_ar,
      value: model.id,
    })) || [];
  const vehicleColorOptions =
    colorModel?.data?.records?.map((color) => ({
      label: color.name_ar,
      value: color.id,
    })) || [];

  return (
    <>
      {brandModelOptions.length > 0 &&
        vehicleModelOptions.length > 0 &&
        vehicleColorOptions.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <CustomSelect
                name="vehicleType"
                title="نوع المركبة"
                placeholder="- اختر ـ"
                formikProps={formikProps}
                options={brandModelOptions}
                label="label"
                value="value"
                initialValue={formikProps.values.vehicleType}
              />
              <CustomSelect
                name="vehicleModel"
                title="طراز المركبة"
                placeholder="- اختر ـ"
                formikProps={formikProps}
                options={vehicleModelOptions}
                label="label"
                value="value"
                initialValue={formikProps.values.vehicleModel}
              />
              <CustomSelect
                name="vehicleColor"
                title="لون المركبة"
                placeholder="- اختر ـ"
                formikProps={formikProps}
                options={vehicleColorOptions}
                label="label"
                value="value"
                initialValue={formikProps.values.vehicleColor}
              />
              <CustomSelect
                name="seatsNumber"
                title="عدد المقاعد"
                placeholder="- اختر ـ"
                formikProps={formikProps}
                options={[
                  { label: "1", value: 1 },
                  { label: "2", value: 2 },
                  { label: "3", value: 3 },
                  { label: "4", value: 4 },
                  { label: "5", value: 5 },
                  { label: "6", value: 6 },
                ]}
                label="label"
                value="value"
                initialValue={formikProps.values.seatsNumber}
              />
            </div>
            <p className="text-14 text-primaryColor font-[600]">
              القواعد الخاصة به
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {formikProps.values.rules?.map((rule: any) => (
                <div key={rule.id} className="flex items-center gap-2">
                  <Checkbox
                    id={rule.id.toString()}
                    checked={rule.is_assigned}
                    onCheckedChange={(value) =>
                      formikProps.setFieldValue(
                        "rules",
                        formikProps.values.rules.map((r: any) =>
                          r.id === rule.id ? { ...r, is_assigned: value } : r
                        )
                      )
                    }
                  />
                  <label
                    htmlFor={rule.id.toString()}
                    className="text-14 text-textMain peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {rule.title}
                  </label>
                </div>
              ))}
            </div>
            <div>
              <div className="flex items-center justify-between gap-5">
                <p className="text-14 text-primaryColor font-[600]">
                  خدمة سيارة تاكسي مع مواعيد مهمة
                </p>
                <Switch
                  checked={formikProps.values.importantAppointments == 1}
                  onCheckedChange={(value) =>
                    formikProps.setFieldValue(
                      "importantAppointments",
                      value ? 1 : 0
                    )
                  }
                />
              </div>
              <p className="text-12 text-textMain mt-3">
                هل تفكر في تحسين تجربة ركوب السيارة لعملائك؟ قم بتفعيل خدمة
                المواعيد المهمة الآن! تتيح لك هذه الخدمة فرصة تحديد المواعيد
                المهمة مسبقًا وتوفير خدمة عالية الجودة لعملائك. قم بتشغيل هذه
                الخدمة إذا كانت سيارتك تدعمها وابدأ في كسب المزيد من الثقة
                والرضا من العملاء.
              </p>
            </div>
          </>
        )}
    </>
  );
};

export default Step2;
