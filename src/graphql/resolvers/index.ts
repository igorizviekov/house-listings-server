import merge from "lodash.merge";
import { authResolvers } from "./Auth/auth";

export const resolvers = merge(authResolvers);
