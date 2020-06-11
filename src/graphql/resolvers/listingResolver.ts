import { Listing } from "../../models/types";
import { DB } from "../../models/types";
import { ObjectID } from "mongodb";

export const resolvers = {
  Query: {
    listings: async (
      _root: undefined,
      _args: null,
      { db }: { db: DB }
    ): Promise<Listing[]> => {
      return await db.listings.find({}).toArray();
    }
  },
  Mutation: {
    deleteListing: async (
      _root: undefined,
      { id }: { id: string },
      { db }: { db: DB }
    ): Promise<Listing | undefined> => {
      const target = await db.listings.findOneAndDelete({
        _id: new ObjectID(id)
      });
      if (!target) {
        throw new Error("No listing found.");
      }
      return target.value;
    }
  }
};
