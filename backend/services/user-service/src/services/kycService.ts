import axios from "axios";

/**
 * TEMP PKCE verifier storage
 * ⚠️ In production use Redis or DB
 */
const verifierStore = new Map<string, string>();

/**
 * Save PKCE verifier before redirecting to DigiLocker
 */
export const saveVerifier = async (userId: string, verifier: string) => {
  verifierStore.set(userId, verifier);
};

/**
 * Get PKCE verifier during callback
 */
export const getVerifier = async (userId: string) => {
  return verifierStore.get(userId);
};

/**
 * Exchange DigiLocker authorization code → access token
 */
export const exchangeToken = async (code: string, userId: string) => {
  const verifier = await getVerifier(userId);

  if (!verifier) {
    throw new Error("PKCE verifier not found for this user");
  }

  const res = await axios.post(
    "https://digilocker.meripehchaan.gov.in/public/oauth2/2/token",
    new URLSearchParams({
      code,
      client_id: process.env.APISETU_CLIENT_ID!,
      client_secret: process.env.APISETU_CLIENT_SECRET!,
      redirect_uri: process.env.APISETU_REDIRECT!,
      grant_type: "authorization_code",
      code_verifier: verifier,   // 🔥 REQUIRED for DigiLocker
    }),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );

  return res.data;
};

/**
 * Fetch DigiLocker issued documents
 */
export const fetchDocuments = async (accessToken: string) => {
  const res = await axios.get(
    "https://digilocker.meripehchaan.gov.in/public/oauth2/2/files/issued",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  return res.data;
};



export const fetchProfile = async (accessToken: string) => {
  const res = await axios.get(
    "https://digilocker.meripehchaan.gov.in/public/oauth2/1/user",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  return res.data;
};