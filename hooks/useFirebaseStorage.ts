"use client";

import { useState, useCallback } from "react";
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { isFirebaseConfigured, storage } from "@/lib/config/firebase";

export type UploadFolder = "avatars" | "company-logos" | "documents" | "attachments";

export interface UploadResult {
  url: string;
  path: string;
}

interface UseFirebaseStorageReturn {
  upload: (file: File, folder: UploadFolder, fileName?: string) => Promise<UploadResult>;
  remove: (path: string) => Promise<void>;
  progress: number;
  uploading: boolean;
  error: string | null;
}

export function useFirebaseStorage(): UseFirebaseStorageReturn {
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(
    (file: File, folder: UploadFolder, fileName?: string): Promise<UploadResult> => {
      return new Promise((resolve, reject) => {
        if (!isFirebaseConfigured || !storage) {
          const configError = new Error(
            "Firebase is not configured. Add NEXT_PUBLIC_FIREBASE_* variables to enable uploads."
          );
          setError(configError.message);
          reject(configError);
          return;
        }

        setUploading(true);
        setProgress(0);
        setError(null);

        const ext = file.name.split(".").pop() ?? "jpg";
        const name = fileName ?? `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const path = `trax/${folder}/${name}`;
        const storageRef = ref(storage, path);

        const task = uploadBytesResumable(storageRef, file, {
          contentType: file.type,
        });

        task.on(
          "state_changed",
          (snap) => {
            const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
            setProgress(pct);
          },
          (err) => {
            setUploading(false);
            setError(err.message);
            reject(err);
          },
          async () => {
            try {
              const url = await getDownloadURL(task.snapshot.ref);
              setUploading(false);
              setProgress(100);
              resolve({ url, path });
            } catch (err) {
              setUploading(false);
              reject(err);
            }
          }
        );
      });
    },
    []
  );

  const remove = useCallback(async (path: string): Promise<void> => {
    if (!isFirebaseConfigured || !storage) {
      throw new Error(
        "Firebase is not configured. Add NEXT_PUBLIC_FIREBASE_* variables to enable file deletion."
      );
    }

    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
  }, []);

  return { upload, remove, progress, uploading, error };
}
