import { STATES } from '../../model/Account.js';

const VALID_STATES = new Set(Object.values(STATES));

const ALLOWED_TRANSITIONS = Object.freeze({
  [STATES.ACTIVE]: new Set([STATES.DEACTIVE, STATES.HIDE]),
  [STATES.DEACTIVE]: new Set([STATES.ACTIVE, STATES.HIDE]),
  [STATES.HIDE]: new Set(),
});

export function assertState(state) {
  if (!VALID_STATES.has(state)) {
    throw new Error(`Invalid state: ${state}`);
  }
}

export function assertStateTransition(fromState, toState) {
  assertState(fromState);
  assertState(toState);

  if (fromState === toState) {
    return;
  }

  const allowed = ALLOWED_TRANSITIONS[fromState];
  if (!allowed?.has(toState)) {
    throw new Error(`Invalid state transition: ${fromState} → ${toState}`);
  }
}
