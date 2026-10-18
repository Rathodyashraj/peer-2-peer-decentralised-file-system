import { OAuth2Client } from "google-auth-library";

// "postmessage" is the redirect uri used by the popup auth-code flow
export const getGoogleClient = () =>
    new OAuth2Client(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, "postmessage");
