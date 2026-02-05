<script>
/**
 * ProjectSecretProxy
 *
 * This component acts as a bridge to allow the "Project Secrets" sidebar item to be highlighted correctly
 * while reusing the standard Secret creation/editing logic.
 *
 * How it works:
 * 1. The Sidebar logic highlights items based on the current route's resource (e.g., /explorer/projectsecret/...).
 * 2. The ResourceDetail loader looks for an edit component matching the resource name (shell/edit/projectsecret.vue).
 * 3. Without this file, the loader falls back to the default YAML editor.
 * 4. We cannot globally alias 'projectsecret' to 'secret' via `componentForType` because that would also
 *    redirect the List View to the generic Secret list, breaking the Project Secrets list logic.
 *
 * Therefore, this file exists solely to satisfy the component lookup for the Edit/Create view
 * and pass control to the standard Secret component.
 */
import Secret from '@shell/edit/secret/index.vue';

export default {
  name:         'ProjectSecretProxy',
  components:   { Secret },
  inheritAttrs: false,
};
</script>

<template>
  <Secret v-bind="$attrs" />
</template>
