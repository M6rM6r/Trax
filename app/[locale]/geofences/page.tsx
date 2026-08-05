"use client";

import { useState, useEffect, useRef } from "react";
import MainLayout from "@/components/shared/MainLayout";
import FullPageHead from "@/components/shared/FullPageHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Plus, Trash2, Edit, X, Pencil, Check, Eye, Crosshair, Copy } from "lucide-react";
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
import { useTranslations } from "next-intl";

import Map from "ol/Map";
import View from "ol/View";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { fromLonLat, toLonLat } from "ol/proj";
import { createStreetMapLayers } from "@/lib/utils/mapLayers";
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
import { MAP_THEME } from "@/lib/utils/mapTheme";

const DEFAULT_GEOFENCE = {
  name: "",
  address: "",
  lat: 24.7136,
  lng: 46.6753,
  radius: 100,
  color: "#14b8a6",
  shifts: null as Geofence["shifts"],
};
const RADIUS_PRESETS = [50, 100, 250, 500, 1000, 5000, 10000];
const MIN_RADIUS_METERS = 1;
const MAX_RADIUS_METERS = 100000;

function formatRadius(radius: number, t: (key: string) => string): string {
  return radius >= 1000
    ? `${(radius / 1000).toFixed(radius % 1000 === 0 ? 0 : 1)} ${t("kilometers")}`
    : `${radius} ${t("meters")}`;
}

function normalizeColor(color: string | null | undefined): string {
  return /^#[0-9A-Fa-f]{6}$/.test(color ?? "") ? color! : DEFAULT_GEOFENCE.color;
}

function defaultShift(
  startTime = "08:00",
  endTime = "17:00"
): NonNullable<Geofence["shifts"]>["defaultShift"] {
  return { startTime, endTime, gracePeriodMinutes: 30, lateThresholdMinutes: 30 };
}

