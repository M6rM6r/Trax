"use client";

import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import { useEffect, useState } from "react";

interface TraxDB extends DBSchema {
  attendance: {
    key: string;
    value: {
      id: string;
      employeeId: number;
      date: string;
      checkInTime: string | null;
      checkOutTime: string | null;
      status: string;
      synced: boolean;
    };
  };
  employees: {
    key: number;
    value: {
      id: number;
      name: string;
      email: string;
      status: string;
    };
  };
}

let dbInstance: IDBPDatabase<TraxDB> | null = null;

async function getDB(): Promise<IDBPDatabase<TraxDB>> {
  if (dbInstance) return dbInstance;
  dbInstance = await openDB<TraxDB>("trax-db", 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("attendance")) {
        db.createObjectStore("attendance", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("employees")) {
        db.createObjectStore("employees", { keyPath: "id" });
      }
    },
  });
  return dbInstance;
}

export async function cacheAttendance(record: TraxDB["attendance"]["value"]) {
  const db = await getDB();
  await db.put("attendance", record);
}

export async function getCachedAttendance(): Promise<TraxDB["attendance"]["value"][]> {
  const db = await getDB();
  return db.getAll("attendance");
}

export async function cacheEmployees(employees: TraxDB["employees"]["value"][]) {
  const db = await getDB();
  const tx = db.transaction("employees", "readwrite");
  await Promise.all(employees.map((e) => tx.store.put(e)));
  await tx.done;
}

export async function getCachedEmployees(): Promise<TraxDB["employees"]["value"][]> {
  const db = await getDB();
  return db.getAll("employees");
}

export async function getUnsyncedAttendance(): Promise<TraxDB["attendance"]["value"][]> {
  const db = await getDB();
  const all = await db.getAll("attendance");
  return all.filter((r) => !r.synced);
}

export async function markSynced(id: string) {
  const db = await getDB();
  const record = await db.get("attendance", id);
  if (record) {
    record.synced = true;
    await db.put("attendance", record);
  }
}

export function useIndexedDB() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    getDB().then(() => setIsReady(true));
  }, []);

  return { isReady, cacheAttendance, getCachedAttendance, cacheEmployees, getCachedEmployees };
}
