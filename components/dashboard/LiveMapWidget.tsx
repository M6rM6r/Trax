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
      layers: [...createHybridSatelliteLayers(), new VectorLayer({ source: vectorSource })],
      view: new View({
        center: initialCenter,
        zoom: initialGeofence ? 14 : 12,
      }),
    });

    mapInstanceRef.current = map;

    return () => {
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

      const circle = new Feature({
        geometry: new CircleGeom(center, geo.radius),
        type: "geofence",
      });
      circle.setStyle(
        new Style({
          stroke: new Stroke({ color: geo.color, width: 2 }),
          fill: new Fill({ color: `${geo.color}20` }),
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
            fill: new Fill({ color: geo.color }),
            stroke: new Stroke({ color: MAP_THEME.contrastStroke, width: 2 }),
          }),
          text: new Text({
            text: geo.name,
            offsetY: -12,
            font: "bold 10px sans-serif",
            fill: new Fill({ color: MAP_THEME.surface }),
            stroke: new Stroke({ color: MAP_THEME.contrastStroke, width: 2 }),
          }),
        })
      );
      vectorSource.addFeature(centerPoint);
    });

    liveTracking.forEach((emp) => {
      if (emp.lat === null || emp.lat === undefined || emp.lng === null || emp.lng === undefined)
        return;
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
            text: emp.name,
            offsetY: -14,
            font: "bold 10px sans-serif",
            fill: new Fill({ color: MAP_THEME.surface }),
            stroke: new Stroke({ color: MAP_THEME.contrastStroke, width: 2 }),
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
  }, [geofences, liveTracking]);

  return (
    <div className="relative rounded-xl overflow-hidden border border-border/50 bg-card h-[300px]">
      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
}
