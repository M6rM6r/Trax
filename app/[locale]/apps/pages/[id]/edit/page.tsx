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
import { validationForPages } from "@/lib/types/validationTypes";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  AllEnums,
  InfoPagesTypes,
  PageResponse,
} from "@/lib/types/responseTypes";
import CustomFileInput from "@/components/shared/CustomFileInput";
import RichTextEditor from "@/components/shared/RichTextEditor";
import Image from "next/image";
const CustomSelect = dynamic(
  () => import("@/components/shared/form/CustomSelect")
);
const Page = ({ params }: { params: { id: string } }) => {
  const [data, setData] = useState<PageResponse>({} as PageResponse);
  const [loading, setLoading] = useState(true);
  const { showResponseToast } = useResponseToast();
  const router = useRouter();
  const [infoPages, setInfoPages] = useState<InfoPagesTypes | null>(null);
  const [appTypes, setAppTypes] = useState<{
    en: any;
    ar: any;
  } | null>(null);
  const [deletedFileIds, setDeletedFileIds] = useState<number[]>([]);

  useEffect(() => {
    const getAllEnums = async () => {
      try {
        const res = await fetcherClient<AllEnums>("/allEnums", {
          cache: "force-cache",
        });
        setInfoPages(res.InfoPagesTypes);
        setAppTypes(res.AppTypes);
      } catch (error) {
      }
    };
    getAllEnums();
  }, []);
  useEffect(() => {
    const getBrand = async () => {
      try {
        const response = await fetcherClient<PageResponse>(
          `/infoPages/${params.id}`
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
            label: "بيانات المركبات",
          },
          {
            icon: <Flash className="w-5 text-iconColor" />,
            label: "ماركة السيارة",
          },
          {
            icon: <Flash className="w-5 text-textSubTextDarker" />,
            label: "تعديل الماركة",
          },
        ]}
      />
      <GoBack />
      {!loading && infoPages && appTypes && data.data && (
        <Formik<{
          title_ar: string;
          title_en: string;
          description_en: string;
          description_ar: string;
          app: string;
          type: string;
          files: File[];
          is_active: string;
        }>
          enableReinitialize={true}
          initialValues={{
            title_ar: data.data.info_page.title_ar || "",
            title_en: data.data.info_page.title_en || "",
            description_en: data.data.info_page.description_en || "",
            description_ar: data.data.info_page.description_ar || "",
            // Find the key that matches the Arabic value from API
            app: Object.entries(appTypes?.ar || {}).find(
              ([, value]) => value === data.data.info_page.app
            )?.[0] || data.data.info_page.app || "",
            type: Object.entries(infoPages?.ar || {}).find(
              ([, value]) => value === data.data.info_page.type
            )?.[0] || data.data.info_page.type || "",
            files: [],
            is_active: data.data.info_page.is_active?.toString() || "1",
          }}
          validationSchema={validationForPages}
          onSubmit={async (values, { setSubmitting }) => {
            const formdata: any = new FormData();
            formdata.append("title_ar", values.title_ar);
            formdata.append("title_en", values.title_en);
            formdata.append("description_ar", values.description_ar);
            formdata.append("description_en", values.description_en);
            formdata.append("app", values.app);
            formdata.append("type", values.type);

            // Add new files if any
            if (values.files.length > 0) {
              values.files.forEach((file) => {
                formdata.append("files[]", file);
              });
            }

            // Send old_files[] - only include files that weren't deleted
            const remainingFiles = data.data.info_page.files.filter(
              (file: any) => !deletedFileIds.includes(file.id)
            );

            // Backend requires at least one file in old_files[] or new files[]
            // If user tries to delete all files without uploading new ones, show error
            if (remainingFiles.length === 0 && values.files.length === 0) {
              showResponseToast({
                success: false,
                message: "يجب الاحتفاظ بملف واحد على الأقل أو إضافة ملفات جديدة",
              });
              setSubmitting(false);
              return;
            }

            // Send remaining file IDs
            remainingFiles.forEach((file: any) => {
              formdata.append("old_files[]", file.id);
            });

            formdata.append("is_active", values.is_active.toString());
            formdata.append("_method", "put");

            try {
              const response = await fetcherClient<any>(
                `/infoPages/${params.id}`,
                {
                  method: "POST",
                  body: formdata,
                }
              );
              showResponseToast(response);
              if (response.success) {
                router.push("/ar/apps/pages");
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
                  تعديل الصفحة
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
                  تفاصيل الصفحة
                </p>
                <div className=" grid grid-cols-1 md:grid-cols-2 gap-5">
                  <CustomInput
                    type="text"
                    name="title_ar"
                    placeholder="اسم الماركة باللغة العربية"
                    label="الاسم بالعربية"
                  />
                  <CustomInput
                    type="text"
                    name="title_en"
                    placeholder="اسم الماركة باللغة الانجليزية"
                    label="الاسم بالإنجليزية"
                  />
                  <RichTextEditor
                    name="description_ar"
                    label="الوصف بالعربية"
                    formikProps={props}
                    className="md:col-span-2"
                    initialValue={data.data.info_page.description_ar}
                  />
                  <RichTextEditor
                    name="description_en"
                    label="الوصف بالانجليزية"
                    formikProps={props}
                    className="md:col-span-2"
                    initialValue={data.data.info_page.description_en}
                  />
                  <CustomSelect
                    name="app"
                    title="نوع التطبيق"
                    placeholder="- اختر ـ"
                    options={
                      appTypes
                        ? Object.entries(appTypes.ar).map(([key, value]) => ({
                            label: value as string,
                            value: key,
                          }))
                        : []
                    }
                    formikProps={props}
                    label="label"
                    value="value"
                    initialValue={data.data.info_page.app}
                  />
                  <CustomSelect
                    name="type"
                    title="نوع الصفحة"
                    placeholder="- اختر ـ"
                    options={
                      infoPages
                        ? Object.entries(infoPages.ar).map(([key, value]) => ({
                            label: value,
                            value: key,
                          }))
                        : []
                    }
                    formikProps={props}
                    label="label"
                    value="value"
                    initialValue={data.data.info_page.type}
                  />
                  <div className="md:col-span-2">
                    {data.data.info_page.files && data.data.info_page.files.filter((f: any) => !deletedFileIds.includes(f.id)).length > 0 && (
                      <div className="mb-4">
                        <p className="text-16 text-primarySlate700 font-[600] mb-3">
                          الملفات الحالية
                        </p>
                        <div className="flex gap-3 flex-wrap">
                          {data.data.info_page.files
                            .filter((f: any) => !deletedFileIds.includes(f.id))
                            .map((file: any) => (
                            <div
                              key={file.id}
                              className="relative group"
                            >
                              <Image
                                src={file.name}
                                alt="file"
                                width={96}
                                height={96}
                                className="w-24 h-24 object-cover rounded-lg border-2 border-gray-200 hover:border-blue-400 transition-colors"
                              />
                              <button
                                type="button"
                                onClick={() => setDeletedFileIds([...deletedFileIds, file.id])}
                                className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-lg transition-colors z-10"
                                title="حذف الملف"
                              >
                                ×
                              </button>
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded-lg flex items-center justify-center">
                                <a
                                  href={file.name}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="opacity-0 group-hover:opacity-100 text-white text-xs bg-blue-600 px-3 py-1 rounded-md"
                                >
                                  عرض
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <CustomFileInput
                      name="files"
                      label="إضافة ملفات جديدة"
                      formikProps={props}
                      acceptedTypes="image/*,.pdf,.doc,.docx"
                      maxFiles={5}
                      maxSize={5 * 1024 * 1024}
                      multiple={true}
                    />
                  </div>
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
                    initialValue={data.data.info_page.is_active.toString()}
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
