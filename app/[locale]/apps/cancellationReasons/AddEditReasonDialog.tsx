"use client";
import { useEffect, useMemo, useState } from "react";
import CustomDialog, { Colors } from "@/components/shared/CustomDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { CancellationReasonRecord, CancellationReasonService, CreateCancellationReasonBody } from "@/lib/types/responseTypes";
import { useFormik, FormikProvider } from "formik";
import * as Yup from "yup";
import CustomSelect from "@/components/shared/form/CustomSelect";
import { AllEnums } from "@/lib/types/responseTypes";
import { fetcherClient } from "@/lib/fetcherClient";
import { useRouter } from "next/navigation";
import { useResponseToast } from "@/lib/toastUtils";

interface AddEditReasonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (reason: any) => void;
  mode: "add" | "edit";
  initialData?: CancellationReasonRecord;
  enumsData: AllEnums;
  serviceList: CancellationReasonService[];
}

// Validation schema
const validationSchema = Yup.object({
  reason_ar: Yup.string().required("السبب بالعربية مطلوب"),
  reason_en: Yup.string().required("السبب بالإنجليزية مطلوب"),
  service_type: Yup.array()
    .of(Yup.string())
    .min(1, "يجب اختيار خدمة واحدة على الأقل")
    .required("نوع الخدمة مطلوب"),
  category: Yup.string().required("الفئة مطلوبة"),
  sorting: Yup.number().min(1, "الترتيب يجب أن يكون 1 على الأقل").required("الترتيب مطلوب"),
});

