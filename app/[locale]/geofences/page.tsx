"use client";

import { useState, useEffect, useRef } from "react";
import MainLayout from "@/components/shared/MainLayout";
import FullPageHead from "@/components/shared/FullPageHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Plus, Trash2, Edit, X, Pencil, Check, Eye } from "lucide-react";
import {
  useGeofences,
  useCreateGeofence,
  useDeleteGeofence,
  useUpdateGeofence,
} from "@/hooks/useApi";
import { EmptyState, ErrorState } from "@/components/shared/StateViews";
import GeofenceSkeleton from "@/components/shared/Skeletons/GeofenceSkeleton";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { FormDrawer } from "@/components/shared/FormDrawer";
import { useToast } from "@/hooks/use-toast";
import { hapticTap, hapticSuccess } from "@/lib/utils/haptics";
import { motion, AnimatePresence } from "framer-motion";
import type { Geofence } from "@/lib/types/trackingTypes";
import { ApiError } from "@/lib/services/httpClient";

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
import "ol/ol.css";

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
  const [editDrawMode, setEditDrawMode] = useState(false);
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
  const markerFeatureRef = useRef<Feature<Point> | null>(null);
  const circleFeatureRef = useRef<Feature<CircleGeom> | null>(null);
  const drawInteractionRef = useRef<Draw | null>(null);
  const editDrawerMapRef = useRef<HTMLDivElement>(null);
  const editDrawerMapInstance = useRef<Map | null>(null);
  const editDrawSourceRef = useRef<VectorSource | null>(null);
  const editMarkerFeatureRef = useRef<Feature<Point> | null>(null);
  const editCircleFeatureRef = useRef<Feature<CircleGeom> | null>(null);
  const editDrawInteractionRef = useRef<Draw | null>(null);

  const extractApiErrorMessage = (error: unknown, fallback: string): string => {
    if (error instanceof ApiError) {
      const context = error.context as
        | {
            message?: string;
            errors?: Record<string, string[] | string>;
          }
        | undefined;

      const firstFieldErrors = context?.errors ? Object.values(context.errors)[0] : undefined;
      if (Array.isArray(firstFieldErrors) && firstFieldErrors.length > 0) {
        return String(firstFieldErrors[0]);
      }
      if (typeof firstFieldErrors === "string" && firstFieldErrors.trim()) {
        return firstFieldErrors;
      }
      if (context?.message?.trim()) {
        return context.message;
      }
      if (error.message?.trim()) {
        return error.message;
      }
    }

    if (error instanceof Error && error.message.trim()) {
      return error.message;
    }

    return fallback;
  };

  useEffect(() => {
    if (!previewMapRef.current || !previewGeofence) return;

    const source = new VectorSource();
    const center = fromLonLat([previewGeofence.lng, previewGeofence.lat]);

    const circleFeature = new Feature({
      geometry: new CircleGeom(center, previewGeofence.radius),
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

  const syncDrawerCircle = (
    source: VectorSource,
    lng: number,
    lat: number,
    radius: number,
    color: string
  ) => {
    const center = fromLonLat([lng, lat]);

    // Clear everything so no duplicate or leftover circles remain
    source.clear();
    markerFeatureRef.current = null;
    circleFeatureRef.current = null;

    markerFeatureRef.current = new Feature({ geometry: new Point(center) });
    source.addFeature(markerFeatureRef.current);
    markerFeatureRef.current.setStyle(
      new Style({
        image: new CircleStyle({
          radius: 6,
          fill: new Fill({ color }),
          stroke: new Stroke({ color: "#fff", width: 2 }),
        }),
      })
    );

    circleFeatureRef.current = new Feature({ geometry: new CircleGeom(center, radius) });
    source.addFeature(circleFeatureRef.current);
    circleFeatureRef.current.setStyle(
      new Style({
        stroke: new Stroke({ color, width: 2 }),
        fill: new Fill({ color: `${color}20` }),
      })
    );
  };

  const syncEditDrawerCircle = (
    source: VectorSource,
    lng: number,
    lat: number,
    radius: number,
    color: string
  ) => {
    const center = fromLonLat([lng, lat]);

    // Clear everything so no duplicate or leftover circles remain
    source.clear();
    editMarkerFeatureRef.current = null;
    editCircleFeatureRef.current = null;

    editMarkerFeatureRef.current = new Feature({ geometry: new Point(center) });
    source.addFeature(editMarkerFeatureRef.current);
    editMarkerFeatureRef.current.setStyle(
      new Style({
        image: new CircleStyle({
          radius: 6,
          fill: new Fill({ color }),
          stroke: new Stroke({ color: "#fff", width: 2 }),
        }),
      })
    );

    editCircleFeatureRef.current = new Feature({ geometry: new CircleGeom(center, radius) });
    source.addFeature(editCircleFeatureRef.current);
    editCircleFeatureRef.current.setStyle(
      new Style({
        stroke: new Stroke({ color, width: 2 }),
        fill: new Fill({ color: `${color}20` }),
      })
    );
  };

  useEffect(() => {
    if (!showAddForm) return;

    let map: Map | null = null;
    let sizeTimer: ReturnType<typeof setTimeout>;

    const initMap = () => {
      if (!drawerMapRef.current) {
        sizeTimer = setTimeout(initMap, 100);
        return;
      }

      const source = new VectorSource();
      drawSourceRef.current = source;

      if (drawerMapInstance.current) {
        drawerMapInstance.current.setTarget(undefined);
      }

      map = new Map({
        target: drawerMapRef.current,
        layers: [new TileLayer({ source: new OSM() }), new VectorLayer({ source })],
        view: new View({
          center: fromLonLat([newGeofence.lng, newGeofence.lat]),
          zoom: 12,
        }),
      });
      drawerMapInstance.current = map;

      syncDrawerCircle(
        source,
        newGeofence.lng,
        newGeofence.lat,
        newGeofence.radius,
        newGeofence.color
      );

      sizeTimer = setTimeout(() => map!.updateSize(), 400);

      map.on("click", (e) => {
        const [lng, lat] = toLonLat(e.coordinate);
        map!.getView().setCenter(e.coordinate);
        setNewGeofence((prev) => ({
          ...prev,
          lat: Number(lat.toFixed(6)),
          lng: Number(lng.toFixed(6)),
        }));
        hapticTap();
      });
    };

    initMap();

    return () => {
      clearTimeout(sizeTimer);
      markerFeatureRef.current = null;
      circleFeatureRef.current = null;
      drawSourceRef.current = null;
      map?.setTarget(undefined);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAddForm]);

  useEffect(() => {
    if (!showAddForm || !drawSourceRef.current) return;

    syncDrawerCircle(
      drawSourceRef.current,
      newGeofence.lng,
      newGeofence.lat,
      Math.max(1, Number(newGeofence.radius) || 1),
      newGeofence.color
    );
  }, [showAddForm, newGeofence.lat, newGeofence.lng, newGeofence.radius, newGeofence.color]);

  useEffect(() => {
    if (!editTarget) return;

    let map: Map | null = null;
    let sizeTimer: ReturnType<typeof setTimeout>;

    const initMap = () => {
      if (!editDrawerMapRef.current) {
        sizeTimer = setTimeout(initMap, 100);
        return;
      }

      const source = new VectorSource();
      editDrawSourceRef.current = source;

      if (editDrawerMapInstance.current) {
        editDrawerMapInstance.current.setTarget(undefined);
      }

      map = new Map({
        target: editDrawerMapRef.current,
        layers: [new TileLayer({ source: new OSM() }), new VectorLayer({ source })],
        view: new View({
          center: fromLonLat([editGeofence.lng, editGeofence.lat]),
          zoom: 12,
        }),
      });
      editDrawerMapInstance.current = map;

      syncEditDrawerCircle(
        source,
        editGeofence.lng,
        editGeofence.lat,
        editGeofence.radius,
        editGeofence.color
      );

      sizeTimer = setTimeout(() => map!.updateSize(), 400);

      map.on("click", (e) => {
        const [lng, lat] = toLonLat(e.coordinate);
        map!.getView().setCenter(e.coordinate);
        setEditGeofence((prev) => ({
          ...prev,
          lat: Number(lat.toFixed(6)),
          lng: Number(lng.toFixed(6)),
        }));
        hapticTap();
      });
    };

    initMap();

    return () => {
      clearTimeout(sizeTimer);
      editMarkerFeatureRef.current = null;
      editCircleFeatureRef.current = null;
      editDrawSourceRef.current = null;
      if (editDrawInteractionRef.current && editDrawerMapInstance.current) {
        editDrawerMapInstance.current.removeInteraction(editDrawInteractionRef.current);
      }
      editDrawInteractionRef.current = null;
      setEditDrawMode(false);
      map?.setTarget(undefined);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editTarget]);

  useEffect(() => {
    if (!editTarget || !editDrawSourceRef.current) return;

    syncEditDrawerCircle(
      editDrawSourceRef.current,
      editGeofence.lng,
      editGeofence.lat,
      Math.max(1, Number(editGeofence.radius) || 1),
      editGeofence.color
    );
  }, [editTarget, editGeofence.lat, editGeofence.lng, editGeofence.radius, editGeofence.color]);

  const toggleDrawMode = () => {
    if (!drawerMapInstance.current || !drawSourceRef.current) return;
    hapticTap();

    if (drawMode) {
      if (drawInteractionRef.current) {
        drawerMapInstance.current.removeInteraction(drawInteractionRef.current);
        drawInteractionRef.current = null;
      }
      setDrawMode(false);
      // Restore the static preview based on current form values
      if (drawSourceRef.current) {
        syncDrawerCircle(
          drawSourceRef.current,
          newGeofence.lng,
          newGeofence.lat,
          Math.max(1, Number(newGeofence.radius) || 1),
          newGeofence.color
        );
      }
    } else {
      // Hide the static preview while the user is drawing a circle
      drawSourceRef.current.clear();
      markerFeatureRef.current = null;
      circleFeatureRef.current = null;

      const draw = new Draw({
        source: drawSourceRef.current,
        type: "Circle",
      });
      draw.on("drawend", (e) => {
        const geom = e.feature.getGeometry() as CircleGeom;
        const center = geom.getCenter();
        const radiusMeters = geom.getRadius();
        const [lng, lat] = toLonLat(center);

        drawSourceRef.current?.removeFeature(e.feature);

        setNewGeofence((prev) => ({
          ...prev,
          lat: Number(lat.toFixed(6)),
          lng: Number(lng.toFixed(6)),
          radius: Math.max(1, Math.round(radiusMeters)),
        }));

        if (drawInteractionRef.current && drawerMapInstance.current) {
          drawerMapInstance.current.removeInteraction(drawInteractionRef.current);
          drawInteractionRef.current = null;
          setDrawMode(false);
        }

        hapticSuccess();
      });
      drawerMapInstance.current.addInteraction(draw);
      drawInteractionRef.current = draw;
      setDrawMode(true);
    }
  };

  const toggleEditDrawMode = () => {
    if (!editDrawerMapInstance.current || !editDrawSourceRef.current) return;
    hapticTap();

    if (editDrawMode) {
      if (editDrawInteractionRef.current) {
        editDrawerMapInstance.current.removeInteraction(editDrawInteractionRef.current);
        editDrawInteractionRef.current = null;
      }
      setEditDrawMode(false);
      // Restore the static preview based on current form values
      if (editDrawSourceRef.current) {
        syncEditDrawerCircle(
          editDrawSourceRef.current,
          editGeofence.lng,
          editGeofence.lat,
          Math.max(1, Number(editGeofence.radius) || 1),
          editGeofence.color
        );
      }
    } else {
      // Hide the static preview while the user is drawing a circle
      editDrawSourceRef.current.clear();
      editMarkerFeatureRef.current = null;
      editCircleFeatureRef.current = null;

      const draw = new Draw({
        source: editDrawSourceRef.current,
        type: "Circle",
      });
      draw.on("drawend", (e) => {
        const geom = e.feature.getGeometry() as CircleGeom;
        const center = geom.getCenter();
        const radiusMeters = geom.getRadius();
        const [lng, lat] = toLonLat(center);

        editDrawSourceRef.current?.removeFeature(e.feature);

        setEditGeofence((prev) => ({
          ...prev,
          lat: Number(lat.toFixed(6)),
          lng: Number(lng.toFixed(6)),
          radius: Math.max(1, Math.round(radiusMeters)),
        }));

        if (editDrawInteractionRef.current && editDrawerMapInstance.current) {
          editDrawerMapInstance.current.removeInteraction(editDrawInteractionRef.current);
          editDrawInteractionRef.current = null;
          setEditDrawMode(false);
        }

        hapticSuccess();
      });
      editDrawerMapInstance.current.addInteraction(draw);
      editDrawInteractionRef.current = draw;
      setEditDrawMode(true);
    }
  };

  const handleAdd = () => {
    if (!Number.isFinite(newGeofence.radius) || newGeofence.radius <= 0) {
      toast({ description: "نصف القطر يجب أن يكون أكبر من صفر", variant: "destructive" });
      return;
    }

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
        onError: (error) => {
          toast({
            description: extractApiErrorMessage(error, "حدث خطأ أثناء إضافة النطاق"),
            variant: "destructive",
          });
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
    if (!Number.isFinite(editGeofence.radius) || editGeofence.radius <= 0) {
      toast({ description: "نصف القطر يجب أن يكون أكبر من صفر", variant: "destructive" });
      return;
    }
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
                    ? "bg-primaryColor text-white"
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
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-primaryColor bg-transparent dark:bg-slate-900 text-gray-900 dark:text-slate-100"
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
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-primaryColor bg-transparent dark:bg-slate-900 text-gray-900 dark:text-slate-100"
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
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-primaryColor bg-transparent dark:bg-slate-900 text-gray-900 dark:text-slate-100"
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
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-primaryColor bg-transparent dark:bg-slate-900 text-gray-900 dark:text-slate-100"
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
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-primaryColor bg-transparent dark:bg-slate-900 text-gray-900 dark:text-slate-100"
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

        {isLoading && <GeofenceSkeleton />}
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
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-gray-600 dark:text-slate-400 hover:bg-primaryColor/10 hover:text-primaryColor dark:hover:bg-primaryColor/10 dark:hover:text-primaryColor transition-colors"
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
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 dark:text-slate-300">
                  تعديل الموقع على الخريطة
                </label>
                <button
                  onClick={toggleEditDrawMode}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    editDrawMode
                      ? "bg-primaryColor text-white"
                      : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300"
                  }`}
                >
                  {editDrawMode ? <Check className="w-3 h-3" /> : <Pencil className="w-3 h-3" />}
                  {editDrawMode ? "تم الرسم" : "رسم دائرة"}
                </button>
              </div>
              <div
                ref={editDrawerMapRef}
                className="w-full h-64 rounded-xl border border-gray-200 dark:border-slate-600 overflow-hidden"
              />
              <p className="text-xs text-gray-500 dark:text-slate-400">
                {editDrawMode
                  ? "ارسم دائرة جديدة لتحديث الموقع ونصف القطر"
                  : "انقر على الخريطة لتحديث مركز النطاق"}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-1 block">
                الاسم
              </label>
              <input
                type="text"
                value={editGeofence.name}
                onChange={(e) => setEditGeofence({ ...editGeofence, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-primaryColor bg-transparent dark:bg-slate-900 text-gray-900 dark:text-slate-100"
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
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-primaryColor bg-transparent dark:bg-slate-900 text-gray-900 dark:text-slate-100"
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
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-primaryColor bg-transparent dark:bg-slate-900 text-gray-900 dark:text-slate-100"
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
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-primaryColor bg-transparent dark:bg-slate-900 text-gray-900 dark:text-slate-100"
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
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-primaryColor bg-transparent dark:bg-slate-900 text-gray-900 dark:text-slate-100"
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
