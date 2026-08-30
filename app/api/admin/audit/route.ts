import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const take = Math.min(100, Math.max(10, Number(request.nextUrl.searchParams.get("take")) || 50));
  const logs = await prisma.adminAuditLog.findMany({ orderBy: { createdAt: "desc" }, take });
  return NextResponse.json({ success: true, data: logs });
}
