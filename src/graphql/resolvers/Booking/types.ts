export interface CreateBookingArgs {
  input: CreateBookingInput;
}

export interface CreateBookingInput {
  source: string;
  id: string;
  checkIn: string;
  checkOut: string;
}
