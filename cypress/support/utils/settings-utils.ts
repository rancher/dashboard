/**
 * There's a small amount of mgmt settings that are public and will be returned when the user in unauthed. When logged in there will be more.
 *
 * This number is used to check that after log in we get all settings by checking that unauthed setting count is lower and authed settings count is at or greater than
 */
export const PARTIAL_SETTING_THRESHOLD = 13;
