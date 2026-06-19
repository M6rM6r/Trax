"use client";
import { fetcherClient } from "@/lib/fetcherClient";
import {
  BrandModelResponse,
  CarModelResponse,
} from "@/lib/types/responseTypes";
import { FormikProps } from "formik";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
const CustomSelect = dynamic(
  () => import("@/components/shared/form/CustomSelect")
);

const Index = ({ formikProps }: { formikProps: FormikProps<any> }) => {
  const [brands, setBrands] = useState<BrandModelResponse | null>(null);
  const [carModel, setCarModel] = useState<CarModelResponse | null>(null);

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

        const [brandModelData, carModelData] = await Promise.all([
          brandPromise,
          carModelPromise,
        ]);

        setBrands(brandModelData);
        setCarModel(carModelData);
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
  return (
    <>
      {brandModelOptions.length > 0 && vehicleModelOptions.length > 0 && (
        <div className=" grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
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
            name="numberOfCabins"
            title="عدد الكبائن"
            placeholder="- اختر ـ"
            formikProps={formikProps}
            options={[
              { label: "كابينة مفردة", value: "single_cabin" },
              {
                label: "كابينة مزدوجة",
                value: "double_cabin",
              },
            ]}
            label="label"
            value="value"
            initialValue={formikProps.values.numberOfCabins}
          />
        </div>
      )}
    </>
  );
};

export default Index;
