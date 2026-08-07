import TileLayer from "ol/layer/Tile";
import XYZ from "ol/source/XYZ";
import OSM from "ol/source/OSM";

const imageryAttribution = "Esri, Maxar, Earthstar Geographics";
const streetAttribution = "Esri, HERE, Garmin, USGS, NPS";

function esriXyz(url: string, attributions: string) {
  return new XYZ({
    url,
    attributions,
    maxZoom: 19,
    crossOrigin: "anonymous",
    transition: 0,
    wrapX: true,
  });
}

export function createHybridSatelliteLayers(): TileLayer[] {
  return [
    new TileLayer({
      source: esriXyz(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        imageryAttribution
      ),
      preload: 2,
    }),
    new TileLayer({
      source: esriXyz(
        "https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}",
        imageryAttribution
      ),
      zIndex: 10,
      preload: 1,
    }),
  ];
}

export function createStreetMapLayers(): TileLayer[] {
  return [
    new TileLayer({
      source: new OSM({
        crossOrigin: "anonymous",
        transition: 0,
      }),
      preload: 1,
      opacity: 1,
      zIndex: 0,
    }),
    new TileLayer({
      source: esriXyz(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
        streetAttribution
      ),
      preload: 2,
      zIndex: 1,
    }),
  ];
}
