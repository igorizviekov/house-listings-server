import { Booking, Listing } from "../../../models/types";

export interface ListingArgs {
  id: string;
}

export enum ListingsFilter {
  PRICE_LOW_TO_HIGH = "PRICE_LOW_TO_HIGH",
  PRICE_HIGH_TO_LOW = "PRICE_HIGH_TO_LOW"
}

export interface ListingsArgs {
  filter: ListingsFilter;
  limit: number;
  page: number;
}

export interface ListingsData {
  total: number;
  result: Listing[];
}

export interface ListingBookingsArgs {
  limit: number;
  page: number;
}

export interface ListingBookingsData {
  total: number;
  result: Booking[];
}
