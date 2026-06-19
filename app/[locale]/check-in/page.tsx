"use client";

import { useState, useEffect } from "react";
import MainLayout from "@/components/shared/MainLayout";
import FullPageHead from "@/components/shared/FullPageHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation, CheckCircle, XCircle, Clock } from "lucide-react";
import { mockGeofences } from "@/lib/mockData/trackingMockData";

export default function CheckInPage() {
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [nearestGeofence, setNearestGeofence] = useState<{ geofence: typeof mockGeofences[0]; distance: number } | null>(null);
  const [checkInStatus, setCheckInStatus] = useState<"idle" | "success" | "outside" | "loading">("idle");
  const [checkInTime, setCheckInTime] = useState<string | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation({ lat: latitude, lng: longitude });

          let closest: { geofence: typeof mockGeofences[0]; distance: number } | null = null;
          mockGeofences.forEach((geo) => {
            const dist = calculateDistance(latitude, longitude, geo.lat, geo.lng);
            if (!closest || dist < closest.distance) {
              closest = { geofence: geo, distance: dist };
            }
          });
          if (closest) {
            setNearestGeofence(closest);
          }
        },
        (error) => {
          setLocationError("تعذر الحصول على موقعك. يرجى تفعيل خدمة تحديد الموقع.");
        }
      );
    } else {
      setLocationError("متصفحك لا يدعم خدمة تحديد الموقع.");
    }
  }, []);

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const handleCheckIn = () => {
    if (!nearestGeofence || !currentLocation) return;
    setCheckInStatus("loading");
    setTimeout(() => {
      if (nearestGeofence.distance <= nearestGeofence.geofence.radius) {
        const now = new Date();
        setCheckInTime(now.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }));
        setCheckInStatus("success");
      } else {
        setCheckInStatus("outside");
      }
    }, 1000);
  };

  const isInside = nearestGeofence && nearestGeofence.distance <= nearestGeofence.geofence.radius;

  return (
    <MainLayout>
      <div className="p-6 space-y-6 min-h-screen">
        <FullPageHead
          head="تسجيل الحضور"
          description="سجل حضورك باستخدام موقعك الحالي ضمن النطاق الجغرافي"
          Icon={<CheckCircle className="w-7 h-7" />}
        />

        <div className="max-w-2xl mx-auto space-y-6">
          <Card className="border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Navigation className="w-5 h-5 text-blue-600" />
                موقعك الحالي
              </CardTitle>
            </CardHeader>
            <CardContent>
              {locationError ? (
                <div className="flex items-center gap-3 bg-red-50 p-4 rounded-xl">
                  <XCircle className="w-6 h-6 text-red-600" />
                  <p className="text-sm text-red-700">{locationError}</p>
                </div>
              ) : !currentLocation ? (
                <div className="flex items-center gap-3 bg-blue-50 p-4 rounded-xl">
                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-blue-700">جاري تحديد موقعك...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 bg-green-50 p-4 rounded-xl">
                    <MapPin className="w-6 h-6 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-green-900">تم تحديد موقعك</p>
                      <p className="text-xs text-green-700 mt-0.5">
                        خط العرض: {currentLocation.lat.toFixed(4)} | خط الطول: {currentLocation.lng.toFixed(4)}
                      </p>
                    </div>
                  </div>

                  {nearestGeofence && (
                    <div
                      className={`p-4 rounded-xl ${
                        isInside ? "bg-green-50 border-2 border-green-200" : "bg-amber-50 border-2 border-amber-200"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: `${nearestGeofence.geofence.color}20` }}
                        >
                          <MapPin className="w-5 h-5" style={{ color: nearestGeofence.geofence.color }} />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-gray-900">{nearestGeofence.geofence.name}</p>
                          <p className="text-xs text-gray-600">{nearestGeofence.geofence.address}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            المسافة: {Math.round(nearestGeofence.distance)} متر | النطاق: {nearestGeofence.geofence.radius} متر
                          </p>
                        </div>
                        {isInside ? (
                          <CheckCircle className="w-6 h-6 text-green-600" />
                        ) : (
                          <XCircle className="w-6 h-6 text-amber-600" />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {checkInStatus === "success" && (
            <Card className="border-0 shadow-xl bg-gradient-to-br from-green-50 to-emerald-50">
              <CardContent className="pt-6">
                <div className="text-center space-y-3">
                  <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center mx-auto">
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-green-900">تم تسجيل الحضور بنجاح!</h3>
                  <div className="flex items-center justify-center gap-2 text-green-700">
                    <Clock className="w-5 h-5" />
                    <span className="text-lg font-semibold">{checkInTime}</span>
                  </div>
                  {nearestGeofence && (
                    <p className="text-sm text-green-600">
                      الموقع: {nearestGeofence.geofence.name}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {checkInStatus === "outside" && (
            <Card className="border-0 shadow-xl bg-gradient-to-br from-amber-50 to-orange-50">
              <CardContent className="pt-6">
                <div className="text-center space-y-3">
                  <div className="w-16 h-16 rounded-full bg-amber-500 flex items-center justify-center mx-auto">
                    <XCircle className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-amber-900">أنت خارج النطاق الجغرافي</h3>
                  <p className="text-sm text-amber-700">
                    يجب أن تكون ضمن نطاق {nearestGeofence?.geofence.name} لتسجيل الحضور.
                    المسافة الحالية: {Math.round(nearestGeofence?.distance || 0)} متر
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-center">
            <Button
              variant="primary"
              size="lg"
              disabled={!currentLocation || checkInStatus === "loading" || checkInStatus === "success"}
              onClick={handleCheckIn}
              className="flex items-center gap-2 min-w-[200px]"
            >
              {checkInStatus === "loading" ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  جاري التسجيل...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  تسجيل الحضور
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
