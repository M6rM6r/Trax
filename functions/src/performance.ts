import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

const db = admin.firestore();

/**
 * Track Cloud Function execution metrics in Firestore.
 * Called from other functions to record latency and success/failure.
 */
export async function recordMetric(
  functionName: string,
  durationMs: number,
  success: boolean,
  metadata?: Record<string, unknown>
): Promise<void> {
  const today = new Date().toISOString().split("T")[0];
  const ref = db.collection("function_metrics").doc();

  await ref.set({
    function: functionName,
    duration_ms: durationMs,
    success,
    date: today,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    ...metadata,
  });
}

/**
 * Scheduled function — runs every hour to aggregate function metrics.
 * Computes average latency and error rate per function.
 */
export const aggregateFunctionMetrics = functions.pubsub
  .schedule("every 60 minutes")
  .onRun(async () => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const metrics = await db
      .collection("function_metrics")
      .where("timestamp", ">=", oneHourAgo)
      .get();

    const byFunction: Record<string, { count: number; totalMs: number; errors: number }> = {};

    metrics.docs.forEach((doc) => {
      const data = doc.data();
      const name = data.function as string;
      if (!byFunction[name]) {
        byFunction[name] = { count: 0, totalMs: 0, errors: 0 };
      }
      byFunction[name].count++;
      byFunction[name].totalMs += data.duration_ms ?? 0;
      if (!data.success) byFunction[name].errors++;
    });

    const batch = db.batch();
    const hourKey = new Date().toISOString().split("T")[1]?.split(":")[0] ?? "00";

    for (const [name, stats] of Object.entries(byFunction)) {
      const ref = db
        .collection("function_metrics_hourly")
        .doc(`${name}_${new Date().toISOString().split("T")[0]}_${hourKey}`);
      batch.set(ref, {
        function: name,
        hour: hourKey,
        date: new Date().toISOString().split("T")[0],
        count: stats.count,
        avg_latency_ms: Math.round(stats.totalMs / stats.count),
        error_rate: stats.errors / stats.count,
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    await batch.commit();
    functions.logger.info(`Aggregated metrics for ${Object.keys(byFunction).length} functions`);
  });
