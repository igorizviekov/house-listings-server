import { IResolvers } from "apollo-server-express";
import { Booking, Listing, DB, User } from "../../../models/types";
export const bookingResolvers: IResolvers = {
  Booking: {
    id: (booking: Booking): string => {
      return booking._id.toString();
    },
    listing: (
      booking: Booking,
      _args: Record<string, unknown>,
      { db }: { db: DB }
    ): Promise<Listing | null> => {
      return db.listings.findOne({ _id: booking.listing });
    },
    tenant: (
      booking: Booking,
      _args: Record<string, unknown>,
      { db }: { db: DB }
    ): Promise<User | null> => {
      return db.users.findOne({ _id: booking.tenant });
    }
  }
};
