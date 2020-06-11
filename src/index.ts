//dotenv
import dotenv from "dotenv";
dotenv.config();

import express, { Application } from "express";

//database
import { connectDB } from "./database/index";

//apollo server
import { ApolloServer } from "apollo-server-express";
import { typeDefs, resolvers } from "./graphql/index";

const mount = async (app: Application) => {
  const db = await connectDB();
  //apollo setup
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: () => ({ db })
  });
  server.applyMiddleware({ app, path: "/api" });
  app.listen(process.env.PORT || 3000);
};
mount(express());
