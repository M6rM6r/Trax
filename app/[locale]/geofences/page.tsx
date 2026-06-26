"use client";

import { useState, useEffect, useRef } from "react";
import MainLayout from "@/components/shared/MainLayout";
import FullPageHead from "@/components/shared/FullPageHead";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Plus, Trash2, Edit, X, Pencil, Check, Activity, Circle, Eye } from "lucide-react";
import {
  useGeofences,
  useCreateGeofence,
  useDeleteGeofence,
  useUpdateGeofence,
} from "@/hooks/useApi";
import { LoadingSkeleton, EmptyState, ErrorState } from "@/components/shared/StateViews";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { FormDrawer } from "@/components/shared/FormDrawer";
import { useToast } from "@/hooks/use-toast";
import { hapticTap, hapticSuccess } from "@/lib/utils/haptics";
import { motion, AnimatePresence } from "framer-motion";
import type { Geofence } from "@/lib/types/trackingTypes";

import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import OSM from "ol/source/OSM";
import { fromLonLat, toLonLat } from "ol/proj";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import CircleGeom from "ol/geom/Circle";
import Style from "ol/style/Style";
import Stroke from "ol/style/Stroke";
import Fill from "ol/style/Fill";
import CircleStyle from "ol/style/Circle";
import Text from "ol/style/Text";
import { Draw } from "ol/interaction";

