"use client";
import { fetcherClient } from "@/lib/fetcherClient";
import { FormikProps } from "formik";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
const CustomSelect = dynamic(
  () => import("@/components/shared/form/CustomSelect")
);

const Index = ({ formikProps }: { formikProps: FormikProps<any> }) => {
  const [volums, setvolums] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const allvolums = await fetcherClient<any>(
          `/modelDDLList?model_name=FontasUnit&is_active=1&filters[type]=${
            formikProps.values.fontas_type == "صالح للشرب" ? "valid" : "invalid"
          }`,
          {
            cache: "force-cache",
            next: { revalidate: 300 },
          }
        );
        setvolums(allvolums);
      } catch (err) {}
    };

    fetchData();
  }, [formikProps.values.fontas_type]);

  const volumOptions = volums?.data?.records?.map((item: any) => ({
    label: `${item.unit}-${item.value}`,
    value: item.id,
  }));

  return (
    <>
      {volumOptions?.length > 0 && (
        <div className=" grid grid-cols-1 md:grid-cols-2 gap-5">
          <CustomSelect
            name="fontas_type"
            title="صالح للشرب؟"
            placeholder="- اختر ـ"
            formikProps={formikProps}
            options={[
              { label: "صالح للشرب", value: "صالح للشرب" },
              { label: "غير صالح للشرب", value: "غير صالح للشرب" },
            ]}
            label="label"
            value="value"
            initialValue={formikProps.values.fontas_type}
          />
          <CustomSelect
            name="fontas_unit_id"
            title="حجم الصهريج"
            placeholder="- اختر ـ"
            formikProps={formikProps}
            options={volumOptions}
            label="label"
            value="value"
            initialValue={formikProps.values.fontas_unit_id}
          />
        </div>
      )}
    </>
  );
};

export default Index;
