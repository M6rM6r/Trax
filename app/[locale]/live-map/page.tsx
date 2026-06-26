"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import MainLayout from "@/components/shared/MainLayout";
import FullPageHead from "@/components/shared/FullPageHead";
import { Card, CardContent } from "@/components/ui/card";
import {
  MapPin,
  Battery as BatteryIcon,
  Wifi,
  WifiOff,
  Navigation,
  X,
  Search,
  Route,
  Clock,
  Maximize2,
  Minimize2,
  Layers,
} from "lucide-react";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import OSM from "ol/source/OSM";
import XYZ from "ol/source/XYZ";
import { fromLonLat } from "ol/proj";
import { Point, Circle as CircleGeom, LineString } from "ol/geom";
import Feature from "ol/Feature";
import { Style, Stroke, Fill, Circle as CircleStyle, Text } from "ol/style";
import "ol/ol.css";
import { useLiveTracking, useGeofences } from "@/hooks/useApi";
import { useLiveTrackingSocket } from "@/hooks/useLiveTrackingSocket";
import { LoadingSkeleton, ErrorState, EmptyState } from "@/components/shared/StateViews";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { hapticTap } from "@/lib/utils/haptics";
import type { LiveTrackingEmployee, Geofence } from "@/lib/types/trackingTypes";

