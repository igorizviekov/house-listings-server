//dotenv
import dotenv from "dotenv";
dotenv.config();

import express, { Application } from "express";
import cors from "cors";
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

  const corsOptions = {
    origin: process.env.PUBLIC_URL,
    credentials: true // <-- REQUIRED backend setting
  };
  app.use(cors(corsOptions));
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
