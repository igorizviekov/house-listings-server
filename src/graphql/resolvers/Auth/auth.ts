import { IResolvers } from "apollo-server-express";
import { Viewer, User, DB } from "../../../models/types";
import { Google } from "../../../lib/api";
import { LoginArgs } from "./types";
import crypto from "crypto";

const loginViaGoogle = async (
  code: string,
  token: string,
  db: DB
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
  console.log("logged with Google");
  return viewer;
};

const loginViaCookie = async (
  cookie: string,
  token: string,
  db: DB
): Promise<User | undefined> => {
  try {
    if (cookie) {
      const updatedRes = await db.users.findOneAndUpdate(
        { _id: cookie },
        { $set: { token } },
        { returnOriginal: false }
      );
      const viewer = updatedRes.value;
      let message = "logged with cookie";
      if (!viewer) {
        message = "no user found.";
        return;
      }
      console.log(message);
      return viewer;
    }
    return undefined;
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
      { db }: { db: DB }
    ): Promise<Viewer> => {
      try {
        const code = input ? input.code : null;
        const cookie = input ? input.cookie : "";
        const token = crypto.randomBytes(16).toString("hex");
        const viewer: User | undefined = code
          ? //if no code  string from google try to log  in with cookie
            await loginViaGoogle(code, token, db)
          : await loginViaCookie(cookie, token, db);
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
    logout: (): Viewer => {
      return { didRequest: true };
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
