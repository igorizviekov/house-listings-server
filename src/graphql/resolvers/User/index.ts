import { IResolvers } from "apollo-server-express";
import { Request } from "express";
import {
  UserArgs,
  UserBookingsArgs,
  UserBookingsData,
  UserListingsArgs,
  UserListingsData
} from "./types";
import { DB, User } from "../../../models/types";
import { authorize } from "../../../lib/utils";

export const userResolvers: IResolvers = {
  Query: {
    user: async (
      _root: undefined,
      { id }: UserArgs,
      { db, req }: { db: DB; req: Request }
    ): Promise<User | undefined> => {
      try {
        const user = await db.users.findOne({ _id: id });
        if (!user) {
          throw new Error("No user found.");
        }
        // authorize user
        const viewer = await authorize(db, req);
        if (viewer && viewer._id === user._id) {
          user.authorized = true;
        }
        return user;
      } catch (err) {
        throw new Error(err);
      }
    }
  },
  User: {
    id: (user: User): string => user._id,
    hasWallet: (user: User): boolean => Boolean(user.walletId),
    income: (user: User): number | null =>
      user.authorized ? user.income : null,
    bookings: async (
      user: User,
      { limit, page }: UserBookingsArgs,
      { db }: { db: DB }
    ): Promise<UserBookingsData | undefined> => {
      try {
        if (!user.authorized) {
          return undefined;
        }
        const data: UserBookingsData = {
          total: 0,
          result: []
        };

        //pagination
        let cursor = await db.bookings.find({ _id: { $in: user.bookings } });
        cursor = cursor.skip(page > 0 ? (page - 1) * limit : 0);
        cursor = cursor.limit(limit);

        data.total = await cursor.count();
        data.result = await cursor.toArray();

        return data;
      } catch (err) {
        throw new Error(err);
      }
    },
    listings: async (
      user: User,
      { limit, page }: UserListingsArgs,
      { db }: { db: DB }
    ): Promise<UserListingsData | undefined> => {
      try {
        const data: UserListingsData = {
          total: 0,
          result: []
        };

        //pagination
        let cursor = await db.listings.find({ _id: { $in: user.listings } });
        cursor = cursor.skip(page > 0 ? (page - 1) * limit : 0);
        cursor = cursor.limit(limit);

        data.total = await cursor.count();
        data.result = await cursor.toArray();

        return data;
      } catch (err) {
        throw new Error(err);
      }
    }
  }
};
