import { NextResponse } from "next/server";
import { updateEvent, deleteEvent } from "@/lib/db";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const event = await updateEvent({ ...body, id: params.id });
    return NextResponse.json(event);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update event" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log("Attempting to delete event with id:", params.id); // Add logging
    await deleteEvent(params.id);
    return NextResponse.json({ success: true }, { status: 200 }); // Changed from 204
  } catch (error) {
    console.error("Error deleting event:", error); // Add logging
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to delete event",
      },
      { status: 500 }
    );
  }
}