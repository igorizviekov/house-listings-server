import stripe from "stripe";

const client = new stripe(`${process.env.S_SECRET_KEY}`, {
  apiVersion: "2020-03-02"
});

export const Stripe = {
  connect: async (code: string): Promise<stripe.OAuthToken> => {
    const res = await client.oauth.token({
      grant_type: "authorization_code",
      code
    });
    return res;
  }
};
