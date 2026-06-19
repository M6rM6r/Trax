"use client";
import { useFormik, FormikProvider } from "formik";
import { Button } from "@/components/ui/button";
import CustomSelect from "@/components/shared/form/CustomSelect";
import { AllEnums, CancellationReasonService } from "@/lib/types/responseTypes";
import { useMemo } from "react";

interface FilterComponentProps {
  selectedService: string;
  selectedAudience: string;
  onServiceChange: (value: string) => void;
  onAudienceChange: (value: string) => void;
  onReset: () => void;
  stats: {
    total: number;
    users: number;
    captains: number;
    filtered: number;
  };
  enumsData: AllEnums;
  serviceList: CancellationReasonService[];
}

export function FilterComponent({
  selectedService,
  selectedAudience,
  onServiceChange,
  onAudienceChange,
  onReset,
  stats,
  enumsData,
  serviceList,
}: FilterComponentProps) {
  // Prepare options for CustomSelect from API service list
  const serviceTypeOptions = useMemo(() => {
    const apiServices = serviceList.map(service => ({
      label: service.title_ar,
      value: String(service.id), // Use service ID as value for filtering
    }));

    return [
      { label: "جميع الخدمات", value: "all" },
      ...apiServices
    ];
  }, [serviceList]);

  const audienceOptions = [
    { label: "الجميع", value: "all" },
    { label: "عملاء", value: "customer" },
    { label: "كباتن", value: "driver" },
  ];

  const formik = useFormik({
    initialValues: {
      service_type: selectedService,
      audience: selectedAudience,
    },
    enableReinitialize: true,
    onSubmit: () => {
      // Not used for filters, but required by Formik
    },
  });

  // Handle changes and sync with parent
  const handleServiceChange = async (value: string) => {
    formik.setFieldValue("service_type", value);
    onServiceChange(value);
  };

  const handleAudienceChange = async (value: string) => {
    formik.setFieldValue("audience", value);
    onAudienceChange(value);
  };

  const handleReset = () => {
    formik.resetForm({
      values: {
        service_type: "all",
        audience: "all",
      },
    });
    onReset();
  };

  return (
    <div className="flex flex-col gap-5 border border-gray200 rounded-12 p-5">
      <p className="text-20 text-textMain font-[700]">فلترة</p>

      {/* Statistics Cards */}
      {/* <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="text-sm text-gray-600 mb-1">إجمالي الأسباب</div>
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="text-sm text-gray-600 mb-1">أسباب العملاء</div>
            <div className="text-2xl font-bold text-green-600">{stats.users}</div>
          </CardContent>
        </Card>
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4">
            <div className="text-sm text-gray-600 mb-1">أسباب الكباتن</div>
            <div className="text-2xl font-bold text-purple-600">{stats.captains}</div>
          </CardContent>
        </Card>
        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-4">
            <div className="text-sm text-gray-600 mb-1">النتائج المعروضة</div>
            <div className="text-2xl font-bold text-orange-600">{stats.filtered}</div>
          </CardContent>
        </Card>
      </div> */}

      {/* Filters */}
      <FormikProvider value={formik}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Service Type Filter */}
          <CustomSelect
            name="service_type"
            title="نوع الخدمة"
            placeholder="اختر نوع الخدمة"
            formikProps={formik}
            options={serviceTypeOptions}
            label="label"
            value="value"
            callBack={handleServiceChange}
          />

          {/* Audience Filter */}
          <CustomSelect
            name="audience"
            title="الفئة"
            placeholder="اختر الفئة"
            formikProps={formik}
            options={audienceOptions}
            label="label"
            value="value"
            callBack={handleAudienceChange}
          />
        </div>
      </FormikProvider>

      {/* Reset Button */}
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="primary"
          className="text-primaryColor bg-white border border-primaryColor hover:bg-white"
          onClick={handleReset}
        >
          إعادة تعيين الفلتر
        </Button>
      </div>
    </div>
  );
}
