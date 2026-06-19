"use client";
import { useState } from "react";
import { Copy, Car, CircleCheck, Phone } from "lucide-react";
import Image from "next/image";
import StatusCell from "@/components/shared/TableCellComponents/StatusCell";

export interface LocationsTypes {
  id: number;
  long: number;
  lat: number;
  type: string;
  order: number;
  ride_id: number;
  created_at: Date;
  updated_at: Date;
  deleted_at: null;
  address: string;
}

const RideDetails = ({ ride, onClear }: { ride: any; onClear: () => void }) => {
  const [copied, setCopied] = useState(false);

  if (!ride) return null;
  const handleCopy = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    navigator.clipboard.writeText(ride.id.toString());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-4 mt-4 border rounded-2xl bg-white shadow-sm">
      {/* العنوان + الأزرار */}
      <div className="grid grid-cols-1 md:grid-cols-2 items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">معلومات الرحلة</h3>
        <div className="flex gap-2 justify-start md:justify-end mt-2 md:mt-0">
          <button
            onClick={onClear}
            className="px-6 py-2 text-sm rounded bg-red-100 text-red-600 hover:bg-red-200"
          >
            إلغاء الربط
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* div1 = معلومات الرحلة */}
        <div className="border rounded-lg p-3 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <p className="text-sm">
                رحلة رقم #<span className="font-semibold">{ride?.id}</span>
              </p>

              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-sm px-2 py-1 transition text-[#11489B]"
              >
                <Copy size={16} />
                {copied ? "تم النسخ" : "نسخ"}
              </button>
            </div>
            {ride?.status_title && (
              <StatusCell text={ride?.status_title} green={ride?.status} />
            )}
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm">
              تاريخ الرحلة:{" "}
              <span className="font-semibold">
                {new Date(ride?.start_at).toLocaleDateString("en-US")}
              </span>
            </p>

            {/* الحالة */}
            {ride?.service_type_title && (
              <div
                className={`flex items-center gap-3 py-1.5 px-2 w-fit rounded-full max-h-[26px] bg-[#EBEBEC]`}
              >
                <span className={`text-14`}>{ride?.service_type_title}</span>
                <span>
                  <CircleCheck size={16} />
                </span>
              </div>
            )}
          </div>

          <p className="text-sm">
            موقع الالتقاء
            <span className="block pr-3 pt-2 font-semibold">
              {ride?.locations
                .filter(
                  (location: LocationsTypes) => location?.type === "pickup"
                )
                .map((location: LocationsTypes) => location?.address)}
            </span>
            {/* ride.locations.filter((location) => location.type === "pickup").map((location) => location.address) */}
          </p>
          <p className="text-sm">
            موقع الوصول
            <span className="block pr-3 pt-2 font-semibold">
              {ride?.locations
                .filter(
                  (location: LocationsTypes) => location?.type === "destination"
                )
                .map((location: LocationsTypes) => location?.address)}
            </span>
          </p>
          <p className="text-sm">
            التكلفة الأولية للرحلة: &nbsp;
            <span className="font-semibold">{ride?.price} ريال سعودي </span>
          </p>
        </div>
        {/* العمود الثاني = السائق + الراكب */}
        <div className="grid grid-rows-2 gap-4 h-full">
          <div className="border rounded-lg p-3 flex items-center gap-3 h-full justify-between">
            {" "}
            {/* الراكب */}
            {ride?.customer && (
              <div>
                <p>الراكب</p>
                <div className="p-3 flex items-center gap-3 h-full">
                  {ride?.customer?.profile_image && (
                    <Image
                      src={ride?.customer?.profile_image || ""}
                      width={80}
                      height={80}
                      className="rounded-sm"
                      alt="customer"
                    />
                  )}

                  <div>
                    <p className="font-semibold">{ride?.customer?.name}</p>
                    <p className="text-sm text-gray-500">
                      {ride?.customer?.gender}
                    </p>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <Phone size={16} />
                      {ride?.customer?.country_code}
                      {ride?.customer?.mobile}
                    </p>
                  </div>
                </div>
              </div>
            )}
            {/* السائق */}
            {ride?.driver && (
              <div>
                <p>السائق</p>
                <div className="p-3 flex items-center gap-3 h-full">
                  {ride?.driver?.profile_image && (
                    <Image
                      src={ride?.driver?.profile_image || ""}
                      width={80}
                      height={80}
                      className="rounded-sm"
                      alt="driver"
                    />
                  )}

                  <div>
                    <p className="font-semibold">{ride?.driver?.name}</p>
                    <p className="text-sm text-gray-500">
                      {ride?.driver?.gender}
                    </p>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <Phone size={16} />
                      {ride?.driver?.country_code}
                      {ride?.driver?.mobile}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
          {/* ride?.driver?.vehicles[0]?.car_name */}

          {ride?.driver?.vehicles[0] && (
            <div className="border rounded-lg p-4 flex justify-between items-start h-full">
              {/* بيانات السياره */}
              {/* القسم اليمين: بيانات السيارة + التفاصيل */}
              <div className="flex flex-col items-start text-right gap-2">
                {/* بيانات السيارة */}
                <div className="flex items-center gap-2">
                  <Car size={40} />
                  <span className="font-semibold">
                    {ride?.driver?.vehicles[0]?.car_name}
                  </span>
                </div>

                {/* التفاصيل */}
                <div className="text-sm text-gray-600">
                  <p>
                    لون المركبة:{" "}
                    <span className="font-bold">
                      {ride?.driver?.vehicles[0]?.color}
                    </span>
                  </p>
                  <p>
                    عدد المقاعد:{" "}
                    <span className="font-bold">
                      {" "}
                      {ride?.driver?.vehicles[0]?.seats_number}
                    </span>
                  </p>
                </div>
              </div>

              {/* القسم الشمال: اللوحة */}
              <div className="flex items-center gap-1 text-xl px-3 py-1 ">
                <span>{ride?.driver?.vehicles[0]?.plate_number}</span>
                <span className="border-l border-gray-300 h-6"></span>
                <span>{ride?.driver?.vehicles[0]?.plate_letter_right}</span>
                <span>{ride?.driver?.vehicles[0]?.plate_letter_middle}</span>
                <span>{ride?.driver?.vehicles[0]?.plate_letter_left}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RideDetails;
