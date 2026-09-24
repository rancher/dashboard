/**
 * Table Views - the query/column/group/export engine behind the toolbar shown above resource
 * tables (see @shell/components/TableViews/TableViewsBar).
 *
 * A "view" is a saved combination of a filter query, the visible columns and a group by field.
 * Everything here is pure so it can be unit tested and reused by the toolbar, the export menu
 * and the share-by-url handling. The shapes it passes around are in @shell/types/table-views.
 *
 * The whole surface, so that `@shell/utils/table-views` keeps meaning what it did before the
 * split - an extension importing it does not have to know how the file was broken up. Inside
 * the repo, import the part you actually use.
 */
export * from '@shell/utils/table-views/fields';
export * from '@shell/utils/table-views/query';
export * from '@shell/utils/table-views/filter-rows';
export * from '@shell/utils/table-views/server-filters';
export * from '@shell/utils/table-views/export';
export * from '@shell/utils/table-views/views';
