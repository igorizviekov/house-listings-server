import merge from "lodash.merge";
import { authResolvers } from "./Auth/auth";
import { userResolvers } from "./User";
import { listingResolvers } from "./Listing";
import { bookingResolvers } from "./Booking";
export const resolvers = merge(
  authResolvers,
  userResolvers,
  listingResolvers,
  bookingResolvers
);
