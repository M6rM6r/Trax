import * as admin from "firebase-admin";

admin.initializeApp();

export { onUserCreated, onUserDeleted } from "./authTriggers";
export { onAttendanceWritten, onEmployeeWritten, onCompanyDeleted } from "./firestoreTriggers";
export { dailyAttendanceSummary, checkTrialExpiry, cleanupStaleLocations } from "./scheduled";
export { exportAttendance, bulkCreateEmployees, sendCompanyNotification } from "./callables";
export { aggregateFunctionMetrics } from "./performance";
export { serveBundle } from "./bundles";
