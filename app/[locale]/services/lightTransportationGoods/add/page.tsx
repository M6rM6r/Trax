"use client";
import MainLayout from "@/components/shared/MainLayout";
import BreadCrumb from "@/components/shared/BreadCrumb";
import { Flash, Star } from "@/public/SVG";
import { Button } from "@/components/ui/button";
import GoBack from "@/components/shared/GoBack";
import { Form, Formik } from "formik";
import dynamic from "next/dynamic";
import { useResponseToast } from "@/lib/toastUtils";
import { fetcherClient } from "@/lib/fetcherClient";
import { useRouter } from "next/navigation";
import CustomFileImage, {
  EImageType,
} from "@/components/shared/form/CustomFileImage";
import CustomInput from "@/components/shared/form/CustomInput";
import { useEffect, useState } from "react";
import { CargoTypes, Record } from "@/lib/types/responseTypes";
import * as Yup from "yup";

const CustomSelect = dynamic(
  () => import("@/components/shared/form/CustomSelect")
);

//  Validation Schema جديد
const validationSchema = Yup.object({
  name_ar: Yup.string().required("الاسم بالعربية مطلوب"),
  name_en: Yup.string().required("الاسم بالانجليزية مطلوب"),
  cargo_type: Yup.string().required("نوع الخدمة مطلوب"),
});

