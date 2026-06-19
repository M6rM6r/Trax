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
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AllEnums, BannerResponse } from "@/lib/types/responseTypes";
import { validationForBanners } from "@/lib/types/validationTypes";
import CustomFileInput from "@/components/shared/CustomFileInput";
const CustomSelect = dynamic(
  () => import("@/components/shared/form/CustomSelect")
);
const Page = ({ params }: { params: { id: string; locale: string } }) => {
  const [data, setData] = useState<BannerResponse>({} as BannerResponse);
  const [loading, setLoading] = useState(true);
  const { showResponseToast } = useResponseToast();
  const router = useRouter();
  const [appTypes, setAppTypes] = useState<{
    en: any;
    ar: any;
  } | null>(null);

  useEffect(() => {
    const getAllEnums = async () => {
      try {
        const res = await fetcherClient<AllEnums>("/allEnums", {
          cache: "force-cache",
        });

        setAppTypes(res.AppTypes);
      } catch (error) {
      }
    };

    getAllEnums();
  }, []);

  const appFieldOptions = useMemo(() => {
    if (!appTypes?.ar) return [];

    const options = Object.entries(appTypes.ar).map(([key, value]) => ({
      label: value as string,
      value: key,
    }));

    return options;
  }, [appTypes]);

  // Convert Arabic app value to English key for form display
  const getAppKeyFromValue = useMemo(() => {
    if (!appTypes?.ar || !data?.data?.banner?.app) return "";

    const appValue = data.data.banner.app;

    // Find the key that matches the Arabic value
    const entry = Object.entries(appTypes.ar).find(
      ([, value]) => value === appValue
    );

    return entry ? entry[0] : appValue;
  }, [appTypes, data]);

  useEffect(() => {
    const getBrand = async () => {
      try {
        const response = await fetcherClient<BannerResponse>(
          `/banners/${params.id}`,
          {
            cache: "no-store",
          }
        );
        setData(response);
        setLoading(false);
      } catch (error) {
      }
    };
    getBrand();
  }, [params.id]);

  return (
    <MainLayout showSidebar={false}>
      <BreadCrumb
        labels={[
          {
            icon: <Driving className="w-5 text-iconColor" />,
            label: "إدارة التطبيقات",
          },
          {
            icon: <Flash className="w-5 text-iconColor" />,
            label: "اللافتات",
          },
          {
            icon: <Flash className="w-5 text-textSubTextDarker" />,
            label: "تعديل اللافتة",
          },
        ]}
      />
      <GoBack />
      {!loading && appTypes && appFieldOptions.length > 0 && (
        <Formik<{
          title_ar: string;
          title_en: string;
          target_url: string;
          order: string;
          banner_ar: string | File;
          banner_en: string | File;
          app: string;
          is_active: string;
        }>
          key={`banner-form-${data.data.banner.id}`}
          initialValues={{
            title_ar: data.data.banner.title_ar,
            title_en: data.data.banner.title_en,
            target_url: data.data.banner.target_url,
            order: data.data.banner.order.toString(),
            banner_ar: data.data.banner.banner_ar ?? "",
            banner_en: data.data.banner.banner_en ?? "",
            app: getAppKeyFromValue,
            is_active: data.data.banner.is_active.toString(),
          }}
          validationSchema={validationForBanners}
          onSubmit={async (values, { setSubmitting }) => {
            const formdata: any = new FormData();
            formdata.append("title_ar", values.title_ar);
            formdata.append("title_en", values.title_en);
            formdata.append("target_url", values.target_url);
            formdata.append("order", values.order);

            // Handle banner_ar: send new file, or send null if deleted, or don't send if unchanged
            if (values.banner_ar instanceof File) {
              formdata.append("banner_ar", values.banner_ar);
            } else if (values.banner_ar === "" && data.data.banner.banner_ar) {
              formdata.append("banner_ar", "null");
            }

            // Handle banner_en: send new file, or send null if deleted, or don't send if unchanged
            if (values.banner_en instanceof File) {
              formdata.append("banner_en", values.banner_en);
            } else if (values.banner_en === "" && data.data.banner.banner_en) {
              formdata.append("banner_en", "null");
            }

            formdata.append("app", values.app);
            formdata.append("is_active", values.is_active.toString());
            formdata.append("_method", "put");

            try {
              const response = await fetcherClient<any>(
                `/banners/${params.id}`,
                {
                  method: "POST",
                  body: formdata,
                  cache: "no-store",
                }
              );
              showResponseToast(response);
              if (response.success) {
                // Navigate and let the page fetch fresh data
                router.push(`/${params.locale}/apps/banners?t=${Date.now()}`);
              }
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
                  تعديل اللافتة
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
                  تفاصيل اللافتة
                </p>
                <div className=" grid grid-cols-1 md:grid-cols-2 gap-5">
                  <CustomInput
                    type="text"
                    name="title_ar"
                    placeholder="العنوان بالعربية"
                    label="العنوان بالعربية"
                  />
                  <CustomInput
                    type="text"
                    name="title_en"
                    placeholder="العنوان بالإنجليزية"
                    label="العنوان بالإنجليزية"
                  />
                  <CustomInput
                    type="text"
                    name="target_url"
                    placeholder="عنوان الهدف"
                    label="عنوان الهدف"
                  />
                  <CustomSelect
                    name="order"
                    title="الترتيب"
                    placeholder="- اختر ـ"
                    options={[
                      { label: "1", value: "1" },
                      { label: "2", value: "2" },
                      { label: "3", value: "3" },
                      { label: "4", value: "4" },
                      { label: "5", value: "5" },
                      { label: "6", value: "6" },
                      { label: "7", value: "7" },
                      { label: "8", value: "8" },
                      { label: "9", value: "9" },
                      { label: "10", value: "10" },
                    ]}
                    formikProps={props}
                    label="label"
                    value="value"
                    initialValue={props.values.order}
                  />
                  <CustomFileInput
                    name="banner_ar"
                    label="اللافتة بالعربية"
                    formikProps={props}
                    acceptedTypes="image/*"
                    maxFiles={5}
                    maxSize={5 * 1024 * 1024}
                    multiple={false}
                  />
                  <CustomFileInput
                    name="banner_en"
                    label="اللافتة بالإنجليزية"
                    formikProps={props}
                    acceptedTypes="image/*"
                    maxFiles={5}
                    maxSize={5 * 1024 * 1024}
                    multiple={false}
                  />
                  <CustomSelect
                    name="app"
                    title="نوع التطبيق"
                    placeholder="- اختر ـ"
                    options={appFieldOptions}
                    formikProps={props}
                    label="label"
                    value="value"
                    className="md:col-span-2"
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
