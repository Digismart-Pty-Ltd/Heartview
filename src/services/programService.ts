import { addDoc, collection } from "firebase/firestore";
import { db } from "./firebase";

export const createProgramInFirestore = async (program: any) => {
  try {
    const docRef = await addDoc(collection(db, "programs"), {
      ...program,
      // Keep createdAt as a number (Date.now()) from the caller — do NOT overwrite
      // with new Date() as that produces a Firestore Timestamp which breaks
      // the 90-day numeric comparison in the Previously view.
      createdAt: typeof program.createdAt === "number" ? program.createdAt : Date.now(),
      published: false,
      paid: false,
    });

    return docRef.id;
  } catch (error) {
    console.error("Firestore Error:", error);
    throw error;
  }
};