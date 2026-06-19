"use client";

import { useState } from "react";
import MainLayout from "@/components/shared/MainLayout";
import FullPageHead from "@/components/shared/FullPageHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Plus, Trash2, Edit } from "lucide-react";
import { useGeofences, useCreateGeofence, useDeleteGeofence } from "@/hooks/useApi";
import { LoadingSkeleton, EmptyState, ErrorState } from "@/components/shared/StateViews";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { useToast } from "@/hooks/use-toast";
import type { Geofence } from "@/lib/types/trackingTypes";

export default function GeofencesPage() {
  const { data: geofences = [], isLoading, isError, refetch } = useGeofences();
  const createGeofence = useCreateGeofence();
  const deleteGeofence = useDeleteGeofence();
  const { toast } = useToast();
  const [showAddForm, setShowAddForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Geofence | null>(null);
  const [newGeofence, setNewGeofence] = useState({
    name: "",
    address: "",
    lat: 24.7136,
    lng: 46.6753,
    radius: 100,
    color: "#2563EB",
  });

  const handleAdd = () => {
    createGeofence.mutate(
      { ...newGeofence, active: true },
      {
        onSuccess: () => {
          toast({ description: "تم إضافة النطاق الجغرافي بنجاح" });
          setShowAddForm(false);
          setNewGeofence({
            name: "",
            address: "",
            lat: 24.7136,
            lng: 46.6753,
            radius: 100,
            color: "#2563EB",
          });
        },
        onError: () => {
          toast({ description: "حدث خطأ أثناء إضافة النطاق", variant: "destructive" });
        },
      }
    );
  };

  const handleDelete = (geo: Geofence) => {
    setDeleteTarget(geo);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteGeofence.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast({ description: "تم حذف النطاق الجغرافي" });
        setDeleteTarget(null);
      },
      onError: () => {
        toast({ description: "تعذر حذف النطاق الجغرافي", variant: "destructive" });
        setDeleteTarget(null);
      },
    });
  };

  return (
    <MainLayout>
      <div className="p-6 space-y-6 min-h-screen">
        <FullPageHead
          head="النطاقات الجغرافية"
          description="إدارة مواقع العمل والنطاقات الجغرافية للموظفين"
          Icon={<MapPin className="w-7 h-7" />}
          LeftSection={
            <Button
              variant="primary"
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              إضافة نطاق
            </Button>
          }
        />

        {showAddForm && (
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-bold">إضافة نطاق جغرافي جديد</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">الاسم</label>
                  <input
                    type="text"
                    value={newGeofence.name}
                    onChange={(e) => setNewGeofence({ ...newGeofence, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="اسم الموقع"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">العنوان</label>
                  <input
                    type="text"
                    value={newGeofence.address}
                    onChange={(e) => setNewGeofence({ ...newGeofence, address: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="العنوان"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    خط العرض (Lat)
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={newGeofence.lat}
                    onChange={(e) =>
                      setNewGeofence({ ...newGeofence, lat: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    خط الطول (Lng)
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={newGeofence.lng}
                    onChange={(e) =>
                      setNewGeofence({ ...newGeofence, lng: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    نصف القطر (متر)
                  </label>
                  <input
                    type="number"
                    value={newGeofence.radius}
                    onChange={(e) =>
                      setNewGeofence({ ...newGeofence, radius: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">اللون</label>
                  <input
                    type="color"
                    value={newGeofence.color}
                    onChange={(e) => setNewGeofence({ ...newGeofence, color: e.target.value })}
                    className="w-full h-10 border border-gray-300 rounded-lg cursor-pointer"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <Button variant="primary" onClick={handleAdd} disabled={createGeofence.isPending}>
                  {createGeofence.isPending ? "جاري الحفظ..." : "حفظ"}
                </Button>
                <Button variant="outline" onClick={() => setShowAddForm(false)}>
                  إلغاء
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {isLoading && <LoadingSkeleton variant="cards" />}
        {isError && <ErrorState onRetry={() => refetch()} />}
        {!isLoading && !isError && geofences.length === 0 && (
          <EmptyState
            icon={MapPin}
            title="لا توجد نطاقات جغرافية"
            description="لم يتم العثور على أي نطاقات جغرافية في النظام"
            actionLabel="إضافة نطاق"
            onAction={() => setShowAddForm(true)}
          />
        )}
        {!isLoading && !isError && geofences.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {geofences.map((geo) => (
              <Card
                key={geo.id}
                className="border-0 shadow-lg overflow-hidden transition-transform duration-200 hover:scale-[1.02] animate-scale-in"
              >
                <div className="h-2" style={{ backgroundColor: geo.color }} />
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${geo.color}20` }}
                      >
                        <MapPin className="w-5 h-5" style={{ color: geo.color }} />
                      </div>
                      <div>
                        <CardTitle className="text-base font-bold">{geo.name}</CardTitle>
                        <p className="text-xs text-gray-500 mt-0.5">{geo.address}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 dark:hover:bg-blue-900/20">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(geo)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">نصف القطر:</span>
                      <span className="font-medium text-gray-900">{geo.radius} متر</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">خط العرض:</span>
                      <span className="font-medium text-gray-900">{geo.lat}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">خط الطول:</span>
                      <span className="font-medium text-gray-900">{geo.lng}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">الحالة:</span>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          geo.active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {geo.active ? "نشط" : "متوقف"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <ConfirmDialog
          open={deleteTarget !== null}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
          title="تأكيد الحذف"
          description={`هل أنت متأكد من حذف ${deleteTarget?.name}؟ لا يمكن التراجع عن هذا الإجراء.`}
          confirmLabel="حذف"
          cancelLabel="إلغاء"
          onConfirm={confirmDelete}
        />
      </div>
    </MainLayout>
  );
}
