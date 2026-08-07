"use client";

import { useEffect, useRef } from "react";
import Map from "ol/Map";
import View from "ol/View";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { fromLonLat } from "ol/proj";
import { createHybridSatelliteLayers } from "@/lib/utils/mapLayers";
import type { Coordinate } from "ol/coordinate";
import { Point, Circle as CircleGeom } from "ol/geom";
import Feature from "ol/Feature";
import { Style, Stroke, Fill, Circle as CircleStyle, Text } from "ol/style";
import { boundingExtent, buffer } from "ol/extent";
import "ol/ol.css";
import type { LiveTrackingEmployee, Geofence } from "@/lib/types/trackingTypes";
import { MAP_THEME } from "@/lib/utils/mapTheme";

interface LiveMapWidgetProps {
  liveTracking: LiveTrackingEmployee[];
  geofences: Geofence[];
}

/**
 * Dashboard map strip. OpenLayers must run in LTR containers and call updateSize()
 * after layout — otherwise RTL pages show a thin leftover tile column + blank map.
 */
export default function LiveMapWidget({ liveTracking, geofences }: LiveMapWidgetProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Map | null>(null);
  const vectorSourceRef = useRef<VectorSource | null>(null);
  const initialGeofenceRef = useRef<Geofence | undefined>(geofences[0]);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const vectorSource = new VectorSource();
    vectorSourceRef.current = vectorSource;

    const initialGeofence = initialGeofenceRef.current;
    const initialCenter = initialGeofence
      ? fromLonLat([initialGeofence.lng, initialGeofence.lat])
      : fromLonLat([46.6753, 24.7136]);

    const map = new Map({
      target: mapRef.current,
      layers: [
        ...createHybridSatelliteLayers(),
        new VectorLayer({ source: vectorSource, zIndex: 20 }),
      ],
      view: new View({
        center: initialCenter,
        zoom: initialGeofence ? 14 : 12,
        // Keep pan/zoom stable on mobile browsers
        constrainResolution: true,
      }),
      controls: [],
    });

    mapInstanceRef.current = map;

    const refreshSize = () => {
      map.updateSize();
    };

    // Layout settles after paint / fonts / sidebar
    requestAnimationFrame(refreshSize);
    const t1 = window.setTimeout(refreshSize, 100);
    const t2 = window.setTimeout(refreshSize, 400);
    const t3 = window.setTimeout(refreshSize, 1000);

    const ro =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => {
            refreshSize();
          })
        : null;
    if (mapRef.current && ro) ro.observe(mapRef.current);

    window.addEventListener("resize", refreshSize);
    window.addEventListener("orientationchange", refreshSize);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
      ro?.disconnect();
      window.removeEventListener("resize", refreshSize);
      window.removeEventListener("orientationchange", refreshSize);
      map.setTarget(undefined);
      mapInstanceRef.current = null;
      vectorSourceRef.current = null;
    };
  }, []);

  useEffect(() => {
    const vectorSource = vectorSourceRef.current;
    if (!vectorSource) return;

    vectorSource.clear();
    const extentCoords: Coordinate[] = [];

    geofences.forEach((geo) => {
      const center = fromLonLat([geo.lng, geo.lat]);
      extentCoords.push(center);

      // CircleGeom radius is in projection units (m in Web Mercator — good enough for SA)
      const circle = new Feature({
        geometry: new CircleGeom(center, Math.max(50, Number(geo.radius) || 100)),
        type: "geofence",
      });
      circle.setStyle(
        new Style({
          stroke: new Stroke({ color: geo.color || MAP_THEME.employeeMarker, width: 2 }),
          fill: new Fill({ color: `${geo.color || MAP_THEME.employeeMarker}33` }),
        })
      );
      vectorSource.addFeature(circle);

      const centerPoint = new Feature({
        geometry: new Point(center),
        type: "geofence-center",
      });
      centerPoint.setStyle(
        new Style({
          image: new CircleStyle({
            radius: 4,
            fill: new Fill({ color: geo.color || MAP_THEME.employeeMarker }),
            stroke: new Stroke({ color: MAP_THEME.contrastStroke, width: 2 }),
          }),
          text: new Text({
            text: geo.name || "",
            offsetY: -12,
            font: "bold 11px system-ui, sans-serif",
            fill: new Fill({ color: MAP_THEME.surface }),
            stroke: new Stroke({ color: MAP_THEME.contrastStroke, width: 3 }),
          }),
        })
      );
      vectorSource.addFeature(centerPoint);
    });

    liveTracking.forEach((emp) => {
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
            radius: 7,
            fill: new Fill({ color }),
            stroke: new Stroke({ color: MAP_THEME.contrastStroke, width: 2 }),
          }),
          text: new Text({
            text: emp.name || "",
            offsetY: -14,
            font: "bold 11px system-ui, sans-serif",
            fill: new Fill({ color: MAP_THEME.surface }),
            stroke: new Stroke({ color: MAP_THEME.contrastStroke, width: 3 }),
          }),
        })
      );
      vectorSource.addFeature(feature);
    });

    const map = mapInstanceRef.current;
    if (map && extentCoords.length >= 1) {
      map.updateSize();
      const extent = boundingExtent(extentCoords);
      map.getView().fit(buffer(extent, 2500), {
        duration: 400,
        padding: [24, 24, 24, 24],
        maxZoom: 15,
      });
    } else if (map) {
      map.updateSize();
    }
  }, [geofences, liveTracking]);

  return (
    <div className="relative h-[220px] overflow-hidden rounded-xl border border-border/50 bg-card sm:h-[280px] lg:h-[320px]">
      {/* Force LTR so OL viewport/canvas width matches container under Arabic dir=rtl */}
      <div
        ref={mapRef}
        dir="ltr"
        className="absolute inset-0 h-full w-full touch-pan-y [&_.ol-viewport]:!h-full [&_.ol-viewport]:!w-full [&_.ol-layer]:!w-full"
        aria-label="Live map"
      />
      <div className="pointer-events-none absolute bottom-2 start-2 z-10 rounded-md bg-background/80 px-2 py-1 text-[10px] text-muted-foreground backdrop-blur-sm">
        Esri
      </div>
    </div>
  );
}
