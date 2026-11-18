/**
 * Stub for `@rancher/auto-import`.
 *
 * At build time webpack replaces `@rancher/auto-import` with a generated virtual module that
 * registers everything under an extension's `models`/`edit`/`list`/`detail` folders. There is no
 * such file on disk, so Jest cannot resolve it — this stub stands in for it (see the
 * `moduleNameMapper` entry in jest.config.js) and lets tests import an extension's `index.ts`.
 */
module.exports = { importTypes: () => {} };