export function AddEditReasonDialog({
  open,
  onOpenChange,
  onSave,
  mode,
  initialData,
  enumsData,
  serviceList,
}: AddEditReasonDialogProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showResponseToast } = useResponseToast();

  // Prepare service options from API service list
  const serviceTypeOptions = useMemo(() => {
    return serviceList.map(service => ({
      label: service.title_ar,
      value: service.key,
    }));
  }, [serviceList]);

  // Create dynamic mappings from service list
  const serviceIdToKey = useMemo(() => {
    const mapping: Record<number, string> = {};
    serviceList.forEach(service => {
      mapping[service.id] = service.key;
    });
    return mapping;
  }, [serviceList]);

  const serviceKeyToId = useMemo(() => {
    const mapping: Record<string, number> = {};
    serviceList.forEach(service => {
      mapping[service.key] = service.id;
    });
    return mapping;
  }, [serviceList]);

  const audienceOptions = [
    { label: "عميل", value: "customer" },
    { label: "كابتن", value: "driver" },
  ];

  const statusOptions = [
    { label: "مفعل", value: "active" },
    { label: "غير مفعل", value: "disabled" },
  ];

  const formik = useFormik({
    initialValues: {
      reason_ar: initialData?.reason_ar || "",
      reason_en: initialData?.reason_en || "",
      service_type: initialData?.services
        ? initialData.services.map(service => serviceIdToKey[service.id] || String(service.id))
        : [] as string[],
      category: initialData?.category || "customer",
      status: initialData?.status || "active",
      sorting: initialData?.sorting || 1,
    },
    validationSchema,
    validateOnChange: false,
    validateOnBlur: false,
    enableReinitialize: true,
    onSubmit: async (values) => {
      setIsSubmitting(true);

      try {
        // Convert selected service types (keys) to IDs using the dynamic mapping
        const service_ids = values.service_type
          .map(key => serviceKeyToId[key])
          .filter((id): id is number => id !== undefined && id > 0);

        const bodyData: CreateCancellationReasonBody = {
          reason_ar: values.reason_ar,
          reason_en: values.reason_en,
          category: values.category as "driver" | "customer",
          sorting: Number(values.sorting),
          status: values.status as "active" | "disabled",
          service_ids: service_ids,
        };

        if (mode === "add") {
          // POST request to create
          const response = await fetcherClient<{ success: boolean; message: string; data: CancellationReasonRecord }>(
            "/cancellation_reasons",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(bodyData),
            }
          );

          showResponseToast(response);

          if (response.success) {
            // Reconstruct services array from the selected service types and service list
            const reconstructedServices = values.service_type
              .map(serviceKey => {
                // Find the service in serviceList
                const service = serviceList.find(s => s.key === serviceKey);
                return service || null;
              })
              .filter((service): service is NonNullable<typeof service> => service !== null);

            // Merge the response data with reconstructed services
            const updatedData = {
              ...response.data,
              services: reconstructedServices,
            };

            onSave(updatedData);
            onOpenChange(false);
            formik.resetForm();
            router.refresh();
          }
        } else {
          // PUT request to update
          const response = await fetcherClient<{ success: boolean; message: string; data: CancellationReasonRecord }>(
            `/cancellation_reasons/update/${initialData?.id}`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(bodyData),
            }
          );

          showResponseToast(response);

          if (response.success) {
            // Reconstruct services array from the selected service types and service list
            const reconstructedServices = values.service_type
              .map(serviceKey => {
                // Find the service in serviceList
                const service = serviceList.find(s => s.key === serviceKey);
                return service || null;
              })
              .filter((service): service is NonNullable<typeof service> => service !== null);

            // Merge the response data with reconstructed services
            const updatedData = {
              ...response.data,
              services: reconstructedServices,
            };

            onSave(updatedData);
            onOpenChange(false);
            formik.resetForm();
            router.refresh();
          }
        }
      } catch (error: any) {
        console.error("Error saving cancellation reason:", error);
        showResponseToast({
          success: false,
          message: error?.info?.message || "حدث خطأ أثناء حفظ السبب",
        });
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  useEffect(() => {
    if (!open) {
      formik.resetForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <CustomDialog
      title={mode === "add" ? "إضافة سبب إلغاء جديد" : "تعديل سبب الإلغاء"}
      color={Colors.primary}
      className="max-w-[700px]"
      open={open}
      onOpenChange={onOpenChange}
      trigger={<div></div>}
      content={
        <FormikProvider value={formik}>
          <form onSubmit={formik.handleSubmit} className="space-y-6">
            {/* Arabic Reason */}
            <div className="space-y-2">
            <Label htmlFor="reason_ar" className="text-textMain font-medium">
              السبب بالعربية <span className="text-red-500">*</span>
            </Label>
            <Input
              id="reason_ar"
              name="reason_ar"
              value={formik.values.reason_ar}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              placeholder="أدخل سبب الإلغاء بالعربية"
              className="text-right"
            />
            {formik.submitCount > 0 && formik.errors.reason_ar && (
              <div className="text-14 text-red-500">{formik.errors.reason_ar}</div>
            )}
          </div>

          {/* English Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason_en" className="text-textMain font-medium">
              السبب بالإنجليزية <span className="text-red-500">*</span>
            </Label>
            <Input
              id="reason_en"
              name="reason_en"
              value={formik.values.reason_en}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              placeholder="أدخل سبب الإلغاء بالإنجليزية"
              dir="ltr"
              className="text-right"
            />
            {formik.submitCount > 0 && formik.errors.reason_en && (
              <div className="text-14 text-red-500">{formik.errors.reason_en}</div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Service Type - Checkbox List */}
            <div className="space-y-2">
              <Label className="text-textMain font-medium">
                نوع الخدمة <span className="text-red-500">*</span>
              </Label>
              <div
                className="border border-gray-200 rounded-lg p-4 max-h-[300px] overflow-y-auto"
                onBlur={() => formik.setFieldTouched("service_type", true)}
              >
                <div className="grid grid-cols-1 gap-3">
                  {serviceTypeOptions.map((service) => (
                    <div key={service.value} className="flex items-center gap-3">
                      <Checkbox
                        id={`service-${service.value}`}
                        checked={formik.values.service_type.includes(service.value)}
                        onCheckedChange={(checked) => {
                          const currentTypes = formik.values.service_type;
                          const newTypes = checked
                            ? [...currentTypes, service.value]
                            : currentTypes.filter((t: string) => t !== service.value);
                          formik.setFieldValue("service_type", newTypes);
                          formik.setFieldTouched("service_type", true);
                        }}
                      />
                      <label
                        htmlFor={`service-${service.value}`}
                        className="text-14 text-textMain font-[600] cursor-pointer select-none"
                      >
                        {service.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              {formik.submitCount > 0 && formik.errors.service_type && (
                <div className="text-14 text-red-500">
                  {typeof formik.errors.service_type === 'string'
                    ? formik.errors.service_type
                    : 'يجب اختيار خدمة واحدة على الأقل'}
                </div>
              )}
            </div>

            {/* Right Side - Stacked Fields */}
            <div className="space-y-4">
              {/* Audience */}
              <CustomSelect
                name="category"
                title="الفئة"
                placeholder="اختر الفئة"
                formikProps={formik}
                options={audienceOptions}
                label="label"
                value="value"
                required
              />

              {/* Active Status */}
              <CustomSelect
                name="status"
                title="الحالة"
                placeholder="اختر الحالة"
                formikProps={formik}
                options={statusOptions}
                label="label"
                value="value"
              />

              {/* Sort Order */}
              <div className="space-y-2">
                <Label htmlFor="sorting" className="text-textMain font-medium">
                  الترتيب
                </Label>
                <Input
                  id="sorting"
                  name="sorting"
                  type="number"
                  value={formik.values.sorting}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  min="1"
                />
                {formik.submitCount > 0 && formik.errors.sorting && (
                  <div className="text-14 text-red-500">{formik.errors.sorting}</div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? "جاري الحفظ..." : mode === "add" ? "إضافة السبب" : "حفظ التعديلات"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              إلغاء
            </Button>
          </div>
          </form>
        </FormikProvider>
      }
    />
  );
}
