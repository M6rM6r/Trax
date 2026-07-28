export { getFirebaseUserProfile, getFirebaseUserProfileFromApi } from "./auth";
export { employeesApi } from "./employees";
export { geofencesApi } from "./geofences";
export { attendanceApi } from "./attendance";
export { dashboardApi } from "./dashboard";
export { trackingApi } from "./tracking";
export { companiesApi } from "./companies";
export {
  requestFCMToken,
  revokeFCMToken,
  onForegroundMessage,
  isNotificationSupported,
  getNotificationPermission,
} from "./messaging";
export {
  initializeRemoteConfig,
  getFeatureFlag,
  getConfigNumber,
  getConfigString,
  FeatureFlags,
} from "./remoteConfig";
export { paginatedQuery, createInfiniteLoader } from "./pagination";
export { cachedQuery, invalidateCache, invalidateCompanyCache } from "./cache";
export { loadBundleFromServer, executeNamedQuery, BUNDLE_DEFINITIONS } from "./bundles";
export { cloudFunctionsApi } from "./cloudFunctions";

import { employeesApi } from "./employees";
import { geofencesApi } from "./geofences";
import { attendanceApi } from "./attendance";
import { dashboardApi } from "./dashboard";
import { trackingApi } from "./tracking";
import { companiesApi } from "./companies";
import { cloudFunctionsApi } from "./cloudFunctions";

export const firebaseData = {
  employees: employeesApi,
  geofences: geofencesApi,
  attendance: attendanceApi,
  dashboard: dashboardApi,
  tracking: trackingApi,
  companies: companiesApi,
  cloudFunctions: cloudFunctionsApi,
};
