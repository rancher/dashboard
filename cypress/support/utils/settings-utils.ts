/**
 * There's a small amount of mgmt settings that are public and will be returned when the user in unauthed. This represents that number.
 *
 * It doesn't need to be exact but should always be equal or more than the actual amount
 * (tests will check that the pre-authed setting count is less than this, and the post-authed count is greater than)
 *
 */
export const PARTIAL_SETTING_THRESHOLD = 13;
