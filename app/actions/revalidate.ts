"use server";

import { revalidatePath, revalidateTag } from "next/cache";

/**
 * Server action to revalidate cache by tag
 * This invalidates all cached requests with the specified tag
 * @param tag - The cache tag to revalidate (e.g., 'service-taxi', 'zone-123')
 */
export async function revalidateServiceCache(tag: string) {
  try {
    revalidateTag(tag);
    return { success: true };
  } catch (error) {
    console.error("Failed to revalidate tag:", tag, error);
    return { success: false, error: "Failed to revalidate cache" };
  }
}

/**
 * Server action to revalidate driver pages
 * This invalidates all driver-related pages to ensure fresh data
 */
export async function revalidateDrivers() {
  try {
    // Revalidate all driver pages
    revalidatePath("/[locale]/drivers", "page");
    revalidatePath("/[locale]/drivers/taxi", "page");
    revalidatePath("/[locale]/drivers/wensh", "page");
    revalidatePath("/[locale]/drivers/fontas", "page");
    revalidatePath("/[locale]/drivers/lightTransportation", "page");
    revalidatePath("/[locale]/drivers/driversWithoutCar", "page");
    revalidatePath("/[locale]/drivers/outages", "page");
    revalidatePath("/[locale]/drivers/outages/fuel", "page");
    revalidatePath("/[locale]/drivers/outages/tires", "page");
    revalidatePath("/[locale]/drivers/outages/towing", "page");
    revalidatePath("/[locale]/drivers/(stopped)/blocked", "page");
    revalidatePath("/[locale]/drivers/(stopped)/deleted", "page");

    return { success: true };
  } catch (error) {
    console.error("Failed to revalidate drivers:", error);
    return { success: false, error: "Failed to revalidate drivers cache" };
  }
}
