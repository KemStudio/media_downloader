import {
  ACCOUNT_ID,
  CREATED_AT,
  ID,
  NAME,
  STATE,
  TOKEN_HASH,
  TOKEN_PREFIX,
  UPDATED_AT,
} from '../../model/AccessToken.js';

export function mapAccessToken(row) {
  if (!row) {
    return null;
  }

  return {
    [ID]: row[ID],
    [ACCOUNT_ID]: row[ACCOUNT_ID],
    [NAME]: row[NAME],
    [TOKEN_HASH]: row[TOKEN_HASH],
    [TOKEN_PREFIX]: row[TOKEN_PREFIX],
    [STATE]: row[STATE],
    [CREATED_AT]: row[CREATED_AT],
    [UPDATED_AT]: row[UPDATED_AT],
  };
}
