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
import type { Coordinate } from "ol/coordinate";
import { Point, Circle as CircleGeom, LineString } from "ol/geom";
import Feature from "ol/Feature";
import { Style, Stroke, Fill, Circle as CircleStyle, Text } from "ol/style";
import { boundingExtent, buffer } from "ol/extent";
import "ol/ol.css";
import { useLiveTracking, useGeofences } from "@/hooks/useApi";
import { useLiveTrackingSocket } from "@/hooks/useLiveTrackingSocket";
import { ErrorState, EmptyState } from "@/components/shared/StateViews";
import LiveMapSkeleton from "@/components/shared/Skeletons/LiveMapSkeleton";
import { Input } from "@/components/ui/input";
import { hapticTap } from "@/lib/utils/haptics";
import type { LiveTrackingEmployee, Geofence } from "@/lib/types/trackingTypes";
import { useTranslations } from "next-intl";
import { useAuthStore } from "@/stores/useAuthStore";
import AccessDeniedCard from "@/components/shared/AccessDeniedCard";
import { MAP_THEME } from "@/lib/utils/mapTheme";
import { createHybridSatelliteLayers } from "@/lib/utils/mapLayers";

export default function LiveMapPage() {
  const t = useTranslations("LiveMap");
  const mapRef = useRef<HTMLDivElement>(null);
  const { data: initialTracking = [], isLoading, isError, refetch } = useLiveTracking();
  const { data: geofences = [] } = useGeofences();
  const { role } = useAuthStore();
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
  const [tileLayer, setTileLayer] = useState<"osm" | "satellite" | "topo">("satellite");
  const [showTilePicker, setShowTilePicker] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Map | null>(null);
  const routeSourceRef = useRef<VectorSource | null>(null);
  const tileLayerRef = useRef<TileLayer<OSM | XYZ> | null>(null);
  const overlayLayersRef = useRef<TileLayer<XYZ>[]>([]);
  const filteredTrackingRef = useRef<LiveTrackingEmployee[]>([]);

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

  const tileSources = useMemo<Record<"osm" | "satellite" | "topo", () => OSM | XYZ>>(
    () => ({
      osm: () =>
        new XYZ({
          url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
          maxZoom: 19,
          attributions: "Esri, HERE, Garmin, USGS, NPS",
        }) as unknown as OSM,
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
    }),
    []
  );

  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    tileLayerRef.current.setSource(tileSources[tileLayer]());
    overlayLayersRef.current.forEach((layer) => layer.setVisible(tileLayer === "satellite"));
  }, [tileLayer, tileSources]);

  const statusLabels: Record<string, string> = {
    inside_geofence: t("insideGeofence"),
    outside_geofence: t("outsideGeofence"),
    offline: t("offlineStatus"),
  };

  const statusColors: Record<string, string> = {
    inside_geofence: "text-primary bg-primary/10",
    outside_geofence: "text-[hsl(48_96%_53%)] bg-[hsl(48_96%_53%/0.15)]",
    offline: "text-muted-foreground bg-muted",
  };

  const statusCounts = useMemo(() => {
    const counts = { inside_geofence: 0, outside_geofence: 0, offline: 0 };
    for (const emp of liveTracking) {
      if (emp.status in counts) counts[emp.status as keyof typeof counts]++;
    }
    return counts;
  }, [liveTracking]);

  const filteredTracking = useMemo(() => {
    return liveTracking.filter((emp) => {
      if (searchQuery && !emp.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (statusFilter !== "all" && emp.status !== statusFilter) return false;
      return true;
    });
  }, [liveTracking, searchQuery, statusFilter]);

  useEffect(() => {
    filteredTrackingRef.current = filteredTracking;
  }, [filteredTracking]);

  const vectorSourceRef = useRef<VectorSource | null>(null);

  // Initialize map once
  useEffect(() => {
    if (!mapRef.current) return;

    const vectorSource = new VectorSource();
    vectorSourceRef.current = vectorSource;

    const routeSource = new VectorSource();
    routeSourceRef.current = routeSource;

    const baseTileLayer = new TileLayer({ source: tileSources.satellite() });
    tileLayerRef.current = baseTileLayer;

    const overlayLayers = createHybridSatelliteLayers().slice(1) as TileLayer<XYZ>[];
    overlayLayersRef.current = overlayLayers;

    const vectorLayer = new VectorLayer({ source: vectorSource, zIndex: 50 });
    const routeLayer = new VectorLayer({ source: routeSource, zIndex: 100 });

    const initialGeofence = geofences[0];
    const initialCenter = initialGeofence
      ? fromLonLat([initialGeofence.lng, initialGeofence.lat])
      : fromLonLat([46.6753, 24.7136]);

    const map = new Map({
      target: mapRef.current,
      layers: [baseTileLayer, ...overlayLayers, vectorLayer, routeLayer],
      view: new View({
        center: initialCenter,
        zoom: initialGeofence ? 14 : 12,
      }),
    });
    mapInstanceRef.current = map;

    map.on("click", (evt) => {
      let clicked = false;
      map.forEachFeatureAtPixel(evt.pixel, (feature) => {
        const type = feature.get("type");
        if (type === "employee") {
          const empId = feature.get("employeeId");
          const emp = filteredTrackingRef.current.find((e) => String(e.id) === String(empId));
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update vector source features when data changes (no map rebuild)
  useEffect(() => {
    const vectorSource = vectorSourceRef.current;
    if (!vectorSource) return;

    vectorSource.clear();
    const extentCoords: Coordinate[] = [];

    // Add geofence circles
    geofences.forEach((geo: Geofence) => {
      const center = fromLonLat([geo.lng, geo.lat]);
      extentCoords.push(center);
      const circleFeature = new Feature({
        geometry: new CircleGeom(center, geo.radius),
        type: "geofence",
      });
      circleFeature.setStyle(
        new Style({
          stroke: new Stroke({ color: geo.color, width: 2 }),
          fill: new Fill({ color: `${geo.color}20` }),
        })
      );
      vectorSource.addFeature(circleFeature);

      const centerFeature = new Feature({
        geometry: new Point(center),
        type: "geofence-center",
      });
      centerFeature.setStyle(
        new Style({
          image: new CircleStyle({
            radius: 5,
            fill: new Fill({ color: geo.color }),
            stroke: new Stroke({ color: MAP_THEME.contrastStroke, width: 2 }),
          }),
          text: new Text({
            text: geo.name,
            offsetY: -15,
            font: "bold 12px sans-serif",
            fill: new Fill({ color: MAP_THEME.surface }),
            stroke: new Stroke({ color: MAP_THEME.contrastStroke, width: 3 }),
          }),
        })
      );
      vectorSource.addFeature(centerFeature);
    });

    // Add employee markers
    filteredTracking.forEach((emp) => {
      if (emp.lat === null || emp.lng === null) return;
      const point = fromLonLat([emp.lng, emp.lat]);
      extentCoords.push(point);
      const feature = new Feature({
        geometry: new Point(point),
        type: "employee",
        employeeId: emp.id,
      });

      const color =
        emp.status === "inside_geofence"
          ? MAP_THEME.employeeMarker
          : emp.status === "outside_geofence"
            ? MAP_THEME.secondary
            : MAP_THEME.surfaceLight;

      feature.setStyle(
        new Style({
          image: new CircleStyle({
            radius: 8,
            fill: new Fill({ color }),
            stroke: new Stroke({ color: MAP_THEME.contrastStroke, width: 2 }),
          }),
          text: new Text({
            text: emp.name,
            offsetY: -15,
            font: "bold 11px sans-serif",
            fill: new Fill({ color: MAP_THEME.surface }),
            stroke: new Stroke({ color: MAP_THEME.contrastStroke, width: 3 }),
          }),
        })
      );
      vectorSource.addFeature(feature);
    });

    const map = mapInstanceRef.current;
    if (map && extentCoords.length >= 1) {
      const extent = boundingExtent(extentCoords);
      map.getView().fit(buffer(extent, 2000), { duration: 500 });
    }
  }, [geofences, filteredTracking]);

  // Track route history for selected employee
  useEffect(() => {
    if (!selectedEmployee || !showRoute) return;
    const newPoint = {
      lat: selectedEmployee.lat,
      lng: selectedEmployee.lng,
      time: new Date().toLocaleTimeString("ar-SA-u-nu-latn", {
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
          stroke: new Stroke({ color: MAP_THEME.secondary, width: 3, lineDash: [8, 4] }),
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
            fill: new Fill({ color: MAP_THEME.employeeMarker }),
            stroke: new Stroke({ color: MAP_THEME.contrastStroke, width: 2 }),
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
            fill: new Fill({ color: MAP_THEME.primary }),
            stroke: new Stroke({ color: MAP_THEME.contrastStroke, width: 2 }),
          }),
        })
      );
      routeSourceRef.current.addFeature(endFeature);
    }
  }, [showRoute, routeHistory, selectedEmployee]);

  if (role === "employee") {
    return (
      <MainLayout>
        <div className="p-6 min-h-screen">
          <AccessDeniedCard icon={MapPin} message={t("accessDenied")} ctaHref="/check-in" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-6 space-y-6 min-h-screen">
        <FullPageHead
          head={t("title")}
          description={t("description")}
          Icon={<MapPin className="w-7 h-7" />}
          LeftSection={
            <div className="flex items-center gap-3 text-sm">
              <span
                className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${socketConnected ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}
              >
                {socketConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                {socketConnected ? t("live") : t("offline")}
              </span>
              {lastUpdate && (
                <span className="text-xs text-muted-foreground/70">
                  {t("lastUpdate")}:{" "}
                  {lastUpdate.toLocaleTimeString(undefined, {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-primary" />
                <span className="text-muted-foreground">{t("insideGeofence")}</span>
                <span className="text-xs font-bold text-primary">
                  {statusCounts.inside_geofence}
                </span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[hsl(48_96%_53%/0.7)]" />
                <span className="text-muted-foreground">{t("outsideGeofence")}</span>
                <span className="text-xs font-bold text-[hsl(48_96%_53%)]">
                  {statusCounts.outside_geofence}
                </span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-muted-foreground/50" />
                <span className="text-muted-foreground">{t("offlineStatus")}</span>
                <span className="text-xs font-bold text-muted-foreground">
                  {statusCounts.offline}
                </span>
              </span>
            </div>
          }
        />

        {isLoading && <LiveMapSkeleton />}
        {isError && <ErrorState onRetry={() => refetch()} />}
        {!isLoading && !isError && liveTracking.length === 0 && (
          <EmptyState
            icon={MapPin}
            illustration="geofences"
            title={t("noEmployeesConnected")}
            description={t("noEmployeesConnectedDescription")}
          />
        )}
        {!isLoading && !isError && liveTracking.length > 0 && (
          <div className="space-y-4">
            {/* Search & Filter Bar */}
            <Card className="border-0 shadow-md bg-card">
              <CardContent className="py-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t("searchEmployee")}
                      className="pr-9 bg-background text-foreground"
                      aria-label={t("searchEmployeeAria")}
                    />
                  </div>
                  <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                    {[
                      { value: "all", label: t("all") },
                      { value: "inside_geofence", label: t("inside") },
                      { value: "outside_geofence", label: t("outside") },
                      { value: "offline", label: t("offlineStatus") },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => {
                          hapticTap();
                          setStatusFilter(opt.value);
                        }}
                        aria-pressed={statusFilter === opt.value}
                        className={`px-3 py-1.5 rounded-md text-xs transition-all ${
                          statusFilter === opt.value
                            ? "bg-card shadow-sm font-medium"
                            : "text-muted-foreground"
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
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Route className="w-4 h-4" />
                      {showRoute ? t("hideRoute") : t("showRoute")}
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card className="border-0 shadow-lg overflow-hidden bg-card">
                  <div ref={mapContainerRef} className="relative group">
                    <div
                      ref={mapRef}
                      className="h-[600px] w-full dark:[&_.ol-layer]:filter dark:[&_.ol-layer]:invert-[1] dark:[&_.ol-layer]:hue-rotate-180 dark:[&_.ol-layer]:brightness-[0.9] dark:[&_.ol-layer]:contrast-[0.9]"
                    />
                    {/* Map Controls */}
                    <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
                      <button
                        onClick={toggleFullscreen}
                        className="p-2 rounded-lg bg-card/90 backdrop-blur-sm shadow-md hover:bg-muted transition-colors"
                        title={isFullscreen ? t("exitFullscreen") : t("fullscreen")}
                        aria-label={isFullscreen ? t("exitFullscreen") : t("fullscreen")}
                      >
                        {isFullscreen ? (
                          <Minimize2 className="w-4 h-4 text-foreground" />
                        ) : (
                          <Maximize2 className="w-4 h-4 text-foreground" />
                        )}
                      </button>
                      <div className="relative">
                        <button
                          onClick={() => setShowTilePicker(!showTilePicker)}
                          className="p-2 rounded-lg bg-card/90 backdrop-blur-sm shadow-md hover:bg-muted transition-colors"
                          title={t("mapLayer")}
                          aria-label={t("chooseMapLayer")}
                          aria-expanded={showTilePicker}
                        >
                          <Layers className="w-4 h-4 text-foreground" />
                        </button>
                        {showTilePicker && (
                          <div className="absolute left-full top-0 ml-2 bg-card rounded-xl shadow-xl border border-border overflow-hidden">
                            {(
                              [
                                { key: "osm", label: t("normal") },
                                { key: "satellite", label: t("satellite") },
                                { key: "topo", label: t("topographic") },
                              ] as const
                            ).map(({ key, label }) => (
                              <button
                                key={key}
                                onClick={() => {
                                  setTileLayer(key);
                                  setShowTilePicker(false);
                                }}
                                className={`block w-full px-4 py-2.5 text-sm text-right hover:bg-muted transition-colors ${
                                  tileLayer === key
                                    ? "font-bold text-primary bg-primary/5"
                                    : "text-foreground"
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
                  <Card className="border-0 shadow-lg bg-card animate-slide-up">
                    <CardContent className="pt-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground font-bold">
                            {selectedEmployee.name.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-bold text-foreground">{selectedEmployee.name}</h3>
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[selectedEmployee.status]}`}
                            >
                              {statusLabels[selectedEmployee.status]}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedEmployee(null)}
                          className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground/70"
                          aria-label={t("close")}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t("location")}:</span>
                          <span className="font-medium text-foreground">
                            {selectedEmployee.geofenceName || t("outsideGeofenceShort")}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t("lastSeen")}:</span>
                          <span className="font-medium text-foreground">
                            {new Date(selectedEmployee.lastSeen).toLocaleTimeString(undefined, {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">{t("battery")}:</span>
                          <div className="flex items-center gap-1.5">
                            {selectedEmployee.batteryLevel !== null ? (
                              <>
                                <BatteryIcon
                                  className={`w-4 h-4 ${selectedEmployee.batteryLevel < 20 ? "text-destructive" : selectedEmployee.batteryLevel < 50 ? "text-[hsl(48_96%_53%)]" : "text-primary"}`}
                                />
                                <span
                                  className={`font-medium ${selectedEmployee.batteryLevel < 20 ? "text-destructive" : "text-foreground"}`}
                                >
                                  {selectedEmployee.batteryLevel}%
                                </span>
                              </>
                            ) : (
                              <span className="text-muted-foreground/70 text-sm">
                                {t("batteryNotAvailable")}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t("latitude")}:</span>
                          <span className="font-medium text-foreground">
                            {selectedEmployee.lat.toFixed(4)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t("longitude")}:</span>
                          <span className="font-medium text-foreground">
                            {selectedEmployee.lng.toFixed(4)}
                          </span>
                        </div>
                      </div>

                      {/* Route History */}
                      {showRoute && routeHistory.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-border">
                          <h4 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
                            <Route className="w-4 h-4 text-primary" />
                            {t("routeHistory", { count: routeHistory.length })}
                          </h4>
                          <div className="max-h-32 overflow-y-auto space-y-1">
                            {routeHistory
                              .slice()
                              .reverse()
                              .map((point, i) => (
                                <div
                                  key={i}
                                  className="flex items-center gap-2 text-xs text-muted-foreground"
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
                  <Card className="border-0 shadow-lg bg-card">
                    <CardContent className="pt-6 text-center text-muted-foreground">
                      <MapPin className="w-10 h-10 mx-auto mb-2 text-muted-foreground/50" />
                      <p className="text-sm">{t("clickEmployeeForDetails")}</p>
                    </CardContent>
                  </Card>
                )}

                <Card className="border-0 shadow-lg bg-card">
                  <CardContent className="pt-6">
                    <h3 className="font-bold text-foreground mb-4">
                      {t("connectedEmployees", { count: filteredTracking.length })}
                    </h3>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {filteredTracking.length === 0 ? (
                        <p className="text-sm text-muted-foreground/70 text-center py-4">
                          {t("noMatchingResults")}
                        </p>
                      ) : (
                        filteredTracking.map((emp) => (
                          <div
                            key={emp.id}
                            onClick={() => setSelectedEmployee(emp)}
                            className="flex items-center justify-between p-3 rounded-xl border border-border hover:bg-muted/50 cursor-pointer transition-all"
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground text-xs font-bold">
                                {emp.name.charAt(0)}
                              </div>
                              <span className="text-sm font-medium text-foreground">
                                {emp.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {emp.status === "offline" ? (
                                <WifiOff className="w-4 h-4 text-muted-foreground/70" />
                              ) : (
                                <Wifi className="w-4 h-4 text-primary" />
                              )}
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <BatteryIcon className="w-3 h-3" />
                                {emp.batteryLevel !== null ? `${emp.batteryLevel}%` : "—"}
                              </span>
                              {emp.status === "inside_geofence" ? (
                                <span className="relative flex w-2 h-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                                </span>
                              ) : (
                                <span
                                  className={`w-2 h-2 rounded-full ${
                                    emp.status === "outside_geofence"
                                      ? "bg-[hsl(48_96%_53%/0.7)]"
                                      : "bg-muted-foreground/50"
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
