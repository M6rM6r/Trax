"use client";

import { useEffect, useRef, useState } from "react";
import MainLayout from "@/components/shared/MainLayout";
import FullPageHead from "@/components/shared/FullPageHead";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Battery, Wifi, WifiOff } from "lucide-react";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import OSM from "ol/source/OSM";
import { fromLonLat } from "ol/proj";
import { Point, Circle as CircleGeom } from "ol/geom";
import Feature from "ol/Feature";
import { Style, Stroke, Fill, Circle as CircleStyle, Text } from "ol/style";
import "ol/ol.css";
import { mockLiveTracking, mockGeofences } from "@/lib/mockData/trackingMockData";

export default function LiveMapPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<(typeof mockLiveTracking)[0] | null>(
    null
  );

  useEffect(() => {
    if (!mapRef.current) return;

    const vectorSource = new VectorSource();

    // Add geofence circles
    mockGeofences.forEach((geo) => {
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
            fill: new Fill({ color: "#333" }),
            stroke: new Stroke({ color: "#fff", width: 3 }),
          }),
        })
      );
      vectorSource.addFeature(centerFeature);
    });

    // Add employee markers
    mockLiveTracking.forEach((emp) => {
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
            fill: new Fill({ color: "#333" }),
            stroke: new Stroke({ color: "#fff", width: 3 }),
          }),
        })
      );
      vectorSource.addFeature(feature);
    });

    const vectorLayer = new VectorLayer({ source: vectorSource });

    const map = new Map({
      target: mapRef.current,
      layers: [new TileLayer({ source: new OSM() }), vectorLayer],
      view: new View({
        center: fromLonLat([46.6753, 24.7136]),
        zoom: 12,
      }),
    });

    map.on("click", (evt) => {
      let clicked = false;
      map.forEachFeatureAtPixel(evt.pixel, (feature) => {
        const type = feature.get("type");
        if (type === "employee") {
          const empId = feature.get("employeeId");
          const emp = mockLiveTracking.find((e) => e.id === empId);
          if (emp) {
            setSelectedEmployee(emp);
            clicked = true;
          }
        }
      });
      if (!clicked) setSelectedEmployee(null);
    });

    return () => map.setTarget(undefined);
  }, []);

  const statusLabels: Record<string, string> = {
    inside_geofence: "داخل النطاق",
    outside_geofence: "خارج النطاق",
    offline: "غير متصل",
  };

  const statusColors: Record<string, string> = {
    inside_geofence: "text-green-600 bg-green-100",
    outside_geofence: "text-amber-600 bg-amber-100",
    offline: "text-gray-600 bg-gray-100",
  };

  return (
    <MainLayout>
      <div className="p-6 space-y-6 min-h-screen">
        <FullPageHead
          head="تتبع مباشر"
          description="متابعة موظفيك على الخريطة في الوقت الحقيقي"
          Icon={<MapPin className="w-7 h-7" />}
          LeftSection={
            <div className="flex items-center gap-3 text-sm">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-gray-700">داخل النطاق</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-gray-700">خارج النطاق</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-gray-400" />
                <span className="text-gray-700">غير متصل</span>
              </span>
            </div>
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-lg overflow-hidden">
              <div ref={mapRef} className="h-[600px] w-full" />
            </Card>
          </div>

          <div className="space-y-4">
            {selectedEmployee ? (
              <Card className="border-0 shadow-lg">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                      {selectedEmployee.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{selectedEmployee.name}</h3>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[selectedEmployee.status]}`}
                      >
                        {statusLabels[selectedEmployee.status]}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">الموقع:</span>
                      <span className="font-medium text-gray-900">
                        {selectedEmployee.geofenceName || "خارج النطاق"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">آخر ظهور:</span>
                      <span className="font-medium text-gray-900">
                        {new Date(selectedEmployee.lastSeen).toLocaleTimeString("ar-SA", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">البطارية:</span>
                      <span
                        className={`font-medium ${selectedEmployee.battery < 20 ? "text-red-600" : "text-gray-900"}`}
                      >
                        {selectedEmployee.battery}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">خط العرض:</span>
                      <span className="font-medium text-gray-900">
                        {selectedEmployee.lat.toFixed(4)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">خط الطول:</span>
                      <span className="font-medium text-gray-900">
                        {selectedEmployee.lng.toFixed(4)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-0 shadow-lg">
                <CardContent className="pt-6 text-center text-gray-500">
                  <MapPin className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">انقر على موظف على الخريطة لعرض تفاصيله</p>
                </CardContent>
              </Card>
            )}

            <Card className="border-0 shadow-lg">
              <CardContent className="pt-6">
                <h3 className="font-bold text-gray-900 mb-4">الموظفون المتصلون</h3>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {mockLiveTracking.map((emp) => (
                    <div
                      key={emp.id}
                      onClick={() => setSelectedEmployee(emp)}
                      className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-gray-50 cursor-pointer transition-all"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                          {emp.name.charAt(0)}
                        </div>
                        <span className="text-sm font-medium text-gray-900">{emp.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {emp.status === "offline" ? (
                          <WifiOff className="w-4 h-4 text-gray-400" />
                        ) : (
                          <Wifi className="w-4 h-4 text-green-500" />
                        )}
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Battery className="w-3 h-3" />
                          {emp.battery}%
                        </span>
                        <span
                          className={`w-2 h-2 rounded-full ${
                            emp.status === "inside_geofence"
                              ? "bg-green-500"
                              : emp.status === "outside_geofence"
                                ? "bg-amber-500"
                                : "bg-gray-400"
                          }`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
