"use client";

import { useEffect, useRef } from "react";
import { Crosshair, Maximize } from "lucide-react";
import Map from "ol/Map";
import View from "ol/View";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { createStreetMapLayers } from "@/lib/utils/mapLayers";
import { fromLonLat } from "ol/proj";
import { Point, Circle as CircleGeom } from "ol/geom";
import Feature from "ol/Feature";
import { Style, Stroke, Fill, Circle as CircleStyle, Text } from "ol/style";
import "ol/ol.css";
import type { Geofence } from "@/lib/types/trackingTypes";
import { MAP_THEME } from "@/lib/utils/mapTheme";
import { useTranslations } from "next-intl";

interface CheckInMapProps {
  geofences: Geofence[];
  currentLocation: { lat: number; lng: number } | null;
  nearestGeofence?: { geofence: Geofence; distance: number } | null;
  isWithinRange?: boolean;
  loading?: boolean;
  className?: string;
}

export default function CheckInMap({
  geofences,
  currentLocation,
  nearestGeofence,
  isWithinRange = false,
  loading = false,
  className = "",
}: CheckInMapProps) {
  const t = useTranslations("CheckIn");
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Map | null>(null);
  const vectorSourceRef = useRef<VectorSource | null>(null);

  const recenterOnUser = () => {
    const map = mapInstanceRef.current;
    if (!map || !currentLocation) return;
    map.getView().setCenter(fromLonLat([currentLocation.lng, currentLocation.lat]));
    map.getView().setZoom(17);
  };

  const fitToAll = () => {
    const map = mapInstanceRef.current;
    const source = vectorSourceRef.current;
    if (!map || !source) return;
    const extent = source.getExtent();
    if (extent[0] === Infinity) return;
    map.getView().fit(extent, { padding: [50, 50, 50, 50], maxZoom: 18 });
  };

  useEffect(() => {
    if (!mapRef.current) return;

    const vectorSource = new VectorSource();
    vectorSourceRef.current = vectorSource;

    const map = new Map({
      target: mapRef.current,
      layers: [
        ...createStreetMapLayers(),
        new VectorLayer({
          source: vectorSource,
          style: undefined,
        }),
      ],
      view: new View({
        center: fromLonLat([46.6753, 24.7136]),
        zoom: 13,
      }),
      controls: [],
    });

    mapInstanceRef.current = map;

    return () => {
      map.setTarget(undefined);
      mapInstanceRef.current = null;
      vectorSourceRef.current = null;
    };
  }, []);

  useEffect(() => {
    const source = vectorSourceRef.current;
    const map = mapInstanceRef.current;
    if (!source || !map) return;

    source.clear();

    let extent: number[] | undefined;

    geofences.forEach((geo) => {
      const center = fromLonLat([geo.lng, geo.lat]);
      const isNearest = nearestGeofence?.geofence.id === geo.id;
      const color = geo.color || (isNearest ? MAP_THEME.primary : MAP_THEME.secondary);

      const circleFeature = new Feature({
        geometry: new CircleGeom(center, geo.radius),
        type: "geofence",
      });
      circleFeature.setStyle(
        new Style({
          stroke: new Stroke({
            color,
            width: isNearest ? 3 : 2,
          }),
          fill: new Fill({
            color: `${color}20`,
          }),
        })
      );
      source.addFeature(circleFeature);

      const centerFeature = new Feature({
        geometry: new Point(center),
        type: "geofence-center",
      });
      centerFeature.setStyle(
        new Style({
          image: new CircleStyle({
            radius: isNearest ? 7 : 5,
            fill: new Fill({ color }),
            stroke: new Stroke({ color: MAP_THEME.contrastStroke, width: 2 }),
          }),
          text: new Text({
            text: geo.name,
            offsetY: -18,
            font: "bold 12px sans-serif",
            fill: new Fill({ color: MAP_THEME.surfaceLight }),
            stroke: new Stroke({ color: MAP_THEME.border, width: 3 }),
          }),
        })
      );
      source.addFeature(centerFeature);

      const circleExtent = (circleFeature.getGeometry() as CircleGeom).getExtent();
      if (!extent) {
        extent = circleExtent.slice();
      } else {
        for (let i = 0; i < 4; i++) {
          extent[i] =
            i < 2 ? Math.min(extent[i], circleExtent[i]) : Math.max(extent[i], circleExtent[i]);
        }
      }
    });

    if (currentLocation) {
      const userPoint = fromLonLat([currentLocation.lng, currentLocation.lat]);
      const userFeature = new Feature({
        geometry: new Point(userPoint),
        type: "user",
      });
      userFeature.setStyle(
        new Style({
          image: new CircleStyle({
            radius: 8,
            fill: new Fill({ color: MAP_THEME.employeeMarker }),
            stroke: new Stroke({ color: MAP_THEME.contrastStroke, width: 3 }),
          }),
          text: new Text({
            text: t("youAreHere"),
            offsetY: -22,
            font: "bold 12px sans-serif",
            fill: new Fill({ color: MAP_THEME.employeeMarker }),
            stroke: new Stroke({ color: MAP_THEME.border, width: 3 }),
          }),
        })
      );
      source.addFeature(userFeature);

      const pointExtent = (userFeature.getGeometry() as Point).getExtent();
      if (!extent) {
        extent = pointExtent.slice();
      } else {
        for (let i = 0; i < 4; i++) {
          extent[i] =
            i < 2 ? Math.min(extent[i], pointExtent[i]) : Math.max(extent[i], pointExtent[i]);
        }
      }
    }

    if (extent) {
      map.getView().fit(extent, { padding: [40, 40, 40, 40], maxZoom: 18 });
    } else if (currentLocation) {
      map.getView().setCenter(fromLonLat([currentLocation.lng, currentLocation.lat]));
    } else if (geofences[0]) {
      map.getView().setCenter(fromLonLat([geofences[0].lng, geofences[0].lat]));
    }
  }, [geofences, currentLocation, nearestGeofence, t]);

  const statusText = isWithinRange ? t("insideRange") : t("outsideRange");
  const statusColor = isWithinRange ? "bg-primary" : "bg-[hsl(48_96%_53%/0.7)]";

  return (
    <div className={`relative w-full overflow-hidden rounded-xl ${className}`}>
      <div
        ref={mapRef}
        dir="ltr"
        className="absolute inset-0 [&_.ol-viewport]:!h-full [&_.ol-viewport]:!w-full"
      />

      {/* Map controls */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-2">
        <button
          type="button"
          onClick={recenterOnUser}
          disabled={!currentLocation}
          className="p-2 rounded-lg bg-card/80 text-primary-foreground shadow-md backdrop-blur-sm hover:bg-muted/90 disabled:opacity-40 transition-colors"
          title={t("recenterOnMe")}
          aria-label={t("recenterOnMe")}
        >
          <Crosshair className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={fitToAll}
          className="p-2 rounded-lg bg-card/80 text-primary-foreground shadow-md backdrop-blur-sm hover:bg-muted/90 transition-colors"
          title={t("showAll")}
          aria-label={t("showAll")}
        >
          <Maximize className="w-4 h-4" />
        </button>
      </div>

      {/* Location / geofence info */}
      <div className="absolute bottom-3 left-3 z-10 max-w-[85%] rounded-xl bg-background/80 p-3 text-primary-foreground shadow-lg backdrop-blur-sm">
        {loading ? (
          <p className="text-[11px]">{t("loadingGeofences")}</p>
        ) : geofences.length === 0 ? (
          <p className="text-[11px]">{t("noGeofenceSetup")}</p>
        ) : !currentLocation ? (
          <p className="text-[11px]">{t("locatingYou")}</p>
        ) : nearestGeofence ? (
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{
                  backgroundColor:
                    nearestGeofence.geofence.color ||
                    (isWithinRange ? MAP_THEME.primary : MAP_THEME.secondary),
                }}
              />
              <span className="text-xs font-bold truncate">{nearestGeofence.geofence.name}</span>
            </div>
            <div className="text-[11px] text-muted-foreground">
              {t("distanceAndRadius", {
                distance: Math.round(nearestGeofence.distance),
                radius: Math.round(nearestGeofence.geofence.radius),
              })}
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${statusColor}`} />
              <span className="text-[11px] font-medium">{statusText}</span>
            </div>
          </div>
        ) : (
          <p className="text-[11px]">{t("noMatchingGeofence")}</p>
        )}
      </div>
    </div>
  );
}
