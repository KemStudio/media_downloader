import {
  CREATED_AT,
  ID,
  PASSWORD_HASH,
  ROLE,
  STATE,
  UPDATED_AT,
  USERNAME,
} from '../../model/Account.js';

export function mapAccount(row) {
  if (!row) {
    return null;
  }

  return {
    [ID]: row[ID],
    [USERNAME]: row[USERNAME],
    [PASSWORD_HASH]: row[PASSWORD_HASH],
    [ROLE]: row[ROLE],
    [STATE]: row[STATE],
    [CREATED_AT]: row[CREATED_AT],
    [UPDATED_AT]: row[UPDATED_AT],
  };
}
