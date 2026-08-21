import { NAME as EXPLORER } from '@shell/config/product/explorer';

/**
 * The id the product registration builds for a page inside a group: `<product>-<group>-<page>`.
 * Pinned by a test, because nothing else would notice if the convention changed.
 */
export const OVERVIEW_NAV_ID = 'explorer-cert-manager-cert-manager-overview';

/**
 * Marks the overview page as the group's own landing page.
 *
 * `Group.vue` renders a child row only when the child is not an overview, and uses the overview
 * child as the link on the group header instead. So this makes clicking "Cert Manager" open the
 * overview without also listing "Overview" beneath it.
 *
 * The product registration API has no way to set this on a standalone page - `configurePageItem`
 * only auto-sets `overview`/`exact` for a group that has its own component (the flow added with the
 * product API). Moving the overview onto the group to earn it that way would lose the `ifHaveType`
 * gate that hides the whole group when cert-manager is not installed (groups take no `enable`). The store's
 * `virtualType` mutation merges by name, so this adds the one flag to the entry that
 * `extendProduct` already registered, leaving the gate intact.
 */
export function init(plugin: any, store: any) {
  const { virtualType } = plugin.DSL(store, EXPLORER);

  virtualType({
    name: OVERVIEW_NAV_ID, overview: true, exact: true
  });
}
