import { IResolvers } from "apollo-server-express";
import { Listing, DB, User } from "../../../models/types";
import {
  ListingArgs,
  ListingsArgs,
  ListingsData,
  ListingBookingsArgs,
  ListingBookingsData,
  ListingsFilter
} from "./types";
import { ObjectID } from "mongodb";
import { authorize } from "../../../lib/utils";
import { Request } from "express";

export const listingResolvers: IResolvers = {
  Query: {
    listing: async (
      _root: undefined,
      { id }: ListingArgs,
      { db, req }: { db: DB; req: Request }
    ): Promise<Listing | undefined> => {
      try {
        const listing = await db.listings.findOne({ _id: new ObjectID(id) });
        if (!listing) {
          throw new Error("no listing found");
        }
        // authorize user
        const viewer = await authorize(db, req);
        if (viewer && viewer._id === listing.host) {
          listing.authorized = true;
        }
        return listing;
      } catch (err) {
        console.log(err);
      }
    },
    listings: async (
      _root: undefined,
      { filter, limit, page }: ListingsArgs,
      { db }: { db: DB }
    ): Promise<ListingsData | undefined> => {
      try {
        const data: ListingsData = {
          total: 0,
          result: []
        };
        let cursor = await db.listings.find();
        if (!cursor) {
          throw new Error("no listings found");
        }
        //apply  filters
        if (filter && filter === ListingsFilter.PRICE_HIGH_TO_LOW) {
          cursor = cursor.sort({ price: -1 });
        }
        if (filter && filter === ListingsFilter.PRICE_LOW_TO_HIGH) {
          cursor = cursor.sort({ price: 1 });
        }
        cursor = cursor.skip(page > 0 ? (page - 1) * limit : 0);
        cursor = cursor.limit(limit);

        (data.total = await cursor.count()),
          (data.result = await cursor.toArray());

        return data;
      } catch (error) {
        console.log(error);
      }
    }
  },
  Listing: {
    bookings: async (
      listing: Listing,
      { limit, page }: ListingBookingsArgs,
      { db }: { db: DB }
    ): Promise<ListingBookingsData | undefined> => {
      try {
        if (!listing.authorized) {
          return undefined;
        }
        const data: ListingBookingsData = {
          total: 0,
          result: []
        };

        //pagination
        let cursor = await db.bookings.find({ _id: { $in: listing.bookings } });
        cursor = cursor.skip(page > 0 ? (page - 1) * limit : 0);
        cursor = cursor.limit(limit);

        data.total = await cursor.count();
        data.result = await cursor.toArray();

        return data;
      } catch (err) {
        console.log(err);
      }
    },
    id: (listing: Listing): string => {
      return listing._id.toString();
    },
    host: async (
      listing: Listing,
      _args: Record<string, unknown>,
      { db }: { db: DB }
    ): Promise<User> => {
      const host = await db.users.findOne({ _id: listing.host });
      if (!host) {
        throw new Error("host can`t be found");
      }
      return host;
    },
    bookingIndex: (listing: Listing): string => {
      return JSON.stringify(listing.bookingIndex);
    }
  }
};
