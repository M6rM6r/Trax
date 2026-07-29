import TileLayer from "ol/layer/Tile";
import XYZ from "ol/source/XYZ";

const imageryAttribution = "Esri, Maxar, Earthstar Geographics";
const streetAttribution = "Esri, HERE, Garmin, USGS, NPS";

/**
 * Hybrid satellite layers: Esri imagery + road/label overlays.
 * Improved with Esri World_Reference for Google Maps-like place labels and POIs.
 */
export function createHybridSatelliteLayers(): TileLayer<XYZ>[] {
  return [
    new TileLayer({
      source: new XYZ({
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        attributions: imageryAttribution,
        maxZoom: 19,
      }),
    }),
    new TileLayer({
      source: new XYZ({
        url: "https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}",
        attributions: imageryAttribution,
        maxZoom: 19,
      }),
      zIndex: 10,
    }),
  ];
}

/**
 * Google Maps-like street map using Esri World_Street_Map.
 * Clean road labeling, place names, and POIs similar to Google Maps.
 */
export function createStreetMapLayers(): TileLayer<XYZ>[] {
  return [
    new TileLayer({
      source: new XYZ({
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
        attributions: streetAttribution,
        maxZoom: 19,
      }),
    }),
  ];
}
