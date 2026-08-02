"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import type { Geofence } from "@/lib/types/trackingTypes";
import { calculateDistance, GEOFENCE_DISTANCE_BUFFER_METERS } from "@/lib/utils/geo";

export const LOCATION_ACCURACY_THRESHOLD_METERS = 100;
export const LOCATION_DEBOUNCE_MS = 500;
export const LOCATION_TIMEOUT_MS = 15000;
export const POSITION_MAX_AGE_MS = 0; // force a fresh fix; don't reuse cached positions

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

function normalizeAccuracy(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
    return value;
  }
  return LOCATION_ACCURACY_THRESHOLD_METERS;
}

function isWithinAnyGeofence(
  lat: number,
  lng: number,
  geofences: Geofence[],
  bufferMeters: number,
  gpsAccuracy: number = LOCATION_ACCURACY_THRESHOLD_METERS
): { nearestGeofence: { geofence: Geofence; distance: number } | null; isWithinRange: boolean } {
  const accuracy = normalizeAccuracy(gpsAccuracy);
  let closestOverall: { geofence: Geofence; distance: number } | null = null;
  let closestWithin: { geofence: Geofence; distance: number } | null = null;
  for (const geo of geofences) {
    const dist = calculateDistance(lat, lng, geo.lat, geo.lng);
    if (!closestOverall || dist < closestOverall.distance) {
      closestOverall = { geofence: geo, distance: dist };
    }
    if (dist <= geo.radius + bufferMeters + accuracy) {
      if (!closestWithin || dist < closestWithin.distance) {
        closestWithin = { geofence: geo, distance: dist };
      }
    }
  }
  return {
    nearestGeofence: closestWithin ?? closestOverall,
    isWithinRange: closestWithin !== null,
  };
}

export function useGeolocation(options: UseGeolocationOptions): GeolocationState {
  const { geofences, bufferMeters = GEOFENCE_DISTANCE_BUFFER_METERS, enabled = true } = options;

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
  const hasPositionRef = useRef(false);
  const positionRef = useRef<{ lat: number; lng: number; accuracy: number } | null>(null);
  const geofencesRef = useRef(geofences);
  const bufferMetersRef = useRef(bufferMeters);

  useEffect(() => {
    geofencesRef.current = geofences;
  }, [geofences]);
  useEffect(() => {
    bufferMetersRef.current = bufferMeters;
  }, [bufferMeters]);

  const updatePosition = useCallback((pos: GeolocationPosition) => {
    const { latitude, longitude } = pos.coords;
    const accuracy = normalizeAccuracy(pos.coords.accuracy);

    const newPosition = { lat: latitude, lng: longitude, accuracy };
    positionRef.current = newPosition;
    setPosition(newPosition);
    hasPositionRef.current = true;
    setIsLocating(false);
    setError(null);

    if (locatingTimerRef.current) {
      clearTimeout(locatingTimerRef.current);
      locatingTimerRef.current = null;
    }

    if (geofencesRef.current.length === 0) {
      setNearestGeofence(null);
      setIsWithinRange(true);
      return;
    }

    const { nearestGeofence: nearest, isWithinRange: within } = isWithinAnyGeofence(
      latitude,
      longitude,
      geofencesRef.current,
      bufferMetersRef.current,
      accuracy
    );
    setNearestGeofence(nearest);
    setIsWithinRange(within);
  }, []);

  const handlePosition = useCallback(
    (pos: GeolocationPosition) => {
      pendingPositionRef.current = pos;

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // First fix updates immediately; subsequent fixes are debounced to avoid jitter
      const isFirst = !hasPositionRef.current;
      const delay = isFirst ? 0 : LOCATION_DEBOUNCE_MS;

      debounceTimerRef.current = setTimeout(() => {
        if (pendingPositionRef.current) {
          updatePosition(pendingPositionRef.current);
          pendingPositionRef.current = null;
        }
      }, delay);
    },
    [updatePosition]
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

    const quickFix = () => {
      navigator.geolocation.getCurrentPosition(handlePosition, handleError, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: POSITION_MAX_AGE_MS,
      });
    };

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
            quickFix();
            startWatch();
          }
        })
        .catch(() => {
          quickFix();
          startWatch();
        });
    } else {
      quickFix();
      startWatch();
    }

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
      if (locatingTimerRef.current) clearTimeout(locatingTimerRef.current);
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [enabled, handlePosition, handleError]);

  // Recompute geofence match when the geofence list or thresholds change
  useEffect(() => {
    if (!position) return;
    if (geofences.length === 0) {
      setNearestGeofence(null);
      setIsWithinRange(true);
      return;
    }
    const { nearestGeofence: nearest, isWithinRange: within } = isWithinAnyGeofence(
      position.lat,
      position.lng,
      geofences,
      bufferMeters,
      position.accuracy
    );
    setNearestGeofence(nearest);
    setIsWithinRange(within);
  }, [position, geofences, bufferMeters]);

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
