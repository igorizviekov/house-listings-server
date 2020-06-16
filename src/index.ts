//dotenv
import dotenv from "dotenv";
dotenv.config();

import express, { Application } from "express";

//database
import { connectDB } from "./database/index";
import cookieParser from "cookie-parser";
//apollo server
import { ApolloServer } from "apollo-server-express";
import { typeDefs, resolvers } from "./graphql";

const mount = async (app: Application) => {
  const db = await connectDB();

  //set  up cookies for log in
  app.use(cookieParser(process.env.SECRET));
  //apollo setup
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req, res }) => ({ db, req, res })
  });
  server.applyMiddleware({ app, path: "/api" });
  app.listen(process.env.PORT || 8080);
};
mount(express());
