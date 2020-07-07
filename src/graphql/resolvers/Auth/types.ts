export interface LoginArgs {
  input: { code: string; cookie: string } | null;
}

export interface StripeArgs {
  input: { code: string };
}
