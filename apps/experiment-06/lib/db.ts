import clientPromise from "./mongodb";
import type { CalendarEvent } from "@/components/event-calendar";
import { ObjectId } from "mongodb";

const DB_NAME = "calendar";
const COLLECTION_NAME = "events";

export async function getAllEvents(): Promise<CalendarEvent[]> {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  const events = await db.collection(COLLECTION_NAME).find({}).toArray();

  return events.map((event) => ({
    id: event._id.toString(),
    title: event.title,
    description: event.description,
    start: new Date(event.start),
    end: new Date(event.end),
    allDay: event.allDay || false,
    color: event.color,
    label: event.label,
    location: event.location,
    subject: event.subject
  }));
}

export async function createEvent(
  event: Omit<CalendarEvent, "id">
): Promise<CalendarEvent> {
  const client = await clientPromise;
  const db = client.db(DB_NAME);

  const result = await db.collection(COLLECTION_NAME).insertOne({
    title: event.title,
    description: event.description,
    start:
      event.start instanceof Date ? event.start.toISOString() : event.start,
    end: event.end instanceof Date ? event.end.toISOString() : event.end,
    allDay: event.allDay || false,
    color: event.color,
    label: event.label,
    location: event.location,
    createdAt: new Date(),
    subject: event.subject
  });

  return {
    ...event,
    id: result.insertedId.toString(),
    start: event.start instanceof Date ? event.start : new Date(event.start),
    end: event.end instanceof Date ? event.end : new Date(event.end),
  };
}

export async function updateEvent(
  event: CalendarEvent
): Promise<CalendarEvent> {
  const client = await clientPromise;
  const db = client.db(DB_NAME);

  await db.collection(COLLECTION_NAME).updateOne(
    { _id: new ObjectId(event.id) },
    {
      $set: {
        title: event.title,
        description: event.description,
        start:
          event.start instanceof Date ? event.start.toISOString() : event.start,
        end: event.end instanceof Date ? event.end.toISOString() : event.end,
        allDay: event.allDay,
        color: event.color,
        label: event.label,
        location: event.location,
        updatedAt: new Date(),
      },
    }
  );

  return event;
}

export async function deleteEvent(id: string): Promise<void> {
  const client = await clientPromise;
  const db = client.db(DB_NAME);

  if (!ObjectId.isValid(id)) {
    throw new Error(`Invalid ObjectId format: ${id}`);
  }

  const result = await db.collection(COLLECTION_NAME).deleteOne({
    _id: new ObjectId(id),
  });

  if (result.deletedCount === 0) {
    throw new Error(`Event with id ${id} not found`);
  }
}
