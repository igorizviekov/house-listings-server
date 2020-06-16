import { MongoClient } from "mongodb";
import { DB, User, Booking, Listing } from "../models/types";
const url = `${process.env.DB}`;

export const connectDB = async (): Promise<DB> => {
  const client = await MongoClient.connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  const db = client.db(`${process.env.DB_NAME}`);
  return {
    listings: db.collection<Listing>(`${process.env.LISTINGS_COLLECTION}`),
    users: db.collection<User>(`${process.env.USERS_COLLECTION}`),
    bookings: db.collection<Booking>(`${process.env.BOOKINGS_COLLECTION}`)
  };
};
