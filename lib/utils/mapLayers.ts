import TileLayer from "ol/layer/Tile";
import XYZ from "ol/source/XYZ";

const imageryAttribution = "Esri, Maxar, Earthstar Geographics";

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
    new TileLayer({
      source: new XYZ({
        url: "https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
        attributions: imageryAttribution,
        maxZoom: 19,
      }),
      zIndex: 11,
    }),
  ];
}
