import { IResolvers } from "apollo-server-express";
import {
  UserArgs,
  UserBookingsArgs,
  UserBookingsData,
  UserListingsArgs,
  UserListingsData
} from "./types";
import { DB, User } from "../../../models/types";
// import {authorize}

export const userResolvers: IResolvers = {
  Query: {
    user: async (
      _root: undefined,
      { id }: UserArgs,
      { db }: { db: DB }
    ): Promise<User | undefined> => {
      try {
        const user = await db.users.findOne({ _id: id });
        if (!user) {
          throw new Error("No user found.");
        }
        // TODO: authorize user
        // const viewer = await authorize(db, req);
        // if (viewer && viewer._id === user._id) {
        //   user.authorized = true;
        // }
        return user;
      } catch (err) {
        console.log(err);
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
        // if(!user.authorized) {
        //   return null
        // }
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
        console.log(err);
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
        console.log(err);
      }
    }
  }
};
