/* eslint-disable @typescript-eslint/no-unused-expressions */
"use client";
import CustomDialog, { Colors } from "@/components/shared/CustomDialog";
import { Button } from "@/components/ui/button";
import { Edit2 } from "@/public/SVG";
import { useEffect, useRef, useState } from "react";
import CustomInput from "@/components/shared/form/CustomInput";
import CustomFileImage, {
  EImageType,
} from "@/components/shared/form/CustomFileImage";
import { Form, Formik } from "formik";
import * as Yup from "yup";
import { fetcherClient } from "@/lib/fetcherClient";
import dynamic from "next/dynamic";
import { useResponseToast } from "@/lib/toastUtils";
import { useRouter } from "next/navigation";
import { CargoTypes, Record } from "@/lib/types/responseTypes";
const CustomSelect = dynamic(
  () => import("@/components/shared/form/CustomSelect")
);

const validationSchema = Yup.object({
  icon: Yup.mixed().nullable(),
  name_ar: Yup.string()
    .required("الاسم بالعربية مطلوب")
    .matches(
      /^(?!\s)(?!.*\s$)[^\d]+$/,
      "الاسم لا يمكن أن يحتوي على أرقام أو مسافات في البداية أو النهاية"
    )
    .min(3, "الاسم يجب ان يكون مكون من 3 حروف على الاقل"),
  name_en: Yup.string()
    .required("الاسم بالإنجليزية مطلوب")
    .min(3, "الاسم يجب ان يكون مكون من 3 حروف على الاقل"),
  is_active: Yup.string().required("الحالة مطلوبة"),
  cargo_type: Yup.string().required("نوع الخدمة مطلوب"),
});

