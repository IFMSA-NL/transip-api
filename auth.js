const crypto = require("crypto");
const fetch = require("node-fetch");

const createNonce = () => {
  return crypto.randomBytes(16).toString("hex");
};

const reformKey = (key) => {
  return key
    .replace(/\s*/g, "")
    .match(/.{1,64}/g)
    .join("\n");
};

const checkAndFixKey = (key) => {
  const INVALID_KEY = "Invalid key provided";
  const regex = /-----BEGIN (RSA )?PRIVATE KEY-----(.*)-----END (RSA )?PRIVATE KEY-----/is;
  if (!regex.test(key)) {
    throw new Error(INVALID_KEY);
  }

  const check = key.match(regex);
  if (!check[2]) {
    throw new Error(INVALID_KEY);
  }
  return `-----BEGIN PRIVATE KEY-----\n${reformKey(
    check[2]
  )}\n-----END PRIVATE KEY-----`;
};

/**
 * Request a new Access Token from TransIP
 * @returns {string}
 * @param {Object} options - An object containing options for the acces token creation
 * @param {string} options.login - The account name for whom to create an access token
 * @param {boolean} [option.readOnly=true] - Wether the Access Token should only grant read access or not
 * @param {string} [option.expirationTime=30 minutes] - How lang the token should be valid for. Max. 1 month. E.g. "3 hour", "2 weeks", "20 minutes"
 * @param {string} [option.label] - A custom name for your access token. Must be unique.
 * @param {boolean} [option.globalKey=false] - Whether the Access Token can only be used by whitelisted IPs. False = whitelisted only.
 * @param {string} [key] - A private key provided by TransIP (created in the control panel). Can also be set as environment variable "TRANSIP_PRIVATE_KEY"
 */
const createToken = async (options, key) => {
  if (!options.login) {
    throw new Error("A valid 'login' is required");
  }
  if (!key && !process.env.TRANSIP_PRIVATE_KEY) {
    throw new Error(
      "No 'key' is provided. Pass private key as parameter or TRANSIP_PRIVATE_KEY env variable"
    );
  }

  const reqBody = JSON.stringify({
    login: options.login,
    nonce: createNonce(),
    read_only: options.readOnly ?? false,
    expiration_time: options.expirationTime || "30 minutes",
    label: options.label || "",
    global_key: options.globalKey ?? false,
  });

  const sign = crypto.createSign("SHA512");
  sign.update(reqBody);
  sign.end();
  const signature = sign.sign(
    checkAndFixKey(key || process.env.TRANSIP_PRIVATE_KEY),
    "base64"
  );

  const response = await fetch("https://api.transip.nl/v6/auth", {
    method: "POST",
    body: reqBody,
    headers: {
      Signature: signature,
      "Content-Type": "application/json",
    },
  });

  const parsed = await response.json();
  if (parsed.error) {
    throw new Error(`An error occurred when requesting token: ${parsed.error}`);
  }
  if (!parsed.token) {
    throw new Error(`No valid token was returned`);
  }
  return parsed.token;
};

module.exports = createToken;
