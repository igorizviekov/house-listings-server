//clear mock data to db

import dotenv from "dotenv";
dotenv.config();

import { connectDB } from "../database";

const clear = async () => {
  try {
    const db = await connectDB();

    const bookings = await db.bookings.find({}).toArray();
    const listings = await db.listings.find({}).toArray();
    const users = await db.users.find({}).toArray();

    if (bookings.length > 0) {
      await db.bookings.drop();
    }

    if (listings.length > 0) {
      await db.listings.drop();
    }

    if (users.length > 0) {
      await db.users.drop();
    }
  } catch {
    throw new Error("failed to clear database");
  }
};

clear();
