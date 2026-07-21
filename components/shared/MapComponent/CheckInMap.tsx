"use client";

import { useEffect, useRef } from "react";
import { Crosshair, Maximize } from "lucide-react";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import XYZ from "ol/source/XYZ";
import { fromLonLat } from "ol/proj";
import { Point, Circle as CircleGeom } from "ol/geom";
import Feature from "ol/Feature";
import { Style, Stroke, Fill, Circle as CircleStyle, Text } from "ol/style";
import "ol/ol.css";
import type { Geofence } from "@/lib/types/trackingTypes";

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
        new TileLayer({
          source: new XYZ({
            url: "https://{a-c}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
            attributions:
              '© <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors, © CARTO',
            maxZoom: 19,
          }),
        }),
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
      const color = geo.color || (isNearest ? "#10b981" : "#6366f1");

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
            stroke: new Stroke({ color: "#fff", width: 2 }),
          }),
          text: new Text({
            text: geo.name,
            offsetY: -18,
            font: "bold 12px sans-serif",
            fill: new Fill({ color: "#e2e8f0" }),
            stroke: new Stroke({ color: "#0f172a", width: 3 }),
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
            fill: new Fill({ color: "#22c55e" }),
            stroke: new Stroke({ color: "#fff", width: 3 }),
          }),
          text: new Text({
            text: "أنت هنا",
            offsetY: -22,
            font: "bold 12px sans-serif",
            fill: new Fill({ color: "#22c55e" }),
            stroke: new Stroke({ color: "#0f172a", width: 3 }),
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
  }, [geofences, currentLocation, nearestGeofence]);

  const statusText = isWithinRange ? "داخل النطاق" : "خارج النطاق";
  const statusColor = isWithinRange ? "bg-emerald-500" : "bg-amber-500";

  return (
    <div className={`relative w-full overflow-hidden rounded-xl ${className}`}>
      <div ref={mapRef} className="absolute inset-0" />

      {/* Map controls */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-2">
        <button
          type="button"
          onClick={recenterOnUser}
          disabled={!currentLocation}
          className="p-2 rounded-lg bg-slate-800/80 text-white shadow-md backdrop-blur-sm hover:bg-slate-700/90 disabled:opacity-40 transition-colors"
          title="توسيط على موقعي"
          aria-label="توسيط على موقعي"
        >
          <Crosshair className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={fitToAll}
          className="p-2 rounded-lg bg-slate-800/80 text-white shadow-md backdrop-blur-sm hover:bg-slate-700/90 transition-colors"
          title="عرض الكل"
          aria-label="عرض الكل"
        >
          <Maximize className="w-4 h-4" />
        </button>
      </div>

      {/* Location / geofence info */}
      <div className="absolute bottom-3 left-3 z-10 max-w-[85%] rounded-xl bg-slate-900/80 p-3 text-white shadow-lg backdrop-blur-sm">
        {loading ? (
          <p className="text-[11px]">جاري تحميل النطاقات الجغرافية...</p>
        ) : geofences.length === 0 ? (
          <p className="text-[11px]">لم يتم إعداد نطاق جغرافي بعد.</p>
        ) : !currentLocation ? (
          <p className="text-[11px]">جاري تحديد موقعك...</p>
        ) : nearestGeofence ? (
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{
                  backgroundColor:
                    nearestGeofence.geofence.color || (isWithinRange ? "#10b981" : "#6366f1"),
                }}
              />
              <span className="text-xs font-bold truncate">{nearestGeofence.geofence.name}</span>
            </div>
            <div className="text-[11px] text-slate-300">
              المسافة: {Math.round(nearestGeofence.distance)}م · نصف القطر:{" "}
              {Math.round(nearestGeofence.geofence.radius)}م
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${statusColor}`} />
              <span className="text-[11px] font-medium">{statusText}</span>
            </div>
          </div>
        ) : (
          <p className="text-[11px]">لا يوجد نطاق جغرافي مطابق.</p>
        )}
      </div>
    </div>
  );
}
