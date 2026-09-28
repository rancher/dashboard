/**
 * Takes the contents of the POD restarts value `1 (2m47s ago)` and splits it into `1` and `2m47s ago`
 */
export const POD_RESTARTS_REG_EX = /^(\d+)\s*\(([^)]+)\)/;

/**
 * POD restarts value can be split into two (restart count and last restarted).
 *
 * This is a special path that Vai uses to sort/filter on the first part (restart count)
 */
export const POD_RESTART_FIELD = 'metadata.fields[3][0]';

/**
 * POD restarts value can be split into two (restart count and last restarted).
 *
 * This is a special path that Vai uses to sort/filter on the first part (last restarted)
 */
export const POD_LAST_RESTART_FIELD = 'metadata.fields[3][1]';
