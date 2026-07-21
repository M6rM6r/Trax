import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "trax",
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.max(0, Math.floor(process.uptime())),
    version: process.env.NEXT_PUBLIC_APP_VERSION ?? "0.1.0",
  });
}