function GeofenceShiftsSection({
  shifts,
  onChange,
}: {
  shifts: Geofence["shifts"];
  onChange: (shifts: Geofence["shifts"]) => void;
}) {
  const t = useTranslations("Geofences");
  const enabled = Boolean(shifts);
  return (
    <div className="space-y-3 pt-4 border-t border-border">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">{t("customShifts")}</p>
          <p className="text-xs text-muted-foreground">{t("customShiftsHelper")}</p>
        </div>
        <button
          type="button"
          onClick={() =>
            onChange(
              enabled
                ? null
                : {
                    defaultShift: defaultShift(),
                    morningShift: defaultShift("08:00", "12:00"),
                    eveningShift: defaultShift("13:00", "17:00"),
                  }
            )
          }
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            enabled ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
          }`}
        >
          {enabled ? t("disableCustomShifts") : t("enableCustomShifts")}
        </button>
      </div>
      {enabled && shifts && (
        <div className="space-y-3">
          {[
            { key: "defaultShift" as const, label: t("defaultShift") },
            { key: "morningShift" as const, label: t("morningShift") },
            { key: "eveningShift" as const, label: t("eveningShift") },
          ].map(({ key, label }) => (
            <div key={key} className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  {label} — {t("start")}
                </label>
                <input
                  type="time"
                  value={shifts[key].startTime}
                  onChange={(e) =>
                    onChange({
                      ...shifts,
                      [key]: { ...shifts[key], startTime: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 border border-input rounded-lg outline-none focus:ring-2 focus:ring-ring bg-transparent text-foreground"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  {label} — {t("end")}
                </label>
                <input
                  type="time"
                  value={shifts[key].endTime}
                  onChange={(e) =>
                    onChange({
                      ...shifts,
                      [key]: { ...shifts[key], endTime: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 border border-input rounded-lg outline-none focus:ring-2 focus:ring-ring bg-transparent text-foreground"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function GeofencesPage() {
  const t = useTranslations("Geofences");
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
  const [newGeofence, setNewGeofence] = useState(DEFAULT_GEOFENCE);
  const [editGeofence, setEditGeofence] = useState(DEFAULT_GEOFENCE);

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
    const message = error instanceof Error ? error.message : String(error);
    if (message === "AUTH_EXPIRED") {
      return t("sessionExpired");
    }
    if (error instanceof Error && error.message.trim()) {
      return error.message;
    }

    return fallback;
  };

  const validateGeofence = (geofence: typeof DEFAULT_GEOFENCE): boolean => {
    if (geofence.name.trim().length < 2) {
      toast({ description: t("validation.name"), variant: "destructive" });
      return false;
    }
    if (!Number.isFinite(geofence.lat) || geofence.lat < -90 || geofence.lat > 90) {
      toast({ description: t("validation.lat"), variant: "destructive" });
      return false;
    }
    if (!Number.isFinite(geofence.lng) || geofence.lng < -180 || geofence.lng > 180) {
      toast({ description: t("validation.lng"), variant: "destructive" });
      return false;
    }
    if (!Number.isFinite(geofence.radius) || geofence.radius <= 0) {
      toast({ description: t("validation.radius"), variant: "destructive" });
      return false;
    }
    return true;
  };

  const copyCoordinates = async (lat: number, lng: number) => {
    try {
      await navigator.clipboard.writeText(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
      toast({ description: t("copyCoordinates") });
    } catch {
      toast({ description: t("copyCoordinatesError"), variant: "destructive" });
    }
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
          stroke: new Stroke({ color: MAP_THEME.contrastStroke, width: 2 }),
        }),
        text: new Text({
          text: previewGeofence.name,
          offsetY: -15,
          font: "bold 13px sans-serif",
          fill: new Fill({ color: MAP_THEME.surface }),
          stroke: new Stroke({ color: MAP_THEME.surfaceLight, width: 3 }),
        }),
      })
    );
    source.addFeature(markerFeature);

    if (previewMapInstance.current) {
      previewMapInstance.current.setTarget(undefined);
    }

    const map = new Map({
      target: previewMapRef.current,
      layers: [...createStreetMapLayers(), new VectorLayer({ source })],
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
          stroke: new Stroke({ color: MAP_THEME.contrastStroke, width: 2 }),
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
          stroke: new Stroke({ color: MAP_THEME.contrastStroke, width: 2 }),
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
        layers: [...createStreetMapLayers(), new VectorLayer({ source })],
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

      const refreshMapSize = () => {
        map?.updateSize();
        map?.renderSync();
      };
      requestAnimationFrame(refreshMapSize);
      sizeTimer = setTimeout(refreshMapSize, 500);

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
    // Intentionally only depends on showAddForm to init the map once when the drawer opens.
    // Live value sync (lat/lng/radius/color) is handled by the follow-up effect below.
    // We intentionally avoid re-creating the entire OL map on every value change.
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
        layers: [...createStreetMapLayers(), new VectorLayer({ source })],
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

      const refreshMapSize = () => {
        map?.updateSize();
        map?.renderSync();
      };
      requestAnimationFrame(refreshMapSize);
      sizeTimer = setTimeout(refreshMapSize, 500);

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
    if (!validateGeofence(newGeofence)) return;

    createGeofence.mutate(
      {
        ...newGeofence,
        address:
          newGeofence.address.trim() ||
          `Map location (${newGeofence.lat.toFixed(6)}, ${newGeofence.lng.toFixed(6)})`,
        active: true,
      },
      {
        onSuccess: () => {
          toast({ description: t("addGeofenceSuccess") });
          setShowAddForm(false);
          setNewGeofence(DEFAULT_GEOFENCE);
        },
        onError: (error) => {
          toast({
            description: extractApiErrorMessage(error, t("addGeofenceError")),
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
      color: normalizeColor(geo.color),
      shifts: geo.shifts,
    });
  };

  const handleUpdateGeofence = () => {
    if (!editTarget || !validateGeofence(editGeofence)) return;
    updateGeofence.mutate(
      { id: editTarget.id, data: editGeofence },
      {
        onSuccess: () => {
          toast({ description: t("updateGeofenceSuccess") });
          setEditTarget(null);
        },
        onError: () => toast({ description: t("updateGeofenceError"), variant: "destructive" }),
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
        toast({ description: t("deleteGeofenceSuccess") });
        setDeleteTarget(null);
      },
      onError: () => {
        toast({ description: t("deleteGeofenceError"), variant: "destructive" });
        setDeleteTarget(null);
      },
    });
  };

  return (
    <MainLayout>
      <div className="p-6 space-y-6 min-h-screen">
        <FullPageHead
          head={t("title")}
          description={t("description")}
          Icon={<MapPin className="w-7 h-7" />}
          LeftSection={
            <Button
              variant="primary"
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {t("addGeofence")}
            </Button>
          }
        />

        {/* Form Drawer */}
        <FormDrawer
          open={showAddForm}
          onOpenChange={setShowAddForm}
          title={t("addGeofenceTitle")}
          description={t("addGeofenceDescription")}
          onSubmit={handleAdd}
          submitLabel={createGeofence.isPending ? t("saving") : t("save")}
          isSubmitting={createGeofence.isPending}
        >
          {/* Interactive Map */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-muted-foreground">
                {t("mapLocation")}
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleDrawMode}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    drawMode
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {drawMode ? <Check className="w-3 h-3" /> : <Pencil className="w-3 h-3" />}
                  {drawMode ? t("drawingDone") : t("drawCircle")}
                </button>
              </div>
            </div>
            <div
              ref={drawerMapRef}
              className="w-full h-64 rounded-xl border border-border overflow-hidden"
            />
            <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Crosshair className="w-3.5 h-3.5 text-primary" />
                {drawMode ? t("drawHint") : t("clickHint")}
              </span>
              <span className="font-medium text-foreground">
                {formatRadius(newGeofence.radius, t)}
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-muted/20 p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-foreground">{t("coordinates")}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{t("coordinatesHelper")}</p>
              </div>
              <button
                type="button"
                onClick={() => copyCoordinates(newGeofence.lat, newGeofence.lng)}
                className="shrink-0 rounded-lg border border-border p-2 text-muted-foreground transition-colors hover:border-primary/60 hover:bg-primary/10 hover:text-primary"
                aria-label={t("copyCoordinates")}
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-background px-3 py-2">
                <p className="text-[11px] text-muted-foreground">{t("latitude")}</p>
                <p className="mt-0.5 font-mono text-sm font-semibold text-foreground" dir="ltr">
                  {newGeofence.lat.toFixed(6)}
                </p>
              </div>
              <div className="rounded-lg bg-background px-3 py-2">
                <p className="text-[11px] text-muted-foreground">{t("longitude")}</p>
                <p className="mt-0.5 font-mono text-sm font-semibold text-foreground" dir="ltr">
                  {newGeofence.lng.toFixed(6)}
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1 block">
              {t("name")}
            </label>
            <input
              type="text"
              value={newGeofence.name}
              onChange={(e) => setNewGeofence({ ...newGeofence, name: e.target.value })}
              className="w-full px-3 py-2 border border-input rounded-lg outline-none focus:ring-2 focus:ring-ring bg-transparent text-foreground"
              placeholder={t("geofenceNamePlaceholder")}
            />
          </div>
          <div className="rounded-xl border border-border bg-muted/20 p-3 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">{t("radiusLabel")}</label>
              <span className="text-sm font-bold text-primary">
                {formatRadius(newGeofence.radius, t)}
              </span>
            </div>
            <input
              type="range"
              min={MIN_RADIUS_METERS}
              max={MAX_RADIUS_METERS}
              step="100"
              value={Math.min(MAX_RADIUS_METERS, Math.max(MIN_RADIUS_METERS, newGeofence.radius))}
              onChange={(e) => setNewGeofence({ ...newGeofence, radius: Number(e.target.value) })}
              className="w-full accent-primary"
            />
            <div className="flex flex-wrap gap-2">
              {RADIUS_PRESETS.map((radius) => (
                <button
                  key={radius}
                  type="button"
                  onClick={() => setNewGeofence({ ...newGeofence, radius })}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${newGeofence.radius === radius ? "bg-primary text-primary-foreground" : "bg-background border border-border text-muted-foreground hover:border-primary/60"}`}
                >
                  {formatRadius(radius, t)}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-[1fr_auto] gap-3 items-end">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">
                {t("preciseRadius")}
              </label>
              <input
                type="number"
                step="1"
                value={newGeofence.radius}
                onChange={(e) => setNewGeofence({ ...newGeofence, radius: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-input rounded-lg outline-none focus:ring-2 focus:ring-ring bg-transparent text-foreground"
              />
            </div>
            <input
              aria-label={t("color")}
              type="color"
              value={newGeofence.color}
              onChange={(e) => setNewGeofence({ ...newGeofence, color: e.target.value })}
              className="h-10 w-12 border border-input rounded-lg cursor-pointer bg-transparent"
            />
          </div>
          <GeofenceShiftsSection
            shifts={newGeofence.shifts}
            onChange={(shifts) => setNewGeofence({ ...newGeofence, shifts })}
          />
        </FormDrawer>

        {isLoading && <GeofenceSkeleton />}
        {isError && <ErrorState onRetry={() => refetch()} />}
        {!isLoading && !isError && geofences.length === 0 && (
          <EmptyState
            icon={MapPin}
            title={t("noGeofences")}
            description={t("noGeofencesFound")}
            actionLabel={t("addGeofence")}
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
                <Card className="border-0 shadow-lg overflow-hidden group hover:shadow-xl transition-all duration-300 bg-card cursor-default">
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
                          <h3 className="text-sm font-bold text-foreground truncate">{geo.name}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[140px]">
                            {geo.address}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Stats chips */}
                    <div className="flex items-center gap-2 mb-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-muted text-muted-foreground">
                        <span className="text-muted-foreground">{t("radius")}</span>
                        <span className="font-bold text-foreground">
                          {formatRadius(geo.radius, t)}
                        </span>
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-muted text-muted-foreground">
                        <span className="text-muted-foreground">
                          {geo.lat.toFixed(3)}°, {geo.lng.toFixed(3)}°
                        </span>
                      </span>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1 pt-3 border-t border-border">
                      <button
                        onClick={() => {
                          hapticTap();
                          setPreviewGeofence(geo);
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                        aria-label={t("view")}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        {t("view")}
                      </button>
                      <div className="w-px h-5 bg-border" />
                      <button
                        onClick={() => handleEditGeofence(geo)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                        aria-label={t("edit")}
                      >
                        <Edit className="w-3.5 h-3.5" />
                        {t("edit")}
                      </button>
                      <div className="w-px h-5 bg-border" />
                      <button
                        onClick={() => handleDelete(geo)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                        aria-label={t("delete")}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        {t("delete")}
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
          title={t("editGeofence")}
          description={t("editGeofenceDescription")}
          onSubmit={handleUpdateGeofence}
          isSubmitting={updateGeofence.isPending}
          submitLabel={t("saveChanges")}
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-muted-foreground">
                  {t("mapLocation")}
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleEditDrawMode}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      editDrawMode
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {editDrawMode ? <Check className="w-3 h-3" /> : <Pencil className="w-3 h-3" />}
                    {editDrawMode ? t("drawingDone") : t("drawCircle")}
                  </button>
                </div>
              </div>
              <div
                ref={editDrawerMapRef}
                className="w-full h-64 rounded-xl border border-border overflow-hidden"
              />
              <p className="text-xs text-muted-foreground">
                {editDrawMode ? t("drawHint") : t("clickHint")}
              </p>
            </div>

            <div className="rounded-xl border border-border bg-muted/20 p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{t("coordinates")}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{t("coordinatesHelper")}</p>
                </div>
                <button
                  type="button"
                  onClick={() => copyCoordinates(editGeofence.lat, editGeofence.lng)}
                  className="shrink-0 rounded-lg border border-border p-2 text-muted-foreground transition-colors hover:border-primary/60 hover:bg-primary/10 hover:text-primary"
                  aria-label={t("copyCoordinates")}
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-background px-3 py-2">
                  <p className="text-[11px] text-muted-foreground">{t("latitude")}</p>
                  <p className="mt-0.5 font-mono text-sm font-semibold text-foreground" dir="ltr">
                    {editGeofence.lat.toFixed(6)}
                  </p>
                </div>
                <div className="rounded-lg bg-background px-3 py-2">
                  <p className="text-[11px] text-muted-foreground">{t("longitude")}</p>
                  <p className="mt-0.5 font-mono text-sm font-semibold text-foreground" dir="ltr">
                    {editGeofence.lng.toFixed(6)}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">
                {t("name")}
              </label>
              <input
                type="text"
                value={editGeofence.name}
                onChange={(e) => setEditGeofence({ ...editGeofence, name: e.target.value })}
                className="w-full px-3 py-2 border border-input rounded-lg outline-none focus:ring-2 focus:ring-ring bg-transparent text-foreground"
                placeholder={t("geofenceNamePlaceholder")}
              />
            </div>
            <div className="rounded-xl border border-border bg-muted/20 p-3 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">{t("radiusLabel")}</label>
                <span className="text-sm font-bold text-primary">
                  {formatRadius(editGeofence.radius, t)}
                </span>
              </div>
              <input
                type="range"
                min={MIN_RADIUS_METERS}
                max={MAX_RADIUS_METERS}
                step="100"
                value={Math.min(
                  MAX_RADIUS_METERS,
                  Math.max(MIN_RADIUS_METERS, editGeofence.radius)
                )}
                onChange={(e) =>
                  setEditGeofence({ ...editGeofence, radius: Number(e.target.value) })
                }
                className="w-full accent-primary"
              />
              <div className="flex flex-wrap gap-2">
                {RADIUS_PRESETS.map((radius) => (
                  <button
                    key={radius}
                    type="button"
                    onClick={() => setEditGeofence({ ...editGeofence, radius })}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${editGeofence.radius === radius ? "bg-primary text-primary-foreground" : "bg-background border border-border text-muted-foreground hover:border-primary/60"}`}
                  >
                    {formatRadius(radius, t)}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-[1fr_auto] gap-3 items-end">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">
                  {t("preciseRadius")}
                </label>
                <input
                  type="number"
                  step="1"
                  value={editGeofence.radius}
                  onChange={(e) =>
                    setEditGeofence({ ...editGeofence, radius: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-input rounded-lg outline-none focus:ring-2 focus:ring-ring bg-transparent text-foreground"
                />
              </div>
              <input
                aria-label={t("color")}
                type="color"
                value={editGeofence.color}
                onChange={(e) => setEditGeofence({ ...editGeofence, color: e.target.value })}
                className="h-10 w-12 border border-input rounded-lg cursor-pointer bg-transparent"
              />
            </div>
          </div>
          <GeofenceShiftsSection
            shifts={editGeofence.shifts}
            onChange={(shifts) => setEditGeofence({ ...editGeofence, shifts })}
          />
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
                className="bg-card rounded-2xl p-6 max-w-lg w-full shadow-2xl"
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
                      <h3 className="text-lg font-bold text-foreground">{previewGeofence.name}</h3>
                      <p className="text-xs text-muted-foreground">{previewGeofence.address}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setPreviewGeofence(null)}
                    className="p-2 rounded-lg hover:bg-muted text-muted-foreground"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div
                  ref={previewMapRef}
                  className="w-full h-72 rounded-xl border border-border overflow-hidden"
                />
                <div className="grid grid-cols-3 gap-3 mt-4 text-sm">
                  <div className="text-center p-2 rounded-lg bg-muted text-muted-foreground">
                    <p className="text-xs text-muted-foreground">{t("radius")}</p>
                    <p className="font-bold text-foreground">
                      {formatRadius(previewGeofence.radius, t)}
                    </p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-muted text-muted-foreground">
                    <p className="text-xs text-muted-foreground">{t("latitude")}</p>
                    <p className="font-bold text-foreground">{previewGeofence.lat}</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-muted text-muted-foreground">
                    <p className="text-xs text-muted-foreground">{t("longitude")}</p>
                    <p className="font-bold text-foreground">{previewGeofence.lng}</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <ConfirmDialog
          open={deleteTarget !== null}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
          title={t("confirmDelete")}
          description={t("deleteGeofenceDescription", { name: deleteTarget?.name })}
          confirmLabel={t("deleteConfirmLabel")}
          cancelLabel={t("cancel")}
          onConfirm={confirmDelete}
        />
      </div>
    </MainLayout>
  );
}
