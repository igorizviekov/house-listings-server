import merge from "lodash.merge";
import { authResolvers } from "./Auth/auth";
import { userResolvers } from "./User";
export const resolvers = merge(authResolvers, userResolvers);
