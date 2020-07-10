import { Request } from "express";
import { authorize } from "../../../lib/utils";
import { IResolvers } from "apollo-server-express";
import { CreateBookingArgs } from "./types";
import { Booking, Listing, DB, User } from "../../../models/types";
import { ObjectId } from "mongodb";
import { Stripe } from "../../../lib/api";
import { BookingIndex } from "../../../models/types";

const resolveBookingIndex = (
  bookingsIndex: BookingIndex,
  checkIn: string,
  checkOut: string
): BookingIndex => {
  let dateCursor = new Date(checkIn);
  const checkoutDate = new Date(checkOut);
  const newBookingIndex: BookingIndex = { ...bookingsIndex };
  while (dateCursor.getTime() <= checkoutDate.getTime()) {
    const y = dateCursor.getUTCFullYear();
    const m = dateCursor.getUTCMonth();
    const d = dateCursor.getUTCDate();
    if (!newBookingIndex[y]) {
      newBookingIndex[y] = {};
    }
    if (!newBookingIndex[y][m]) {
      newBookingIndex[y][m] = {};
    }
    if (!newBookingIndex[y][m][d]) {
      newBookingIndex[y][m][d] = true;
    } else {
      throw new Error("Selected dates have already been booked.");
    }
    dateCursor = new Date(dateCursor.getTime() + 86400000);
  }

  return newBookingIndex;
};

export const bookingResolvers: IResolvers = {
  Mutation: {
    createBooking: async (
      _root: undefined,
      { input }: CreateBookingArgs,
      { db, req }: { db: DB; req: Request }
    ): Promise<Booking> => {
      try {
        //verify a logged user
        const { id, source, checkIn, checkOut } = input;
        const viewer = await authorize(db, req);
        if (!viewer) {
          throw new Error("Viewer can not be found.");
        }

        // find listing that is being booked
        const listing = await db.listings.findOne({
          _id: new ObjectId(id)
        });
        if (!listing) {
          throw new Error("Listing can not be found.");
        }

        //check if viewer is not booking their own
        if (listing.host === viewer._id) {
          throw new Error("Viewer can not book own listing.");
        }

        //check if checkout is not before check-in
        const checkInDate = new Date(checkIn);
        const checkOutDate = new Date(checkOut);

        if (checkOutDate < checkInDate) {
          throw new Error("Check out can not be before check in.");
        }

        //create a new booking index for listing being booked
        const bookingIndex = resolveBookingIndex(
          listing.bookingIndex,
          checkIn,
          checkOut
        );

        //get the total price
        const totalPrice =
          listing.price *
          ((checkOutDate.getTime() - checkInDate.getTime()) / 86400000 + 1); //milliseconds in a day

        //get user of host listing and check for stripe account
        const host = await db.users.findOne({
          _id: listing.host
        });
        if (!host || !host.walletId) {
          throw new Error(
            "The host can not be found or the Stripe is not connected"
          );
        }

        // create stripe charge
        await Stripe.charge(totalPrice, source, host.walletId);

        //insert a new booking to bookings collection
        const insertedRes = await db.bookings.insertOne({
          _id: new ObjectId(),
          listing: listing._id,
          tenant: viewer._id,
          checkIn,
          checkOut
        });
        const insertedBooking: Booking = insertedRes.ops[0];

        // update user to increment income
        await db.users.updateOne(
          {
            _id: host._id
          },
          {
            $inc: { income: totalPrice }
          }
        );

        //update booking fields of tenant
        await db.users.updateOne(
          {
            _id: viewer._id
          },
          {
            $push: { bookings: insertedBooking._id }
          }
        );

        //update booking that is being booked
        await db.listings.updateOne(
          {
            _id: listing._id
          },
          {
            $set: { bookingIndex },
            $push: { bookings: insertedBooking._id }
          }
        );

        //return bew booking
        return insertedBooking;
      } catch (e) {
        throw new Error(e);
      }
    }
  },
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
