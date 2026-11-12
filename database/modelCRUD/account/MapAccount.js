import {
  CREATED_AT,
  ID,
  IS_ACTIVE,
  PASSWORD_HASH,
  ROLE,
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
    [IS_ACTIVE]: Boolean(row[IS_ACTIVE]),
    [CREATED_AT]: row[CREATED_AT],
    [UPDATED_AT]: row[UPDATED_AT],
  };
}
