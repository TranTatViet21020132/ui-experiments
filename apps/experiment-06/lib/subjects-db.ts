import clientPromise from "./mongodb";
import type { Subject } from "@/components/event-calendar/types";
import { ObjectId } from "mongodb";

const DB_NAME = "calendar";
const COLLECTION_NAME = "subjects";

export async function getAllSubjects(): Promise<Subject[]> {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  const subjects = await db.collection(COLLECTION_NAME).find({}).toArray();

  return subjects.map((subject) => ({
    id: subject._id.toString(),
    name: subject.name,
    color: subject.color,
    isActive: subject.isActive ?? true,
  }));
}

export async function createSubject(
  subject: Omit<Subject, "id">
): Promise<Subject> {
  const client = await clientPromise;
  const db = client.db(DB_NAME);

  const result = await db.collection(COLLECTION_NAME).insertOne({
    name: subject.name,
    color: subject.color,
    isActive: subject.isActive ?? true,
    createdAt: new Date(),
  });

  return { ...subject, id: result.insertedId.toString() };
}

export async function updateSubject(subject: Subject): Promise<Subject> {
  const client = await clientPromise;
  const db = client.db(DB_NAME);

  await db.collection(COLLECTION_NAME).updateOne(
    { _id: new ObjectId(subject.id) },
    {
      $set: {
        name: subject.name,
        color: subject.color,
        isActive: subject.isActive,
        updatedAt: new Date(),
      },
    }
  );

  return subject;
}

export async function deleteSubject(id: string): Promise<void> {
  const client = await clientPromise;
  const db = client.db(DB_NAME);

  await db.collection(COLLECTION_NAME).deleteOne({
    _id: new ObjectId(id),
  });
}
