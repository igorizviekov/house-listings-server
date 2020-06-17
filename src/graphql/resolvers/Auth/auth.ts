import { IResolvers } from "apollo-server-express";
import { Response, Request } from "express";
import { Viewer, User, DB } from "../../../models/types";
import { Google } from "../../../lib/api";
import { LoginArgs } from "./types";
import crypto from "crypto";

const cookieOptions = {
  httpOnly: true,
  sameSite: true,
  signed: true,
  secure: process.env.NODE_ENV === "development" ? false : true
};

const loginViaGoogle = async (
  code: string,
  token: string,
  db: DB,
  res: Response
): Promise<User | undefined> => {
  const { user } = await Google.login(code);
  if (!user) {
    throw new Error("Google login error");
  }
  //Name/Photo/Email Lists
  const userNamesList = user.names && user.names?.length ? user.names : null;
  const userPhotosList =
    user.photos && user.photos?.length ? user.photos : null;
  const userEmailsList =
    user.emailAddresses && user.emailAddresses?.length
      ? user.emailAddresses
      : null;

  //user display name
  const userName = userNamesList ? userNamesList[0].displayName : null;

  //user id
  const userId =
    userNamesList &&
    userNamesList[0].metadata &&
    userNamesList[0].metadata.source
      ? userNamesList[0].metadata.source.id
      : null;

  //user avatar
  const userAvatar =
    userPhotosList && userPhotosList[0].url ? userPhotosList[0].url : null;

  //user email
  const userEmail =
    userEmailsList && userEmailsList[0].value ? userEmailsList[0].value : null;

  if (!userId || !userName || !userAvatar || !userEmail) {
    throw new Error("Google login error");
  }

  const updateUser = await db.users.findOneAndUpdate(
    { _id: userId },
    {
      $set: {
        name: userName,
        avatar: userAvatar,
        contact: userEmail,
        token
      }
    },
    { returnOriginal: false }
  );

  let viewer = updateUser.value;
  if (!viewer) {
    const insertUser = await db.users.insertOne({
      _id: userId,
      name: userName,
      avatar: userAvatar,
      contact: userEmail,
      token,
      income: 0,
      bookings: [],
      listings: []
    });

    viewer = insertUser.ops[0];
  }
  //at this point there should be cookies set up in the browser
  res.cookie("viewer", userId, {
    ...cookieOptions,
    maxAge: 365 * 24 * 60 * 60 * 1000
  });
  console.log("logged with Google, cookies set");
  return viewer;
};

const loginViaCookie = async (
  token: string,
  db: DB,
  req: Request,
  res: Response
): Promise<User | undefined> => {
  try {
    const updatedRes = await db.users.findOneAndUpdate(
      { _id: req.signedCookies.viewer },
      { $set: { token } },
      { returnOriginal: false }
    );
    const viewer = updatedRes.value;
    let message = "logged with cookie";
    if (!viewer) {
      message = "cookies cleared";
      res.clearCookie("viewer", cookieOptions);
    }
    console.log(message);
    return viewer;
  } catch (err) {
    console.log(err);
  }
};

export const authResolvers: IResolvers = {
  Query: {
    authUrl: (): string => {
      try {
        return Google.authUrl;
      } catch (err) {
        throw new Error(err);
      }
    }
  },
  Mutation: {
    login: async (
      _root: undefined,
      { input }: LoginArgs,
      { db, req, res }: { db: DB; req: Request; res: Response }
    ): Promise<Viewer> => {
      try {
        const code = input ? input.code : null;
        const token = crypto.randomBytes(16).toString("hex");
        const viewer: User | undefined = code
          ? //if no code  string from google try to log  in with cookie
            await loginViaGoogle(code, token, db, res)
          : await loginViaCookie(token, db, req, res);
        if (!viewer) {
          return { didRequest: true };
        }
        return {
          _id: viewer._id,
          token: viewer.token,
          avatar: viewer.avatar,
          walletId: viewer.walletId,
          didRequest: true
        };
      } catch (err) {
        throw new Error(err);
      }
    },
    logout: (
      _root: undefined,
      _args: Record<string, unknown>,
      { res }: { res: Response }
    ): Viewer => {
      try {
        res.clearCookie("viewer", cookieOptions);
        return { didRequest: true };
      } catch (err) {
        throw new Error(err);
      }
    }
  },
  Viewer: {
    id: (viewer: Viewer): string | undefined => {
      return viewer._id;
    },
    hasWallet: (viewer: Viewer): true | undefined => {
      return viewer.walletId ? true : undefined;
    }
  }
};
