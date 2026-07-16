"use client";

import { useEffect, useRef } from "react";
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
  className?: string;
}

export default function CheckInMap({
  geofences,
  currentLocation,
  nearestGeofence,
  className = "",
}: CheckInMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Map | null>(null);
  const vectorSourceRef = useRef<VectorSource | null>(null);

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
          extent[i] = i < 2 ? Math.min(extent[i], circleExtent[i]) : Math.max(extent[i], circleExtent[i]);
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
          extent[i] = i < 2 ? Math.min(extent[i], pointExtent[i]) : Math.max(extent[i], pointExtent[i]);
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

  return <div ref={mapRef} className={`w-full rounded-xl ${className}`} />;
}
