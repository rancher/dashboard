
# Update Select Components 

Make use of server-side pagination and filtering in components used to select resources.

In the UI there are places where the user is required to select a specific resource. These use the `LabeledSelect` component. A new select component `ResourceLabeledSelect` has been created that supports both the old method (fetch everything, display everything) and the new method (fetch only a page's worth of data, only show that page). This should replace usages of `LabeledSelect`.

Some additional configuration can be supplied, see the `paginatedResourceSettings` property / `ResourceLabeledSelectPaginateSettings` type for details.

*Examples*

- rancher/dashboard `shell/components/form/SecretSelector.vue`
- rancher/dashboard `shell/chart/rancher-backup/S3.vue`

## Checklist

1. `LabeledSelect` component has been replaced with `ResourceLabeledSelect`
1. Configuration has been supplied, given the resource type and requirements
1. Change has been validated when Server-Side Pagination is enabled via the `ui-sql-cache` Feature Flag   