const Index = ({
  lightTransportgoodsData,
}: {
  lightTransportgoodsData: any;
}) => {
  const [CargoTypes, setCargoTypes] = useState<Record[]>([]);
  const [BasinSizes, setBasinSizes] = useState<Record[]>([]);
  const [WeightUnit, setWeightUnit] = useState<Record[]>([]);
  const { showResponseToast } = useResponseToast();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();

  //  state للتحكم في فتح/إغلاق البوباب
  const [open, setOpen] = useState(false);

  const handleClose = () => {
    setOpen(false);
  };

  // Extract details safely
  const details = lightTransportgoodsData.details || [];

  //  تجهيز initialValues بناءً على cargo_type
  const initialValues = {
    icon: null,
    name_ar: lightTransportgoodsData.name_ar || "",
    name_en: lightTransportgoodsData.name_en || "",
    is_active: lightTransportgoodsData.is_active?.toString() || "1",
    cargo_type: lightTransportgoodsData.cargo_type_key?.toString() || "",

    // basin
    basin_size:
      details.find((d: any) => d.basin_size_key)?.basin_size_key || "",

    full_basin_price:
      details.find((d: any) => d.full_basin_price)?.full_basin_price || 0,
    half_basin_price:
      details.find((d: any) => d.half_basin_price)?.half_basin_price || 0,

    // weight
    unit: details.find((d: any) => d.unit_key)?.unit || "",
    price_per_unit:
      details.find((d: any) => d.price_per_unit)?.price_per_unit || "",
    free_limit:
      details.find((d: any) => d.free_limit)?.free_limit?.toString() || "",
  };

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
    <CustomDialog
      title="تعديل بيانات نقل البضائع الخفيفة"
      color={Colors.primary}
      open={open}
      onOpenChange={setOpen}
      trigger={
        <Button variant={"primaryLight"} ref={buttonRef}>
          تعديل البيانات <Edit2 className="w-4 text-primaryColor" />
        </Button>
      }
      content={
        lightTransportgoodsData && (
          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={async (values, { setSubmitting }) => {
              const formdata = new FormData();

              // أيقونة لو موجودة
              if (values.icon) formdata.append("icon", values.icon);

              // الحقول الأساسية
              formdata.append("name_ar", values.name_ar);
              formdata.append("name_en", values.name_en);
              formdata.append("is_active", values.is_active);
              formdata.append("cargo_type", values.cargo_type);

              //  handling حسب النوع
              if (values.cargo_type === "basin") {
                formdata.append("basin_size", values.basin_size);
                formdata.append("full_basin_price", Number(values.full_basin_price || 0).toFixed(2));
                formdata.append("half_basin_price", Number(values.half_basin_price || 0).toFixed(2));
              }

              if (values.cargo_type === "weight") {
                formdata.append("unit", values.unit);
                formdata.append("price_per_unit", Number(values.price_per_unit || 0).toFixed(2));
                formdata.append("free_limit", values.free_limit);
              }

              if (values.cargo_type === "count") {
                formdata.append("price_per_unit", Number(values.price_per_unit || 0).toFixed(2));
                formdata.append("free_limit", values.free_limit);
              }

              // Laravel compatibility
              formdata.append("_method", "PUT");

              try {
                const response = await fetcherClient<any>(
                  `/lightTransportationCargo/${lightTransportgoodsData.id}`,
                  {
                    method: "POST", // Using POST with _method=PUT
                    body: formdata,
                  }
                );
                showResponseToast(response);
                handleClose(); // Close the dialog
                router.refresh(); // Refresh the page data
              } catch (error: any) {
                showResponseToast(error.info);
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {(props) => (
              <Form className="flex flex-col gap-5">
                <CustomFileImage
                  name="icon"
                  formikProps={props}
                  imageType={EImageType.image}
                  value={lightTransportgoodsData.icon}
                />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
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
                    placeholder="- اختر -"
                    options={[
                      { label: "مفعل", value: "1" },
                      { label: "غير مفعل", value: "0" },
                    ]}
                    formikProps={props}
                    label="label"
                    value="value"
                    initialValue={lightTransportgoodsData.is_active?.toString()}
                  />
                  <CustomSelect
                    name="cargo_type"
                    title="نوع الخدمة"
                    placeholder="- اختر -"
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
                    initialValue={lightTransportgoodsData.cargo_type_key?.toString()}
                  />

                  {/* basin */}
                  {props.values.cargo_type === "basin" && (
                    <>
                      <CustomSelect
                        name="basin_size"
                        title="حجم الحوض"
                        placeholder="- اختر -"
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
                        initialValue={
                          details.find((d: any) => d.basin_size_key)
                            ?.basin_size_key || ""
                        }
                      />
                      {(props.values.basin_size === "full_basin" ||
                        props.values.basin_size === "all") && (
                        <CustomInput
                          name="full_basin_price"
                          type="number"
                          label="سعر الحوض الكامل"
                          placeholder="0"
                          step="0.01"
                        />
                      )}

                      {(props.values.basin_size === "half_basin" ||
                        props.values.basin_size === "all") && (
                        <CustomInput
                          name="half_basin_price"
                          type="number"
                          label="سعر نصف الحوض"
                          placeholder="0"
                          step="0.01"
                        />
                      )}
                    </>
                  )}

                  {/* weight */}
                  {props.values.cargo_type === "weight" && (
                    <>
                      <CustomSelect
                        name="unit"
                        title="الوحدة"
                        placeholder="- اختر -"
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
                        initialValue={
                          details.find((d: any) => d.unit_key)?.unit_key || ""
                        }
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

                  {/* count */}
                  {props.values.cargo_type === "count" && (
                    <>
                      <CustomInput
                        name="price_per_unit"
                        type="number"
                        label="السعر/ الوحدة لأكثر من الوزن المجاني"
                        placeholder="0"
                        step="0.01"
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
                <Button type="submit" variant={"primary"} className="ms-auto">
                  حفظ
                </Button>
              </Form>
            )}
          </Formik>
        )
      }
    />
  );
};

export default Index;
