"use client";

import { useEffect, useRef, useState } from "react";
import Map from "ol/Map";
import View from "ol/View";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { createStreetMapLayers } from "@/lib/utils/mapLayers";
import { fromLonLat, toLonLat } from "ol/proj";
import { Point, LineString, Polygon } from "ol/geom";
import Feature from "ol/Feature";
import { Style, Stroke, Fill, Circle } from "ol/style";
import "ol/ol.css";
import { Modify, Snap } from "ol/interaction";
import { Button } from "@/components/ui/button";
import { FormikProps } from "formik";
import { MAP_THEME } from "@/lib/utils/mapTheme";
import { useTranslations } from "next-intl";

interface MapPoint {
  id: string;
  lon: number;
  lat: number;
}

interface Shape {
  id: string;
  type: "line" | "polygon";
  coordinates: [number, number][];
  points: MapPoint[];
}

export default function OLMap({
  name,
  formikProps,
}: {
  name: string;
  formikProps: FormikProps<Record<string, unknown>>;
}) {
  const t = useTranslations("Geofences");
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<Map | null>(null);
  const [currentShape, setCurrentShape] = useState<Shape | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [mousePosition, setMousePosition] = useState<[number, number] | null>(null);
  const [showSaveButton, setShowSaveButton] = useState(false);
  const vectorSourceRef = useRef<VectorSource | null>(null);
  const modifyRef = useRef<Modify | null>(null);
  const snapRef = useRef<Snap | null>(null);

  // Style for points
  const getPointStyle = (index: number) => {
    return new Style({
      image: new Circle({
        radius: 6,
        fill: new Fill({
          color: index === 0 ? MAP_THEME.primary : MAP_THEME.secondary,
        }),
        stroke: new Stroke({
          color: MAP_THEME.contrastStroke,
          width: 2,
        }),
      }),
    });
  };

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) return;

    const initialMap = new Map({
      target: mapRef.current,
      layers: [...createStreetMapLayers()],
      view: new View({
        center: fromLonLat([46.6753, 24.7136]),
        zoom: 13,
      }),
    });

    // Create a vector source and layer for features
    const vectorSource = new VectorSource();
    vectorSourceRef.current = vectorSource;

    const vectorLayer = new VectorLayer({
      source: vectorSource,
    });

    initialMap.addLayer(vectorLayer);

    // Add modify interaction
    const modify = new Modify({
      source: vectorSource,
      style: new Style({
        image: new Circle({
          radius: 7,
          fill: new Fill({
            color: "rgba(255, 255, 255, 0.4)",
          }),
          stroke: new Stroke({
            color: MAP_THEME.secondary,
            width: 2,
          }),
        }),
      }),
    });
    modifyRef.current = modify;
    initialMap.addInteraction(modify);

    // Add snap interaction
    const snap = new Snap({
      source: vectorSource,
      pixelTolerance: 20,
      vertex: true,
      edge: true,
    });
    snapRef.current = snap;
    initialMap.addInteraction(snap);

    // Track mouse position
    initialMap.on("pointermove", (evt) => {
      if (evt.coordinate) {
        const lonLat = toLonLat(evt.coordinate);
        setMousePosition([lonLat[0], lonLat[1]]);
      }
    });

    // Start drawing on first click
    initialMap.on("click", (evt) => {
      if (!currentShape && !isDrawing) {
        const lonLat = toLonLat(evt.coordinate);
        const newPoint: MapPoint = {
          id: Date.now().toString(),
          lon: lonLat[0],
          lat: lonLat[1],
        };

        setCurrentShape({
          id: Date.now().toString(),
          type: "line",
          coordinates: [[lonLat[0], lonLat[1]]],
          points: [newPoint],
        });
        setIsDrawing(true);
      }
    });

    setMap(initialMap);

    return () => initialMap.setTarget(undefined);
  }, [currentShape, isDrawing]);

  // Update features layer
  useEffect(() => {
    if (!map || !vectorSourceRef.current) return;

    // Clear existing features
    vectorSourceRef.current.clear();

    // Add current shape features if exists
    if (currentShape) {
      // Add points
      currentShape.points.forEach((point, index) => {
        const feature = new Feature({
          geometry: new Point(fromLonLat([point.lon, point.lat])),
          type: "point",
          id: point.id,
          isFirstPoint: index === 0,
        });

        feature.setStyle(getPointStyle(index));
        vectorSourceRef.current?.addFeature(feature);
      });

      // Add shape (line or polygon)
      let geometry;
      if (currentShape.type === "line") {
        geometry = new LineString(currentShape.coordinates.map((coord) => fromLonLat(coord)));
      } else {
        geometry = new Polygon([currentShape.coordinates.map((coord) => fromLonLat(coord))]);
      }

      const shapeFeature = new Feature({
        geometry,
        type: currentShape.type,
        id: currentShape.id,
      });

      shapeFeature.setStyle(
        new Style({
          stroke: new Stroke({
            color: currentShape.type === "line" ? "blue" : "green",
            width: 2,
          }),
          fill:
            currentShape.type === "polygon"
              ? new Fill({
                  color: "rgba(0, 255, 0, 0.2)",
                })
              : undefined,
        })
      );

      vectorSourceRef.current?.addFeature(shapeFeature);
    }

    // Add preview line if drawing
    if (isDrawing && currentShape && mousePosition && currentShape.coordinates.length > 0) {
      const previewLine = new Feature({
        geometry: new LineString([
          fromLonLat(currentShape.coordinates[currentShape.coordinates.length - 1]),
          fromLonLat(mousePosition),
        ]),
        type: "preview-line",
      });

      previewLine.setStyle(
        new Style({
          stroke: new Stroke({
            color: "rgba(255, 165, 0, 0.7)",
            width: 2,
            lineDash: [5, 5],
          }),
        })
      );

      vectorSourceRef.current?.addFeature(previewLine);
    }
  }, [map, currentShape, isDrawing, mousePosition]);

  // Handle map clicks for drawing
  useEffect(() => {
    if (!map || !isDrawing || !mousePosition || !currentShape) return;

    const clickHandler = (evt: { coordinate: number[] }) => {
      const lonLat = toLonLat(evt.coordinate);

      // Check if we're clicking near the first point to close the shape
      if (currentShape.coordinates.length > 2) {
        const firstPoint = currentShape.coordinates[0];
        const distance = Math.sqrt(
          Math.pow(firstPoint[0] - lonLat[0], 2) + Math.pow(firstPoint[1] - lonLat[1], 2)
        );

        if (distance < 0.0005) {
          // Close the polygon
          setCurrentShape({
            ...currentShape,
            type: "polygon",
            coordinates: [...currentShape.coordinates, currentShape.coordinates[0]],
          });
          setIsDrawing(false);
          setShowSaveButton(true);
          return;
        }
      }

      // Add new point to existing shape
      const newPoint: MapPoint = {
        id: Date.now().toString(),
        lon: lonLat[0],
        lat: lonLat[1],
      };

      setCurrentShape({
        ...currentShape,
        coordinates: [...currentShape.coordinates, [lonLat[0], lonLat[1]]],
        points: [...currentShape.points, newPoint],
      });
    };

    map.on("click", clickHandler);

    return () => {
      map.un("click", clickHandler);
    };
  }, [map, isDrawing, currentShape, mousePosition]);

  const clearCurrentShape = () => {
    setCurrentShape(null);
    setIsDrawing(false);
    setShowSaveButton(false);
  };

  const saveShape = () => {
    if (currentShape) {
      // Get all coordinates except the last one (closing point)
      const coords =
        currentShape.type === "polygon"
          ? currentShape.coordinates.slice(0, -1)
          : currentShape.coordinates;

      const formattedCoordinates = coords.map((coord) => `(${coord[1]}, ${coord[0]})`).join(",");

      // alert(`Shape saved with coordinates: ${formattedCoordinates}`);
      formikProps.setFieldValue(name, formattedCoordinates);
      setShowSaveButton(false);
    }
  };

  return (
    <div className="relative h-[500px] w-full">
      <div
        ref={mapRef}
        dir="ltr"
        className="h-full w-full [&_.ol-viewport]:!h-full [&_.ol-viewport]:!w-full"
      />

      <div className=" flex gap-5 mt-5">
        {currentShape && (
          <Button variant={"primary"} onClick={clearCurrentShape} type="button">
            {t("deleteShape")}
          </Button>
        )}

        {(showSaveButton || currentShape?.type === "polygon") && (
          <Button variant={"primary"} onClick={saveShape} type="button">
            {t("saveShape")}
          </Button>
        )}
      </div>
    </div>
  );
}