export default function GeofencesPage() {
  const { data: geofences = [], isLoading, isError, refetch } = useGeofences();
  const createGeofence = useCreateGeofence();
  const deleteGeofence = useDeleteGeofence();
  const updateGeofence = useUpdateGeofence();
  const { toast } = useToast();
  const [showAddForm, setShowAddForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Geofence | null>(null);
  const [editTarget, setEditTarget] = useState<Geofence | null>(null);
  const [previewGeofence, setPreviewGeofence] = useState<Geofence | null>(null);
  const [drawMode, setDrawMode] = useState(false);
  const [newGeofence, setNewGeofence] = useState({
    name: "",
    address: "",
    lat: 24.7136,
    lng: 46.6753,
    radius: 100,
    color: "#2563EB",
  });
  const [editGeofence, setEditGeofence] = useState({
    name: "",
    address: "",
    lat: 24.7136,
    lng: 46.6753,
    radius: 100,
    color: "#2563EB",
  });

  const previewMapRef = useRef<HTMLDivElement>(null);
  const previewMapInstance = useRef<Map | null>(null);
  const drawerMapRef = useRef<HTMLDivElement>(null);
  const drawerMapInstance = useRef<Map | null>(null);
  const drawSourceRef = useRef<VectorSource | null>(null);
  const drawInteractionRef = useRef<Draw | null>(null);

  useEffect(() => {
    if (!previewMapRef.current || !previewGeofence) return;

    const source = new VectorSource();
    const center = fromLonLat([previewGeofence.lng, previewGeofence.lat]);

    const circleFeature = new Feature({
      geometry: new CircleGeom(center, previewGeofence.radius * 10),
    });
    circleFeature.setStyle(
      new Style({
        stroke: new Stroke({ color: previewGeofence.color, width: 2 }),
        fill: new Fill({ color: `${previewGeofence.color}20` }),
      })
    );
    source.addFeature(circleFeature);

    const markerFeature = new Feature({ geometry: new Point(center) });
    markerFeature.setStyle(
      new Style({
        image: new CircleStyle({
          radius: 6,
          fill: new Fill({ color: previewGeofence.color }),
          stroke: new Stroke({ color: "#fff", width: 2 }),
        }),
        text: new Text({
          text: previewGeofence.name,
          offsetY: -15,
          font: "bold 12px sans-serif",
          fill: new Fill({ color: "#1e293b" }),
        }),
      })
    );
    source.addFeature(markerFeature);

    if (previewMapInstance.current) {
      previewMapInstance.current.setTarget(undefined);
    }

    const map = new Map({
      target: previewMapRef.current,
      layers: [new TileLayer({ source: new OSM() }), new VectorLayer({ source })],
      view: new View({
        center,
        zoom: 15,
      }),
    });
    previewMapInstance.current = map;

    return () => map.setTarget(undefined);
  }, [previewGeofence]);

  useEffect(() => {
    if (!showAddForm || !drawerMapRef.current) return;

    const source = new VectorSource();
    drawSourceRef.current = source;

    if (drawerMapInstance.current) {
      drawerMapInstance.current.setTarget(undefined);
    }

    const map = new Map({
      target: drawerMapRef.current,
      layers: [new TileLayer({ source: new OSM() }), new VectorLayer({ source })],
      view: new View({
        center: fromLonLat([newGeofence.lng, newGeofence.lat]),
        zoom: 12,
      }),
    });
    drawerMapInstance.current = map;

    map.on("click", (e) => {
      const [lng, lat] = toLonLat(e.coordinate);
      setNewGeofence((prev) => ({
        ...prev,
        lat: Number(lat.toFixed(6)),
        lng: Number(lng.toFixed(6)),
      }));
      hapticTap();

      source.clear();
      const center = fromLonLat([lng, lat]);
      const marker = new Feature({ geometry: new Point(center) });
      marker.setStyle(
        new Style({
          image: new CircleStyle({
            radius: 6,
            fill: new Fill({ color: newGeofence.color }),
            stroke: new Stroke({ color: "#fff", width: 2 }),
          }),
        })
      );
      source.addFeature(marker);

      const circle = new Feature({
        geometry: new CircleGeom(center, newGeofence.radius * 10),
      });
      circle.setStyle(
        new Style({
          stroke: new Stroke({ color: newGeofence.color, width: 2 }),
          fill: new Fill({ color: `${newGeofence.color}20` }),
        })
      );
      source.addFeature(circle);
    });

    return () => map.setTarget(undefined);
  }, [showAddForm]);

  const toggleDrawMode = () => {
    if (!drawerMapInstance.current || !drawSourceRef.current) return;
    hapticTap();

    if (drawMode) {
      if (drawInteractionRef.current) {
        drawerMapInstance.current.removeInteraction(drawInteractionRef.current);
        drawInteractionRef.current = null;
      }
      setDrawMode(false);
    } else {
      const draw = new Draw({
        source: drawSourceRef.current,
        type: "Circle",
      });
      draw.on("drawend", (e) => {
        const geom = e.feature.getGeometry() as CircleGeom;
        const center = geom.getCenter();
        const radiusMeters = geom.getRadius() / 10;
        const [lng, lat] = toLonLat(center);
        setNewGeofence((prev) => ({
          ...prev,
          lat: Number(lat.toFixed(6)),
          lng: Number(lng.toFixed(6)),
          radius: Math.round(radiusMeters),
        }));
        hapticSuccess();
      });
      drawerMapInstance.current.addInteraction(draw);
      drawInteractionRef.current = draw;
      setDrawMode(true);
    }
  };

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

  const handleEditGeofence = (geo: Geofence) => {
    hapticTap();
    setEditTarget(geo);
    setEditGeofence({
      name: geo.name,
      address: geo.address,
      lat: geo.lat,
      lng: geo.lng,
      radius: geo.radius,
      color: geo.color,
    });
  };

  const handleUpdateGeofence = () => {
    if (!editTarget) return;
    updateGeofence.mutate(
      { id: editTarget.id, data: editGeofence },
      {
        onSuccess: () => {
          toast({ description: "تم تحديث النطاق الجغرافي بنجاح" });
          setEditTarget(null);
        },
        onError: () => toast({ description: "حدث خطأ أثناء التحديث", variant: "destructive" }),
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

        {/* Stats summary row */}
        {geofences.length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            {[
              {
                label: "إجمالي النطاقات",
                value: geofences.length,
                icon: MapPin,
                color: "blue",
              },
              {
                label: "نشطة",
                value: geofences.filter((g) => g.active).length,
                icon: Activity,
                color: "green",
              },
              {
                label: "متوقفة",
                value: geofences.filter((g) => !g.active).length,
                icon: Circle,
                color: "gray",
              },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.label} className="border-0 shadow-md dark:bg-slate-800">
                  <CardContent className="flex items-center gap-3 py-4">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                        stat.color === "blue"
                          ? "bg-blue-100 dark:bg-blue-900/30"
                          : stat.color === "green"
                            ? "bg-green-100 dark:bg-green-900/30"
                            : "bg-gray-100 dark:bg-slate-700"
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 ${
                          stat.color === "blue"
                            ? "text-blue-600 dark:text-blue-400"
                            : stat.color === "green"
                              ? "text-green-600 dark:text-green-400"
                              : "text-gray-500 dark:text-slate-400"
                        }`}
                      />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-gray-900 dark:text-slate-100">
                        {stat.value}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-slate-400">{stat.label}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Form Drawer */}
        <FormDrawer
          open={showAddForm}
          onOpenChange={setShowAddForm}
          title="إضافة نطاق جغرافي"
          description="حدد الموقع والنطاق على الخريطة"
          onSubmit={handleAdd}
          submitLabel={createGeofence.isPending ? "جاري الحفظ..." : "حفظ"}
          isSubmitting={createGeofence.isPending}
        >
          {/* Interactive Map */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 dark:text-slate-300">
                حدد الموقع على الخريطة
              </label>
              <button
                onClick={toggleDrawMode}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  drawMode
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300"
                }`}
              >
                {drawMode ? <Check className="w-3 h-3" /> : <Pencil className="w-3 h-3" />}
                {drawMode ? "تم الرسم" : "رسم دائرة"}
              </button>
            </div>
            <div
              ref={drawerMapRef}
              className="w-full h-64 rounded-xl border border-gray-200 dark:border-slate-600 overflow-hidden"
            />
            <p className="text-xs text-gray-500 dark:text-slate-400">
              {drawMode
                ? "ارسم دائرة على الخريطة لتحديد الموقع والنطاق"
                : "انقر على الخريطة لتحديد المركز"}
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-1 block">
              الاسم
            </label>
            <input
              type="text"
              value={newGeofence.name}
              onChange={(e) => setNewGeofence({ ...newGeofence, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-transparent dark:bg-slate-900 text-gray-900 dark:text-slate-100"
              placeholder="اسم الموقع"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-1 block">
              العنوان
            </label>
            <input
              type="text"
              value={newGeofence.address}
              onChange={(e) => setNewGeofence({ ...newGeofence, address: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-transparent dark:bg-slate-900 text-gray-900 dark:text-slate-100"
              placeholder="العنوان"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-1 block">
                خط العرض
              </label>
              <input
                type="number"
                step="0.0001"
                value={newGeofence.lat}
                onChange={(e) => setNewGeofence({ ...newGeofence, lat: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-transparent dark:bg-slate-900 text-gray-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-1 block">
                خط الطول
              </label>
              <input
                type="number"
                step="0.0001"
                value={newGeofence.lng}
                onChange={(e) => setNewGeofence({ ...newGeofence, lng: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-transparent dark:bg-slate-900 text-gray-900 dark:text-slate-100"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-1 block">
                نصف القطر (متر)
              </label>
              <input
                type="number"
                value={newGeofence.radius}
                onChange={(e) => setNewGeofence({ ...newGeofence, radius: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-transparent dark:bg-slate-900 text-gray-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-1 block">
                اللون
              </label>
              <input
                type="color"
                value={newGeofence.color}
                onChange={(e) => setNewGeofence({ ...newGeofence, color: e.target.value })}
                className="w-full h-10 border border-gray-300 dark:border-slate-600 rounded-lg cursor-pointer bg-transparent dark:bg-slate-900"
              />
            </div>
          </div>
        </FormDrawer>

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
            {geofences.map((geo, idx) => (
              <motion.div
                key={geo.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.06, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                <Card className="border-0 shadow-lg overflow-hidden group hover:shadow-xl transition-all duration-300 dark:bg-slate-800 cursor-default">
                  {/* Color accent bar */}
                  <div className="h-1.5" style={{ backgroundColor: geo.color }} />

                  <CardContent className="p-5">
                    {/* Header row */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-11 h-11 rounded-xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-110 duration-300"
                          style={{ backgroundColor: `${geo.color}18` }}
                        >
                          <MapPin className="w-5 h-5" style={{ color: geo.color }} />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100 truncate">
                            {geo.name}
                          </h3>
                          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 truncate max-w-[140px]">
                            {geo.address}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                          geo.active
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-slate-400"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            geo.active ? "bg-green-500 animate-pulse" : "bg-gray-400"
                          }`}
                        />
                        {geo.active ? "نشط" : "متوقف"}
                      </span>
                    </div>

                    {/* Stats chips */}
                    <div className="flex items-center gap-2 mb-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-50 dark:bg-slate-700/60 text-xs font-medium text-gray-600 dark:text-slate-300">
                        <span className="text-gray-400">نصف القطر</span>
                        <span className="font-bold text-gray-900 dark:text-slate-100">
                          {geo.radius}م
                        </span>
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-50 dark:bg-slate-700/60 text-xs font-medium text-gray-600 dark:text-slate-300">
                        <span className="text-gray-400">
                          {geo.lat.toFixed(3)}°, {geo.lng.toFixed(3)}°
                        </span>
                      </span>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1 pt-3 border-t border-gray-100 dark:border-slate-700">
                      <button
                        onClick={() => {
                          hapticTap();
                          setPreviewGeofence(geo);
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-gray-600 dark:text-slate-400 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400 transition-colors"
                        aria-label="عرض على الخريطة"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        عرض
                      </button>
                      <div className="w-px h-5 bg-gray-100 dark:bg-slate-700" />
                      <button
                        onClick={() => handleEditGeofence(geo)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-gray-600 dark:text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-900/20 dark:hover:text-indigo-400 transition-colors"
                        aria-label="تعديل"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        تعديل
                      </button>
                      <div className="w-px h-5 bg-gray-100 dark:bg-slate-700" />
                      <button
                        onClick={() => handleDelete(geo)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-gray-600 dark:text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors"
                        aria-label="حذف"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        حذف
                      </button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Edit Geofence Drawer */}
        <FormDrawer
          open={editTarget !== null}
          onOpenChange={(open) => !open && setEditTarget(null)}
          title={`تعديل: ${editTarget?.name || ""}`}
          description="تحديث بيانات النطاق الجغرافي"
          onSubmit={handleUpdateGeofence}
          isSubmitting={updateGeofence.isPending}
          submitLabel="حفظ التعديلات"
        >
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-1 block">
                الاسم
              </label>
              <input
                type="text"
                value={editGeofence.name}
                onChange={(e) => setEditGeofence({ ...editGeofence, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-transparent dark:bg-slate-900 text-gray-900 dark:text-slate-100"
                placeholder="اسم الموقع"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-1 block">
                العنوان
              </label>
              <input
                type="text"
                value={editGeofence.address}
                onChange={(e) => setEditGeofence({ ...editGeofence, address: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-transparent dark:bg-slate-900 text-gray-900 dark:text-slate-100"
                placeholder="العنوان"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-1 block">
                  خط العرض
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={editGeofence.lat}
                  onChange={(e) =>
                    setEditGeofence({ ...editGeofence, lat: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-transparent dark:bg-slate-900 text-gray-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-1 block">
                  خط الطول
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={editGeofence.lng}
                  onChange={(e) =>
                    setEditGeofence({ ...editGeofence, lng: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-transparent dark:bg-slate-900 text-gray-900 dark:text-slate-100"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-1 block">
                  نصف القطر (متر)
                </label>
                <input
                  type="number"
                  value={editGeofence.radius}
                  onChange={(e) =>
                    setEditGeofence({ ...editGeofence, radius: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-transparent dark:bg-slate-900 text-gray-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-1 block">
                  اللون
                </label>
                <input
                  type="color"
                  value={editGeofence.color}
                  onChange={(e) => setEditGeofence({ ...editGeofence, color: e.target.value })}
                  className="w-full h-10 border border-gray-300 dark:border-slate-600 rounded-lg cursor-pointer bg-transparent"
                />
              </div>
            </div>
          </div>
        </FormDrawer>

        {/* Map Preview Modal */}
        <AnimatePresence>
          {previewGeofence && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
              onClick={() => setPreviewGeofence(null)}
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${previewGeofence.color}20` }}
                    >
                      <MapPin className="w-5 h-5" style={{ color: previewGeofence.color }} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">
                        {previewGeofence.name}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-slate-400">
                        {previewGeofence.address}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setPreviewGeofence(null)}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 dark:text-slate-400"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div
                  ref={previewMapRef}
                  className="w-full h-72 rounded-xl border border-gray-200 dark:border-slate-600 overflow-hidden"
                />
                <div className="grid grid-cols-3 gap-3 mt-4 text-sm">
                  <div className="text-center p-2 rounded-lg bg-gray-50 dark:bg-slate-700/50">
                    <p className="text-xs text-gray-500 dark:text-slate-400">نصف القطر</p>
                    <p className="font-bold text-gray-900 dark:text-slate-100">
                      {previewGeofence.radius}م
                    </p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-gray-50 dark:bg-slate-700/50">
                    <p className="text-xs text-gray-500 dark:text-slate-400">خط العرض</p>
                    <p className="font-bold text-gray-900 dark:text-slate-100">
                      {previewGeofence.lat}
                    </p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-gray-50 dark:bg-slate-700/50">
                    <p className="text-xs text-gray-500 dark:text-slate-400">خط الطول</p>
                    <p className="font-bold text-gray-900 dark:text-slate-100">
                      {previewGeofence.lng}
                    </p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

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
