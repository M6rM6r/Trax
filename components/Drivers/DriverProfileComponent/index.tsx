"use client";
import BreadCrumb from "@/components/shared/BreadCrumb";
import {
  Edit2,
  EyeWhite,
  Flash,
  Slash,
  Star,
  User,
  UserRemove,
  Wallet,
} from "@/public/SVG";
import { Button } from "@/components/ui/button";
import GoBack from "@/components/shared/GoBack";
import { Checkbox } from "@/components/ui/checkbox";
import UserInformation from "@/components/shared/UserInformation";
import { Driver } from "@/lib/types/responseTypes";
import Documents from "@/components/shared/Documents";
import CustomDialog, { Colors } from "@/components/shared/CustomDialog";
import EditDriver from "@/components/shared/EditDriver";
import { EVehicleType } from "@/lib/types/enums";
import Link from "next/link";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  MoreVertical,
  Calendar,
  MapPin,
  Car,
  FileText,
  Shield,
  BadgeCheck,
  BarChart2,
  Truck,
  Droplets,
  CheckCircle,
  XCircle,
  DollarSign,
  Container,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import WarningDialog from "@/components/shared/WarningDialog";
import ErrorDialog from "@/components/shared/ErrorDialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FC, useState } from "react";
import Image from "next/image";
import { fetcherClient } from "@/lib/fetcherClient";
import { useResponseToast } from "@/lib/toastUtils";
import type { ResponseObject } from "@/lib/toastUtils";

