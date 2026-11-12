export function isUniqueConstraintError(error) {
  return (
    error?.code === 'SQLITE_CONSTRAINT_UNIQUE'
    || /UNIQUE constraint failed/i.test(String(error?.message ?? ''))
  );
}

export default {
  isUniqueConstraintError,
};