export default function LiveMapPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const { data: initialTracking = [], isLoading, isError, refetch } = useLiveTracking();
  const { data: geofences = [] } = useGeofences();
  const {
    employees: liveTracking,
    isConnected: socketConnected,
    lastUpdate,
  } = useLiveTrackingSocket(initialTracking);
  const [selectedEmployee, setSelectedEmployee] = useState<LiveTrackingEmployee | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showRoute, setShowRoute] = useState(false);
  const [routeHistory, setRouteHistory] = useState<
    Array<{ lat: number; lng: number; time: string }>
  >([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [tileLayer, setTileLayer] = useState<"osm" | "satellite" | "topo">("osm");
  const [showTilePicker, setShowTilePicker] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Map | null>(null);
  const routeSourceRef = useRef<VectorSource | null>(null);
  const tileLayerRef = useRef<TileLayer<OSM | XYZ> | null>(null);

  const toggleFullscreen = () => {
    const el = mapContainerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch(() => {});
    } else {
      document
        .exitFullscreen()
        .then(() => setIsFullscreen(false))
        .catch(() => {});
    }
  };

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const tileSources: Record<"osm" | "satellite" | "topo", () => OSM | XYZ> = {
    osm: () => new OSM(),
    satellite: () =>
      new XYZ({
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        maxZoom: 19,
        attributions: "Esri",
      }),
    topo: () =>
      new XYZ({
        url: "https://tile.opentopomap.org/{z}/{x}/{y}.png",
        maxZoom: 17,
        attributions: "OpenTopoMap",
      }),
  };

  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    tileLayerRef.current.setSource(tileSources[tileLayer]());
  }, [tileLayer]);

  const statusLabels: Record<string, string> = {
    inside_geofence: "داخل النطاق",
    outside_geofence: "خارج النطاق",
    offline: "غير متصل",
  };

  const statusColors: Record<string, string> = {
    inside_geofence: "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30",
    outside_geofence: "text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/30",
    offline: "text-gray-600 bg-gray-100 dark:text-slate-400 dark:bg-slate-700",
  };

  const filteredTracking = useMemo(() => {
    return liveTracking.filter((emp) => {
      if (searchQuery && !emp.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (statusFilter !== "all" && emp.status !== statusFilter) return false;
      return true;
    });
  }, [liveTracking, searchQuery, statusFilter]);

  useEffect(() => {
    if (!mapRef.current) return;

    const vectorSource = new VectorSource();

    // Add geofence circles
    geofences.forEach((geo: Geofence) => {
      const center = fromLonLat([geo.lng, geo.lat]);
      const circleFeature = new Feature({
        geometry: new CircleGeom(center, geo.radius * 10),
        type: "geofence",
      });
      circleFeature.setStyle(
        new Style({
          stroke: new Stroke({ color: geo.color, width: 2 }),
          fill: new Fill({ color: `${geo.color}20` }),
        })
      );
      vectorSource.addFeature(circleFeature);

      // Add geofence center marker
      const centerFeature = new Feature({
        geometry: new Point(center),
        type: "geofence-center",
      });
      centerFeature.setStyle(
        new Style({
          image: new CircleStyle({
            radius: 5,
            fill: new Fill({ color: geo.color }),
            stroke: new Stroke({ color: "#fff", width: 2 }),
          }),
          text: new Text({
            text: geo.name,
            offsetY: -15,
            font: "bold 12px sans-serif",
            fill: new Fill({ color: "#1e293b" }),
            stroke: new Stroke({ color: "#fff", width: 3 }),
          }),
        })
      );
      vectorSource.addFeature(centerFeature);
    });

    // Add employee markers
    liveTracking.forEach((emp) => {
      if (emp.lat === null || emp.lng === null) return;
      const point = fromLonLat([emp.lng, emp.lat]);
      const feature = new Feature({
        geometry: new Point(point),
        type: "employee",
        employeeId: emp.id,
      });

      const color =
        emp.status === "inside_geofence"
          ? "#16A34A"
          : emp.status === "outside_geofence"
            ? "#F59E0B"
            : "#9CA3AF";

      feature.setStyle(
        new Style({
          image: new CircleStyle({
            radius: 8,
            fill: new Fill({ color }),
            stroke: new Stroke({ color: "#fff", width: 2 }),
          }),
          text: new Text({
            text: emp.name,
            offsetY: -15,
            font: "bold 11px sans-serif",
            fill: new Fill({ color: "#1e293b" }),
            stroke: new Stroke({ color: "#fff", width: 3 }),
          }),
        })
      );
      vectorSource.addFeature(feature);
    });

    const vectorLayer = new VectorLayer({ source: vectorSource });

    const routeSource = new VectorSource();
    routeSourceRef.current = routeSource;
    const routeLayer = new VectorLayer({ source: routeSource, zIndex: 100 });

    const baseTileLayer = new TileLayer({ source: new OSM() });
    tileLayerRef.current = baseTileLayer;
    const map = new Map({
      target: mapRef.current,
      layers: [baseTileLayer, vectorLayer, routeLayer],
      view: new View({
        center: fromLonLat([46.6753, 24.7136]),
        zoom: 12,
      }),
    });
    mapInstanceRef.current = map;

    map.on("click", (evt) => {
      let clicked = false;
      map.forEachFeatureAtPixel(evt.pixel, (feature) => {
        const type = feature.get("type");
        if (type === "employee") {
          const empId = feature.get("employeeId");
          const emp = filteredTracking.find((e) => e.id === empId);
          if (emp) {
            setSelectedEmployee(emp);
            hapticTap();
            clicked = true;
          }
        }
      });
      if (!clicked) setSelectedEmployee(null);
    });

    return () => map.setTarget(undefined);
  }, [geofences, filteredTracking]);

  // Track route history for selected employee
  useEffect(() => {
    if (!selectedEmployee || !showRoute) return;
    const newPoint = {
      lat: selectedEmployee.lat,
      lng: selectedEmployee.lng,
      time: new Date().toLocaleTimeString("ar-SA", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
    };
    setRouteHistory((prev) => [...prev.slice(-19), newPoint]);
  }, [selectedEmployee, showRoute, lastUpdate]);

  // Draw route line on map
  useEffect(() => {
    if (!mapInstanceRef.current || !routeSourceRef.current) return;
    routeSourceRef.current.clear();

    if (showRoute && routeHistory.length > 1 && selectedEmployee) {
      const coordinates = routeHistory.map((p) => fromLonLat([p.lng, p.lat]));
      const routeFeature = new Feature({
        geometry: new LineString(coordinates),
        type: "route",
      });
      routeFeature.setStyle(
        new Style({
          stroke: new Stroke({ color: "#3B82F6", width: 3, lineDash: [8, 4] }),
        })
      );
      routeSourceRef.current.addFeature(routeFeature);

      // Add start and end markers
      const startFeature = new Feature({
        geometry: new Point(coordinates[0]),
        type: "route-start",
      });
      startFeature.setStyle(
        new Style({
          image: new CircleStyle({
            radius: 6,
            fill: new Fill({ color: "#22C55E" }),
            stroke: new Stroke({ color: "#fff", width: 2 }),
          }),
        })
      );
      routeSourceRef.current.addFeature(startFeature);

      const endFeature = new Feature({
        geometry: new Point(coordinates[coordinates.length - 1]),
        type: "route-end",
      });
      endFeature.setStyle(
        new Style({
          image: new CircleStyle({
            radius: 6,
            fill: new Fill({ color: "#EF4444" }),
            stroke: new Stroke({ color: "#fff", width: 2 }),
          }),
        })
      );
      routeSourceRef.current.addFeature(endFeature);
    }
  }, [showRoute, routeHistory, selectedEmployee]);

  return (
    <MainLayout>
      <div className="p-6 space-y-6 min-h-screen">
        <FullPageHead
          head="تتبع مباشر"
          description="متابعة موظفيك على الخريطة في الوقت الحقيقي"
          Icon={<MapPin className="w-7 h-7" />}
          LeftSection={
            <div className="flex items-center gap-3 text-sm">
              <span
                className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${socketConnected ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-slate-400"}`}
              >
                {socketConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                {socketConnected ? "مباشر" : "غير متصل"}
              </span>
              {lastUpdate && (
                <span className="text-xs text-gray-400 dark:text-slate-500">
                  آخر تحديث:{" "}
                  {lastUpdate.toLocaleTimeString("ar-SA", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-gray-700 dark:text-slate-300">داخل النطاق</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-gray-700 dark:text-slate-300">خارج النطاق</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-gray-400" />
                <span className="text-gray-700 dark:text-slate-300">غير متصل</span>
              </span>
            </div>
          }
        />

        {isLoading && <LoadingSkeleton variant="map" />}
        {isError && <ErrorState onRetry={() => refetch()} />}
        {!isLoading && !isError && liveTracking.length === 0 && (
          <EmptyState
            icon={MapPin}
            illustration="geofences"
            title="لا يوجد موظفون متصلون"
            description="لا يوجد موظفون متصلون حالياً"
          />
        )}
        {!isLoading && !isError && liveTracking.length > 0 && (
          <div className="space-y-4">
            {/* Search & Filter Bar */}
            <Card className="border-0 shadow-md dark:bg-slate-800">
              <CardContent className="py-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="بحث عن موظف..."
                      className="pr-9 dark:bg-slate-900 dark:text-slate-100"
                      aria-label="بحث عن موظف"
                    />
                  </div>
                  <div className="flex items-center gap-1 bg-gray-100 dark:bg-slate-700 rounded-lg p-1">
                    {[
                      { value: "all", label: "الكل" },
                      { value: "inside_geofence", label: "داخل" },
                      { value: "outside_geofence", label: "خارج" },
                      { value: "offline", label: "غير متصل" },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => {
                          hapticTap();
                          setStatusFilter(opt.value);
                        }}
                        className={`px-3 py-1.5 rounded-md text-xs transition-all ${
                          statusFilter === opt.value
                            ? "bg-white dark:bg-slate-800 shadow-sm font-medium"
                            : "text-gray-500 dark:text-slate-400"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  {selectedEmployee && (
                    <button
                      onClick={() => {
                        hapticTap();
                        setShowRoute(!showRoute);
                        setRouteHistory([]);
                      }}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                        showRoute
                          ? "bg-blue-500 text-white"
                          : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300"
                      }`}
                    >
                      <Route className="w-4 h-4" />
                      {showRoute ? "إخفاء المسار" : "عرض المسار"}
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card className="border-0 shadow-lg overflow-hidden dark:bg-slate-800">
                  <div ref={mapContainerRef} className="relative group">
                    <div
                      ref={mapRef}
                      className="h-[600px] w-full dark:[&_.ol-layer]:filter dark:[&_.ol-layer]:invert-[1] dark:[&_.ol-layer]:hue-rotate-180 dark:[&_.ol-layer]:brightness-[0.9] dark:[&_.ol-layer]:contrast-[0.9]"
                    />
                    {/* Map Controls */}
                    <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
                      <button
                        onClick={toggleFullscreen}
                        className="p-2 rounded-lg bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-md hover:bg-white dark:hover:bg-slate-700 transition-colors"
                        title={isFullscreen ? "خروج من الشاشة الكاملة" : "شاشة كاملة"}
                      >
                        {isFullscreen ? (
                          <Minimize2 className="w-4 h-4 text-gray-700 dark:text-slate-200" />
                        ) : (
                          <Maximize2 className="w-4 h-4 text-gray-700 dark:text-slate-200" />
                        )}
                      </button>
                      <div className="relative">
                        <button
                          onClick={() => setShowTilePicker(!showTilePicker)}
                          className="p-2 rounded-lg bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-md hover:bg-white dark:hover:bg-slate-700 transition-colors"
                          title="طبقة الخريطة"
                        >
                          <Layers className="w-4 h-4 text-gray-700 dark:text-slate-200" />
                        </button>
                        {showTilePicker && (
                          <div className="absolute left-full top-0 ml-2 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
                            {(
                              [
                                { key: "osm", label: "عادي" },
                                { key: "satellite", label: "أقمار صناعية" },
                                { key: "topo", label: "طبوغرافي" },
                              ] as const
                            ).map(({ key, label }) => (
                              <button
                                key={key}
                                onClick={() => {
                                  setTileLayer(key);
                                  setShowTilePicker(false);
                                }}
                                className={`block w-full px-4 py-2.5 text-sm text-right hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors ${
                                  tileLayer === key
                                    ? "font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
                                    : "text-gray-700 dark:text-slate-200"
                                }`}
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              <div className="space-y-4">
                {selectedEmployee ? (
                  <Card className="border-0 shadow-lg dark:bg-slate-800 animate-slide-up">
                    <CardContent className="pt-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                            {selectedEmployee.name.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900 dark:text-slate-100">
                              {selectedEmployee.name}
                            </h3>
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[selectedEmployee.status]}`}
                            >
                              {statusLabels[selectedEmployee.status]}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedEmployee(null)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-gray-400 dark:text-slate-500"
                          aria-label="إغلاق"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500 dark:text-slate-400">الموقع:</span>
                          <span className="font-medium text-gray-900 dark:text-slate-100">
                            {selectedEmployee.geofenceName || "خارج النطاق"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500 dark:text-slate-400">آخر ظهور:</span>
                          <span className="font-medium text-gray-900 dark:text-slate-100">
                            {new Date(selectedEmployee.lastSeen).toLocaleTimeString("ar-SA", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500 dark:text-slate-400">البطارية:</span>
                          <div className="flex items-center gap-1.5">
                            {selectedEmployee.batteryLevel !== null ? (
                              <>
                                <BatteryIcon
                                  className={`w-4 h-4 ${selectedEmployee.batteryLevel < 20 ? "text-red-500" : selectedEmployee.batteryLevel < 50 ? "text-amber-500" : "text-green-500"}`}
                                />
                                <span
                                  className={`font-medium ${selectedEmployee.batteryLevel < 20 ? "text-red-600 dark:text-red-400" : "text-gray-900 dark:text-slate-100"}`}
                                >
                                  {selectedEmployee.batteryLevel}%
                                </span>
                              </>
                            ) : (
                              <span className="text-gray-400 text-sm">غير متاح</span>
                            )}
                          </div>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500 dark:text-slate-400">خط العرض:</span>
                          <span className="font-medium text-gray-900 dark:text-slate-100">
                            {selectedEmployee.lat.toFixed(4)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500 dark:text-slate-400">خط الطول:</span>
                          <span className="font-medium text-gray-900 dark:text-slate-100">
                            {selectedEmployee.lng.toFixed(4)}
                          </span>
                        </div>
                      </div>

                      {/* Route History */}
                      {showRoute && routeHistory.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
                          <h4 className="text-sm font-bold text-gray-900 dark:text-slate-100 mb-2 flex items-center gap-2">
                            <Route className="w-4 h-4 text-blue-500" />
                            سجل المسار ({routeHistory.length} نقطة)
                          </h4>
                          <div className="max-h-32 overflow-y-auto space-y-1">
                            {routeHistory
                              .slice()
                              .reverse()
                              .map((point, i) => (
                                <div
                                  key={i}
                                  className="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400"
                                >
                                  <Clock className="w-3 h-3" />
                                  <span>{point.time}</span>
                                  <span className="font-mono">
                                    {point.lat.toFixed(4)}, {point.lng.toFixed(4)}
                                  </span>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border-0 shadow-lg dark:bg-slate-800">
                    <CardContent className="pt-6 text-center text-gray-500 dark:text-slate-400">
                      <MapPin className="w-10 h-10 mx-auto mb-2 text-gray-300 dark:text-slate-600" />
                      <p className="text-sm">انقر على موظف على الخريطة لعرض تفاصيله</p>
                    </CardContent>
                  </Card>
                )}

                <Card className="border-0 shadow-lg dark:bg-slate-800">
                  <CardContent className="pt-6">
                    <h3 className="font-bold text-gray-900 dark:text-slate-100 mb-4">
                      الموظفون المتصلون ({filteredTracking.length})
                    </h3>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {filteredTracking.length === 0 ? (
                        <p className="text-sm text-gray-400 dark:text-slate-500 text-center py-4">
                          لا نتائج مطابقة
                        </p>
                      ) : (
                        filteredTracking.map((emp) => (
                          <div
                            key={emp.id}
                            onClick={() => setSelectedEmployee(emp)}
                            className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-gray-50 dark:border-slate-700 dark:hover:bg-slate-700/50 cursor-pointer transition-all"
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                                {emp.name.charAt(0)}
                              </div>
                              <span className="text-sm font-medium text-gray-900 dark:text-slate-100">
                                {emp.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {emp.status === "offline" ? (
                                <WifiOff className="w-4 h-4 text-gray-400" />
                              ) : (
                                <Wifi className="w-4 h-4 text-green-500" />
                              )}
                              <span className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1">
                                <BatteryIcon className="w-3 h-3" />
                                {emp.batteryLevel !== null ? `${emp.batteryLevel}%` : "—"}
                              </span>
                              {emp.status === "inside_geofence" ? (
                                <span className="relative flex w-2 h-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                                </span>
                              ) : (
                                <span
                                  className={`w-2 h-2 rounded-full ${
                                    emp.status === "outside_geofence"
                                      ? "bg-amber-500"
                                      : "bg-gray-400"
                                  }`}
                                />
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
