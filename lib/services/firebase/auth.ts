import { collection, doc, getDoc, getDocs, limit, query, where } from "firebase/firestore";
import { requireDb } from "./helpers";

export async function getFirebaseUserProfile(uid: string, email: string) {
  const database = requireDb();
  const direct = await getDoc(doc(database, "users", uid));
  if (direct.exists()) return direct.data();

  const normalizedEmail = String(email ?? "")
    .trim()
    .toLowerCase();
  if (normalizedEmail) {
    const byEmail = await getDocs(
      query(collection(database, "users"), where("email", "==", normalizedEmail), limit(1))
    );
    if (!byEmail.empty) return byEmail.docs[0].data();
  }

  return null;
}

export async function getFirebaseUserProfileFromApi(idToken: string) {
  if (!idToken || typeof window === "undefined") return null;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
  try {
    const response = await fetch(`${apiUrl.replace(/\/$/, "")}/auth/firebase`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_token: idToken }),
    });

    if (!response.ok) return null;
    const payload = await response.json();
    if (!payload?.success || !payload?.data?.user) return null;

    return {
      ...payload.data.user,
      company_name: payload.data.company?.name ?? payload.data.user.company_name,
    };
  } catch {
    return null;
  }
}