const DriverProfileComponent: FC<{ driver: Driver }> = ({ driver }) => {
  const [verifying, setVerifying] = useState(false);
  const [waslResponse, setWaslResponse] = useState<ResponseObject | null>(null);
  const [showWaslDialog, setShowWaslDialog] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const { showResponseToast } = useResponseToast();

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "غير متوفر";
    return new Date(dateString).toLocaleDateString("ar-SA");
  };

  const handleWaslVerification = async () => {
    setVerifying(true);
    try {
      const formData = new FormData();
      formData.append("identity_number", driver.identity_number || "");
      formData.append("date_of_birth", driver.date_of_birth || "");
      formData.append("sequence_number", driver.vehicle_data?.sequence_number || "");
      formData.append("plate_letter_right", driver.vehicle_data?.plate_letter_right || "");
      formData.append("plate_letter_middle", driver.vehicle_data?.plate_letter_middle || "");
      formData.append("plate_letter_left", driver.vehicle_data?.plate_letter_left || "");
      formData.append("plate_number", driver.vehicle_data?.plate_number || "");
      formData.append("plate_type", driver.vehicle_data?.plate_type?.toString() || "");
      formData.append("mobile", driver.mobile || "");
      formData.append("user_id", driver.id.toString());
      formData.append("country_code", "966");


      const response = await fetcherClient<ResponseObject>(
        "/drivers/checkWaslValidity",
        {
          method: "POST",
          body: formData,
        }
      );

      showResponseToast(response);
      setWaslResponse(response);
      setShowWaslDialog(true);
    } catch (error: any) {
      console.error("WASL verification error:", error);
      const errorResponse = error?.info || error;
      showResponseToast({
        success: false,
        message: errorResponse?.message || "حدث خطأ أثناء التحقق من وصل",
      });
      // Show error response in dialog too
      setWaslResponse(errorResponse);
      setShowWaslDialog(true);
    } finally {
      setVerifying(false);
    }
  };

  const getVehicleType = (): EVehicleType => {
    if (driver.driver_without_car) {
      return EVehicleType.driver_without_car;
    }
    return (driver.vehicle_data?.vehicle_type as EVehicleType) || EVehicleType.taxi;
  };

  const getStatusBadge = (isActive: boolean, isOnline: number) => {
    if (!isActive) {
      return (
        <Badge
          variant="destructive"
          className="text-xs bg-red-100 text-red-800 border-red-200"
        >
          محظور
        </Badge>
      );
    }
    // return isOnline ? (
    //   <Badge
    //     variant="default"
    //     className="text-xs bg-green-100 text-green-800 border-green-200"
    //   >
    //     🟢 متصل
    //   </Badge>
    // ) : (
    //   <Badge
    //     variant="secondary"
    //     className="text-xs bg-gray-100 text-gray-600 border-gray-200"
    //   >
    //     ⚫ غير متصل
    //   </Badge>
    // );
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return "text-green-600 bg-green-50 border-green-200";
    if (rating >= 4.0) return "text-blue-600 bg-blue-50 border-blue-200";
    if (rating >= 3.0) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Breadcrumb with gradient */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-100">
        <BreadCrumb
          labels={[
            {
              icon: <Star className="w-5 text-blue-600" />,
              label: "السائقين",
            },
            {
              icon: <Flash className="w-5 text-blue-600" />,
              label: "جميع السائقين",
            },
            {
              icon: <User className="w-5 text-blue-600" />,
              label: driver.name,
            },
          ]}
        />
      </div>

      <GoBack />

      {/* Enhanced Header Section with Gradient */}
      <Card className="border border-blue-100 bg-white shadow-sm rounded-2xl overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Driver Info */}
            <div className="flex items-center gap-4">
              <div className="relative group">
                <div className="absolute -inset-1 bg-blue-100 rounded-full opacity-60"></div>
                <Image
                  width={50}
                  height={50}
                  src={driver.profile_image || "/default-avatar.png"}
                  alt={driver.name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-white relative z-10"
                />
                <div className="absolute -bottom-1 -right-1 z-20">
                  {getStatusBadge(driver.is_active, driver.is_online)}
                </div>
                {/* Eye Icon to view full image */}
                <button
                  onClick={() => setShowImageDialog(true)}
                  className="absolute inset-0 z-30 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  aria-label="عرض الصورة"
                >
                  <EyeWhite className="w-6 h-6 text-white" />
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {driver.name}
                  </h1>
                  {driver.rating > 0 && (
                    <div
                      className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium ${getRatingColor(
                        driver.rating
                      )}`}
                    >
                      <span>⭐</span>
                      <span>{driver.rating}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4 text-gray-600 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>مسجل منذ {formatDate(driver.created_at)}</span>
                  </div>
                  {driver.city && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span>{driver.city}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-gray-400" />
                    <span>{driver.rides.length} رحلة</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {driver.vehicle_data?.vehicle_type === EVehicleType.taxi && (
                <Button
                  variant="outline"
                  onClick={handleWaslVerification}
                  disabled={verifying}
                  className="flex items-center gap-2 border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800 px-4 py-2 rounded-lg"
                >
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>{verifying ? "جاري التحقق..." : "تحقق من وصل"}</span>
                </Button>
              )}

              <Button
                variant="outline"
                asChild
                className="flex items-center gap-2 border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800 px-4 py-2 rounded-lg"
              >
                <Link
                  href={`/ar/drivers/${driver?.id}/analytics`}
                  className="flex items-center gap-2"
                >
                  <BarChart2 className="w-5 h-5 text-blue-600" />
                  <span>الإحصائيات</span>
                </Link>
              </Button>

              <Button
                variant="outline"
                asChild
                className="flex items-center gap-2 border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800 px-4 py-2 rounded-lg"
              >
                <Link
                  href={`/ar/drivers/outages/${driver?.id}`}
                  className="flex items-center gap-2"
                >
                  <Truck className="w-5 h-5 text-blue-600" />
                  <span>الرحلات</span>
                </Link>
              </Button>

              <Button
                variant="outline"
                asChild
                className="gap-2 border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
              >
                <Link href={`/ar/drivers/outages/${driver?.id}/wallet`}>
                  <Wallet className="w-4 h-4 text-blue-600" />
                  <span>المحفظة</span>
                </Link>
              </Button>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-10 w-10 p-0 border-blue-200 text-blue-700 hover:bg-blue-50"
                  >
                    <MoreVertical className="w-4 h-4" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="p-2 w-48 border border-gray-200 shadow-lg bg-white"
                  side="bottom"
                  align="end"
                >
                  <div className="w-full">
                    <EditDriver
                      profileData={driver}
                      vehicleType={getVehicleType()}
                      showBasic={true}
                    />
                  </div>

                  <Separator className="my-1" />

                  <WarningDialog
                    id={driver.id}
                    is_active={driver.is_active}
                    trigger={
                      <button className="w-full flex items-center gap-3 justify-start text-sm text-amber-600 hover:bg-amber-50 p-3 rounded-md transition-colors">
                        <Slash className="w-4 h-4" />
                        {driver.is_active ? "حظر المستخدم" : "رفع الحظر"}
                      </button>
                    }
                  />

                  <Separator className="my-1" />

                  <ErrorDialog
                    id={driver.id}
                    trigger={
                      <button className="w-full flex items-center gap-3 justify-start text-sm text-red-600 hover:bg-red-50 p-3 rounded-md transition-colors">
                        <UserRemove className="w-4 h-4" />
                        حذف المستخدم
                      </button>
                    }
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className={`grid grid-cols-1 xl:grid-cols-3 gap-8`}>
        {/* Left Column - User Info & Documents */}
        <div
          className={`${
            driver.driver_without_car ? "xl:col-span-2" : "xl:col-span-2"
          } space-y-8`}
        >
          {/* Enhanced User Information */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-blue-50/30">
            <CardHeader className="pb-6 border-b border-blue-100">
              <CardTitle className="flex items-center gap-3 text-xl text-blue-800">
                <div className="p-2 bg-blue-100 rounded-xl">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                معلومات المستخدم
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <UserInformation
                image={driver.profile_image}
                name={driver.name}
                gender={driver.gender}
                is_online={Boolean(driver.is_online)}
                created_at={driver.created_at}
                email={driver.email}
                countryCode={driver.country_code}
                mobile={driver.mobile}
                identity_number={driver.identity_number}
                date_of_birth={driver.date_of_birth}
              />
            </CardContent>
          </Card>

          {/* Enhanced Documents */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-indigo-50/30">
            <CardHeader className="pb-6 border-b border-indigo-100">
              <CardTitle className="flex items-center gap-3 text-xl text-indigo-800">
                <div className="p-2 bg-indigo-100 rounded-xl">
                  <FileText className="w-6 h-6 text-indigo-600" />
                </div>
                المستندات
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <Documents
                front_side_identity={driver.front_side_identity}
                front_side_license={driver.front_side_license}
                front_side_vehicle_form={driver.front_side_vehicle_form}
              />
            </CardContent>
          </Card>

          {!driver.driver_without_car && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-purple-50/30 hover:shadow-xl transition-all duration-300">
                <CardHeader className="pb-6 border-b border-purple-100">
                  <CardTitle className="flex items-center gap-3 text-xl text-purple-800">
                    <div className="p-2 bg-purple-100 rounded-xl">
                      <FileText className="w-6 h-6 text-purple-600" />
                    </div>
                    معلومات اللوحة
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <span className="text-sm text-purple-600 font-medium">
                        نوع اللوحة
                      </span>
                      <p className="text-lg font-semibold text-gray-900">
                        {(() => {
                          const plateType = String(driver.vehicle_data.plate_type);
                          if (plateType === "2") return "نقل عام";
                          if (plateType === "1") return "خاص";
                          if (plateType === "6") return "اجره";
                          return "غير محدد";
                        })()}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-sm text-purple-600 font-medium">
                        رقم التسلسل
                      </span>
                      <p className="text-lg font-semibold text-gray-900">
                        {driver.vehicle_data.sequence_number || "غير محدد"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-sm text-purple-600 font-medium">
                        رقم اللوحة
                      </span>
                      <p className="text-lg font-semibold text-gray-900">
                        {driver.vehicle_data.plate_number || "غير محدد"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-sm text-purple-600 font-medium">
                        الحرف الأيمن
                      </span>
                      <p className="text-lg font-semibold text-gray-900">
                        {driver.vehicle_data.plate_letter_right || "غير محدد"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-sm text-purple-600 font-medium">
                        الحرف الأوسط
                      </span>
                      <p className="text-lg font-semibold text-gray-900">
                        {driver.vehicle_data.plate_letter_middle || "غير محدد"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-sm text-purple-600 font-medium">
                        الحرف الأيسر
                      </span>
                      <p className="text-lg font-semibold text-gray-900">
                        {driver.vehicle_data.plate_letter_left || "غير محدد"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Enhanced Wallet Summary - For drivers WITH cars */}
              <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-amber-50/30 hover:shadow-xl transition-all duration-300">
                <CardHeader className="pb-6 border-b border-amber-100">
                  <CardTitle className="flex items-center gap-3 text-xl text-amber-800">
                    <div className="p-2 bg-amber-100 rounded-xl">
                      <Wallet className="w-6 h-6 text-amber-600" />
                    </div>
                    ملخص المحفظة
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-amber-50 rounded-xl border border-amber-100">
                      <div className="space-y-1">
                        <span className="text-sm text-amber-600 font-medium">
                          الرصيد الكلي
                        </span>
                        <p className="text-2xl font-bold text-amber-700">
                          {driver.wallet?.total_balance?.toFixed(2) || "0.00"}
                        </p>
                      </div>
                      <div className="text-amber-600 text-2xl">ر.س</div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1 text-center p-3 bg-white rounded-lg border border-gray-200">
                        <span className="text-sm text-gray-600">رصيد السحب</span>
                        <p className="text-lg font-semibold text-gray-900">
                          {driver.wallet?.withdrawal_balance?.toFixed(2) ||
                            "0.00"}{" "}
                          ر.س
                        </p>
                      </div>
                      <div className="space-y-1 text-center p-3 bg-white rounded-lg border border-gray-200">
                        <span className="text-sm text-gray-600">المعاملات</span>
                        <p className="text-lg font-semibold text-gray-900">
                          {driver.wallet?.transactions?.length || 0}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Right Column - Enhanced Cards */}
        <div className="space-y-8">
          {/* Enhanced Wallet Summary - For drivers WITHOUT cars */}
          {!!driver.driver_without_car && (
            <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-amber-50/30 hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-6 border-b border-amber-100">
                <CardTitle className="flex items-center gap-3 text-xl text-amber-800">
                  <div className="p-2 bg-amber-100 rounded-xl">
                    <Wallet className="w-6 h-6 text-amber-600" />
                  </div>
                  ملخص المحفظة
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-amber-50 rounded-xl border border-amber-100">
                    <div className="space-y-1">
                      <span className="text-sm text-amber-600 font-medium">
                        الرصيد الكلي
                      </span>
                      <p className="text-2xl font-bold text-amber-700">
                        {driver.wallet?.total_balance?.toFixed(2) || "0.00"}
                      </p>
                    </div>
                    <div className="text-amber-600 text-2xl">ر.س</div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1 text-center p-3 bg-white rounded-lg border border-gray-200">
                      <span className="text-sm text-gray-600">رصيد السحب</span>
                      <p className="text-lg font-semibold text-gray-900">
                        {driver.wallet?.withdrawal_balance?.toFixed(2) ||
                          "0.00"}{" "}
                        ر.س
                      </p>
                    </div>
                    <div className="space-y-1 text-center p-3 bg-white rounded-lg border border-gray-200">
                      <span className="text-sm text-gray-600">المعاملات</span>
                      <p className="text-lg font-semibold text-gray-900">
                        {driver.wallet?.transactions?.length || 0}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Enhanced Vehicle Information */}
          {!driver.driver_without_car && (
            <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-emerald-50/30 hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-6 border-b border-emerald-100">
                <CardTitle className="flex items-center gap-3 text-xl text-emerald-800">
                  <div className="p-2 bg-emerald-100 rounded-xl">
                    <Car className="w-6 h-6 text-emerald-600" />
                  </div>
                  معلومات المركبة
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  {/* Show brand and model only for vehicles that have them (not wensh) */}
                  {driver.vehicle_data.vehicle_type !== EVehicleType.wensh && (
                    <>
                      <div className="space-y-1">
                        <span className="text-sm text-emerald-600 font-medium">
                          نوع المركبة
                        </span>
                        <p className="text-lg font-semibold text-gray-900">
                          {driver.vehicle_data.brand || "غير محدد"}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-sm text-emerald-600 font-medium">
                          طراز المركبة
                        </span>
                        <p className="text-lg font-semibold text-gray-900">
                          {driver.vehicle_data.car_model || "غير محدد"}
                        </p>
                      </div>
                    </>
                  )}

                  {/* Show cabin type only for light transportation */}
                  {driver.vehicle_data.vehicle_type === EVehicleType.light_transportation && (
                    <div className="space-y-1">
                      <span className="text-sm text-emerald-600 font-medium">
                        عدد الكبائن
                      </span>
                      <p className="text-lg font-semibold text-gray-900">
                        {driver.vehicle_data.light_transportation_type_key === "single_cabin"
                          ? "كابينة مفردة"
                          : driver.vehicle_data.light_transportation_type_key === "double_cabin"
                          ? "كابينة مزدوجة"
                          : "غير محدد"}
                      </p>
                    </div>
                  )}

                  {/* Show wensh type only for wensh */}
                  {driver.vehicle_data.vehicle_type === EVehicleType.wensh && (
                    <div className="space-y-1">
                      <span className="text-sm text-emerald-600 font-medium">
                        نوع السطحة
                      </span>
                      <p className="text-lg font-semibold text-gray-900">
                        {driver.vehicle_data.wensh_type_key === "hydraulic"
                          ? "هيدروليكي"
                          : driver.vehicle_data.wensh_type_key === "basic"
                          ? "أساسي"
                          : driver.vehicle_data.wensh_type_key === "fork"
                          ? "رافعه"
                          : "غير محدد"}
                      </p>
                    </div>
                  )}

                  {/* Show color and seats only for non-light-transportation and non-wensh vehicles */}
                  {driver.vehicle_data.vehicle_type !== EVehicleType.light_transportation &&
                   driver.vehicle_data.vehicle_type !== EVehicleType.wensh &&
                   driver.vehicle_data.vehicle_type !== EVehicleType.driver_without_car && (
                    <>
                      <div className="space-y-1">
                        <span className="text-sm text-emerald-600 font-medium">
                          لون المركبة
                        </span>
                        <div className="flex items-center gap-2">
                          {driver.vehicle_data.color_hex && (
                            <div
                              className="w-4 h-4 rounded-full border border-gray-300"
                              style={{
                                backgroundColor: driver.vehicle_data.color_hex,
                              }}
                            />
                          )}
                          <p className="text-lg font-semibold text-gray-900">
                            {driver.vehicle_data.color_name || "غير محدد"}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-sm text-emerald-600 font-medium">
                          عدد المقاعد
                        </span>
                        <p className="text-lg font-semibold text-gray-900">
                          {driver.vehicle_data.seats_number?.toString() ||
                            "غير محدد"}
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {/* Enhanced Vehicle Rules - Hide for light transportation and wensh */}
                {driver.vehicle_data.vehicle_type !== EVehicleType.light_transportation &&
                 driver.vehicle_data.vehicle_type !== EVehicleType.wensh && (
                  <div className="border-t border-emerald-100 pt-6">
                    <h4 className="text-sm font-semibold text-emerald-700 mb-4 flex items-center gap-2">
                      <BadgeCheck className="w-4 h-4" />
                      قواعد المركبة
                    </h4>
                    <div className="grid grid-cols-1 gap-3">
                      {driver.vehicle_data.rules?.map(
                        (rule: any, index: number) => (
                          <div
                            key={index}
                            className="flex items-center gap-4 p-4 bg-emerald-50 rounded-xl border border-emerald-100 hover:border-emerald-200 transition-colors"
                          >
                            <Checkbox
                              disabled
                              checked={rule?.is_assigned}
                              className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                            />
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-gray-900">
                                {rule.title}
                              </p>
                              {rule.description && (
                                <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                                  {rule.description}
                                </p>
                              )}
                            </div>
                          </div>
                        )
                      )}
                      {(!driver.vehicle_data.rules ||
                        driver.vehicle_data.rules.length === 0) && (
                        <div className="text-center py-6 bg-gray-50 rounded-xl border border-gray-200">
                          <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">
                            لا توجد قواعد مخصصة
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {driver.vehicle_data?.fontas_unit && driver.vehicle_data?.vehicle_type === EVehicleType.fontas && (
            <Card className="border border-gray-200 bg-white rounded-2xl shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-lg text-gray-900">
                    <div className="p-2 bg-blue-100 rounded-xl">
                      <Droplets className="w-5 h-5 text-blue-600" />
                    </div>
                    معلومات الصهريج
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Water Quality */}
                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-200">
                      <div className="space-y-1">
                        <p className="text-blue-600 font-medium text-sm">
                          صالح للشرب؟
                        </p>
                        <p className="text-lg font-semibold text-gray-900">
                          {driver.vehicle_data.fontas_unit.type === "صالح للشرب"
                            ? "نعم"
                            : "لا"}
                        </p>
                      </div>
                      <div
                        className={`p-3 rounded-lg ${
                          driver.vehicle_data.fontas_unit.type === "صالح للشرب"
                            ? "bg-green-100 text-green-600"
                            : "bg-red-100 text-red-600"
                        }`}
                      >
                        {driver.vehicle_data.fontas_unit.type === "صالح للشرب" ? (
                          <CheckCircle className="w-6 h-6" />
                        ) : (
                          <XCircle className="w-6 h-6" />
                        )}
                      </div>
                    </div>

                    {/* Tank Capacity */}
                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-200">
                      <div className="space-y-1">
                        <p className="text-green-600 font-medium text-sm">
                          حجم الصهريج
                        </p>
                        <p className="text-lg font-semibold text-gray-900">
                          {driver.vehicle_data.fontas_unit.value}{" "}
                          {driver.vehicle_data.fontas_unit.unit ?? "غير محدد"}
                        </p>
                      </div>
                      <div className="p-3 bg-green-100 rounded-lg text-green-600">
                        <Container className="w-6 h-6" />
                      </div>
                    </div>
                  </div>

                  {/* Additional Tank Info if available */}
                  {driver.vehicle_data.fontas_unit.basic_price && (
                    <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-200">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-amber-600 font-medium text-sm">
                            السعر الأساسي
                          </p>
                          <p className="text-lg font-semibold text-gray-900">
                            {driver.vehicle_data.fontas_unit.basic_price} ر.س
                          </p>
                        </div>
                        <div className="p-3 bg-amber-100 rounded-lg text-amber-600">
                          <DollarSign className="w-6 h-6" />
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
        </div>
      </div>

      {/* WASL Response Dialog */}
      <CustomDialog
        title="نتيجة التحقق من وصل"
        color={Colors.primary}
        open={showWaslDialog}
        onOpenChange={setShowWaslDialog}
        trigger={null}
        content={
          <div className="space-y-4">
            {waslResponse && (
              <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-blue-50/30">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Status */}
                    <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl border border-blue-200">
                      <div className="flex-1">
                        <p className="text-sm text-blue-600 font-medium mb-1">
                          الحالة
                        </p>
                        <p className="text-lg font-semibold text-gray-900">
                          {waslResponse.success ? "نجح" : "فشل"}
                        </p>
                      </div>
                      {waslResponse.success ? (
                        <CheckCircle className="w-8 h-8 text-green-600" />
                      ) : (
                        <XCircle className="w-8 h-8 text-red-600" />
                      )}
                    </div>

                    {/* Message */}
                    {waslResponse.message && (
                      <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <p className="text-sm text-gray-600 font-medium mb-2">
                          الرسالة
                        </p>
                        <p className="text-base text-gray-900 leading-relaxed">
                          {waslResponse.message}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
            <div className="flex justify-end">
              <Button
                variant="primary"
                onClick={() => setShowWaslDialog(false)}
              >
                إغلاق
              </Button>
            </div>
          </div>
        }
      />

      {/* Profile Image Dialog */}
      <CustomDialog
        title="صورة الملف الشخصي"
        color={Colors.primary}
        open={showImageDialog}
        onOpenChange={setShowImageDialog}
        trigger={null}
        content={
          <div className="flex items-center justify-center p-4">
            <div className="relative w-full max-w-md">
              <Image
                width={500}
                height={500}
                src={driver.profile_image || "/default-avatar.png"}
                alt={driver.name}
                className="w-full h-auto rounded-xl object-contain"
              />
            </div>
          </div>
        }
      />
    </div>
  );
};

export default DriverProfileComponent;
