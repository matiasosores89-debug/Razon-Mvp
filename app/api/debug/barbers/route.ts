import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const barbers = await prisma.barber.findMany();
    return NextResponse.json({
      status: "ok",
      data: barbers,
    });
  } catch (error: any) {
    return NextResponse.json({
      status: "error",
      message: error.message,
    }, { status: 500 });
  }
}
