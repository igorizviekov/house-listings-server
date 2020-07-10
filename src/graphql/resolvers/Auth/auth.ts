import { IResolvers } from "apollo-server-express";
import { Viewer, User, DB } from "../../../models/types";
import { Google, Stripe } from "../../../lib/api";
import { LoginArgs, StripeArgs } from "./types";
import crypto from "crypto";
import { Request } from "express";
import { authorize } from "../../../lib/utils";

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
      if (!viewer) {
        return;
      }
      return viewer;
    }
    return undefined;
  } catch (err) {
    throw new Error(err);
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
    },
    connectStripe: async (
      _root: undefined,
      { input }: StripeArgs,
      { db, req }: { db: DB; req: Request }
    ): Promise<Viewer> => {
      try {
        const { code } = input;
        //only logged in  users
        let viewer = await authorize(db, req);
        if (!viewer) {
          throw new Error("viewer can not  be found.");
        }
        const wallet = await Stripe.connect(code);
        if (!wallet) {
          throw new Error("Stripe grant error.");
        }
        const updatedUser = await db.users.findOneAndUpdate(
          { _id: viewer._id },
          { $set: { walletId: wallet.stripe_user_id } },
          { returnOriginal: false }
        );
        if (!updatedUser.value) {
          throw new Error("Viewer could not be updated.");
        }
        viewer = updatedUser.value;
        return {
          _id: viewer._id,
          token: viewer.token,
          avatar: viewer.avatar,
          walletId: viewer.walletId,
          didRequest: true
        };
      } catch (e) {
        throw new Error(e);
      }
    },
    disconnectStripe: async (
      _root: undefined,
      _args: Record<string, unknown>,
      { db, req }: { db: DB; req: Request }
    ): Promise<Viewer> => {
      try {
        let viewer = await authorize(db, req);
        if (!viewer) {
          throw new Error("viewer can not  be found.");
        }

        const updatedUser = await db.users.findOneAndUpdate(
          { _id: viewer._id },
          //remove stripe id
          { $set: { walletId: undefined } },
          { returnOriginal: false }
        );
        if (!updatedUser.value) {
          throw new Error("Viewer could not be updated.");
        }
        viewer = updatedUser.value;
        return {
          _id: viewer._id,
          token: viewer.token,
          avatar: viewer.avatar,
          walletId: viewer.walletId,
          didRequest: true
        };
      } catch (e) {
        throw new Error(e);
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
