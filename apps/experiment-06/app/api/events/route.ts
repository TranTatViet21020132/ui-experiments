import { NextResponse } from "next/server";
import { getAllEvents, createEvent } from "@/lib/db";

export async function GET() {
  try {
    const events = await getAllEvents();
    return NextResponse.json(events);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.title || !body.start || !body.end) {
      return NextResponse.json(
        { error: "Missing required fields: title, start, end" },
        { status: 400 }
      );
    }

    // Create event with subject field
    const eventData = {
      title: body.title,
      description: body.description || "",
      start: new Date(body.start),
      end: new Date(body.end),
      allDay: body.allDay || false,
      location: body.location || "",
      color: body.color || "#A855F7",
      subject: body.subject || null, // Add subject field
    };

    const event = await createEvent(eventData);
    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    );
  }
}
