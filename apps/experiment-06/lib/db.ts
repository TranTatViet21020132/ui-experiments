import clientPromise from "./mongodb";
import type { CalendarEvent } from "@/components/event-calendar";
import { ObjectId } from "mongodb";
import { subDays } from "date-fns";

const DB_NAME = "calendar";
const COLLECTION_NAME = "events";

export async function getAllEvents(): Promise<CalendarEvent[]> {
  const client = await clientPromise;
  const db = client.db(DB_NAME);

  // Optionally filter out events older than 1 day on retrieval
  // Remove this filter if you want to show all events including those from yesterday
  const oneDayAgo = subDays(new Date(), 1);

  const events = await db
    .collection(COLLECTION_NAME)
    .find({
      end: { $gte: oneDayAgo }, // Only get events that ended within the last day or are upcoming
    })
    .toArray();

  return events.map((event) => ({
    id: event._id.toString(),
    title: event.title,
    description: event.description || "",
    start: new Date(event.start),
    end: new Date(event.end),
    allDay: event.allDay || false,
    color: event.color,
    location: event.location || "",
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

export async function deleteOldEvents(): Promise<number> {
  const client = await clientPromise;
  const db = client.db(DB_NAME);

  // Delete events that ended more than 1 day ago
  const oneDayAgo = subDays(new Date(), 1);

  const result = await db.collection(COLLECTION_NAME).deleteMany({
    end: { $lt: oneDayAgo },
  });

  return result.deletedCount;
}
