import { MongoClient } from "mongodb";
import { DB } from "../models/types";
const url = `${process.env.DB}`;

export const connectDB = async (): Promise<DB> => {
  const client = await MongoClient.connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  const db = client.db(`${process.env.DB_NAME}`);
  return { listings: db.collection(`${process.env.DB_COLLECTION}`) };
};
