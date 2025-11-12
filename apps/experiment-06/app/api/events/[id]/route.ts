import { NextResponse } from "next/server";
import { updateEvent, deleteEvent } from "@/lib/db";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.title || !body.start || !body.end) {
      return NextResponse.json(
        { error: "Missing required fields: title, start, end" },
        { status: 400 }
      );
    }

    // Update event with subject field
    const eventData = {
      id: params.id,
      title: body.title,
      description: body.description || "",
      start: new Date(body.start),
      end: new Date(body.end),
      allDay: body.allDay || false,
      location: body.location || "",
      color: body.color || "#A855F7",
      subject: body.subject || null, // Add subject field
    };

    const event = await updateEvent(eventData);
    return NextResponse.json(event);
  } catch (error) {
    console.error("Error updating event:", error);
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
    console.log("Attempting to delete event with id:", params.id);
    await deleteEvent(params.id);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error deleting event:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to delete event",
      },
      { status: 500 }
    );
  }
}
