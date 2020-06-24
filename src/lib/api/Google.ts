import { google, people_v1 } from "googleapis";
import { createClient } from "@google/maps";

interface userData {
  user: people_v1.Schema$Person;
}

interface ParsedAddress {
  country: string | null;
  admin: string | null;
  city: string | null;
}

const auth = new google.auth.OAuth2(
  process.env.G_CLIENT_ID,
  process.env.G_CLIENT_SECRET,
  `${process.env.PUBLIC_URL}/login`
);

const maps = createClient({ key: `${process.env.G_GEOCODE_KEY}`, Promise });

export const Google = {
  authUrl: auth.generateAuthUrl({
    access_type: "online",
    scope: [
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile"
    ]
  }),
  login: async (code: string): Promise<userData> => {
    const { tokens } = await auth.getToken(code);
    auth.setCredentials(tokens);
    const { data } = await google.people({ version: "v1", auth }).people.get({
      resourceName: "people/me",
      personFields: "emailAddresses,names,photos"
    });
    return { user: data };
  },
  geocode: async (address: string): Promise<ParsedAddress> => {
    const res = await maps.geocode({ address }).asPromise();
    if (res.status < 200 || res.status > 299) {
      throw new Error("Failed to geocode address");
    }

    let country = null;
    let admin = null; //state
    let city = null;

    //parse data
    if (res && res.json.results && res.json.results.length > 0) {
      res.json.results[0].address_components.forEach(address => {
        //check if there is match on country from data received
        if (address.types.includes("country")) {
          country = address.long_name;
        }

        //check if there is match on state from data received
        if (address.types.includes("administrative_area_level_1")) {
          admin = address.long_name;
        }

        //check if there is match on city from data received
        if (
          address.types.includes("locality") ||
          address.types.includes("postal_town")
        ) {
          city = address.long_name;
        }
      });
    }

    return { country, admin, city };
  }
};
