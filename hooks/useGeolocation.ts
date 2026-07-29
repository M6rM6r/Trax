"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import type { Geofence } from "@/lib/types/trackingTypes";
import { calculateDistance, GEOFENCE_DISTANCE_BUFFER_METERS } from "@/lib/utils/geo";

export const LOCATION_ACCURACY_THRESHOLD_METERS = 100;
export const LOCATION_DEBOUNCE_MS = 500;
export const LOCATION_TIMEOUT_MS = 15000;
export const POSITION_MAX_AGE_MS = 30000;

export type GeolocationPermission = "prompt" | "granted" | "denied" | "unknown";

export interface GeolocationState {
  position: { lat: number; lng: number; accuracy: number } | null;
  nearestGeofence: { geofence: Geofence; distance: number } | null;
  isWithinRange: boolean;
  isLocating: boolean;
  error: GeolocationPositionError | null;
  permission: GeolocationPermission;
}

interface UseGeolocationOptions {
  geofences: Geofence[];
  bufferMeters?: number;
  accuracyThreshold?: number;
  enabled?: boolean;
}

function findNearestGeofence(
  lat: number,
  lng: number,
  geofences: Geofence[]
): { geofence: Geofence; distance: number } | null {
  let closest: { geofence: Geofence; distance: number } | null = null;
  for (const geo of geofences) {
    const dist = calculateDistance(lat, lng, geo.lat, geo.lng);
    if (!closest || dist < closest.distance) {
      closest = { geofence: geo, distance: dist };
    }
  }
  return closest;
}

function isWithinAnyGeofence(
  lat: number,
  lng: number,
  geofences: Geofence[],
  bufferMeters: number
): { nearestGeofence: { geofence: Geofence; distance: number } | null; isWithinRange: boolean } {
  let closest: { geofence: Geofence; distance: number } | null = null;
  let withinRange = false;
  for (const geo of geofences) {
    const dist = calculateDistance(lat, lng, geo.lat, geo.lng);
    if (!closest || dist < closest.distance) {
      closest = { geofence: geo, distance: dist };
    }
    if (dist <= geo.radius + bufferMeters) {
      withinRange = true;
    }
  }
  return { nearestGeofence: closest, isWithinRange: withinRange };
}

export function useGeolocation(options: UseGeolocationOptions): GeolocationState {
  const {
    geofences,
    bufferMeters = GEOFENCE_DISTANCE_BUFFER_METERS,
    accuracyThreshold = LOCATION_ACCURACY_THRESHOLD_METERS,
    enabled = true,
  } = options;

  const [position, setPosition] = useState<{ lat: number; lng: number; accuracy: number } | null>(
    null
  );
  const [nearestGeofence, setNearestGeofence] = useState<{
    geofence: Geofence;
    distance: number;
  } | null>(null);
  const [isWithinRange, setIsWithinRange] = useState(false);
  const [isLocating, setIsLocating] = useState(true);
  const [error, setError] = useState<GeolocationPositionError | null>(null);
  const [permission, setPermission] = useState<GeolocationPermission>("unknown");

  const pendingPositionRef = useRef<GeolocationPosition | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const locatingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updatePosition = useCallback(
    (pos: GeolocationPosition) => {
      const { latitude, longitude, accuracy } = pos.coords;

      // Ignore low-accuracy positions unless we have nothing yet
      if (accuracy > accuracyThreshold && position) {
        return;
      }

      const newPosition = { lat: latitude, lng: longitude, accuracy };
      setPosition(newPosition);
      setIsLocating(false);

      if (locatingTimerRef.current) {
        clearTimeout(locatingTimerRef.current);
        locatingTimerRef.current = null;
      }

      if (geofences.length === 0) {
        setNearestGeofence(null);
        setIsWithinRange(true);
        return;
      }

      const { nearestGeofence: nearest, isWithinRange: within } = isWithinAnyGeofence(
        latitude,
        longitude,
        geofences,
        bufferMeters
      );
      setNearestGeofence(nearest);
      setIsWithinRange(within);
    },
    [accuracyThreshold, bufferMeters, geofences, position]
  );

  const handlePosition = useCallback(
    (pos: GeolocationPosition) => {
      pendingPositionRef.current = pos;

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Immediate update for first position or high accuracy jump; debounce subsequent noisy updates
      const isFirst = !position;
      const delay = isFirst ? 0 : LOCATION_DEBOUNCE_MS;

      debounceTimerRef.current = setTimeout(() => {
        if (pendingPositionRef.current) {
          updatePosition(pendingPositionRef.current);
          pendingPositionRef.current = null;
        }
      }, delay);
    },
    [position, updatePosition]
  );

  const handleError = useCallback((err: GeolocationPositionError) => {
    console.warn("[geolocation] error:", err.code, err.message);
    setError(err);
    setIsLocating(false);
    if (err.code === GeolocationPositionError.PERMISSION_DENIED) {
      setPermission("denied");
    }
  }, []);

  useEffect(() => {
    if (!enabled || typeof navigator === "undefined" || !navigator.geolocation) {
      setIsLocating(false);
      if (!navigator.geolocation) {
        setError({ code: 2, message: "Geolocation not supported" } as GeolocationPositionError);
      }
      return;
    }

    let watchId = 0;
    const fallbackId = 0;

    const startWatch = () => {
      setIsLocating(true);
      setError(null);
      watchId = navigator.geolocation.watchPosition(handlePosition, handleError, {
        enableHighAccuracy: true,
        timeout: LOCATION_TIMEOUT_MS,
        maximumAge: POSITION_MAX_AGE_MS,
      });
      locatingTimerRef.current = setTimeout(() => setIsLocating(false), LOCATION_TIMEOUT_MS);
    };

    if (navigator.permissions?.query) {
      navigator.permissions
        .query({ name: "geolocation" })
        .then((result) => {
          setPermission(result.state as GeolocationPermission);
          if (result.state === "denied") {
            setError({ code: 1, message: "Permission denied" } as GeolocationPositionError);
            setIsLocating(false);
          } else {
            startWatch();
          }
        })
        .catch(() => startWatch());
    } else {
      startWatch();
    }

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
      if (fallbackId) window.clearTimeout(fallbackId);
      if (locatingTimerRef.current) clearTimeout(locatingTimerRef.current);
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [enabled, handlePosition, handleError]);

  return useMemo(
    () => ({
      position,
      nearestGeofence,
      isWithinRange,
      isLocating,
      error,
      permission,
    }),
    [position, nearestGeofence, isWithinRange, isLocating, error, permission]
  );
}

export { findNearestGeofence, isWithinAnyGeofence };
