const isArray = require('lodash/isArray');
const pick = require('lodash/pick');
const util = require('util');
const plaid = require('./plaid');

/**
 * Wraps input in an array if needed.
 *
 * @param {*} input the data to be wrapped in array if needed.
 * @returns {*[]} an array based on the input.
 */
const toArray = input => (isArray(input) ? [...input] : [input]);

/**
 * Returns an array of objects that have only the given keys present.
 *
 * @param {(Object|Object[])} input a single object or an array of objects.
 * @param {string[]} keysToKeep the keys to keep in the sanitized objects.
 */
const sanitizeWith = (input, keysToKeep) =>
  toArray(input).map(obj => pick(obj, keysToKeep));

/**
 * Returns an array of sanitized accounts.
 *
 * @param {(Object|Object[])} accounts a single account or an array of accounts.
 */
const sanitizeAccounts = accounts =>
  sanitizeWith(accounts, [
    'id',
    'item_id',
    'user_id',
    'plaid_account_id',
    'name',
    'mask',
    'official_name',
    'current_balance',
    'available_balance',
    'iso_currency_code',
    'unofficial_currency_code',
    'ach_account',
    'ach_routing',
    'ach_wire_routing',
    'processor_token',
    'number_of_transfers',
    'owner_names',
    'emails',
    'type',
    'subtype',
    'created_at',
    'updated_at',
  ]);

/**
 * Returns an array of sanitized items.
 *
 * @param {(Object|Object[])} items a single item or an array of items.
 */
const sanitizeItems = items =>
  sanitizeWith(items, [
    'id',
    'user_id',
    'plaid_institution_id',
    'status',
    'plaid_account_id',
    'created_at',
    'updated_at',
  ]);

/**
 * Returns an array of sanitized users.
 *
 * @param {(Object|Object[])} users a single user or an array of users.
 */
const sanitizeUsers = users =>
  sanitizeWith(users, [
    'id',
    'username',
    'fullname',
    'email',
    'identity_check',
    'should_verify_identity',
    'created_at',
    'updated_at',
  ]);

const validItemStatuses = new Set(['good', 'bad']);
const isValidItemStatus = status => validItemStatuses.has(status);

const prettyPrintResponse = response => {
  console.log(util.inspect(response.data, { colors: true, depth: 4 }));
};

const getAuthAndIdentityAndCreateAccount = async (
  accessToken,
  account,
  isAuth,
  isIdentity
) => {
  // the request is the same for both auth and identity calls

  console.log(accessToken, account);
  const authAndIdRequest = {
    access_token: accessToken,
    options: {
      account_ids: [account.id],
    },
  };
  // identity info will remain null if not identity
  let emails = null;
  let ownerNames = null;

  // auth numbers will remain null if not auth
  let authNumbers = {
    account: null,
    routing: null,
    wire_routing: null,
  };

  // balances will be null if not auth or identity, only until the first transfer is made
  // and accounts/balance/get is called
  let balances = {
    available: null,
    current: null,
    iso_currency_code: null,
    unofficial_currency_code: null,
  };
  if (isIdentity) {
    const identityResponse = await plaid.identityGet(authAndIdRequest);
    emails = identityResponse.data.accounts[0].owners[0].emails.map(email => {
      return email.data;
    });

    ownerNames = identityResponse.data.accounts[0].owners[0].names;
    if (!isAuth) {
      balances = identityResponse.data.accounts[0].balances;
    }
  }
  // processorToken is only set if IS_PROCESSOR is true in .env file and
  // therefore isAuth is false
  let processorToken = null;

  if (isAuth) {
    authResponse = await plaid.authGet(authAndIdRequest);
    authNumbers = authResponse.data.numbers.ach[0];
    balances = authResponse.data.accounts[0].balances;
  } else {
    const processorRequest = {
      access_token: accessToken,
      account_id: account.id,
      processor: 'dwolla',
    };
    const processorTokenResponse = await plaid.processorTokenCreate(
      processorRequest
    );
    processorToken = processorTokenResponse.data.processor_token;
  }

  return {
    processorToken,
    emails,
    ownerNAmes,
    balances,
    authNumbers,
  };
};

module.exports = {
  toArray,
  sanitizeAccounts,
  sanitizeItems,
  sanitizeUsers,
  validItemStatuses,
  isValidItemStatus,
  prettyPrintResponse,
  getAuthAndIdentityAndCreateAccount,
};
