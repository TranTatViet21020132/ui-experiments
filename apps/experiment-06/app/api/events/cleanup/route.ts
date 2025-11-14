import { NextResponse } from "next/server";
import { deleteOldEvents } from "@/lib/db";

export async function POST() {
  try {
    const deletedCount = await deleteOldEvents();
    return NextResponse.json({
      success: true,
      deletedCount,
      message: `Deleted ${deletedCount} events that ended more than 1 day ago`,
    });
  } catch (error) {
    console.error("Error cleaning up old events:", error);
    return NextResponse.json(
      { error: "Failed to clean up old events" },
      { status: 500 }
    );
  }
}
