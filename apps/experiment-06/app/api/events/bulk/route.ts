// app/api/events/bulk/route.ts
import { NextRequest, NextResponse } from "next/server";
import { updateMultipleEvents, deleteMultipleEvents } from "@/lib/db";

// PUT /api/events/bulk - Update multiple events
export async function PUT(request: NextRequest) {
  try {
    const { events } = await request.json();

    if (!Array.isArray(events)) {
      return NextResponse.json(
        { error: "Events must be an array" },
        { status: 400 }
      );
    }

    await updateMultipleEvents(events);

    return NextResponse.json({
      success: true,
      count: events.length,
    });
  } catch (error) {
    console.error("Error updating multiple events:", error);
    return NextResponse.json(
      { error: "Failed to update events" },
      { status: 500 }
    );
  }
}

// DELETE /api/events/bulk - Delete multiple events
export async function DELETE(request: NextRequest) {
  try {
    const { ids } = await request.json();

    if (!Array.isArray(ids)) {
      return NextResponse.json(
        { error: "IDs must be an array" },
        { status: 400 }
      );
    }

    const deletedCount = await deleteMultipleEvents(ids);

    return NextResponse.json({
      success: true,
      deletedCount,
    });
  } catch (error) {
    console.error("Error deleting multiple events:", error);
    return NextResponse.json(
      { error: "Failed to delete events" },
      { status: 500 }
    );
  }
}
