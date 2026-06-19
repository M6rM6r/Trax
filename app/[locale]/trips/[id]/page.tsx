import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  Navigation,
  User,
  Phone,
  Mail,
  Car,
  Star,
  MapPinned,
} from "lucide-react";
import MainLayout from "@/components/shared/MainLayout";
import { fetcher } from "@/lib/fetcher";
import { Genders, Ride } from "@/lib/types/responseTypes";
import Link from "next/link";

// Trip information page component
export default async function TripDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const response: any = await fetcher(`/rides/${params.id}`);
  const trip: Ride = response.data?.ride;

  const getStatusVariant = (statusKey: string) => {
    const variants: {
      [key: string]: "default" | "destructive" | "outline" | "secondary";
    } = {
      canceled_automatically: "destructive",
      pending: "outline",
      completed: "default",
      in_progress: "secondary",
      accepted: "secondary",
    };
    return variants[statusKey] || "outline";
  };

  const getPaymentStatusVariant = (statusKey: string) => {
    const variants: {
      [key: string]:
        | "default"
        | "success"
        | "warning"
        | "destructive"
        | "outline"
        | "secondary";
    } = {
      paid: "success",
      pending: "warning",
      failed: "destructive",
      refunded: "outline",
    };
    return variants[statusKey] || "outline";
  };

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString("ar-SA", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatPhoneNumber = (phone: string, countryCode?: string) => {
    const code = countryCode || "966";
    return `${code}${phone}`;
  };

  const getInitials = (name: string) => {
    return name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <MainLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              تفاصيل الرحلة #{trip.id}
            </h1>
            <p className="text-gray-600 mt-2">
              معلومات كاملة عن الرحلة والعميل
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Trip Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Trip Status Card */}
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge
                    variant={getStatusVariant(trip.status_key)}
                    className="text-sm px-3 py-1"
                  >
                    {trip.status}
                  </Badge>
                  <Badge variant="secondary" className="text-sm px-3 py-1">
                    {trip.service_type}
                  </Badge>
                  {trip.is_now && (
                    <Badge
                      variant="default"
                      className="bg-green-500 text-white text-sm px-3 py-1"
                    >
                      الآن
                    </Badge>
                  )}
                  {trip.is_important_date && (
                    <Badge
                      variant="default"
                      className="bg-purple-500 text-white text-sm px-3 py-1"
                    >
                      تاريخ مهم
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Location Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Pickup Location */}
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <MapPinned className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-2">
                        نقطة الانطلاق
                      </h3>
                      {trip.pickup ? (
                        <>
                          <p className="text-gray-600 text-sm leading-relaxed">
                            {trip.pickup.address}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {trip.pickup.lat}, {trip.pickup.long}
                          </p>
                        </>
                      ) : (
                        <p className="text-gray-400 text-sm">
                          لم يتم تحديد نقطة الانطلاق
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Destination Location */}
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-2">
                        الوجهة
                      </h3>
                      {trip.destination ? (
                        <>
                          <p className="text-gray-600 text-sm leading-relaxed">
                            {trip.destination.address}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {trip.destination.lat}, {trip.destination.long}
                          </p>
                        </>
                      ) : (
                        <p className="text-gray-400 text-sm">
                          لم يتم تحديد الوجهة
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Timing Information */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">
                        طلب في
                      </h3>
                      <p className="text-gray-600 text-xs">
                        {formatDateTime(trip.requested_at)}
                      </p>
                    </div>
                  </div>

                  {trip.start_at && (
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <Clock className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 text-sm">
                          بدأت في
                        </h3>
                        <p className="text-gray-600 text-xs">
                          {formatDateTime(trip.start_at)}
                        </p>
                      </div>
                    </div>
                  )}

                  {trip.end_at && (
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <Clock className="w-4 h-4 text-gray-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 text-sm">
                          انتهت في
                        </h3>
                        <p className="text-gray-600 text-xs">
                          {formatDateTime(trip.end_at)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Ride Metrics */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">
                      {trip.ride_distance} كم
                    </p>
                    <p className="text-sm text-gray-600">المسافة المتوقعة</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">
                      {parseInt(trip.ride_duration).toFixed(0)} د
                    </p>
                    <p className="text-sm text-gray-600">المدة المتوقعة</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">
                      {trip.extra_hours} س
                    </p>
                    <p className="text-sm text-gray-600">ساعات إضافية</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Information Card */}
            <Card className="border border-gray-200 shadow-sm rounded-xl">
              <CardHeader className="border-b bg-gray-50/70 rounded-t-xl py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    معلومات الدفع
                  </CardTitle>
                </div>
              </CardHeader>

              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Section: Pricing */}
                  <div className="space-y-5">
                    <h3 className="font-semibold text-gray-900 text-base flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-primary"></span>
                      التكلفة
                    </h3>

                    <div className="space-y-4 bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                        <span className="text-gray-600">السعر الأساسي:</span>
                        <span className="font-bold text-lg text-gray-800">
                          {trip.price} ر.س
                        </span>
                      </div>

                      {trip.final_price && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">السعر النهائي:</span>
                          <span className="font-bold text-lg text-green-600">
                            {trip.final_price} ر.س
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Section: Payment Status */}
                  <div className="space-y-5">
                    <h3 className="font-semibold text-gray-900 text-base flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-primary"></span>
                      حالة الدفع
                    </h3>

                    <div className="space-y-5 bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div>
                        <Badge
                          variant={getPaymentStatusVariant(
                            trip.payment_status_key
                          )}
                          className="text-sm px-3 py-1.5 rounded-md"
                        >
                          {trip.payment_status}
                        </Badge>
                      </div>

                      {trip.payment_method && (
                        <div className="flex justify-between items-center py-2 border-b border-gray-200">
                          <span className="text-gray-600">طريقة الدفع:</span>
                          <span className="font-semibold text-gray-800">
                            {trip.payment_method.title}
                          </span>
                        </div>
                      )}

                      {trip.paid_at && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">دفع في:</span>
                          <span className="text-sm text-gray-500">
                            {formatDateTime(trip.paid_at)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - User Information */}
          <div className="space-y-6">
            {/* Customer Card */}
            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="w-5 h-5" />
                  معلومات العميل
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="w-14 h-14 border-2 border-gray-200">
                    <AvatarImage
                      src={trip.customer.profile_image || ""}
                      alt={trip.customer.name}
                    />
                    <AvatarFallback className="bg-green-100 text-green-800">
                      {getInitials(trip.customer.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 text-lg">
                      {trip.customer.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className="text-sm font-medium text-gray-700">
                          {trip.customer.rating}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {trip.customer.gender === ("male" as unknown as Genders)
                          ? "ذكر"
                          : "أنثى"}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-700 font-medium">
                      {formatPhoneNumber(
                        trip.customer.phone,
                        trip.customer.countryCode
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-700">{trip.customer.email}</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1 p-0">
                    <Link
                      href={`tel:+${formatPhoneNumber(
                        trip.customer.phone,
                        trip.customer.countryCode
                      )}`}
                      className="flex items-center justify-center gap-2 w-full h-full px-3 py-2"
                    >
                      <Phone className="w-4 h-4" />
                      اتصال
                    </Link>
                  </Button>

                  <Button variant="outline" size="sm" className="flex-1 p-0">
                    <Link
                      href={`mailto:${trip.customer.email}`}
                      className="flex items-center justify-center gap-2 w-full h-full px-3 py-2"
                    >
                      <Mail className="w-4 h-4" />
                      رسالة
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Driver Card - Conditionally Rendered */}
            {trip.driver && (
              <Card className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Car className="w-5 h-5" />
                    معلومات السائق
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-14 h-14 border-2 border-gray-200">
                      <AvatarImage
                        src={trip.driver.profile_image || ""}
                        alt={trip.driver.name}
                      />
                      <AvatarFallback className="bg-blue-100 text-blue-800">
                        {getInitials(trip.driver.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-lg">
                        {trip.driver.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          <span className="text-sm font-medium text-gray-700">
                            {trip.driver.rating}
                          </span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {trip.driver.gender === ("male" as unknown as Genders)
                            ? "ذكر"
                            : "أنثى"}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 bg-gray-50 p-3 rounded-lg">
                    {/* Phone */}
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-700 font-medium">
                        {formatPhoneNumber(
                          trip.driver.phone,
                          trip.driver.countryCode
                        )}
                      </span>
                    </div>

                    {/* Email */}
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-700">{trip.driver.email}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    {/* Call Button */}
                    <Button variant="outline" size="sm" className="flex-1 p-0">
                      <Link
                        href={`tel:+${formatPhoneNumber(
                          trip.driver.phone,
                          trip.driver.countryCode
                        )}`}
                        className="flex items-center justify-center gap-2 w-full h-full px-3 py-2"
                      >
                        <Phone className="w-4 h-4" />
                        اتصال
                      </Link>
                    </Button>

                    {/* Email Button */}
                    <Button variant="outline" size="sm" className="flex-1 p-0">
                      <Link
                        href={`mailto:${trip.driver.email}`}
                        className="flex items-center justify-center gap-2 w-full h-full px-3 py-2"
                      >
                        <Mail className="w-4 h-4" />
                        رسالة
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Trip Summary Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">ملخص الرحلة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-gray-600 text-sm">رقم الرحلة:</span>
                    <p className="font-mono font-semibold">#{trip.id}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-gray-600 text-sm">نوع الخدمة:</span>
                    <p className="font-semibold">{trip.service_type}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-gray-600 text-sm">عدد الأيام:</span>
                    <p className="font-semibold">{trip.number_of_days}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-gray-600 text-sm">طلبات نشطة:</span>
                    <Badge
                      variant={
                        trip.has_active_requests ? "destructive" : "outline"
                      }
                    >
                      {trip.has_active_requests ? "نعم" : "لا"}
                    </Badge>
                  </div>
                </div>

                {trip.customer_requested_to_complete > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-yellow-800 text-sm text-center">
                      العميل طلب الإكمال ({trip.customer_requested_to_complete}{" "}
                      مرات)
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
