"use client";
import MainLayout from "@/components/shared/MainLayout";
import BreadCrumb from "@/components/shared/BreadCrumb";
import { Complaints, Flash } from "@/public/SVG";
import GoBack from "@/components/shared/GoBack";
import { Form } from "formik";
import dynamic from "next/dynamic";
import { useResponseToast } from "@/lib/toastUtils";
import { fetcherClient } from "@/lib/fetcherClient";
import { useRouter } from "next/navigation";
import RichTextEditor from "@/components/shared/RichTextEditor";
import CustomFileInput from "@/components/shared/CustomFileInput";
import { useFetchEnums } from "@/hooks/useAllEnums";
import { useEffect, useState } from "react";
import { useFetchModelName } from "@/hooks/useFetchDDLModel";
import FormStepper from "@/components/shared/form/FormStepper";
import RideDetails from "@/components/Complaints/TakeAction/RideDetails";
import * as Yup from "yup";

// واجهات TypeScript
interface PaginationState {
  page: number;
  hasMore: boolean;
}

interface LoadingState {
  customerDriver: boolean;
  trips: boolean;
  childrenCategory: boolean;
}

interface Option {
  [key: string]: any;
  label: string;
  value: string | number;
}

// تحميل مكون CustomSelect مع الخصائص الجديدة
const CustomSelect = dynamic(
  () => import("@/components/shared/form/CustomSelect"),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col gap-2 w-full">
        <div className="h-5 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-10 border border-gray200 rounded-12 bg-gray-100 animate-pulse"></div>
      </div>
    ),
  }
);

