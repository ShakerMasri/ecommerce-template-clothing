import { NextResponse } from "next/server";

export function POST() {
  return NextResponse.json(
    {
      message:
        "This registration endpoint has been replaced by Better Auth signup.",
    },
    { status: 410 },
  );
}
