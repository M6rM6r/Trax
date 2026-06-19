"use client";
import CustomInput from "@/components/shared/form/CustomInput";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { fetcherClient } from "@/lib/fetcherClient";
import { useResponseToast } from "@/lib/toastUtils";
import { validationForPricesFuel } from "@/lib/types/validationTypes";
import { Form, Formik } from "formik";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { revalidateServiceCache } from "@/app/actions/revalidate";

const Index = ({
  is_coming_soon,
  is_hidden,
  service_price,
  fuel_91_price,
  fuel_95_price,
  dezel_price,
  price_per_km,
  price_per_minute,
  base_price,
  minimum_charge,
  waiting_cost,
  cancellation_cost,
  service_settings,
  serviceName,
  change_tires_price,
  external_patch_service_price,
  tire_air_fill_price,
  distance_from_paved_road,
}: {
  is_coming_soon: string | number;
  is_hidden: string | number;
  service_price: string | number;
  fuel_91_price?: string | number;
  fuel_95_price?: string | number;
  dezel_price?: string | number;
  price_per_km: string | number;
  price_per_minute: string | number;
  base_price: string | number;
  minimum_charge: string | number;
  waiting_cost: string | number;
  cancellation_cost: string | number;
  service_settings: any[];
  serviceName: string;
  tire_air_fill_price?: string | number;
  external_patch_service_price?: string | number;
  change_tires_price?: string | number;
  distance_from_paved_road?: string | number;
}) => {
  const params = useParams();
  const searchParams = useSearchParams();
  const { showResponseToast } = useResponseToast();
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);

  useEffect(() => {
    const filteredMethods = service_settings.filter(
      (item: any) => item.key === "payment_method"
    );
    setPaymentMethods(filteredMethods);
  }, [service_settings]);

  const initialValues = {
    is_coming_soon,
    is_hidden,
    service_price,
    fuel_91_price,
    fuel_95_price,
    dezel_price,
    price_per_km,
    price_per_minute,
    base_price,
    minimum_charge,
    waiting_cost,
    cancellation_cost,
    change_tires_price,
    external_patch_service_price,
    distance_from_paved_road,
    tire_air_fill_price,
    ...paymentMethods.reduce((acc, method) => {
      return { ...acc, [method.title_key]: method.value };
    }, {}),
  };
  return (
    <Formik
      initialValues={initialValues}
      enableReinitialize={true}
      validationSchema={validationForPricesFuel}
      onSubmit={async (values, { setSubmitting }) => {
        const formdata: any = new FormData();
        formdata.append("is_coming_soon", Number(values.is_coming_soon));
        formdata.append("is_hidden", Number(values.is_hidden));
        formdata.append("service_price", values.service_price);
        if (serviceName === "fuel") {
          formdata.append("fuel_91_price", values.fuel_91_price);
          formdata.append("fuel_95_price", values.fuel_95_price);
          formdata.append("dezel_price", values.dezel_price);
        }
        formdata.append("price_per_km", values.price_per_km);
        formdata.append("price_per_minute", values.price_per_minute);
        formdata.append("base_price", values.base_price);
        formdata.append("minimum_charge", values.minimum_charge);
        if (serviceName === "tires") {
          formdata.append("tire_air_fill_price", values.tire_air_fill_price);
          formdata.append("change_tires_price", values.change_tires_price);
          formdata.append(
            "external_patch_service_price",
            values.external_patch_service_price
          );
        }
        if (serviceName === "towing") {
          formdata.append(
            "distance_from_paved_road",
            values.distance_from_paved_road
          );
        }
        formdata.append("cancellation_cost", values.cancellation_cost);
        formdata.append("waiting_cost", values.waiting_cost);
        formdata.append("type", serviceName);

        paymentMethods.forEach((method) => {
          formdata.append(
            `${method.title_key}`,
            Number(values[method.title_key])
          );
        });
        try {
          const response: any = await fetcherClient(
            `/${serviceName}/updateServiceSettings`,
            {
              method: "POST",
              body: formdata,
            }
          );
          showResponseToast(response);

          // Revalidate the cache to show updated values immediately
          if (response.status === "success") {
            await revalidateServiceCache(`service-${serviceName}`);
          }
        } catch (error: any) {
          showResponseToast(error.info);
        } finally {
          setSubmitting(false);
        }
      }}
    >
      {(props) => (
        <Form className="flex flex-col gap-5">
          <div className="p-7 border border-gray200 rounded-6 flex flex-col gap-5">
            <div className="flex items-center gap-5">
              <Switch
                checked={props.values.is_coming_soon == "1"}
                onCheckedChange={(value) => {
                  props.setFieldValue("is_coming_soon", value ? 1 : 0);
                }}
              />
              <p className="text-30 text-textMain font-[600]">
                ايقاف الخدمة مؤقتاً “جعلها قريبا”
              </p>
            </div>
            <div className="flex items-center gap-5">
              <Switch
                checked={props.values.is_hidden == "1"}
                onCheckedChange={(value) => {
                  props.setFieldValue("is_hidden", value ? 1 : 0);
                }}
              />
              <p className="text-30 text-textMain font-[600]">
                اخفاء الخدمة من التطبيق
              </p>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="p-5 border border-gray200 rounded-6">
            <h3 className="text-20 text-textMain font-[700] mb-5">
              وسائل الدفع
            </h3>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-5">
              {paymentMethods.map((method) => (
                <div key={method.id} className="flex items-center gap-5">
                  <Switch
                    checked={props.values[method.title_key]}
                    onCheckedChange={(value) => {
                      props.setFieldValue(method.title_key, value);
                    }}
                  />
                  <div className="flex items-center gap-2">
                    <p className="text-16 text-textMain font-[600]">
                      {method.title}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing Inputs */}
          <div className="p-5 border border-gray200 rounded-6">
            <h3 className="text-20 text-textMain font-[700] mb-5">
              الاسعار على مدار اليوم
            </h3>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-5">
              <CustomInput
                type="number"
                name="service_price"
                label="سعر الخدمة"
                placeholder="0.000"
                step="0.1"
                maxDecimals={3}
              />

              {serviceName === "towing" && (
                <CustomInput
                  type="number"
                  name="distance_from_paved_road"
                  label="المسافة من الطريق الممهد"
                  placeholder="0.000"
                  step="0.1"
                  maxDecimals={3}
                />
              )}
              {serviceName === "fuel" && (
                <>
                  {" "}
                  <CustomInput
                    type="number"
                    name="fuel_91_price"
                    label="سعر بنزين 91 / لتر"
                    placeholder="0.000"
                    step="0.1"
                    maxDecimals={3}
                  />
                  <CustomInput
                    type="number"
                    name="fuel_95_price"
                    label="سعر بنزين 95 / لتر"
                    placeholder="0.000"
                    step="0.1"
                    maxDecimals={3}
                  />
                  <CustomInput
                    type="number"
                    name="dezel_price"
                    label="سعر الديزل / لتر"
                    placeholder="0.000"
                    step="0.1"
                    maxDecimals={3}
                  />
                </>
              )}
              {serviceName === "tires" && (
                <>
                  <CustomInput
                    type="number"
                    name="change_tires_price"
                    label="سعر تغيير الإطار/ الإطار"
                    placeholder="0.000"
                    step="0.1"
                    maxDecimals={3}
                  />{" "}
                  <CustomInput
                    type="number"
                    name="external_patch_service_price"
                    label="سعر خدمة الرتق خارجي /الرتق"
                    placeholder="0.000"
                    step="0.1"
                    maxDecimals={3}
                  />{" "}
                  <CustomInput
                    type="number"
                    name="tire_air_fill_price"
                    label="سعر تعبئة الإطار بالهواء /الإطار"
                    placeholder="0.000"
                    step="0.1"
                    maxDecimals={3}
                  />
                </>
              )}
              <CustomInput
                type="number"
                name="price_per_km"
                label="سعر الكيلو"
                placeholder="0.000"
                step="0.1"
                maxDecimals={3}
              />
              <CustomInput
                type="number"
                name="price_per_minute"
                label="سعر الدقيقة"
                placeholder="0.000"
                step="0.1"
                maxDecimals={3}
              />
              <CustomInput
                type="number"
                name="base_price"
                label="سعر ثابت"
                placeholder="0.000"
                step="0.1"
                maxDecimals={3}
              />
              <CustomInput
                type="number"
                name="minimum_charge"
                label="سعر الحد الادنى"
                placeholder="0.000"
                step="0.1"
                maxDecimals={3}
              />
              <CustomInput
                type="number"
                name="waiting_cost"
                label="سعر الانتظار"
                placeholder="0.000"
                step="0.1"
                maxDecimals={3}
              />
              <CustomInput
                type="number"
                name="cancellation_cost"
                label="سعر الالغاء"
                placeholder="0.000"
                step="0.1"
                maxDecimals={3}
              />
              <Button
                type="submit"
                variant="primary"
                className="col-span-full max-w-[160px]"
              >
                حفظ
              </Button>
            </div>
          </div>
        </Form>
      )}
    </Formik>
  );
};

export default Index;
