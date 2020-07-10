import bodyParser from "body-parser";

import express, { Application } from "express";
//database
import { connectDB } from "./database/index";
//apollo server
import { ApolloServer } from "apollo-server-express";
import { typeDefs, resolvers } from "./graphql";
import compression from "compression";
const mount = async (app: Application) => {
  const db = await connectDB();
  app.use(compression());
  app.use(bodyParser.json({ limit: "2mb" }));
  app.use(express.static(`${__dirname}/client`));
  app.get("/*", (_req, res) => res.sendFile(`${__dirname}/client/index.html`));
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
