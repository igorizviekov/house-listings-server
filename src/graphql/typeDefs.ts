import { gql } from "apollo-server-express";

//schema of list item
export const typeDefs = gql`
  type Listing {
    _id: ID!
    title: String
    address: String
    image: String
    price: Int
    numOfGuests: Int
    numOfBeds: Int
    numOfBaths: Int
    rating: Int
  }

  type Query {
    listings: [Listing!]!
  }

  type Mutation {
    deleteListing(id: ID): Listing!
  }
`;
