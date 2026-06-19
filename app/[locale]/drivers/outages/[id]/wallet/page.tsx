import MainLayout from "@/components/shared/MainLayout";
import BreadCrumb from "@/components/shared/BreadCrumb";
import {
  Edit2,
  EyeB,
  Flash,
  Slash,
  Star,
  User,
  UserRemove,
} from "@/public/SVG";
import CustomDialog, { Colors } from "@/components/shared/CustomDialog";
import GoBack from "@/components/shared/GoBack";
import { fetcher } from "@/lib/fetcher";
import { DriverProfileResponse } from "@/lib/types/responseTypes";
import WalletTable from "@/components/shared/WalletTable";
import EditDriverOutages from "@/components/outages/EditDriverOutages";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  MoreVertical,
  Wallet,
  Calendar,
  MapPin,
  Car,
  BarChart2,
  Truck,
} from "lucide-react";
import { EVehicleType } from "@/lib/types/enums";
import { Separator } from "@/components/ui/separator";
import WarningDialog from "@/components/shared/WarningDialog";
import ErrorDialog from "@/components/shared/ErrorDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const Page = async ({ params }: { params: { id: string } }) => {
  const profile = await fetcher<DriverProfileResponse>(`/drivers/${params.id}`);

  console.log({ profile: profile.data.driver });

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "غير متوفر";
    return new Date(dateString).toLocaleDateString("ar-SA");
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge
        variant="default"
        className="text-xs bg-green-100 text-green-800 border-green-200"
      >
        🟢 نشط
      </Badge>
    ) : (
      <Badge
        variant="destructive"
        className="text-xs bg-red-100 text-red-800 border-red-200"
      >
        محظور
      </Badge>
    );
  };

  return (
    <MainLayout showSidebar={false}>
      <div className="space-y-6">
        {/* Enhanced Breadcrumb */}
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
                label: profile.data.driver.name,
              },
            ]}
          />
        </div>

        <GoBack />

        {/* Header Section */}
        <Card className="border border-blue-100 bg-white shadow-sm rounded-2xl">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              {/* Driver Info */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute -inset-1 bg-blue-100 rounded-full opacity-60"></div>
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center relative z-10 border-2 border-white">
                    <Wallet className="w-6 h-6 text-white" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 z-20">
                    {getStatusBadge(profile.data.driver.is_active)}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-gray-900">
                      محفظة السائق
                    </h1>
                    <Badge
                      variant="outline"
                      className="bg-blue-50 text-blue-700 border-blue-200"
                    >
                      المعاملات
                    </Badge>
                  </div>
                  <p className="text-gray-600 text-sm">
                    عرض تفصيلي لمعاملات المحفظة والرصيد المتاح
                  </p>
                </div>
              </div>

              {/* Center - Driver Name */}
              <div className="flex flex-col items-center text-center flex-1">
                <span className="text-gray-500 text-sm font-medium mb-1">
                  اسم السائق
                </span>
                <span className="text-2xl font-bold text-gray-900">
                  {profile.data.driver.name}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  asChild
                  className="flex items-center gap-2 border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800 px-4 py-2 rounded-lg"
                >
                  <Link
                    href={`/ar/drivers/${params.id}/analytics`}
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
                    href={`/ar/drivers/outages/${params.id}`}
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
                  <Link href={`/ar/drivers/outages/${params.id}/profile`}>
                    <EyeB className="text-blue-600" />
                    <span>الملف الشخصي</span>
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
                    <CustomDialog
                      title="تعديل بيانات السائق"
                      color={Colors.primary}
                      trigger={
                        <button className="w-full flex items-center gap-3 justify-start text-sm text-gray-700 hover:bg-gray-50 p-3 rounded-md cursor-pointer transition-colors">
                          <Edit2 className="w-4 h-4 text-gray-600" />
                          تعديل البيانات
                        </button>
                      }
                      content={
                        <EditDriverOutages
                          profileData={profile.data.driver}
                          vehicleType={EVehicleType.fast_support}
                        />
                      }
                    />

                    <Separator className="my-1" />

                    <WarningDialog
                      id={profile.data.driver.id}
                      is_active={profile.data.driver.is_active}
                      trigger={
                        <button className="w-full flex items-center gap-3 justify-start text-sm text-amber-600 hover:bg-amber-50 p-3 rounded-md transition-colors">
                          <Slash className="w-4 h-4" />
                          {profile.data.driver.is_active
                            ? "حظر المستخدم"
                            : "رفع الحظر"}
                        </button>
                      }
                    />

                    <Separator className="my-1" />

                    <ErrorDialog
                      id={profile.data.driver.id}
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

            {/* Additional Driver Info */}
            <div className="flex items-center gap-6 mt-4 pt-4 border-t border-gray-100 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span>
                  مسجل منذ {formatDate(profile.data.driver.created_at)}
                </span>
              </div>
              {profile.data.driver.city && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span>{profile.data.driver.city}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Car className="w-4 h-4 text-gray-400" />
                <span>{profile.data.driver.rides.length} رحلة</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Wallet Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Balance */}
          <Card className="border border-green-200 bg-green-50 rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-green-600 font-medium text-sm">
                    الرصيد الكلي
                  </p>
                  <p className="text-3xl font-bold text-green-700">
                    {profile.data.driver.wallet?.total_balance?.toFixed(2) ||
                      "0.00"}
                  </p>
                  <p className="text-green-600 text-sm">ر.س</p>
                </div>
                <div className="p-3 bg-green-100 rounded-xl">
                  <Wallet className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Withdrawal Balance */}
          <Card className="border border-blue-200 bg-blue-50 rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-blue-600 font-medium text-sm">
                    رصيد السحب
                  </p>
                  <p className="text-3xl font-bold text-blue-700">
                    {profile.data.driver.wallet?.withdrawal_balance?.toFixed(
                      2
                    ) || "0.00"}
                  </p>
                  <p className="text-blue-600 text-sm">ر.س</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Wallet className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transactions Count */}
          <Card className="border border-purple-200 bg-purple-50 rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-purple-600 font-medium text-sm">
                    عدد المعاملات
                  </p>
                  <p className="text-3xl font-bold text-purple-700">
                    {profile.data.driver.wallet?.transactions?.length || 0}
                  </p>
                  <p className="text-purple-600 text-sm">معاملة</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-xl">
                  <Wallet className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Wallet Table */}
        <Card className="border border-gray-200 bg-white rounded-2xl shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-xl text-gray-900">
              <div className="p-2 bg-blue-100 rounded-xl">
                <Wallet className="w-5 h-5 text-blue-600" />
              </div>
              سجل المعاملات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <WalletTable wallet={profile.data.driver.wallet} />
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Page;