const Page = () => {
  const { showResponseToast } = useResponseToast();
  const router = useRouter();
  const { data: dataEnums } = useFetchEnums();
  const { data: category } = useFetchModelName<any>(
    "ComplaintCategory",
    "filters[parent_id]=null"
  );

  // تغيير الحالة الأولية لتتناسب مع هيكل البيانات المتوقع
  const [customerDriverOptions, setCustomerDriverOptions] = useState<any>({
    data: { records: { records: [] } },
  });
  const [trips, setTrips] = useState<any>({
    data: { records: { records: [] } },
  });
  const [childrenCategory, setChildrenCategory] = useState<any>({
    data: { records: { records: [] } },
  });
  const [currentSearchTerm, setCurrentSearchTerm] = useState<
    string | undefined
  >(undefined);

  // حالات التحميل والتدرج
  const [loadingOptions, setLoadingOptions] = useState<LoadingState>({
    customerDriver: false,
    trips: false,
    childrenCategory: false,
  });

  const [pagination, setPagination] = useState<Record<string, PaginationState>>(
    {
      customerDriver: { page: 1, hasMore: true },
      trips: { page: 1, hasMore: true },
      childrenCategory: { page: 1, hasMore: true },
    }
  );

  // دوال الجلب المعدلة لدعم التدرج
  const fetchCustomerOrDriver = async (
    model_name: string,
    page = 1,
    search?: string
  ): Promise<any> => {
    if (!model_name) return { data: { records: { records: [] } } };
    setLoadingOptions((prev) => ({ ...prev, customerDriver: true }));

    try {
      let url = `/modelDDLList?model_name=${
        model_name === "customer" ? "Customer" : "Driver"
      }&page=${page}&isPaginate=1`;

      // Add search filter if provided
      // The API might support different formats - try the most common one first
      if (search && search.trim()) {
        const searchTerm = search.trim();
        // Try filters[name][like] format (common Laravel format for LIKE queries)
        // The API backend should handle case-insensitive matching and wildcards
        url += `&filters[name][like]=${encodeURIComponent(searchTerm)}`;
      }

      const response = await fetcherClient<any>(url, {
        method: "GET",
      });

      // Enhanced debug logging for troubleshooting
      if (search && search.trim()) {
        // If no results, log a warning
        if (!response.data?.records?.records?.length) {
          console.warn(
            "⚠️ Search returned no results. API might not support this format. Try checking the API documentation."
          );
        }
      }

      setPagination((prev) => ({
        ...prev,
        customerDriver: {
          page: page,
          hasMore: response.data.pagination_data?.next !== null,
        },
      }));

      return response;
    } catch (error: any) {
      return { data: { records: { records: [] } } }; // إرجاع هيكل فارغ في حالة الخطأ
    } finally {
      setLoadingOptions((prev) => ({ ...prev, customerDriver: false }));
    }
  };

  const fetchTrips = async (
    type: string,
    id: string,
    page = 1
  ): Promise<any> => {
    if (!type || !id) return { data: { records: { records: [] } } };

    setLoadingOptions((prev) => ({ ...prev, trips: true }));

    try {
      const url = `/modelDDLList?model_name=Ride&filters[${type}_id]=${id}&page=${page}&isPaginate=1`;

      const response = await fetcherClient<any>(url, {
        method: "GET",
      });

      if (!response.data?.records?.records) {
        console.warn("Unexpected response format:", response);
        return { data: { records: { records: [] } } };
      }

      setPagination((prev) => ({
        ...prev,
        trips: {
          page: page,
          hasMore: response.data.pagination_data?.next !== null,
        },
      }));

      return response;
    } catch (error: any) {
      console.error("Error fetching trips:", error);
      console.error("Error details:", {
        message: error.message,
        info: error.info,
        type,
        id,
      });
      return { data: { records: { records: [] } } };
    } finally {
      setLoadingOptions((prev) => ({ ...prev, trips: false }));
    }
  };

  const fetchChildrenCategory = async (id: string, page = 1): Promise<any> => {
    if (!id) return { data: { records: { records: [] } } };
    setLoadingOptions((prev) => ({ ...prev, childrenCategory: true }));

    try {
      const response = await fetcherClient<any>(
        `/modelDDLList?model_name=ComplaintCategory&filters[parent_id]=${id}&page=${page}&isPaginate=1`,
        {
          method: "GET",
        }
      );

      setPagination((prev) => ({
        ...prev,
        childrenCategory: {
          page: page,
          hasMore: response.data.pagination_data?.next !== null,
        },
      }));

      return response;
    } catch (error: any) {
      return { data: { records: { records: [] } } }; // إرجاع هيكل فارغ في حالة الخطأ
    } finally {
      setLoadingOptions((prev) => ({ ...prev, childrenCategory: false }));
    }
  };

  const stepOneValidation = Yup.object({
    complaintable_type: Yup.string().required("هذا الحقل مطلوب"),
    complaintable_id: Yup.string().required("هذا الحقل مطلوب"),
    compliant_source: Yup.string().required("هذا الحقل مطلوب"),
  });

  const stepTwoValidation = Yup.object({
    complaint_type: Yup.string().required("هذا الحقل مطلوب"),
    category_id: Yup.string().required("هذا الحقل مطلوب"),
    priority: Yup.string().required("هذا الحقل مطلوب"),
    ride_id: Yup.string().required("هذا الحقل مطلوب"),
  });

  const stepThreeValidation = Yup.object({
    discription: Yup.string().required("هذا الحقل مطلوب"),
    notes: Yup.string().required("هذا الحقل مطلوب"),
  });

  const validationSchemas = [
    stepOneValidation,
    stepTwoValidation,
    stepThreeValidation,
  ];

  const handleSubmit = async (values: any, { setSubmitting }: any) => {
    const formdata: any = new FormData();
    formdata.append("complaintable_type", values.complaintable_type);
    formdata.append("complaintable_id", values.complaintable_id);
    formdata.append("priority", values.priority);
    formdata.append("ride_id", values.ride_id);
    formdata.append("discription", values.discription);
    formdata.append("compliant_source", values.compliant_source);
    formdata.append("notes", values.notes);
    formdata.append("category_id", values.category_id);

    values.files &&
      values.files?.forEach((file: any) => {
        formdata.append("files[]", file);
      });

    try {
      const response = await fetcherClient<any>("/complaints", {
        method: "POST",
        body: formdata,
      });
      showResponseToast(response);
      router.push("/ar/complaintsManagement/complaints");
    } catch (error: any) {
      showResponseToast(error.info);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MainLayout showSidebar={false}>
      <BreadCrumb
        labels={[
          {
            icon: <Complaints className="w-5 text-iconColor" />,
            label: "إدارة الشكاوى",
          },
          {
            icon: <Flash className="w-5 text-iconColor" />,
            label: "الشكاوى",
          },
          {
            icon: <Flash className="w-5 text-textSubTextDarker" />,
            label: "إنشاء شكوى",
          },
        ]}
      />
      <GoBack />

      <div className="flex flex-col gap-5 p-4 border border-gray200 rounded-12 bg-white">
        <div className="flex items-center justify-between flex-wrap gap-5">
          <h2 className="text-20 text-textMain font-[700]">إنشاء شكوى</h2>
        </div>

        <FormStepper
          initialValues={{
            complaintable_type: "",
            complaintable_id: "",
            complaint_type: "",
            priority: "",
            ride_id: "",
            discription: "",
            compliant_source: "",
            notes: "",
            category_id: "",
            files: null,
          }}
          steps={[
            // Step 1: Basic Information
            (props) => (
              <Form>
                <div className="flex flex-col gap-5 p-4 border border-gray200 rounded-6">
                  <p className="text-16 text-textMain font-[600]">
                    معلومات أساسية
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <CustomSelect
                      name="complaintable_type"
                      title="نوع مقدم الشكوى"
                      placeholder="- اختر -"
                      options={
                        dataEnums?.ComplaintableType
                          ? Object.entries(dataEnums.ComplaintableType?.ar).map(
                              ([key, value]) => ({
                                label: value as string,
                                value: key,
                              })
                            )
                          : []
                      }
                      formikProps={props}
                      label="label"
                      initialValue={props.values.complaintable_type}
                      value="value"
                      callBack={async (selectedType: string) => {
                        if (selectedType) {
                          setCurrentSearchTerm(undefined);
                          const options = await fetchCustomerOrDriver(
                            selectedType,
                            1
                          );
                          setCustomerDriverOptions(options);
                          // إعادة تعيين الحقول المعتمدة على هذا الاختيار
                          props.setFieldValue("complaintable_id", "");
                          props.setFieldValue("ride_id", "");
                          setTrips({ data: { records: { records: [] } } });
                        } else {
                          setCustomerDriverOptions({
                            data: { records: { records: [] } },
                          });
                          setCurrentSearchTerm(undefined);
                        }
                      }}
                    />

                    {props.values.complaintable_type && (
                      <CustomSelect
                        name="complaintable_id"
                        title={
                          props.values.complaintable_type === "customer"
                            ? "اختر راكب"
                            : "اختر سائق"
                        }
                        placeholder="- اختر -"
                        initialValue={props.values.complaintable_id}
                        options={
                          customerDriverOptions.data?.records?.records?.map(
                            (item: any) => ({
                              label: item.name,
                              value: item.id,
                            })
                          ) || []
                        }
                        formikProps={props}
                        label="label"
                        value="value"
                        asyncOptions={true}
                        loading={loadingOptions.customerDriver}
                        hasMore={pagination.customerDriver.hasMore}
                        onSearch={async (inputValue: string) => {
                          const searchTerm = inputValue?.trim();

                          // If inputValue is empty, reload first page without search
                          if (!searchTerm) {
                            // Always reload initial data when search is cleared
                            const initialResults = await fetchCustomerOrDriver(
                              props.values.complaintable_type,
                              1
                            );
                            setCustomerDriverOptions(initialResults);
                            setCurrentSearchTerm(undefined);
                            return (
                              initialResults.data?.records?.records?.map(
                                (item: any) => ({
                                  label: item.name,
                                  value: item.id,
                                })
                              ) || []
                            );
                          }

                          // Search with the term (even if it's just one character)
                          setCurrentSearchTerm(searchTerm);
                          const searchResults = await fetchCustomerOrDriver(
                            props.values.complaintable_type,
                            1,
                            searchTerm
                          );

                          // Update options with search results
                          const searchOptions =
                            searchResults.data?.records?.records?.map(
                              (item: any) => ({
                                label: item.name,
                                value: item.id,
                              })
                            ) || [];

                          // Update state with search results
                          setCustomerDriverOptions(searchResults);
                          setPagination((prev) => ({
                            ...prev,
                            customerDriver: {
                              page: 1,
                              hasMore:
                                searchResults.data.pagination_data?.next !==
                                null,
                            },
                          }));

                          return searchOptions;
                        }}
                        loadMore={async () => {
                          const nextPage = pagination.customerDriver.page + 1;
                          const newData = await fetchCustomerOrDriver(
                            props.values.complaintable_type,
                            nextPage,
                            currentSearchTerm
                          );
                          setCustomerDriverOptions((prev: any) => ({
                            ...prev,
                            data: {
                              records: {
                                records: [
                                  ...prev.data.records.records,
                                  ...newData.data.records.records,
                                ],
                              },
                            },
                          }));
                          setPagination((prev) => ({
                            ...prev,
                            customerDriver: {
                              ...prev.customerDriver,
                              page: nextPage,
                              hasMore:
                                newData.data.pagination_data?.next !== null,
                            },
                          }));
                        }}
                        callBack={async (selectedId: string) => {
                          if (selectedId) {
                            const options = await fetchTrips(
                              props.values.complaintable_type,
                              selectedId,
                              1
                            );
                            setTrips(options);
                            props.setFieldValue("ride_id", "");
                          } else {
                            setTrips({ data: { records: { records: [] } } });
                          }
                        }}
                      />
                    )}

                    <CustomSelect
                      name="compliant_source"
                      title="مصدر الشكوى"
                      placeholder="- اختر -"
                      initialValue={props.values.compliant_source}
                      options={
                        dataEnums?.ComplaintSource
                          ? Object.entries(dataEnums.ComplaintSource?.ar).map(
                              ([key, value]) => ({
                                label: value as string,
                                value: key,
                              })
                            )
                          : []
                      }
                      formikProps={props}
                      label="label"
                      value="value"
                    />
                  </div>
                </div>
              </Form>
            ),

            // Step 2: Classification and Parties
            (props) => (
              <>
                <div className="flex flex-col gap-5 p-4 border border-gray200 rounded-6">
                  <p className="text-16 text-textMain font-[600]">
                    التصنيف والأطراف
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <CustomSelect
                      name="complaint_type"
                      title="تصنيف الشكوى"
                      placeholder="- اختر -"
                      initialValue={props.values.complaint_type}
                      options={
                        category?.data?.records?.map((item: any) => ({
                          label: item.title_ar,
                          value: item.id,
                        })) || []
                      }
                      formikProps={props}
                      label="label"
                      value="value"
                      callBack={async (selectedId: string) => {
                        if (selectedId) {
                          const options = await fetchChildrenCategory(
                            selectedId,
                            1
                          );
                          setChildrenCategory(options);
                          props.setFieldValue("category_id", "");
                        } else {
                          setChildrenCategory({
                            data: { records: { records: [] } },
                          });
                        }
                      }}
                    />

                    <CustomSelect
                      name="category_id"
                      title="نوع الشكوى"
                      placeholder="- اختر -"
                      initialValue={props.values.category_id}
                      options={
                        childrenCategory.data?.records?.records?.map(
                          (item: any) => ({
                            label: item.title_ar,
                            value: item.id,
                          })
                        ) || []
                      }
                      formikProps={props}
                      label="label"
                      value="value"
                      asyncOptions={true}
                      loading={loadingOptions.childrenCategory}
                      hasMore={pagination.childrenCategory.hasMore}
                      loadMore={async () => {
                        const nextPage = pagination.childrenCategory.page + 1;
                        const newData = await fetchChildrenCategory(
                          props.values.complaint_type,
                          nextPage
                        );
                        setChildrenCategory((prev: any) => ({
                          ...prev,
                          data: {
                            records: {
                              records: [
                                ...prev.data.records.records,
                                ...newData.data.records.records,
                              ],
                            },
                          },
                        }));
                        setPagination((prev) => ({
                          ...prev,
                          childrenCategory: {
                            ...prev.childrenCategory,
                            page: nextPage,
                            hasMore:
                              newData.data.pagination_data?.next !== null,
                          },
                        }));
                      }}
                    />

                    <CustomSelect
                      name="priority"
                      title="الأولوية"
                      placeholder="- اختر -"
                      initialValue={props.values.priority}
                      options={
                        dataEnums?.ComplaintPriorites
                          ? Object.entries(
                              dataEnums.ComplaintPriorites?.ar
                            ).map(([key, value]) => ({
                              label: value as string,
                              value: key,
                            }))
                          : []
                      }
                      formikProps={props}
                      label="label"
                      value="value"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-5 p-4 border border-gray200 rounded-6">
                  <p className="text-16 text-textMain font-[600]">
                    معلومات الرحلة
                  </p>
                  <div className="grid grid-cols-1 gap-5">
                    {props.values.ride_id === "" && (
                      <CustomSelect
                        name="ride_id"
                        title="اختر رحلة معينة للربط بالشكوى"
                        placeholder="- اختر -"
                        initialValue={props.values.ride_id}
                        options={
                          trips.data?.records?.records?.map((item: any) => ({
                            label:
                              (item.requested_at?.slice(0, 10) || "") +
                              " - " +
                              (item.final_price || "0") +
                              " ر.س",
                            value: item.id,
                          })) || []
                        }
                        formikProps={props}
                        label="label"
                        value="value"
                        asyncOptions={true}
                        loading={loadingOptions.trips}
                        hasMore={pagination.trips.hasMore}
                        loadMore={async () => {
                          const nextPage = pagination.trips.page + 1;
                          const newData = await fetchTrips(
                            props.values.complaintable_type,
                            props.values.complaintable_id,
                            nextPage
                          );
                          setTrips((prev: any) => ({
                            ...prev,
                            data: {
                              records: {
                                records: [
                                  ...prev.data.records.records,
                                  ...newData.data.records.records,
                                ],
                              },
                            },
                          }));
                          setPagination((prev) => ({
                            ...prev,
                            trips: {
                              ...prev.trips,
                              page: nextPage,
                              hasMore:
                                newData.data.pagination_data?.next !== null,
                            },
                          }));
                        }}
                      />
                    )}

                    <RideDetails
                      ride={trips.data?.records?.records?.find(
                        (record: any) => record.id === props.values.ride_id
                      )}
                      onClear={() => props.setFieldValue("ride_id", "")}
                    />
                  </div>
                </div>
              </>
            ),

            // Step 3: Complaint Content
            (props) => (
              <>
                <div className="flex flex-col gap-5 p-4 border border-gray200 rounded-6">
                  <p className="text-16 text-textMain font-[600]">
                    محتوى الشكوى
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-1 gap-5">
                    <RichTextEditor
                      name="discription"
                      label="وصف الشكوى"
                      formikProps={props}
                      className="md:col-span-2"
                      initialValue={props.values.discription}
                    />

                    <CustomFileInput
                      name="files"
                      label="مرفقات"
                      formikProps={props}
                    />

                    <RichTextEditor
                      name="notes"
                      label="إضافة ملاحظة"
                      formikProps={props}
                      className="md:col-span-2"
                      initialValue={props.values.notes}
                    />
                  </div>
                </div>
              </>
            ),
          ]}
          labels={["معلومات أساسية", "التصنيف والأطراف", "محتوى الشكوى"]}
          onSubmit={handleSubmit}
          validationSchemas={validationSchemas}
        />
      </div>
    </MainLayout>
  );
};

export default Page;
