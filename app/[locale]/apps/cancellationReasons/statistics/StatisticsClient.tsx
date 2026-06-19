"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useFormik, FormikProvider } from "formik";
import CustomSelect from "@/components/shared/form/CustomSelect";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CancellationStatisticsData,
  CancellationStatisticsResponse,
  CancellationReasonService,
} from "@/lib/types/responseTypes";
import { fetcherClient } from "@/lib/fetcherClient";

interface StatisticsClientProps {
  initialStats: CancellationStatisticsData;
  serviceList: CancellationReasonService[];
  locale: string;
}

const StatisticsClient = ({
  initialStats,
  serviceList,
  locale,
}: StatisticsClientProps) => {
  const [selectedService, setSelectedService] = useState<string>("all");
  const [selectedAudience, setSelectedAudience] = useState<string>("all");
  const [stats, setStats] = useState<CancellationStatisticsData>(initialStats);

  // Prepare service options from service list API
  const serviceTypeOptions = useMemo(() => {
    const apiServices = serviceList.map(service => ({
      label: locale === "ar" ? service.title_ar : service.title_en,
      value: String(service.id),
    }));

    return [
      { label: "جميع الخدمات", value: "all" },
      ...apiServices,
    ];
  }, [serviceList, locale]);

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

  // Fetch statistics from API with filters
  const fetchStatistics = async (serviceId?: string, category?: string) => {
    try {
      const params = new URLSearchParams();

      // Add service_id parameter if not "all"
      if (serviceId && serviceId !== "all") {
        params.append("service_id", serviceId);
      }

      // Add category parameter if not "all"
      if (category && category !== "all") {
        params.append("category", category);
      }

      const queryString = params.toString();
      const url = `/cancellation_reasons/statistics${queryString ? `?${queryString}` : ""}`;

      const response = await fetcherClient<CancellationStatisticsResponse>(url, {
        cache: "no-store",
        headers: {
          Accept: "application/json",
          lang: "ar",
        },
      });

      setStats(response.data);
    } catch (error) {
      console.error("Failed to fetch statistics:", error);
    }
  };

  // Handle changes and sync with parent state
  const handleServiceChange = async (value: string) => {
    formik.setFieldValue("service_type", value);
    setSelectedService(value);
    await fetchStatistics(value, selectedAudience);
  };

  const handleAudienceChange = async (value: string) => {
    formik.setFieldValue("audience", value);
    setSelectedAudience(value);
    await fetchStatistics(selectedService, value);
  };

  const handleReset = async () => {
    formik.resetForm({
      values: {
        service_type: "all",
        audience: "all",
      },
    });
    setSelectedService("all");
    setSelectedAudience("all");
    await fetchStatistics("all", "all");
  };

  // Calculate percentages for services
  const servicesWithPercentage = useMemo(() => {
    const total = stats.services_most_cancelled.reduce((sum, service) => sum + service.count, 0);
    return stats.services_most_cancelled.map(service => ({
      ...service,
      percentage: total > 0 ? ((service.count / total) * 100).toFixed(1) : "0",
    }));
  }, [stats.services_most_cancelled]);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>الفلاتر</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Service Type */}
            <FormikProvider value={formik}>
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
            </FormikProvider>

            {/* Audience */}
            <FormikProvider value={formik}>
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
            </FormikProvider>

            {/* Reset Button */}
            <div className="flex items-end">
              <Button
                type="button"
                variant="primary"
                className="w-full text-white bg-primaryColor border border-primaryColor hover:bg-primaryColor"
                onClick={handleReset}
              >
                إعادة تعيين
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-gray-600 mb-2">إجمالي الإلغاءات</div>
            <div className="text-3xl font-bold text-blue-600">
              {stats.total_cancellations}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-gray-600 mb-2">إلغاءات العملاء</div>
            <div className="text-3xl font-bold text-green-600">
              {stats.customer_cancellations}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {stats.total_cancellations > 0
                ? ((stats.customer_cancellations / stats.total_cancellations) * 100).toFixed(1)
                : 0}%
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-gray-600 mb-2">إلغاءات الكباتن</div>
            <div className="text-3xl font-bold text-purple-600">
              {stats.driver_cancellations}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {stats.total_cancellations > 0
                ? ((stats.driver_cancellations / stats.total_cancellations) * 100).toFixed(1)
                : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Reasons */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">أكثر أسباب الإلغاء</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.reasons_most_cancelled.length > 0 ? (
                stats.reasons_most_cancelled.map((reason, index) => {
                  const maxCount = stats.reasons_most_cancelled[0]?.count || 1;
                  const percentage = maxCount > 0 ? (reason.count / maxCount) * 100 : 0;

                  return (
                    <div key={index} className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{reason.reason}</span>
                          <span className="text-sm text-gray-600">{reason.count}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="h-2 rounded-full bg-orange-500"
                            style={{
                              width: `${percentage}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center text-gray-500 py-4">لا توجد بيانات</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Service Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">توزيع الإلغاءات حسب الخدمة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {servicesWithPercentage.length > 0 ? (
                servicesWithPercentage.map((service, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{service.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">{service.count}</span>
                          <span className="text-xs text-gray-500">({service.percentage}%)</span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full bg-blue-500"
                          style={{ width: `${service.percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-4">لا توجد بيانات</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* High-Frequency Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* High-Frequency Users */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">العملاء الأكثر إلغاءً</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الاسم</TableHead>
                  <TableHead className="text-center">الإلغاءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.customers_most_cancelled.length > 0 ? (
                  stats.customers_most_cancelled.map((user, index) => (
                    <TableRow key={index}>
                      <TableCell className="text-sm">{user.name}</TableCell>
                      <TableCell className="text-sm text-center">
                        <Badge className="bg-red-100 text-red-700 hover:bg-red-100 rounded-full">
                          {user.count}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-gray-500 py-4">
                      لا توجد بيانات
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* High-Frequency Captains */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">الكباتن الأكثر إلغاءً</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الاسم</TableHead>
                  <TableHead className="text-center">الإلغاءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.drivers_most_cancelled.length > 0 ? (
                  stats.drivers_most_cancelled.map((captain, index) => (
                    <TableRow key={index}>
                      <TableCell className="text-sm">{captain.name}</TableCell>
                      <TableCell className="text-sm text-center">
                        <Badge className="bg-red-100 text-red-700 hover:bg-red-100 rounded-full">
                          {captain.count}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-gray-500 py-4">
                      لا توجد بيانات
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StatisticsClient;
