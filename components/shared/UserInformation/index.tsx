import { StaticImageData } from "next/image";
import AvatarWithName from "../TableCellComponents/AvatarWithName";
import StatusCell from "../TableCellComponents/StatusCell";
import TitleAndSubTitle from "../TitleAndSubTitle";
import { convertDateFormat } from "@/lib/helperFunctions";
import { Card, CardContent } from "@/components/ui/card";
import { User, Mail, Phone, IdCard, Calendar, FileText } from "lucide-react";
import { isTruthy } from "@/lib/utils";

interface Props {
  image: string | StaticImageData;
  name: string;
  gender: string;
  is_online: boolean;
  created_at: string;
  email: string;
  countryCode: string;
  mobile: string | null;
  identity_number: string;
  date_of_birth: string;
  driving_license_type?: string;
  driving_license_number?: string;
  driving_license_expiration_date?: string;
}

const Index = ({
  image,
  name,
  gender,
  is_online,
  created_at,
  email,
  countryCode,
  mobile,
  identity_number,
  date_of_birth,
  driving_license_type,
  driving_license_number,
  driving_license_expiration_date,
}: Props) => {
  const InfoCard = ({
    children,
    className = "",
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <Card
      className={`rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-blue-50/30 shadow-sm hover:shadow-md transition-all duration-300 ${className}`}
    >
      <CardContent className="p-6">{children}</CardContent>
    </Card>
  );

  const hasDrivingLicense =
    driving_license_type ||
    driving_license_number ||
    driving_license_expiration_date;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Profile Card */}
      <InfoCard className="lg:col-span-1">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <AvatarWithName
              image={image}
              name={name}
              gender={gender}
              online={is_online}
            />
            {is_online && (
              <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium border border-green-200">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                نشط
              </div>
            )}
          </div>
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
            <User className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm text-blue-600 font-medium">
                تاريخ الإنضمام
              </p>
              <p className="text-base font-semibold text-gray-900">
                {convertDateFormat(created_at)}
              </p>
            </div>
          </div>
        </div>
      </InfoCard>

      {/* Contact Card */}
      <InfoCard>
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm text-blue-600 font-medium">
                البريد الإلكتروني
              </p>
              <p className="text-base font-semibold text-gray-900 break-all">
                {email || "لم يتم اضافة بريد الكتروني"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Phone className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm text-blue-600 font-medium">الجوال</p>
              <p className="text-base font-semibold text-gray-900">
                {countryCode + mobile}
              </p>
            </div>
          </div>
        </div>
      </InfoCard>

      {/* Identity Card */}
      <InfoCard>
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <IdCard className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm text-blue-600 font-medium">
                رقم الهوية الرقمية
              </p>
              <p className="text-base font-semibold text-gray-900">
                {identity_number ?? "غير محدد"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm text-blue-600 font-medium">تاريخ الميلاد</p>
              <p className="text-base font-semibold text-gray-900">
                {date_of_birth ? convertDateFormat(date_of_birth) : "غير محدد"}
              </p>
            </div>
          </div>
        </div>
      </InfoCard>

      {/* Driving License Card - Only show if driver has license info */}
      {hasDrivingLicense && (
        <InfoCard>
          <div className="flex flex-col gap-5">
            {driving_license_type && (
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-blue-600 font-medium">
                    نوع رخصة القيادة
                  </p>
                  <p className="text-base font-semibold text-gray-900">
                    {driving_license_type}
                  </p>
                </div>
              </div>
            )}
            {driving_license_number && (
              <div className="flex items-center gap-3">
                <IdCard className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-blue-600 font-medium">
                    رقم رخصة القيادة
                  </p>
                  <p className="text-base font-semibold text-gray-900">
                    {driving_license_number}
                  </p>
                </div>
              </div>
            )}
            {driving_license_expiration_date && (
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-blue-600 font-medium">
                    تاريخ انتهاء الرخصة
                  </p>
                  <p className="text-base font-semibold text-gray-900">
                    {convertDateFormat(driving_license_expiration_date)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </InfoCard>
      )}
    </div>
  );
};

export default Index;
