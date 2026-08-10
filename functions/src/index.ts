import * as admin from "firebase-admin";

admin.initializeApp();

export { onUserCreated, onUserDeleted } from "./authTriggers";
export {
  onAttendanceWritten,
  onEmployeeWritten,
  onCompanyDeleted,
  onLocationWritten,
} from "./firestoreTriggers";
export {
  dailyAttendanceSummary,
  checkTrialExpiry,
  cleanupStaleLocations,
  autoCheckoutEmployees,
} from "./scheduled";
export {
  exportAttendance,
  bulkCreateEmployees,
  sendCompanyNotification,
  createCompany,
  setEmployeePassword,
} from "./callables";
export { aggregateFunctionMetrics } from "./performance";
export { serveBundle } from "./bundles";