const Page = () => {
  const { showResponseToast } = useResponseToast();
  const router = useRouter();
  const [CargoTypes, setCargoTypes] = useState<Record[]>([]);
  const [BasinSizes, setBasinSizes] = useState<Record[]>([]);
  const [WeightUnit, setWeightUnit] = useState<Record[]>([]);

  //  جلب القوائم
  useEffect(() => {
    const getCargoTypes = async () => {
      try {
        const res = await fetcherClient<CargoTypes>(
          `/enumDDLList?enum_name=CargoTypes`,
          { cache: "force-cache" }
        );
        setCargoTypes(res.data.records);
      } catch (error: any) {}
    };
    getCargoTypes();
  }, []);

  useEffect(() => {
    const getBasinSizes = async () => {
      try {
        const res = await fetcherClient<CargoTypes>(
          `/enumDDLList?enum_name=BasinSizes`,
          { cache: "force-cache" }
        );
        setBasinSizes(res.data.records);
      } catch (error: any) {}
    };
    getBasinSizes();
  }, []);

  useEffect(() => {
    const getWeightUnit = async () => {
      try {
        const res = await fetcherClient<CargoTypes>(
          `/enumDDLList?enum_name=WeightUnit`,
          { cache: "force-cache" }
        );
        setWeightUnit(res.data.records);
      } catch (error: any) {}
    };
    getWeightUnit();
  }, []);
  return (
    <MainLayout showSidebar={false}>
      <BreadCrumb
        labels={[
          { icon: <Star className="w-5 text-iconColor" />, label: "الخدمات" },
          {
            icon: <Flash className="w-5 text-iconColor" />,
            label: "النقل الخفيف",
          },
          {
            icon: <Flash className="w-5 text-textSubTextDarker" />,
            label: "أضف نوع لخدمة النقل الخفيف",
          },
        ]}
      />
      <GoBack />
      <Formik
        initialValues={{
          icon: null,
          name_ar: "",
          name_en: "",
          is_active: "1",
          cargo_type: "",
          basin_size: "",
          full_basin_price: 0,
          half_basin_price: 0,
          unit: "",
          price_per_unit: 0,
          free_limit: 0,
        }}
        validationSchema={validationSchema}
        onSubmit={async (values, { setSubmitting }) => {
          const formdata = new FormData();

          // أيقونة لو موجودة
          if (values.icon) formdata.append("icon", values.icon);

          // الحقول الأساسية المشتركة
          formdata.append("name_ar", values.name_ar);
          formdata.append("name_en", values.name_en);
          formdata.append("is_active", values.is_active);
          formdata.append("cargo_type", values.cargo_type);

          // الحقول حسب الـ cargo_type
          if (values.cargo_type === "basin") {
            formdata.append("basin_size", values.basin_size);

            if (values.basin_size === "full_basin") {
              formdata.append(
                "full_basin_price",
                Number(values.full_basin_price).toFixed(2)
              );
            }

            if (values.basin_size === "half_basin") {
              formdata.append(
                "half_basin_price",
                Number(values.half_basin_price).toFixed(2)
              );
            }

            if (values.basin_size === "all") {
              formdata.append(
                "full_basin_price",
                Number(values.full_basin_price).toFixed(2)
              );
              formdata.append(
                "half_basin_price",
                Number(values.half_basin_price).toFixed(2)
              );
            }
          }

          if (values.cargo_type === "weight") {
            formdata.append("unit", values.unit);
            formdata.append("free_limit", values.free_limit.toString());
            formdata.append("price_per_unit", Number(values.price_per_unit).toFixed(2));
          }

          if (values.cargo_type === "count") {
            formdata.append("price_per_unit", Number(values.price_per_unit).toFixed(2));
            formdata.append("free_limit", values.free_limit.toString());
          }

          try {
            const response = await fetcherClient<any>(
              "/lightTransportationCargo",
              {
                method: "POST",
                body: formdata,
              }
            );
            showResponseToast(response);
            router.push("/ar/services/light_transportation");
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
                أضف نوع بضاعة لخدمة النقل الخفيف
              </h2>
              <Button variant="primary" type="submit">
                أضف الخدمة
              </Button>
            </div>

            <div className="flex flex-col gap-5 p-4 border border-gray200 rounded-6">
              <p className="text-16 text-textMain font-[600]">
                تفاصيل نوع الخدمة
              </p>

              <CustomFileImage
                name="icon"
                formikProps={props}
                imageType={EImageType.image}
                value={props.values.icon}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                <CustomInput
                  type="text"
                  name="name_ar"
                  label="الاسم بالعربية"
                  placeholder="الاسم بالعربية"
                />
                <CustomInput
                  type="text"
                  name="name_en"
                  label="الاسم بالانجليزية"
                  placeholder="الاسم بالانجليزية"
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
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <CustomSelect
                  name="cargo_type"
                  title="نوع الخدمة"
                  placeholder="- اختر ـ"
                  options={
                    Array.isArray(CargoTypes)
                      ? CargoTypes.map((item) => ({
                          label: item.value,
                          value: item.key,
                        }))
                      : []
                  }
                  formikProps={props}
                  label="label"
                  value="value"
                />

                {props.values.cargo_type === "basin" && (
                  <>
                    <CustomSelect
                      name="basin_size"
                      title="حجم الحوض"
                      placeholder="- اختر ـ"
                      options={
                        Array.isArray(BasinSizes)
                          ? BasinSizes.map((item) => ({
                              label: item.value,
                              value: item.key,
                            }))
                          : []
                      }
                      formikProps={props}
                      label="label"
                      value="value"
                    />

                    {props.values.basin_size === "full_basin" && (
                      <CustomInput
                        name="full_basin_price"
                        type="number"
                        label="سعر الحوض الكامل"
                        placeholder="0"
                      />
                    )}

                    {props.values.basin_size === "half_basin" && (
                      <CustomInput
                        name="half_basin_price"
                        type="number"
                        label="سعر نصف الحوض"
                        placeholder="0"
                      />
                    )}

                    {props.values.basin_size === "all" && (
                      <>
                        <CustomInput
                          name="full_basin_price"
                          type="number"
                          label="سعر الحوض الكامل"
                          placeholder="0"
                        />
                        <CustomInput
                          name="half_basin_price"
                          type="number"
                          label="سعر نصف الحوض"
                          placeholder="0"
                        />
                      </>
                    )}
                  </>
                )}

                {props.values.cargo_type === "weight" && (
                  <>
                    <CustomSelect
                      name="unit"
                      title="الوحدة "
                      placeholder="- اختر ـ"
                      options={
                        Array.isArray(WeightUnit)
                          ? WeightUnit.map((item) => ({
                              label: item.value,
                              value: item.key,
                            }))
                          : []
                      }
                      formikProps={props}
                      label="label"
                      value="value"
                    />
                    <CustomInput
                      name="free_limit"
                      type="number"
                      label="الوزن المجاني"
                      placeholder="0"
                    />
                    <CustomInput
                      name="price_per_unit"
                      type="number"
                      label="السعر/ الوحدة لأكثر من الوزن المجاني"
                      placeholder="0"
                    />
                  </>
                )}

                {props.values.cargo_type === "count" && (
                  <>
                    <CustomInput
                      name="price_per_unit"
                      type="number"
                      label="السعر / الوحدة  لاكتر من الوزن المجانى"
                      placeholder="0"
                    />
                    <CustomInput
                      name="free_limit"
                      type="number"
                      label="العدد المجاني"
                      placeholder="0"
                    />
                  </>
                )}
              </div>
            </div>
          </Form>
        )}
      </Formik>
    </MainLayout>
  );
};

export default Page;
