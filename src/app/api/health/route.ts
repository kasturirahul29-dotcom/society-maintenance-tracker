import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    data: { ok: true, service: "society-maintenance-tracker" },
  });
}
