import { Collection } from "mongodb";
import { ObjectID } from "mongodb";

export interface Listing {
  _id: ObjectID;
  title: string;
  image: string;
  address: string;
  price: number;
  numOfGuests: number;
  numOfBeds: number;
  numOfBaths: number;
  rating: number;
}

export interface DB {
  listings: Collection<Listing>;
}
