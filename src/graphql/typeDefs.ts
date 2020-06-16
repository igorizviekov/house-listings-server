import { gql } from "apollo-server-express";

export const typeDefs = gql`
  type Viewer {
    id: ID
    token: String
    avatar: String
    hasWallet: Boolean
    didRequest: Boolean!
  }
  type Query {
    authUrl: String!
  }
  input LoginInput {
    code: String!
  }
  type Mutation {
    login(input: LoginInput): Viewer!
    logout: Viewer!
  }
`;
