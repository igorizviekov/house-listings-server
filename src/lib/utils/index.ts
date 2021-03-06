import { Request } from "express";
import { DB, User } from "../../models/types";

export const authorize = async (db: DB, req: Request): Promise<User | null> => {
  //token is passed  from the client. check if  it is the same with  user
  const token = req.get("x-scrf-token");
  const viewer = await db.users.findOne({ token: token });
  return viewer;
};
