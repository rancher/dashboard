/* eslint-disable */
// Lazy registry of components for runtime-compiled custom-view SFCs.
//
// Every path here is resolved by webpack at BUILD time, so a path that does not exist in the
// host's shell fails the whole build. That makes this list version-bound: it was generated
// against @rancher/shell 3.0.13, and modules the shell has since moved or removed have to come
// out. SearchDialog, edit/.../tabs/Ingress and utils/cspAdaptor went that way.
//
// @shell/components: exposed via require.context (sync) — mapped by ctx.keys() (lists only)
// and executed on demand when the SFC imports one. Eager execution disrupts the app.
//
// @components (rancher-components): exposed via EXPLICIT imports of every component. We do
// NOT require.context this package — doing so pulls the whole package (including its barrels)
// into a context that creates a circular dependency at chunk-init, crashing the registry
// before it resolves anything ("Cannot read properties of undefined (reading 'hasComponent')"
// / "Cannot access '<var>' before initialization"). Explicit single-module imports sidestep
// the cycle. Keep this list in sync with @components as it grows.
//
// DO NOT re-attempt the require.context('@components') wildcard: it was tried a second time
// AFTER this file was moved to its own async chunk (below) and STILL crashed with
// "Cannot access '<minified>' before initialization" on the deployed build. The async-chunk
// isolation is necessary but NOT sufficient; the package barrels are the problem.
//
// This file is loaded via a dynamic import from TemplateCode (its own async chunk); a
// static import would pull require.context into the page's sync init and cause circulars.
//
// Supported import forms (match real component code so pages can be copied verbatim):
//   import RcButton from 'RcButton'                          (bare name)
//   import Labels from '@shell/components/form/Labels'       (@shell full path)
//   import Banner, { Banner } from '@components/Banner'      (@components dir, default+named)
//   import { RcDropdown, RcDropdownItem } from '@components/RcDropdown'  (multiple named)

import Accordion from '@components/Accordion/Accordion.vue';
import BadgeState from '@components/BadgeState/BadgeState.vue';
import Banner from '@components/Banner/Banner.vue';
import Card from '@components/Card/Card.vue';
import Checkbox from '@components/Form/Checkbox/Checkbox.vue';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';
import RadioButton from '@components/Form/Radio/RadioButton.vue';
import RadioGroup from '@components/Form/Radio/RadioGroup.vue';
import TextAreaAutoGrow from '@components/Form/TextArea/TextAreaAutoGrow.vue';
import ToggleSwitch from '@components/Form/ToggleSwitch/ToggleSwitch.vue';
import LabeledTooltip from '@components/LabeledTooltip/LabeledTooltip.vue';
import RcCounterBadge from '@components/Pill/RcCounterBadge/RcCounterBadge.vue';
import RcStatusBadge from '@components/Pill/RcStatusBadge/RcStatusBadge.vue';
import RcStatusIndicator from '@components/Pill/RcStatusIndicator/RcStatusIndicator.vue';
import RcTag from '@components/Pill/RcTag/RcTag.vue';
import RcButton from '@components/RcButton/RcButton.vue';
import RcButtonSplit from '@components/RcButtonSplit/RcButtonSplit.vue';
import RcDropdown from '@components/RcDropdown/RcDropdown.vue';
import RcDropdownItem from '@components/RcDropdown/RcDropdownItem.vue';
import RcDropdownItemCheckbox from '@components/RcDropdown/RcDropdownItemCheckbox.vue';
import RcDropdownItemSelect from '@components/RcDropdown/RcDropdownItemSelect.vue';
import RcDropdownMenu from '@components/RcDropdown/RcDropdownMenu.vue';
import RcDropdownSeparator from '@components/RcDropdown/RcDropdownSeparator.vue';
import RcDropdownTrigger from '@components/RcDropdown/RcDropdownTrigger.vue';
import RcIcon from '@components/RcIcon/RcIcon.vue';
import RcItemCard from '@components/RcItemCard/RcItemCard.vue';
import RcItemCardAction from '@components/RcItemCard/RcItemCardAction.vue';
import RcSection from '@components/RcSection/RcSection.vue';
import RcSectionActions from '@components/RcSection/RcSectionActions.vue';
import RcSectionBadges from '@components/RcSection/RcSectionBadges.vue';
import RcSeparator from '@components/RcSeparator/RcSeparator.vue';
import StringList from '@components/StringList/StringList.vue';

// @shell MODULES — EXPLICIT imports, auto-generated from an SCC scan of the @shell import
// graph (see the require.context note above for why a wildcard cannot be used). Every
// module here is ACYCLIC (not part of an import cycle), so importing it explicitly is safe
// even when it transitively imports a cyclic cluster (webpack bundles those deps in the
// main chunk, as the app does). Covers utils, mixins, models, edit/detail/list, dialog,
// composables, chart, directives, cloud-credential, machine-config, promptRemove. In-cycle
// modules are excluded by construction. To refresh: run
//   node shell/config/templating/generate-registry.mjs
// and paste its IMPORTS/ENTRIES output over this block and the SHELL_MODULES array below.

var ctx = require.context('@shell/components', true, /^(?:(?!__tests__).)*\.vue$/);

// [import path, namespace module] for every explicitly-exposed @shell util. Registered by
// full path only (utils are imported by path + named export, never a bare name).
var SHELL_MODULES = [
  ['@shell/chart/example', () => require('@shell/chart/example')],
  ['@shell/chart/gatekeeper', () => require('@shell/chart/gatekeeper')],
  ['@shell/chart/istio', () => require('@shell/chart/istio')],
  ['@shell/chart/logging', () => require('@shell/chart/logging')],
  ['@shell/chart/monitoring/ClusterSelector', () => require('@shell/chart/monitoring/ClusterSelector')],
  ['@shell/chart/monitoring/StorageClassSelector', () => require('@shell/chart/monitoring/StorageClassSelector')],
  ['@shell/chart/monitoring/alerting', () => require('@shell/chart/monitoring/alerting')],
  ['@shell/chart/monitoring/grafana', () => require('@shell/chart/monitoring/grafana')],
  ['@shell/chart/monitoring', () => require('@shell/chart/monitoring')],
  ['@shell/chart/monitoring/prometheus', () => require('@shell/chart/monitoring/prometheus')],
  ['@shell/chart/rancher-backup/S3', () => require('@shell/chart/rancher-backup/S3')],
  ['@shell/chart/rancher-backup', () => require('@shell/chart/rancher-backup')],
  ['@shell/chart/rancher-monitoring-dashboards', () => require('@shell/chart/rancher-monitoring-dashboards')],
  ['@shell/cloud-credential/aws', () => require('@shell/cloud-credential/aws')],
  ['@shell/cloud-credential/azure', () => require('@shell/cloud-credential/azure')],
  ['@shell/cloud-credential/digitalocean', () => require('@shell/cloud-credential/digitalocean')],
  ['@shell/cloud-credential/gcp', () => require('@shell/cloud-credential/gcp')],
  ['@shell/cloud-credential/generic', () => require('@shell/cloud-credential/generic')],
  ['@shell/cloud-credential/harvester', () => require('@shell/cloud-credential/harvester')],
  ['@shell/cloud-credential/linode', () => require('@shell/cloud-credential/linode')],
  ['@shell/cloud-credential/pnap', () => require('@shell/cloud-credential/pnap')],
  ['@shell/cloud-credential/s3', () => require('@shell/cloud-credential/s3')],
  ['@shell/cloud-credential/vmwarevsphere', () => require('@shell/cloud-credential/vmwarevsphere')],
  ['@shell/composables/cruResource', () => require('@shell/composables/cruResource')],
  ['@shell/composables/drawer', () => require('@shell/composables/drawer')],
  ['@shell/composables/focusTrap', () => require('@shell/composables/focusTrap')],
  ['@shell/composables/resourceDetail', () => require('@shell/composables/resourceDetail')],
  ['@shell/composables/resources', () => require('@shell/composables/resources')],
  ['@shell/composables/useClickOutside', () => require('@shell/composables/useClickOutside')],
  ['@shell/composables/useCompactInput', () => require('@shell/composables/useCompactInput')],
  ['@shell/composables/useFormValidation', () => require('@shell/composables/useFormValidation')],
  ['@shell/composables/useHelmOpResources', () => require('@shell/composables/useHelmOpResources')],
  ['@shell/composables/useI18n', () => require('@shell/composables/useI18n')],
  ['@shell/composables/useInterval', () => require('@shell/composables/useInterval')],
  ['@shell/composables/useIsNewDetailPageEnabled', () => require('@shell/composables/useIsNewDetailPageEnabled')],
  ['@shell/composables/useLabeledFormElement', () => require('@shell/composables/useLabeledFormElement')],
  ['@shell/composables/useLabeledSelect', () => require('@shell/composables/useLabeledSelect')],
  ['@shell/composables/useRuntimeFlag', () => require('@shell/composables/useRuntimeFlag')],
  ['@shell/composables/useStateColor', () => require('@shell/composables/useStateColor')],
  ['@shell/composables/useUserRetentionValidation', () => require('@shell/composables/useUserRetentionValidation')],
  ['@shell/composables/useVeeValidateField', () => require('@shell/composables/useVeeValidateField')],
  ['@shell/detail/auditlog.cattle.io.auditpolicy', () => require('@shell/detail/auditlog.cattle.io.auditpolicy')],
  ['@shell/detail/autoscaling.horizontalpodautoscaler', () => require('@shell/detail/autoscaling.horizontalpodautoscaler')],
  ['@shell/detail/catalog.cattle.io.app', () => require('@shell/detail/catalog.cattle.io.app')],
  ['@shell/detail/catalog.cattle.io.clusterrepo', () => require('@shell/detail/catalog.cattle.io.clusterrepo')],
  ['@shell/detail/compliance.cattle.io.clusterscan', () => require('@shell/detail/compliance.cattle.io.clusterscan')],
  ['@shell/detail/configmap', () => require('@shell/detail/configmap')],
  ['@shell/detail/constraints.gatekeeper.sh.constraint', () => require('@shell/detail/constraints.gatekeeper.sh.constraint')],
  ['@shell/detail/fleet.cattle.io.bundle', () => require('@shell/detail/fleet.cattle.io.bundle')],
  ['@shell/detail/fleet.cattle.io.cluster', () => require('@shell/detail/fleet.cattle.io.cluster')],
  ['@shell/detail/fleet.cattle.io.clustergroup', () => require('@shell/detail/fleet.cattle.io.clustergroup')],
  ['@shell/detail/fleet.cattle.io.gitrepo', () => require('@shell/detail/fleet.cattle.io.gitrepo')],
  ['@shell/detail/fleet.cattle.io.helmop', () => require('@shell/detail/fleet.cattle.io.helmop')],
  ['@shell/detail/harvesterhci.io.management.cluster', () => require('@shell/detail/harvesterhci.io.management.cluster')],
  ['@shell/detail/helm.cattle.io.projecthelmchart', () => require('@shell/detail/helm.cattle.io.projecthelmchart')],
  ['@shell/detail/management.cattle.io.fleetworkspace', () => require('@shell/detail/management.cattle.io.fleetworkspace')],
  ['@shell/detail/management.cattle.io.globalrole', () => require('@shell/detail/management.cattle.io.globalrole')],
  ['@shell/detail/management.cattle.io.oidcclient', () => require('@shell/detail/management.cattle.io.oidcclient')],
  ['@shell/detail/management.cattle.io.roletemplate', () => require('@shell/detail/management.cattle.io.roletemplate')],
  ['@shell/detail/management.cattle.io.user', () => require('@shell/detail/management.cattle.io.user')],
  ['@shell/detail/namespace', () => require('@shell/detail/namespace')],
  ['@shell/detail/networking.k8s.io.ingress', () => require('@shell/detail/networking.k8s.io.ingress')],
  ['@shell/detail/node', () => require('@shell/detail/node')],
  ['@shell/detail/pod', () => require('@shell/detail/pod')],
  ['@shell/detail/projectsecret', () => require('@shell/detail/projectsecret')],
  ['@shell/detail/provisioning.cattle.io.cluster', () => require('@shell/detail/provisioning.cattle.io.cluster')],
  ['@shell/detail/rbac.authorization.k8s.io.clusterrole', () => require('@shell/detail/rbac.authorization.k8s.io.clusterrole')],
  ['@shell/detail/rbac.authorization.k8s.io.role', () => require('@shell/detail/rbac.authorization.k8s.io.role')],
  ['@shell/detail/secret', () => require('@shell/detail/secret')],
  ['@shell/detail/service', () => require('@shell/detail/service')],
  ['@shell/detail/workload', () => require('@shell/detail/workload')],
  ['@shell/dialog/AddClusterMemberDialog', () => require('@shell/dialog/AddClusterMemberDialog')],
  ['@shell/dialog/AddCustomBadgeDialog', () => require('@shell/dialog/AddCustomBadgeDialog')],
  ['@shell/dialog/AddExtensionReposDialog', () => require('@shell/dialog/AddExtensionReposDialog')],
  ['@shell/dialog/AddProjectMemberDialog', () => require('@shell/dialog/AddProjectMemberDialog')],
  ['@shell/dialog/AddonConfigConfirmationDialog', () => require('@shell/dialog/AddonConfigConfirmationDialog')],
  ['@shell/dialog/AssignToDialog', () => require('@shell/dialog/AssignToDialog')],
  ['@shell/dialog/ChangePasswordDialog', () => require('@shell/dialog/ChangePasswordDialog')],
  ['@shell/dialog/DeactivateDriverDialog', () => require('@shell/dialog/DeactivateDriverDialog')],
  ['@shell/dialog/DeveloperLoadExtensionDialog', () => require('@shell/dialog/DeveloperLoadExtensionDialog')],
  ['@shell/dialog/DiagnosticTimingsDialog', () => require('@shell/dialog/DiagnosticTimingsDialog')],
  ['@shell/dialog/DisableAuthProviderDialog', () => require('@shell/dialog/DisableAuthProviderDialog')],
  ['@shell/dialog/DrainNode', () => require('@shell/dialog/DrainNode')],
  ['@shell/dialog/ExtensionCatalogInstallDialog', () => require('@shell/dialog/ExtensionCatalogInstallDialog')],
  ['@shell/dialog/ExtensionCatalogUninstallDialog', () => require('@shell/dialog/ExtensionCatalogUninstallDialog')],
  ['@shell/dialog/FeatureFlagListDialog', () => require('@shell/dialog/FeatureFlagListDialog')],
  ['@shell/dialog/ForceMachineRemoveDialog', () => require('@shell/dialog/ForceMachineRemoveDialog')],
  ['@shell/dialog/GenericPrompt', () => require('@shell/dialog/GenericPrompt')],
  ['@shell/dialog/GitRepoForceUpdateDialog', () => require('@shell/dialog/GitRepoForceUpdateDialog')],
  ['@shell/dialog/HelmOpForceUpdateDialog', () => require('@shell/dialog/HelmOpForceUpdateDialog')],
  ['@shell/dialog/ImportDialog', () => require('@shell/dialog/ImportDialog')],
  ['@shell/dialog/InstallExtensionDialog', () => require('@shell/dialog/InstallExtensionDialog')],
  ['@shell/dialog/Ipv6NetworkingDialog', () => require('@shell/dialog/Ipv6NetworkingDialog')],
  ['@shell/dialog/KnownHostsEditDialog', () => require('@shell/dialog/KnownHostsEditDialog')],
  ['@shell/dialog/MoveNamespaceDialog', () => require('@shell/dialog/MoveNamespaceDialog')],
  ['@shell/dialog/OidcClientSecretDialog', () => require('@shell/dialog/OidcClientSecretDialog')],
  ['@shell/dialog/RedeployWorkloadDialog', () => require('@shell/dialog/RedeployWorkloadDialog')],
  ['@shell/dialog/RollbackWorkloadDialog', () => require('@shell/dialog/RollbackWorkloadDialog')],
  ['@shell/dialog/RotateCertificatesDialog', () => require('@shell/dialog/RotateCertificatesDialog')],
  ['@shell/dialog/RotateEncryptionKeyDialog', () => require('@shell/dialog/RotateEncryptionKeyDialog')],
  ['@shell/dialog/ScaleMachineDownDialog', () => require('@shell/dialog/ScaleMachineDownDialog')],
  ['@shell/dialog/ScalePoolDownDialog', () => require('@shell/dialog/ScalePoolDownDialog')],
  ['@shell/dialog/SloDialog', () => require('@shell/dialog/SloDialog')],
  ['@shell/dialog/UninstallExistingExtensionDialog', () => require('@shell/dialog/UninstallExistingExtensionDialog')],
  ['@shell/dialog/UninstallExtensionDialog', () => require('@shell/dialog/UninstallExtensionDialog')],
  ['@shell/dialog/WechatDialog', () => require('@shell/dialog/WechatDialog')],
  ['@shell/directives/clean-html', () => require('@shell/directives/clean-html')],
  ['@shell/directives/clean-tooltip', () => require('@shell/directives/clean-tooltip')],
  ['@shell/directives/focus', () => require('@shell/directives/focus')],
  ['@shell/directives/int-number', () => require('@shell/directives/int-number')],
  ['@shell/directives/positive-int-number', () => require('@shell/directives/positive-int-number')],
  ['@shell/directives/strip-html-aria-label', () => require('@shell/directives/strip-html-aria-label')],
  ['@shell/directives/trim-whitespace', () => require('@shell/directives/trim-whitespace')],
  ['@shell/directives/ui-context', () => require('@shell/directives/ui-context')],
  ['@shell/edit/auditlog.cattle.io.auditpolicy/AdditionalRedactions', () => require('@shell/edit/auditlog.cattle.io.auditpolicy/AdditionalRedactions')],
  ['@shell/edit/auditlog.cattle.io.auditpolicy/Filters', () => require('@shell/edit/auditlog.cattle.io.auditpolicy/Filters')],
  ['@shell/edit/auditlog.cattle.io.auditpolicy/General', () => require('@shell/edit/auditlog.cattle.io.auditpolicy/General')],
  ['@shell/edit/auditlog.cattle.io.auditpolicy', () => require('@shell/edit/auditlog.cattle.io.auditpolicy')],
  ['@shell/edit/auditlog.cattle.io.auditpolicy/types', () => require('@shell/edit/auditlog.cattle.io.auditpolicy/types')],
  ['@shell/edit/auth/AuthProviderWarningBanners', () => require('@shell/edit/auth/AuthProviderWarningBanners')],
  ['@shell/edit/auth/azuread', () => require('@shell/edit/auth/azuread')],
  ['@shell/edit/auth/github-app-steps', () => require('@shell/edit/auth/github-app-steps')],
  ['@shell/edit/auth/github-steps', () => require('@shell/edit/auth/github-steps')],
  ['@shell/edit/auth/github', () => require('@shell/edit/auth/github')],
  ['@shell/edit/auth/googleoauth', () => require('@shell/edit/auth/googleoauth')],
  ['@shell/edit/auth/ldap/config', () => require('@shell/edit/auth/ldap/config')],
  ['@shell/edit/auth/ldap', () => require('@shell/edit/auth/ldap')],
  ['@shell/edit/auth/oidc', () => require('@shell/edit/auth/oidc')],
  ['@shell/edit/auth/saml', () => require('@shell/edit/auth/saml')],
  ['@shell/edit/autoscaling.horizontalpodautoscaler/external-metric', () => require('@shell/edit/autoscaling.horizontalpodautoscaler/external-metric')],
  ['@shell/edit/autoscaling.horizontalpodautoscaler/hpa-scaling-rule', () => require('@shell/edit/autoscaling.horizontalpodautoscaler/hpa-scaling-rule')],
  ['@shell/edit/autoscaling.horizontalpodautoscaler', () => require('@shell/edit/autoscaling.horizontalpodautoscaler')],
  ['@shell/edit/autoscaling.horizontalpodautoscaler/metric-identifier', () => require('@shell/edit/autoscaling.horizontalpodautoscaler/metric-identifier')],
  ['@shell/edit/autoscaling.horizontalpodautoscaler/metric-object-reference', () => require('@shell/edit/autoscaling.horizontalpodautoscaler/metric-object-reference')],
  ['@shell/edit/autoscaling.horizontalpodautoscaler/metric-target', () => require('@shell/edit/autoscaling.horizontalpodautoscaler/metric-target')],
  ['@shell/edit/autoscaling.horizontalpodautoscaler/metrics-row', () => require('@shell/edit/autoscaling.horizontalpodautoscaler/metrics-row')],
  ['@shell/edit/autoscaling.horizontalpodautoscaler/object-metric', () => require('@shell/edit/autoscaling.horizontalpodautoscaler/object-metric')],
  ['@shell/edit/autoscaling.horizontalpodautoscaler/pod-metric', () => require('@shell/edit/autoscaling.horizontalpodautoscaler/pod-metric')],
  ['@shell/edit/autoscaling.horizontalpodautoscaler/resource-metric', () => require('@shell/edit/autoscaling.horizontalpodautoscaler/resource-metric')],
  ['@shell/edit/catalog.cattle.io.clusterrepo', () => require('@shell/edit/catalog.cattle.io.clusterrepo')],
  ['@shell/edit/cloudcredential', () => require('@shell/edit/cloudcredential')],
  ['@shell/edit/compliance.cattle.io.clusterscan', () => require('@shell/edit/compliance.cattle.io.clusterscan')],
  ['@shell/edit/compliance.cattle.io.clusterscanbenchmark', () => require('@shell/edit/compliance.cattle.io.clusterscanbenchmark')],
  ['@shell/edit/compliance.cattle.io.clusterscanprofile', () => require('@shell/edit/compliance.cattle.io.clusterscanprofile')],
  ['@shell/edit/configmap', () => require('@shell/edit/configmap')],
  ['@shell/edit/constraints.gatekeeper.sh.constraint/MatchKinds', () => require('@shell/edit/constraints.gatekeeper.sh.constraint/MatchKinds')],
  ['@shell/edit/constraints.gatekeeper.sh.constraint/NamespaceList', () => require('@shell/edit/constraints.gatekeeper.sh.constraint/NamespaceList')],
  ['@shell/edit/constraints.gatekeeper.sh.constraint/Scope', () => require('@shell/edit/constraints.gatekeeper.sh.constraint/Scope')],
  ['@shell/edit/constraints.gatekeeper.sh.constraint', () => require('@shell/edit/constraints.gatekeeper.sh.constraint')],
  ['@shell/edit/fleet.cattle.io.cluster', () => require('@shell/edit/fleet.cattle.io.cluster')],
  ['@shell/edit/fleet.cattle.io.clustergroup', () => require('@shell/edit/fleet.cattle.io.clustergroup')],
  ['@shell/edit/fleet.cattle.io.gitrepo', () => require('@shell/edit/fleet.cattle.io.gitrepo')],
  ['@shell/edit/fleet.cattle.io.helmop', () => require('@shell/edit/fleet.cattle.io.helmop')],
  ['@shell/edit/group.principal', () => require('@shell/edit/group.principal')],
  ['@shell/edit/helm.cattle.io.projecthelmchart', () => require('@shell/edit/helm.cattle.io.projecthelmchart')],
  ['@shell/edit/k8s.cni.cncf.io.networkattachmentdefinition', () => require('@shell/edit/k8s.cni.cncf.io.networkattachmentdefinition')],
  ['@shell/edit/kontainerDriver', () => require('@shell/edit/kontainerDriver')],
  ['@shell/edit/logging-flow/Match', () => require('@shell/edit/logging-flow/Match')],
  ['@shell/edit/logging-flow', () => require('@shell/edit/logging-flow')],
  ['@shell/edit/logging.banzaicloud.io.clusterflow', () => require('@shell/edit/logging.banzaicloud.io.clusterflow')],
  ['@shell/edit/logging.banzaicloud.io.clusteroutput', () => require('@shell/edit/logging.banzaicloud.io.clusteroutput')],
  ['@shell/edit/logging.banzaicloud.io.flow', () => require('@shell/edit/logging.banzaicloud.io.flow')],
  ['@shell/edit/logging.banzaicloud.io.output', () => require('@shell/edit/logging.banzaicloud.io.output')],
  ['@shell/edit/logging.banzaicloud.io.output/providers/awsElasticsearch', () => require('@shell/edit/logging.banzaicloud.io.output/providers/awsElasticsearch')],
  ['@shell/edit/logging.banzaicloud.io.output/providers/azurestorage', () => require('@shell/edit/logging.banzaicloud.io.output/providers/azurestorage')],
  ['@shell/edit/logging.banzaicloud.io.output/providers/cloudwatch', () => require('@shell/edit/logging.banzaicloud.io.output/providers/cloudwatch')],
  ['@shell/edit/logging.banzaicloud.io.output/providers/datadog', () => require('@shell/edit/logging.banzaicloud.io.output/providers/datadog')],
  ['@shell/edit/logging.banzaicloud.io.output/providers/elasticsearch', () => require('@shell/edit/logging.banzaicloud.io.output/providers/elasticsearch')],
  ['@shell/edit/logging.banzaicloud.io.output/providers/file', () => require('@shell/edit/logging.banzaicloud.io.output/providers/file')],
  ['@shell/edit/logging.banzaicloud.io.output/providers/forward', () => require('@shell/edit/logging.banzaicloud.io.output/providers/forward')],
  ['@shell/edit/logging.banzaicloud.io.output/providers/gcs', () => require('@shell/edit/logging.banzaicloud.io.output/providers/gcs')],
  ['@shell/edit/logging.banzaicloud.io.output/providers/gelf', () => require('@shell/edit/logging.banzaicloud.io.output/providers/gelf')],
  ['@shell/edit/logging.banzaicloud.io.output/providers/kafka', () => require('@shell/edit/logging.banzaicloud.io.output/providers/kafka')],
  ['@shell/edit/logging.banzaicloud.io.output/providers/kinesisStream', () => require('@shell/edit/logging.banzaicloud.io.output/providers/kinesisStream')],
  ['@shell/edit/logging.banzaicloud.io.output/providers/logdna', () => require('@shell/edit/logging.banzaicloud.io.output/providers/logdna')],
  ['@shell/edit/logging.banzaicloud.io.output/providers/logz', () => require('@shell/edit/logging.banzaicloud.io.output/providers/logz')],
  ['@shell/edit/logging.banzaicloud.io.output/providers/loki', () => require('@shell/edit/logging.banzaicloud.io.output/providers/loki')],
  ['@shell/edit/logging.banzaicloud.io.output/providers/newrelic', () => require('@shell/edit/logging.banzaicloud.io.output/providers/newrelic')],
  ['@shell/edit/logging.banzaicloud.io.output/providers/opensearch', () => require('@shell/edit/logging.banzaicloud.io.output/providers/opensearch')],
  ['@shell/edit/logging.banzaicloud.io.output/providers/redis', () => require('@shell/edit/logging.banzaicloud.io.output/providers/redis')],
  ['@shell/edit/logging.banzaicloud.io.output/providers/s3', () => require('@shell/edit/logging.banzaicloud.io.output/providers/s3')],
  ['@shell/edit/logging.banzaicloud.io.output/providers/splunkHec', () => require('@shell/edit/logging.banzaicloud.io.output/providers/splunkHec')],
  ['@shell/edit/logging.banzaicloud.io.output/providers/sumologic', () => require('@shell/edit/logging.banzaicloud.io.output/providers/sumologic')],
  ['@shell/edit/logging.banzaicloud.io.output/providers/syslog', () => require('@shell/edit/logging.banzaicloud.io.output/providers/syslog')],
  ['@shell/edit/logging.banzaicloud.io.output/providers/utils', () => require('@shell/edit/logging.banzaicloud.io.output/providers/utils')],
  ['@shell/edit/management.cattle.io.clusterroletemplatebinding', () => require('@shell/edit/management.cattle.io.clusterroletemplatebinding')],
  ['@shell/edit/management.cattle.io.fleetworkspace', () => require('@shell/edit/management.cattle.io.fleetworkspace')],
  ['@shell/edit/management.cattle.io.globalrole', () => require('@shell/edit/management.cattle.io.globalrole')],
  ['@shell/edit/management.cattle.io.node', () => require('@shell/edit/management.cattle.io.node')],
  ['@shell/edit/management.cattle.io.oidcclient', () => require('@shell/edit/management.cattle.io.oidcclient')],
  ['@shell/edit/management.cattle.io.podsecurityadmissionconfigurationtemplate', () => require('@shell/edit/management.cattle.io.podsecurityadmissionconfigurationtemplate')],
  ['@shell/edit/management.cattle.io.project', () => require('@shell/edit/management.cattle.io.project')],
  ['@shell/edit/management.cattle.io.projectroletemplatebinding', () => require('@shell/edit/management.cattle.io.projectroletemplatebinding')],
  ['@shell/edit/management.cattle.io.roletemplate', () => require('@shell/edit/management.cattle.io.roletemplate')],
  ['@shell/edit/management.cattle.io.setting/delete-machine-on-failure-after', () => require('@shell/edit/management.cattle.io.setting/delete-machine-on-failure-after')],
  ['@shell/edit/management.cattle.io.setting', () => require('@shell/edit/management.cattle.io.setting')],
  ['@shell/edit/management.cattle.io.setting/system-default-registry-pull-secrets', () => require('@shell/edit/management.cattle.io.setting/system-default-registry-pull-secrets')],
  ['@shell/edit/management.cattle.io.user', () => require('@shell/edit/management.cattle.io.user')],
  ['@shell/edit/monitoring.coreos.com.alertmanagerconfig/auth', () => require('@shell/edit/monitoring.coreos.com.alertmanagerconfig/auth')],
  ['@shell/edit/monitoring.coreos.com.alertmanagerconfig', () => require('@shell/edit/monitoring.coreos.com.alertmanagerconfig')],
  ['@shell/edit/monitoring.coreos.com.alertmanagerconfig/receiverConfig', () => require('@shell/edit/monitoring.coreos.com.alertmanagerconfig/receiverConfig')],
  ['@shell/edit/monitoring.coreos.com.alertmanagerconfig/routeConfig', () => require('@shell/edit/monitoring.coreos.com.alertmanagerconfig/routeConfig')],
  ['@shell/edit/monitoring.coreos.com.alertmanagerconfig/tls', () => require('@shell/edit/monitoring.coreos.com.alertmanagerconfig/tls')],
  ['@shell/edit/monitoring.coreos.com.alertmanagerconfig/types/email', () => require('@shell/edit/monitoring.coreos.com.alertmanagerconfig/types/email')],
  ['@shell/edit/monitoring.coreos.com.alertmanagerconfig/types/opsgenie', () => require('@shell/edit/monitoring.coreos.com.alertmanagerconfig/types/opsgenie')],
  ['@shell/edit/monitoring.coreos.com.alertmanagerconfig/types/pagerduty', () => require('@shell/edit/monitoring.coreos.com.alertmanagerconfig/types/pagerduty')],
  ['@shell/edit/monitoring.coreos.com.alertmanagerconfig/types/slack', () => require('@shell/edit/monitoring.coreos.com.alertmanagerconfig/types/slack')],
  ['@shell/edit/monitoring.coreos.com.alertmanagerconfig/types/webhook', () => require('@shell/edit/monitoring.coreos.com.alertmanagerconfig/types/webhook')],
  ['@shell/edit/monitoring.coreos.com.prometheusrule/AlertingRule', () => require('@shell/edit/monitoring.coreos.com.prometheusrule/AlertingRule')],
  ['@shell/edit/monitoring.coreos.com.prometheusrule/GroupRules', () => require('@shell/edit/monitoring.coreos.com.prometheusrule/GroupRules')],
  ['@shell/edit/monitoring.coreos.com.prometheusrule/RecordingRule', () => require('@shell/edit/monitoring.coreos.com.prometheusrule/RecordingRule')],
  ['@shell/edit/monitoring.coreos.com.prometheusrule', () => require('@shell/edit/monitoring.coreos.com.prometheusrule')],
  ['@shell/edit/monitoring.coreos.com.receiver/auth', () => require('@shell/edit/monitoring.coreos.com.receiver/auth')],
  ['@shell/edit/monitoring.coreos.com.receiver', () => require('@shell/edit/monitoring.coreos.com.receiver')],
  ['@shell/edit/monitoring.coreos.com.receiver/tls', () => require('@shell/edit/monitoring.coreos.com.receiver/tls')],
  ['@shell/edit/monitoring.coreos.com.receiver/types/email', () => require('@shell/edit/monitoring.coreos.com.receiver/types/email')],
  ['@shell/edit/monitoring.coreos.com.receiver/types/opsgenie', () => require('@shell/edit/monitoring.coreos.com.receiver/types/opsgenie')],
  ['@shell/edit/monitoring.coreos.com.receiver/types/pagerduty', () => require('@shell/edit/monitoring.coreos.com.receiver/types/pagerduty')],
  ['@shell/edit/monitoring.coreos.com.receiver/types/slack', () => require('@shell/edit/monitoring.coreos.com.receiver/types/slack')],
  ['@shell/edit/monitoring.coreos.com.receiver/types/webhook.add', () => require('@shell/edit/monitoring.coreos.com.receiver/types/webhook.add')],
  ['@shell/edit/monitoring.coreos.com.receiver/types/webhook.banner', () => require('@shell/edit/monitoring.coreos.com.receiver/types/webhook.banner')],
  ['@shell/edit/monitoring.coreos.com.receiver/types/webhook', () => require('@shell/edit/monitoring.coreos.com.receiver/types/webhook')],
  ['@shell/edit/monitoring.coreos.com.route', () => require('@shell/edit/monitoring.coreos.com.route')],
  ['@shell/edit/namespace', () => require('@shell/edit/namespace')],
  ['@shell/edit/networking.istio.io.destinationrule/LoadBalancer', () => require('@shell/edit/networking.istio.io.destinationrule/LoadBalancer')],
  ['@shell/edit/networking.istio.io.destinationrule', () => require('@shell/edit/networking.istio.io.destinationrule')],
  ['@shell/edit/networking.k8s.io.ingress/Certificate', () => require('@shell/edit/networking.k8s.io.ingress/Certificate')],
  ['@shell/edit/networking.k8s.io.ingress/Certificates', () => require('@shell/edit/networking.k8s.io.ingress/Certificates')],
  ['@shell/edit/networking.k8s.io.ingress/DefaultBackend', () => require('@shell/edit/networking.k8s.io.ingress/DefaultBackend')],
  ['@shell/edit/networking.k8s.io.ingress/IngressClass', () => require('@shell/edit/networking.k8s.io.ingress/IngressClass')],
  ['@shell/edit/networking.k8s.io.ingress/Rule', () => require('@shell/edit/networking.k8s.io.ingress/Rule')],
  ['@shell/edit/networking.k8s.io.ingress/RulePath', () => require('@shell/edit/networking.k8s.io.ingress/RulePath')],
  ['@shell/edit/networking.k8s.io.ingress/Rules', () => require('@shell/edit/networking.k8s.io.ingress/Rules')],
  ['@shell/edit/networking.k8s.io.ingress', () => require('@shell/edit/networking.k8s.io.ingress')],
  ['@shell/edit/networking.k8s.io.networkpolicy/PolicyRule', () => require('@shell/edit/networking.k8s.io.networkpolicy/PolicyRule')],
  ['@shell/edit/networking.k8s.io.networkpolicy/PolicyRulePort', () => require('@shell/edit/networking.k8s.io.networkpolicy/PolicyRulePort')],
  ['@shell/edit/networking.k8s.io.networkpolicy/PolicyRuleTarget', () => require('@shell/edit/networking.k8s.io.networkpolicy/PolicyRuleTarget')],
  ['@shell/edit/networking.k8s.io.networkpolicy/PolicyRules', () => require('@shell/edit/networking.k8s.io.networkpolicy/PolicyRules')],
  ['@shell/edit/networking.k8s.io.networkpolicy', () => require('@shell/edit/networking.k8s.io.networkpolicy')],
  ['@shell/edit/node', () => require('@shell/edit/node')],
  ['@shell/edit/nodeDriver', () => require('@shell/edit/nodeDriver')],
  ['@shell/edit/persistentvolume', () => require('@shell/edit/persistentvolume')],
  ['@shell/edit/persistentvolume/plugins/awsElasticBlockStore', () => require('@shell/edit/persistentvolume/plugins/awsElasticBlockStore')],
  ['@shell/edit/persistentvolume/plugins/azureDisk', () => require('@shell/edit/persistentvolume/plugins/azureDisk')],
  ['@shell/edit/persistentvolume/plugins/azureFile', () => require('@shell/edit/persistentvolume/plugins/azureFile')],
  ['@shell/edit/persistentvolume/plugins/cephfs', () => require('@shell/edit/persistentvolume/plugins/cephfs')],
  ['@shell/edit/persistentvolume/plugins/cinder', () => require('@shell/edit/persistentvolume/plugins/cinder')],
  ['@shell/edit/persistentvolume/plugins/csi', () => require('@shell/edit/persistentvolume/plugins/csi')],
  ['@shell/edit/persistentvolume/plugins/fc', () => require('@shell/edit/persistentvolume/plugins/fc')],
  ['@shell/edit/persistentvolume/plugins/flexVolume', () => require('@shell/edit/persistentvolume/plugins/flexVolume')],
  ['@shell/edit/persistentvolume/plugins/flocker', () => require('@shell/edit/persistentvolume/plugins/flocker')],
  ['@shell/edit/persistentvolume/plugins/gcePersistentDisk', () => require('@shell/edit/persistentvolume/plugins/gcePersistentDisk')],
  ['@shell/edit/persistentvolume/plugins/glusterfs', () => require('@shell/edit/persistentvolume/plugins/glusterfs')],
  ['@shell/edit/persistentvolume/plugins/hostPath', () => require('@shell/edit/persistentvolume/plugins/hostPath')],
  ['@shell/edit/persistentvolume/plugins/iscsi', () => require('@shell/edit/persistentvolume/plugins/iscsi')],
  ['@shell/edit/persistentvolume/plugins/local', () => require('@shell/edit/persistentvolume/plugins/local')],
  ['@shell/edit/persistentvolume/plugins/longhorn', () => require('@shell/edit/persistentvolume/plugins/longhorn')],
  ['@shell/edit/persistentvolume/plugins/nfs', () => require('@shell/edit/persistentvolume/plugins/nfs')],
  ['@shell/edit/persistentvolume/plugins/photonPersistentDisk', () => require('@shell/edit/persistentvolume/plugins/photonPersistentDisk')],
  ['@shell/edit/persistentvolume/plugins/portworxVolume', () => require('@shell/edit/persistentvolume/plugins/portworxVolume')],
  ['@shell/edit/persistentvolume/plugins/quobyte', () => require('@shell/edit/persistentvolume/plugins/quobyte')],
  ['@shell/edit/persistentvolume/plugins/rbd', () => require('@shell/edit/persistentvolume/plugins/rbd')],
  ['@shell/edit/persistentvolume/plugins/scaleIO', () => require('@shell/edit/persistentvolume/plugins/scaleIO')],
  ['@shell/edit/persistentvolume/plugins/storageos', () => require('@shell/edit/persistentvolume/plugins/storageos')],
  ['@shell/edit/persistentvolume/plugins/vsphereVolume', () => require('@shell/edit/persistentvolume/plugins/vsphereVolume')],
  ['@shell/edit/persistentvolumeclaim', () => require('@shell/edit/persistentvolumeclaim')],
  ['@shell/edit/pod', () => require('@shell/edit/pod')],
  ['@shell/edit/policy.poddisruptionbudget', () => require('@shell/edit/policy.poddisruptionbudget')],
  ['@shell/edit/projectsecret', () => require('@shell/edit/projectsecret')],
  ['@shell/edit/provisioning.cattle.io.cluster/AgentEnv', () => require('@shell/edit/provisioning.cattle.io.cluster/AgentEnv')],
  ['@shell/edit/provisioning.cattle.io.cluster/CustomCommand', () => require('@shell/edit/provisioning.cattle.io.cluster/CustomCommand')],
  ['@shell/edit/provisioning.cattle.io.cluster/Labels', () => require('@shell/edit/provisioning.cattle.io.cluster/Labels')],
  ['@shell/edit/provisioning.cattle.io.cluster/SelectCredential', () => require('@shell/edit/provisioning.cattle.io.cluster/SelectCredential')],
  ['@shell/edit/provisioning.cattle.io.cluster', () => require('@shell/edit/provisioning.cattle.io.cluster')],
  ['@shell/edit/provisioning.cattle.io.cluster/ingress/IngressCards', () => require('@shell/edit/provisioning.cattle.io.cluster/ingress/IngressCards')],
  ['@shell/edit/provisioning.cattle.io.cluster/ingress/IngressConfiguration', () => require('@shell/edit/provisioning.cattle.io.cluster/ingress/IngressConfiguration')],
  ['@shell/edit/provisioning.cattle.io.cluster/rke2', () => require('@shell/edit/provisioning.cattle.io.cluster/rke2')],
  ['@shell/edit/provisioning.cattle.io.cluster/shared', () => require('@shell/edit/provisioning.cattle.io.cluster/shared')],
  ['@shell/edit/provisioning.cattle.io.cluster/subtype-detection', () => require('@shell/edit/provisioning.cattle.io.cluster/subtype-detection')],
  ['@shell/edit/provisioning.cattle.io.cluster/tabs/AddOnAdditionalManifest', () => require('@shell/edit/provisioning.cattle.io.cluster/tabs/AddOnAdditionalManifest')],
  ['@shell/edit/provisioning.cattle.io.cluster/tabs/AddOnConfig', () => require('@shell/edit/provisioning.cattle.io.cluster/tabs/AddOnConfig')],
  ['@shell/edit/provisioning.cattle.io.cluster/tabs/Advanced', () => require('@shell/edit/provisioning.cattle.io.cluster/tabs/Advanced')],
  ['@shell/edit/provisioning.cattle.io.cluster/tabs/AgentConfiguration', () => require('@shell/edit/provisioning.cattle.io.cluster/tabs/AgentConfiguration')],
  ['@shell/edit/provisioning.cattle.io.cluster/tabs/Basics', () => require('@shell/edit/provisioning.cattle.io.cluster/tabs/Basics')],
  ['@shell/edit/provisioning.cattle.io.cluster/tabs/DirectoryConfig', () => require('@shell/edit/provisioning.cattle.io.cluster/tabs/DirectoryConfig')],
  ['@shell/edit/provisioning.cattle.io.cluster/tabs/MachinePool', () => require('@shell/edit/provisioning.cattle.io.cluster/tabs/MachinePool')],
  ['@shell/edit/provisioning.cattle.io.cluster/tabs/MemberRoles', () => require('@shell/edit/provisioning.cattle.io.cluster/tabs/MemberRoles')],
  ['@shell/edit/provisioning.cattle.io.cluster/tabs/etcd/S3Config', () => require('@shell/edit/provisioning.cattle.io.cluster/tabs/etcd/S3Config')],
  ['@shell/edit/provisioning.cattle.io.cluster/tabs/etcd', () => require('@shell/edit/provisioning.cattle.io.cluster/tabs/etcd')],
  ['@shell/edit/provisioning.cattle.io.cluster/tabs/networking/ACE', () => require('@shell/edit/provisioning.cattle.io.cluster/tabs/networking/ACE')],
  ['@shell/edit/provisioning.cattle.io.cluster/tabs/networking', () => require('@shell/edit/provisioning.cattle.io.cluster/tabs/networking')],
  ['@shell/edit/provisioning.cattle.io.cluster/tabs/registries/RegistryConfigs', () => require('@shell/edit/provisioning.cattle.io.cluster/tabs/registries/RegistryConfigs')],
  ['@shell/edit/provisioning.cattle.io.cluster/tabs/registries/RegistryMirrors', () => require('@shell/edit/provisioning.cattle.io.cluster/tabs/registries/RegistryMirrors')],
  ['@shell/edit/provisioning.cattle.io.cluster/tabs/registries', () => require('@shell/edit/provisioning.cattle.io.cluster/tabs/registries')],
  ['@shell/edit/provisioning.cattle.io.cluster/tabs/upgrade/DrainOptions', () => require('@shell/edit/provisioning.cattle.io.cluster/tabs/upgrade/DrainOptions')],
  ['@shell/edit/provisioning.cattle.io.cluster/tabs/upgrade', () => require('@shell/edit/provisioning.cattle.io.cluster/tabs/upgrade')],
  ['@shell/edit/rbac.authorization.k8s.io.clusterrole', () => require('@shell/edit/rbac.authorization.k8s.io.clusterrole')],
  ['@shell/edit/rbac.authorization.k8s.io.role', () => require('@shell/edit/rbac.authorization.k8s.io.role')],
  ['@shell/edit/resources.cattle.io.backup', () => require('@shell/edit/resources.cattle.io.backup')],
  ['@shell/edit/resources.cattle.io.restore', () => require('@shell/edit/resources.cattle.io.restore')],
  ['@shell/edit/secret/basic', () => require('@shell/edit/secret/basic')],
  ['@shell/edit/secret/generic', () => require('@shell/edit/secret/generic')],
  ['@shell/edit/secret', () => require('@shell/edit/secret')],
  ['@shell/edit/secret/registry', () => require('@shell/edit/secret/registry')],
  ['@shell/edit/secret/ssh', () => require('@shell/edit/secret/ssh')],
  ['@shell/edit/secret/tls', () => require('@shell/edit/secret/tls')],
  ['@shell/edit/service', () => require('@shell/edit/service')],
  ['@shell/edit/serviceaccount', () => require('@shell/edit/serviceaccount')],
  ['@shell/edit/storage.k8s.io.storageclass', () => require('@shell/edit/storage.k8s.io.storageclass')],
  ['@shell/edit/storage.k8s.io.storageclass/provisioners/custom', () => require('@shell/edit/storage.k8s.io.storageclass/provisioners/custom')],
  ['@shell/edit/storage.k8s.io.storageclass/provisioners/driver.harvesterhci.io', () => require('@shell/edit/storage.k8s.io.storageclass/provisioners/driver.harvesterhci.io')],
  ['@shell/edit/storage.k8s.io.storageclass/provisioners/driver.longhorn.io', () => require('@shell/edit/storage.k8s.io.storageclass/provisioners/driver.longhorn.io')],
  ['@shell/edit/storage.k8s.io.storageclass/provisioners/kubernetes.io/aws-ebs', () => require('@shell/edit/storage.k8s.io.storageclass/provisioners/kubernetes.io/aws-ebs')],
  ['@shell/edit/storage.k8s.io.storageclass/provisioners/kubernetes.io/azure-disk', () => require('@shell/edit/storage.k8s.io.storageclass/provisioners/kubernetes.io/azure-disk')],
  ['@shell/edit/storage.k8s.io.storageclass/provisioners/kubernetes.io/azure-file', () => require('@shell/edit/storage.k8s.io.storageclass/provisioners/kubernetes.io/azure-file')],
  ['@shell/edit/storage.k8s.io.storageclass/provisioners/kubernetes.io/cinder', () => require('@shell/edit/storage.k8s.io.storageclass/provisioners/kubernetes.io/cinder')],
  ['@shell/edit/storage.k8s.io.storageclass/provisioners/kubernetes.io/gce-pd', () => require('@shell/edit/storage.k8s.io.storageclass/provisioners/kubernetes.io/gce-pd')],
  ['@shell/edit/storage.k8s.io.storageclass/provisioners/kubernetes.io/glusterfs', () => require('@shell/edit/storage.k8s.io.storageclass/provisioners/kubernetes.io/glusterfs')],
  ['@shell/edit/storage.k8s.io.storageclass/provisioners/kubernetes.io/no-provisioner', () => require('@shell/edit/storage.k8s.io.storageclass/provisioners/kubernetes.io/no-provisioner')],
  ['@shell/edit/storage.k8s.io.storageclass/provisioners/kubernetes.io/portworx-volume', () => require('@shell/edit/storage.k8s.io.storageclass/provisioners/kubernetes.io/portworx-volume')],
  ['@shell/edit/storage.k8s.io.storageclass/provisioners/kubernetes.io/quobyte', () => require('@shell/edit/storage.k8s.io.storageclass/provisioners/kubernetes.io/quobyte')],
  ['@shell/edit/storage.k8s.io.storageclass/provisioners/kubernetes.io/rbd', () => require('@shell/edit/storage.k8s.io.storageclass/provisioners/kubernetes.io/rbd')],
  ['@shell/edit/storage.k8s.io.storageclass/provisioners/kubernetes.io/scaleio', () => require('@shell/edit/storage.k8s.io.storageclass/provisioners/kubernetes.io/scaleio')],
  ['@shell/edit/storage.k8s.io.storageclass/provisioners/kubernetes.io/storageos', () => require('@shell/edit/storage.k8s.io.storageclass/provisioners/kubernetes.io/storageos')],
  ['@shell/edit/storage.k8s.io.storageclass/provisioners/kubernetes.io/vsphere-volume', () => require('@shell/edit/storage.k8s.io.storageclass/provisioners/kubernetes.io/vsphere-volume')],
  ['@shell/edit/token', () => require('@shell/edit/token')],
  ['@shell/edit/ui.cattle.io.navlink', () => require('@shell/edit/ui.cattle.io.navlink')],
  ['@shell/edit/workload/Job', () => require('@shell/edit/workload/Job')],
  ['@shell/edit/workload/Upgrading', () => require('@shell/edit/workload/Upgrading')],
  ['@shell/edit/workload/VolumeClaimTemplate', () => require('@shell/edit/workload/VolumeClaimTemplate')],
  ['@shell/edit/workload', () => require('@shell/edit/workload')],
  ['@shell/edit/workload/mixins/workload', () => require('@shell/edit/workload/mixins/workload')],
  ['@shell/edit/workload/storage/ContainerMountPaths', () => require('@shell/edit/workload/storage/ContainerMountPaths')],
  ['@shell/edit/workload/storage/Mount', () => require('@shell/edit/workload/storage/Mount')],
  ['@shell/edit/workload/storage/awsElasticBlockStore', () => require('@shell/edit/workload/storage/awsElasticBlockStore')],
  ['@shell/edit/workload/storage/azureDisk', () => require('@shell/edit/workload/storage/azureDisk')],
  ['@shell/edit/workload/storage/azureFile', () => require('@shell/edit/workload/storage/azureFile')],
  ['@shell/edit/workload/storage/csi/driver.longhorn.io', () => require('@shell/edit/workload/storage/csi/driver.longhorn.io')],
  ['@shell/edit/workload/storage/csi', () => require('@shell/edit/workload/storage/csi')],
  ['@shell/edit/workload/storage/emptyDir', () => require('@shell/edit/workload/storage/emptyDir')],
  ['@shell/edit/workload/storage/ephemeralVolume', () => require('@shell/edit/workload/storage/ephemeralVolume')],
  ['@shell/edit/workload/storage/gcePersistentDisk', () => require('@shell/edit/workload/storage/gcePersistentDisk')],
  ['@shell/edit/workload/storage/hostPath', () => require('@shell/edit/workload/storage/hostPath')],
  ['@shell/edit/workload/storage', () => require('@shell/edit/workload/storage')],
  ['@shell/edit/workload/storage/nfs', () => require('@shell/edit/workload/storage/nfs')],
  ['@shell/edit/workload/storage/persistentVolumeClaim', () => require('@shell/edit/workload/storage/persistentVolumeClaim')],
  ['@shell/edit/workload/storage/persistentVolumeClaim/persistentvolumeclaim', () => require('@shell/edit/workload/storage/persistentVolumeClaim/persistentvolumeclaim')],
  ['@shell/edit/workload/storage/secret', () => require('@shell/edit/workload/storage/secret')],
  ['@shell/edit/workload/storage/vsphereVolume', () => require('@shell/edit/workload/storage/vsphereVolume')],
  ['@shell/list/auditlog.cattle.io.auditpolicy', () => require('@shell/list/auditlog.cattle.io.auditpolicy')],
  ['@shell/list/catalog.cattle.io.app', () => require('@shell/list/catalog.cattle.io.app')],
  ['@shell/list/catalog.cattle.io.clusterrepo', () => require('@shell/list/catalog.cattle.io.clusterrepo')],
  ['@shell/list/compliance.cattle.io.clusterscan', () => require('@shell/list/compliance.cattle.io.clusterscan')],
  ['@shell/list/ext.cattle.io.kubeconfig', () => require('@shell/list/ext.cattle.io.kubeconfig')],
  ['@shell/list/fleet.cattle.io.bundle', () => require('@shell/list/fleet.cattle.io.bundle')],
  ['@shell/list/fleet.cattle.io.cluster', () => require('@shell/list/fleet.cattle.io.cluster')],
  ['@shell/list/fleet.cattle.io.clustergroup', () => require('@shell/list/fleet.cattle.io.clustergroup')],
  ['@shell/list/fleet.cattle.io.clusterregistrationtoken', () => require('@shell/list/fleet.cattle.io.clusterregistrationtoken')],
  ['@shell/list/fleet.cattle.io.gitrepo', () => require('@shell/list/fleet.cattle.io.gitrepo')],
  ['@shell/list/fleet.cattle.io.helmop', () => require('@shell/list/fleet.cattle.io.helmop')],
  ['@shell/list/group.principal', () => require('@shell/list/group.principal')],
  ['@shell/list/harvesterhci.io.management.cluster', () => require('@shell/list/harvesterhci.io.management.cluster')],
  ['@shell/list/helm.cattle.io.projecthelmchart', () => require('@shell/list/helm.cattle.io.projecthelmchart')],
  ['@shell/list/logging.banzaicloud.io.clusterflow', () => require('@shell/list/logging.banzaicloud.io.clusterflow')],
  ['@shell/list/logging.banzaicloud.io.flow', () => require('@shell/list/logging.banzaicloud.io.flow')],
  ['@shell/list/management.cattle.io.cluster', () => require('@shell/list/management.cattle.io.cluster')],
  ['@shell/list/management.cattle.io.feature', () => require('@shell/list/management.cattle.io.feature')],
  ['@shell/list/management.cattle.io.fleetworkspace', () => require('@shell/list/management.cattle.io.fleetworkspace')],
  ['@shell/list/management.cattle.io.oidcclient', () => require('@shell/list/management.cattle.io.oidcclient')],
  ['@shell/list/management.cattle.io.podsecurityadmissionconfigurationtemplate', () => require('@shell/list/management.cattle.io.podsecurityadmissionconfigurationtemplate')],
  ['@shell/list/management.cattle.io.setting', () => require('@shell/list/management.cattle.io.setting')],
  ['@shell/list/management.cattle.io.user', () => require('@shell/list/management.cattle.io.user')],
  ['@shell/list/monitoring.coreos.com.alertmanagerconfig', () => require('@shell/list/monitoring.coreos.com.alertmanagerconfig')],
  ['@shell/list/namespace', () => require('@shell/list/namespace')],
  ['@shell/list/networking.k8s.io.ingress', () => require('@shell/list/networking.k8s.io.ingress')],
  ['@shell/list/node', () => require('@shell/list/node')],
  ['@shell/list/persistentvolume', () => require('@shell/list/persistentvolume')],
  ['@shell/list/persistentvolumeclaim', () => require('@shell/list/persistentvolumeclaim')],
  ['@shell/list/projectsecret', () => require('@shell/list/projectsecret')],
  ['@shell/list/provisioning.cattle.io.cluster', () => require('@shell/list/provisioning.cattle.io.cluster')],
  ['@shell/list/rbac.authorization.k8s.io.clusterrolebinding', () => require('@shell/list/rbac.authorization.k8s.io.clusterrolebinding')],
  ['@shell/list/secret', () => require('@shell/list/secret')],
  ['@shell/list/service', () => require('@shell/list/service')],
  ['@shell/list/ui.cattle.io.navlink', () => require('@shell/list/ui.cattle.io.navlink')],
  ['@shell/list/utils/management.cattle.io.cluster.utils', () => require('@shell/list/utils/management.cattle.io.cluster.utils')],
  ['@shell/list/workload', () => require('@shell/list/workload')],
  ['@shell/machine-config/amazonec2', () => require('@shell/machine-config/amazonec2')],
  ['@shell/machine-config/azure', () => require('@shell/machine-config/azure')],
  ['@shell/machine-config/components/EC2Networking', () => require('@shell/machine-config/components/EC2Networking')],
  ['@shell/machine-config/components/GCEImage', () => require('@shell/machine-config/components/GCEImage')],
  ['@shell/machine-config/digitalocean', () => require('@shell/machine-config/digitalocean')],
  ['@shell/machine-config/generic', () => require('@shell/machine-config/generic')],
  ['@shell/machine-config/google', () => require('@shell/machine-config/google')],
  ['@shell/machine-config/linode', () => require('@shell/machine-config/linode')],
  ['@shell/machine-config/pnap', () => require('@shell/machine-config/pnap')],
  ['@shell/machine-config/vmwarevsphere-config', () => require('@shell/machine-config/vmwarevsphere-config')],
  ['@shell/machine-config/vmwarevsphere', () => require('@shell/machine-config/vmwarevsphere')],
  ['@shell/mixins/auth-config', () => require('@shell/mixins/auth-config')],
  ['@shell/mixins/back-link', () => require('@shell/mixins/back-link')],
  ['@shell/mixins/brand', () => require('@shell/mixins/brand')],
  ['@shell/mixins/browser-tab-visibility', () => require('@shell/mixins/browser-tab-visibility')],
  ['@shell/mixins/chart', () => require('@shell/mixins/chart')],
  ['@shell/mixins/child-hook', () => require('@shell/mixins/child-hook')],
  ['@shell/mixins/closeable', () => require('@shell/mixins/closeable')],
  ['@shell/mixins/compact-input', () => require('@shell/mixins/compact-input')],
  ['@shell/mixins/create-edit-view/impl', () => require('@shell/mixins/create-edit-view/impl')],
  ['@shell/mixins/create-edit-view', () => require('@shell/mixins/create-edit-view')],
  ['@shell/mixins/fetch.client', () => require('@shell/mixins/fetch.client')],
  ['@shell/mixins/form-validation', () => require('@shell/mixins/form-validation')],
  ['@shell/mixins/login', () => require('@shell/mixins/login')],
  ['@shell/mixins/metric-poller', () => require('@shell/mixins/metric-poller')],
  ['@shell/mixins/page-actions', () => require('@shell/mixins/page-actions')],
  ['@shell/mixins/preset', () => require('@shell/mixins/preset')],
  ['@shell/mixins/resource-fetch-api-pagination', () => require('@shell/mixins/resource-fetch-api-pagination')],
  ['@shell/mixins/resource-fetch-namespaced', () => require('@shell/mixins/resource-fetch-namespaced')],
  ['@shell/mixins/resource-fetch', () => require('@shell/mixins/resource-fetch')],
  ['@shell/mixins/resource-manager', () => require('@shell/mixins/resource-manager')],
  ['@shell/mixins/resource-table-watch', () => require('@shell/mixins/resource-table-watch')],
  ['@shell/mixins/vue-select-overrides', () => require('@shell/mixins/vue-select-overrides')],
  ['@shell/models/apiextensions.k8s.io.customresourcedefinition', () => require('@shell/models/apiextensions.k8s.io.customresourcedefinition')],
  ['@shell/models/app', () => require('@shell/models/app')],
  ['@shell/models/apps.controllerrevision', () => require('@shell/models/apps.controllerrevision')],
  ['@shell/models/apps.daemonset', () => require('@shell/models/apps.daemonset')],
  ['@shell/models/apps.deployment', () => require('@shell/models/apps.deployment')],
  ['@shell/models/apps.replicaset', () => require('@shell/models/apps.replicaset')],
  ['@shell/models/apps.statefulset', () => require('@shell/models/apps.statefulset')],
  ['@shell/models/auditlog.cattle.io.auditpolicy', () => require('@shell/models/auditlog.cattle.io.auditpolicy')],
  ['@shell/models/autoscaling.horizontalpodautoscaler', () => require('@shell/models/autoscaling.horizontalpodautoscaler')],
  ['@shell/models/base-cluster.x-k8s.io', () => require('@shell/models/base-cluster.x-k8s.io')],
  ['@shell/models/batch.cronjob', () => require('@shell/models/batch.cronjob')],
  ['@shell/models/batch.job', () => require('@shell/models/batch.job')],
  ['@shell/models/catalog.cattle.io.app', () => require('@shell/models/catalog.cattle.io.app')],
  ['@shell/models/catalog.cattle.io.clusterrepo', () => require('@shell/models/catalog.cattle.io.clusterrepo')],
  ['@shell/models/catalog.cattle.io.operation', () => require('@shell/models/catalog.cattle.io.operation')],
  ['@shell/models/catalog.cattle.io.repo', () => require('@shell/models/catalog.cattle.io.repo')],
  ['@shell/models/catalog.cattle.io.uiplugin', () => require('@shell/models/catalog.cattle.io.uiplugin')],
  ['@shell/models/chart', () => require('@shell/models/chart')],
  ['@shell/models/chartinstallaction', () => require('@shell/models/chartinstallaction')],
  ['@shell/models/chartupgradeaction', () => require('@shell/models/chartupgradeaction')],
  ['@shell/models/cloudcredential', () => require('@shell/models/cloudcredential')],
  ['@shell/models/cluster', () => require('@shell/models/cluster')],
  ['@shell/models/cluster.x-k8s.io.machine', () => require('@shell/models/cluster.x-k8s.io.machine')],
  ['@shell/models/cluster.x-k8s.io.machinedeployment', () => require('@shell/models/cluster.x-k8s.io.machinedeployment')],
  ['@shell/models/cluster.x-k8s.io.machineset', () => require('@shell/models/cluster.x-k8s.io.machineset')],
  ['@shell/models/cluster/node', () => require('@shell/models/cluster/node')],
  ['@shell/models/cluster/schema', () => require('@shell/models/cluster/schema')],
  ['@shell/models/clusterroletemplatebinding', () => require('@shell/models/clusterroletemplatebinding')],
  ['@shell/models/compliance.cattle.io.clusterscan', () => require('@shell/models/compliance.cattle.io.clusterscan')],
  ['@shell/models/compliance.cattle.io.clusterscanbenchmark', () => require('@shell/models/compliance.cattle.io.clusterscanbenchmark')],
  ['@shell/models/compliance.cattle.io.clusterscanprofile', () => require('@shell/models/compliance.cattle.io.clusterscanprofile')],
  ['@shell/models/compliance.cattle.io.clusterscanreport', () => require('@shell/models/compliance.cattle.io.clusterscanreport')],
  ['@shell/models/configmap', () => require('@shell/models/configmap')],
  ['@shell/models/constraints.gatekeeper.sh.constraint', () => require('@shell/models/constraints.gatekeeper.sh.constraint')],
  ['@shell/models/driver', () => require('@shell/models/driver')],
  ['@shell/models/event', () => require('@shell/models/event')],
  ['@shell/models/ext.cattle.io.groupmembershiprefreshrequest', () => require('@shell/models/ext.cattle.io.groupmembershiprefreshrequest')],
  ['@shell/models/ext.cattle.io.kubeconfig', () => require('@shell/models/ext.cattle.io.kubeconfig')],
  ['@shell/models/ext.cattle.io.passwordchangerequest', () => require('@shell/models/ext.cattle.io.passwordchangerequest')],
  ['@shell/models/ext.cattle.io.selfuser', () => require('@shell/models/ext.cattle.io.selfuser')],
  ['@shell/models/fleet-application', () => require('@shell/models/fleet-application')],
  ['@shell/models/fleet.cattle.io.bundle', () => require('@shell/models/fleet.cattle.io.bundle')],
  ['@shell/models/fleet.cattle.io.cluster', () => require('@shell/models/fleet.cattle.io.cluster')],
  ['@shell/models/fleet.cattle.io.clustergroup', () => require('@shell/models/fleet.cattle.io.clustergroup')],
  ['@shell/models/fleet.cattle.io.clusterregistrationtoken', () => require('@shell/models/fleet.cattle.io.clusterregistrationtoken')],
  ['@shell/models/fleet.cattle.io.gitrepo', () => require('@shell/models/fleet.cattle.io.gitrepo')],
  ['@shell/models/fleet.cattle.io.helmop', () => require('@shell/models/fleet.cattle.io.helmop')],
  ['@shell/models/group.principal', () => require('@shell/models/group.principal')],
  ['@shell/models/helm.cattle.io.projecthelmchart', () => require('@shell/models/helm.cattle.io.projecthelmchart')],
  ['@shell/models/k8s.cni.cncf.io.networkattachmentdefinition', () => require('@shell/models/k8s.cni.cncf.io.networkattachmentdefinition')],
  ['@shell/models/kontainerdriver', () => require('@shell/models/kontainerdriver')],
  ['@shell/models/logging.banzaicloud.io.clusterflow', () => require('@shell/models/logging.banzaicloud.io.clusterflow')],
  ['@shell/models/logging.banzaicloud.io.clusteroutput', () => require('@shell/models/logging.banzaicloud.io.clusteroutput')],
  ['@shell/models/logging.banzaicloud.io.flow', () => require('@shell/models/logging.banzaicloud.io.flow')],
  ['@shell/models/logging.banzaicloud.io.output', () => require('@shell/models/logging.banzaicloud.io.output')],
  ['@shell/models/management.cattle.io.authconfig', () => require('@shell/models/management.cattle.io.authconfig')],
  ['@shell/models/management.cattle.io.cluster', () => require('@shell/models/management.cattle.io.cluster')],
  ['@shell/models/management.cattle.io.clusterroletemplatebinding', () => require('@shell/models/management.cattle.io.clusterroletemplatebinding')],
  ['@shell/models/management.cattle.io.feature', () => require('@shell/models/management.cattle.io.feature')],
  ['@shell/models/management.cattle.io.fleetworkspace', () => require('@shell/models/management.cattle.io.fleetworkspace')],
  ['@shell/models/management.cattle.io.gitreporestriction', () => require('@shell/models/management.cattle.io.gitreporestriction')],
  ['@shell/models/management.cattle.io.globalrole', () => require('@shell/models/management.cattle.io.globalrole')],
  ['@shell/models/management.cattle.io.globalrolebinding', () => require('@shell/models/management.cattle.io.globalrolebinding')],
  ['@shell/models/management.cattle.io.kontainerdriver', () => require('@shell/models/management.cattle.io.kontainerdriver')],
  ['@shell/models/management.cattle.io.node', () => require('@shell/models/management.cattle.io.node')],
  ['@shell/models/management.cattle.io.nodepool', () => require('@shell/models/management.cattle.io.nodepool')],
  ['@shell/models/management.cattle.io.nodetemplate', () => require('@shell/models/management.cattle.io.nodetemplate')],
  ['@shell/models/management.cattle.io.oidcclient', () => require('@shell/models/management.cattle.io.oidcclient')],
  ['@shell/models/management.cattle.io.podsecurityadmissionconfigurationtemplate', () => require('@shell/models/management.cattle.io.podsecurityadmissionconfigurationtemplate')],
  ['@shell/models/management.cattle.io.project', () => require('@shell/models/management.cattle.io.project')],
  ['@shell/models/management.cattle.io.projectroletemplatebinding', () => require('@shell/models/management.cattle.io.projectroletemplatebinding')],
  ['@shell/models/management.cattle.io.registration', () => require('@shell/models/management.cattle.io.registration')],
  ['@shell/models/management.cattle.io.roletemplate', () => require('@shell/models/management.cattle.io.roletemplate')],
  ['@shell/models/management.cattle.io.setting', () => require('@shell/models/management.cattle.io.setting')],
  ['@shell/models/management.cattle.io.user', () => require('@shell/models/management.cattle.io.user')],
  ['@shell/models/management/schema', () => require('@shell/models/management/schema')],
  ['@shell/models/metrics.k8s.io.nodemetrics', () => require('@shell/models/metrics.k8s.io.nodemetrics')],
  ['@shell/models/monitoring.coreos.com.alertmanagerconfig', () => require('@shell/models/monitoring.coreos.com.alertmanagerconfig')],
  ['@shell/models/monitoring.coreos.com.podmonitor', () => require('@shell/models/monitoring.coreos.com.podmonitor')],
  ['@shell/models/monitoring.coreos.com.prometheusrule', () => require('@shell/models/monitoring.coreos.com.prometheusrule')],
  ['@shell/models/monitoring.coreos.com.receiver', () => require('@shell/models/monitoring.coreos.com.receiver')],
  ['@shell/models/monitoring.coreos.com.servicemonitor', () => require('@shell/models/monitoring.coreos.com.servicemonitor')],
  ['@shell/models/networking.istio.io.destinationrule', () => require('@shell/models/networking.istio.io.destinationrule')],
  ['@shell/models/networking.k8s.io.ingress', () => require('@shell/models/networking.k8s.io.ingress')],
  ['@shell/models/nodedriver', () => require('@shell/models/nodedriver')],
  ['@shell/models/persistentvolume', () => require('@shell/models/persistentvolume')],
  ['@shell/models/persistentvolumeclaim', () => require('@shell/models/persistentvolumeclaim')],
  ['@shell/models/pod', () => require('@shell/models/pod')],
  ['@shell/models/principal', () => require('@shell/models/principal')],
  ['@shell/models/projectroletemplatebinding', () => require('@shell/models/projectroletemplatebinding')],
  ['@shell/models/provisioning.cattle.io.cluster', () => require('@shell/models/provisioning.cattle.io.cluster')],
  ['@shell/models/rbac.authorization.k8s.io.clusterrole', () => require('@shell/models/rbac.authorization.k8s.io.clusterrole')],
  ['@shell/models/rbac.authorization.k8s.io.clusterrolebinding', () => require('@shell/models/rbac.authorization.k8s.io.clusterrolebinding')],
  ['@shell/models/rbac.authorization.k8s.io.role', () => require('@shell/models/rbac.authorization.k8s.io.role')],
  ['@shell/models/rbac.authorization.k8s.io.rolebinding', () => require('@shell/models/rbac.authorization.k8s.io.rolebinding')],
  ['@shell/models/replicationcontroller', () => require('@shell/models/replicationcontroller')],
  ['@shell/models/resources.cattle.io.backup', () => require('@shell/models/resources.cattle.io.backup')],
  ['@shell/models/resources.cattle.io.restore', () => require('@shell/models/resources.cattle.io.restore')],
  ['@shell/models/rke-machine-config.cattle.io.harvesterconfig', () => require('@shell/models/rke-machine-config.cattle.io.harvesterconfig')],
  ['@shell/models/rke-machine.cattle.io.amazonec2machinetemplate', () => require('@shell/models/rke-machine.cattle.io.amazonec2machinetemplate')],
  ['@shell/models/rke-machine.cattle.io.azuremachinetemplate', () => require('@shell/models/rke-machine.cattle.io.azuremachinetemplate')],
  ['@shell/models/rke-machine.cattle.io.digitaloceanmachinetemplate', () => require('@shell/models/rke-machine.cattle.io.digitaloceanmachinetemplate')],
  ['@shell/models/rke-machine.cattle.io.linodemachinetemplate', () => require('@shell/models/rke-machine.cattle.io.linodemachinetemplate')],
  ['@shell/models/rke-machine.cattle.io.machinetemplate', () => require('@shell/models/rke-machine.cattle.io.machinetemplate')],
  ['@shell/models/rke-machine.cattle.io.pnapmachinetemplate', () => require('@shell/models/rke-machine.cattle.io.pnapmachinetemplate')],
  ['@shell/models/rke-machine.cattle.io.vmwarevspheremachinetemplate', () => require('@shell/models/rke-machine.cattle.io.vmwarevspheremachinetemplate')],
  ['@shell/models/rke.cattle.io.etcdsnapshot', () => require('@shell/models/rke.cattle.io.etcdsnapshot')],
  ['@shell/models/secret', () => require('@shell/models/secret')],
  ['@shell/models/service', () => require('@shell/models/service')],
  ['@shell/models/steve-schema', () => require('@shell/models/steve-schema')],
  ['@shell/models/storage.k8s.io.storageclass', () => require('@shell/models/storage.k8s.io.storageclass')],
  ['@shell/models/templates.gatekeeper.sh.constrainttemplate', () => require('@shell/models/templates.gatekeeper.sh.constrainttemplate')],
  ['@shell/models/token', () => require('@shell/models/token')],
  ['@shell/models/ui.cattle.io.navlink', () => require('@shell/models/ui.cattle.io.navlink')],
  ['@shell/models/workload', () => require('@shell/models/workload')],
  ['@shell/models/workload.service', () => require('@shell/models/workload.service')],
  ['@shell/pages/404', () => require('@shell/pages/404')],
  ['@shell/pages/about', () => require('@shell/pages/about')],
  ['@shell/pages/account/create-key', () => require('@shell/pages/account/create-key')],
  ['@shell/pages/account', () => require('@shell/pages/account')],
  ['@shell/pages/auth/login', () => require('@shell/pages/auth/login')],
  ['@shell/pages/auth/logout', () => require('@shell/pages/auth/logout')],
  ['@shell/pages/auth/setup', () => require('@shell/pages/auth/setup')],
  ['@shell/pages/auth/verify', () => require('@shell/pages/auth/verify')],
  ['@shell/pages/c/_cluster/_product/_resource/_id', () => require('@shell/pages/c/_cluster/_product/_resource/_id')],
  ['@shell/pages/c/_cluster/_product/_resource/_namespace/_id', () => require('@shell/pages/c/_cluster/_product/_resource/_namespace/_id')],
  ['@shell/pages/c/_cluster/_product/_resource/create', () => require('@shell/pages/c/_cluster/_product/_resource/create')],
  ['@shell/pages/c/_cluster/_product/_resource', () => require('@shell/pages/c/_cluster/_product/_resource')],
  ['@shell/pages/c/_cluster/_product', () => require('@shell/pages/c/_cluster/_product')],
  ['@shell/pages/c/_cluster/_product/members', () => require('@shell/pages/c/_cluster/_product/members')],
  ['@shell/pages/c/_cluster/_product/namespaces', () => require('@shell/pages/c/_cluster/_product/namespaces')],
  ['@shell/pages/c/_cluster/_product/projectsnamespaces', () => require('@shell/pages/c/_cluster/_product/projectsnamespaces')],
  ['@shell/pages/c/_cluster/apps/charts/AddRepoLink', () => require('@shell/pages/c/_cluster/apps/charts/AddRepoLink')],
  ['@shell/pages/c/_cluster/apps/charts/AppChartCardFooter', () => require('@shell/pages/c/_cluster/apps/charts/AppChartCardFooter')],
  ['@shell/pages/c/_cluster/apps/charts/AppChartCardSubHeader', () => require('@shell/pages/c/_cluster/apps/charts/AppChartCardSubHeader')],
  ['@shell/pages/c/_cluster/apps/charts/StatusLabel', () => require('@shell/pages/c/_cluster/apps/charts/StatusLabel')],
  ['@shell/pages/c/_cluster/apps/charts/chart', () => require('@shell/pages/c/_cluster/apps/charts/chart')],
  ['@shell/pages/c/_cluster/apps/charts', () => require('@shell/pages/c/_cluster/apps/charts')],
  ['@shell/pages/c/_cluster/apps/charts/install.helpers', () => require('@shell/pages/c/_cluster/apps/charts/install.helpers')],
  ['@shell/pages/c/_cluster/apps/charts/install', () => require('@shell/pages/c/_cluster/apps/charts/install')],
  ['@shell/pages/c/_cluster/auth/config/_id', () => require('@shell/pages/c/_cluster/auth/config/_id')],
  ['@shell/pages/c/_cluster/auth/config', () => require('@shell/pages/c/_cluster/auth/config')],
  ['@shell/pages/c/_cluster/auth/group.principal/assign-edit', () => require('@shell/pages/c/_cluster/auth/group.principal/assign-edit')],
  ['@shell/pages/c/_cluster/auth/roles/_resource/_id', () => require('@shell/pages/c/_cluster/auth/roles/_resource/_id')],
  ['@shell/pages/c/_cluster/auth/roles/_resource/create', () => require('@shell/pages/c/_cluster/auth/roles/_resource/create')],
  ['@shell/pages/c/_cluster/auth/roles', () => require('@shell/pages/c/_cluster/auth/roles')],
  ['@shell/pages/c/_cluster/auth/user.retention', () => require('@shell/pages/c/_cluster/auth/user.retention')],
  ['@shell/pages/c/_cluster/ecm', () => require('@shell/pages/c/_cluster/ecm')],
  ['@shell/pages/c/_cluster/explorer/ConfigBadge', () => require('@shell/pages/c/_cluster/explorer/ConfigBadge')],
  ['@shell/pages/c/_cluster/explorer/EventsTable', () => require('@shell/pages/c/_cluster/explorer/EventsTable')],
  ['@shell/pages/c/_cluster/explorer/explorer-utils', () => require('@shell/pages/c/_cluster/explorer/explorer-utils')],
  ['@shell/pages/c/_cluster/explorer', () => require('@shell/pages/c/_cluster/explorer')],
  ['@shell/pages/c/_cluster/explorer/projectsecret', () => require('@shell/pages/c/_cluster/explorer/projectsecret')],
  ['@shell/pages/c/_cluster/explorer/tools', () => require('@shell/pages/c/_cluster/explorer/tools')],
  ['@shell/pages/c/_cluster/explorer/workload-dashboard/ByNamespaceSection', () => require('@shell/pages/c/_cluster/explorer/workload-dashboard/ByNamespaceSection')],
  ['@shell/pages/c/_cluster/explorer/workload-dashboard/ByStateSection', () => require('@shell/pages/c/_cluster/explorer/workload-dashboard/ByStateSection')],
  ['@shell/pages/c/_cluster/explorer/workload-dashboard/ByTypeSection', () => require('@shell/pages/c/_cluster/explorer/workload-dashboard/ByTypeSection')],
  ['@shell/pages/c/_cluster/explorer/workload-dashboard/WorkloadCard', () => require('@shell/pages/c/_cluster/explorer/workload-dashboard/WorkloadCard')],
  ['@shell/pages/c/_cluster/explorer/workload-dashboard/WorkloadNamespaceCard', () => require('@shell/pages/c/_cluster/explorer/workload-dashboard/WorkloadNamespaceCard')],
  ['@shell/pages/c/_cluster/explorer/workload-dashboard/WorkloadTypeCard', () => require('@shell/pages/c/_cluster/explorer/workload-dashboard/WorkloadTypeCard')],
  ['@shell/pages/c/_cluster/explorer/workload-dashboard/composable', () => require('@shell/pages/c/_cluster/explorer/workload-dashboard/composable')],
  ['@shell/pages/c/_cluster/explorer/workload-dashboard', () => require('@shell/pages/c/_cluster/explorer/workload-dashboard')],
  ['@shell/pages/c/_cluster/explorer/workload-dashboard/types', () => require('@shell/pages/c/_cluster/explorer/workload-dashboard/types')],
  ['@shell/pages/c/_cluster/fleet/application/_resource/_id', () => require('@shell/pages/c/_cluster/fleet/application/_resource/_id')],
  ['@shell/pages/c/_cluster/fleet/application/_resource/create', () => require('@shell/pages/c/_cluster/fleet/application/_resource/create')],
  ['@shell/pages/c/_cluster/fleet/application/create', () => require('@shell/pages/c/_cluster/fleet/application/create')],
  ['@shell/pages/c/_cluster/fleet/application', () => require('@shell/pages/c/_cluster/fleet/application')],
  ['@shell/pages/c/_cluster/fleet/application/suse-app-collection/ChartDetailBody', () => require('@shell/pages/c/_cluster/fleet/application/suse-app-collection/ChartDetailBody')],
  ['@shell/pages/c/_cluster/fleet/application/suse-app-collection/ChartDetailHeader', () => require('@shell/pages/c/_cluster/fleet/application/suse-app-collection/ChartDetailHeader')],
  ['@shell/pages/c/_cluster/fleet/application/suse-app-collection/chart', () => require('@shell/pages/c/_cluster/fleet/application/suse-app-collection/chart')],
  ['@shell/pages/c/_cluster/fleet/application/suse-app-collection/charts', () => require('@shell/pages/c/_cluster/fleet/application/suse-app-collection/charts')],
  ['@shell/pages/c/_cluster/fleet/application/suse-app-collection/credentials', () => require('@shell/pages/c/_cluster/fleet/application/suse-app-collection/credentials')],
  ['@shell/pages/c/_cluster/fleet/graph/config', () => require('@shell/pages/c/_cluster/fleet/graph/config')],
  ['@shell/pages/c/_cluster/fleet', () => require('@shell/pages/c/_cluster/fleet')],
  ['@shell/pages/c/_cluster/fleet/settings', () => require('@shell/pages/c/_cluster/fleet/settings')],
  ['@shell/pages/c/_cluster/gatekeeper/constraints', () => require('@shell/pages/c/_cluster/gatekeeper/constraints')],
  ['@shell/pages/c/_cluster/gatekeeper', () => require('@shell/pages/c/_cluster/gatekeeper')],
  ['@shell/pages/c/_cluster/istio', () => require('@shell/pages/c/_cluster/istio')],
  ['@shell/pages/c/_cluster/logging', () => require('@shell/pages/c/_cluster/logging')],
  ['@shell/pages/c/_cluster/longhorn', () => require('@shell/pages/c/_cluster/longhorn')],
  ['@shell/pages/c/_cluster/manager/cloudCredential/_id', () => require('@shell/pages/c/_cluster/manager/cloudCredential/_id')],
  ['@shell/pages/c/_cluster/manager/cloudCredential/create', () => require('@shell/pages/c/_cluster/manager/cloudCredential/create')],
  ['@shell/pages/c/_cluster/manager/cloudCredential', () => require('@shell/pages/c/_cluster/manager/cloudCredential')],
  ['@shell/pages/c/_cluster/manager/drivers/kontainerDriver/_id', () => require('@shell/pages/c/_cluster/manager/drivers/kontainerDriver/_id')],
  ['@shell/pages/c/_cluster/manager/drivers/kontainerDriver/create', () => require('@shell/pages/c/_cluster/manager/drivers/kontainerDriver/create')],
  ['@shell/pages/c/_cluster/manager/drivers/kontainerDriver', () => require('@shell/pages/c/_cluster/manager/drivers/kontainerDriver')],
  ['@shell/pages/c/_cluster/manager/drivers/nodeDriver/_id', () => require('@shell/pages/c/_cluster/manager/drivers/nodeDriver/_id')],
  ['@shell/pages/c/_cluster/manager/drivers/nodeDriver/create', () => require('@shell/pages/c/_cluster/manager/drivers/nodeDriver/create')],
  ['@shell/pages/c/_cluster/manager/drivers/nodeDriver', () => require('@shell/pages/c/_cluster/manager/drivers/nodeDriver')],
  ['@shell/pages/c/_cluster/manager/hostedprovider', () => require('@shell/pages/c/_cluster/manager/hostedprovider')],
  ['@shell/pages/c/_cluster/manager/jwt.authentication', () => require('@shell/pages/c/_cluster/manager/jwt.authentication')],
  ['@shell/pages/c/_cluster/monitoring/alertmanagerconfig/_alertmanagerconfigid', () => require('@shell/pages/c/_cluster/monitoring/alertmanagerconfig/_alertmanagerconfigid')],
  ['@shell/pages/c/_cluster/monitoring/alertmanagerconfig/_alertmanagerconfigid/receiver', () => require('@shell/pages/c/_cluster/monitoring/alertmanagerconfig/_alertmanagerconfigid/receiver')],
  ['@shell/pages/c/_cluster/monitoring/alertmanagerconfig', () => require('@shell/pages/c/_cluster/monitoring/alertmanagerconfig')],
  ['@shell/pages/c/_cluster/monitoring', () => require('@shell/pages/c/_cluster/monitoring')],
  ['@shell/pages/c/_cluster/monitoring/monitor/_namespace/_id', () => require('@shell/pages/c/_cluster/monitoring/monitor/_namespace/_id')],
  ['@shell/pages/c/_cluster/monitoring/monitor/create', () => require('@shell/pages/c/_cluster/monitoring/monitor/create')],
  ['@shell/pages/c/_cluster/monitoring/monitor', () => require('@shell/pages/c/_cluster/monitoring/monitor')],
  ['@shell/pages/c/_cluster/monitoring/route-receiver/_id', () => require('@shell/pages/c/_cluster/monitoring/route-receiver/_id')],
  ['@shell/pages/c/_cluster/monitoring/route-receiver/create', () => require('@shell/pages/c/_cluster/monitoring/route-receiver/create')],
  ['@shell/pages/c/_cluster/monitoring/route-receiver', () => require('@shell/pages/c/_cluster/monitoring/route-receiver')],
  ['@shell/pages/c/_cluster/navlinks/_group', () => require('@shell/pages/c/_cluster/navlinks/_group')],
  ['@shell/pages/c/_cluster/neuvector', () => require('@shell/pages/c/_cluster/neuvector')],
  ['@shell/pages/c/_cluster/settings/DefaultLinksEditor', () => require('@shell/pages/c/_cluster/settings/DefaultLinksEditor')],
  ['@shell/pages/c/_cluster/settings/banners', () => require('@shell/pages/c/_cluster/settings/banners')],
  ['@shell/pages/c/_cluster/settings/brand', () => require('@shell/pages/c/_cluster/settings/brand')],
  ['@shell/pages/c/_cluster/settings', () => require('@shell/pages/c/_cluster/settings')],
  ['@shell/pages/c/_cluster/settings/links', () => require('@shell/pages/c/_cluster/settings/links')],
  ['@shell/pages/c/_cluster/settings/performance', () => require('@shell/pages/c/_cluster/settings/performance')],
  ['@shell/pages/c/_cluster/uiplugins/CatalogList', () => require('@shell/pages/c/_cluster/uiplugins/CatalogList')],
  ['@shell/pages/c/_cluster/uiplugins/PluginInfoPanel', () => require('@shell/pages/c/_cluster/uiplugins/PluginInfoPanel')],
  ['@shell/pages/c/_cluster/uiplugins/SetupUIPlugins', () => require('@shell/pages/c/_cluster/uiplugins/SetupUIPlugins')],
  ['@shell/pages/c/_cluster/uiplugins/catalogs', () => require('@shell/pages/c/_cluster/uiplugins/catalogs')],
  ['@shell/pages/c/_cluster/uiplugins', () => require('@shell/pages/c/_cluster/uiplugins')],
  ['@shell/pages/clusters', () => require('@shell/pages/clusters')],
  ['@shell/pages/diagnostic', () => require('@shell/pages/diagnostic')],
  ['@shell/pages/fail-whale', () => require('@shell/pages/fail-whale')],
  ['@shell/pages/home', () => require('@shell/pages/home')],
  ['@shell/pages', () => require('@shell/pages')],
  ['@shell/pages/prefs', () => require('@shell/pages/prefs')],
  ['@shell/pages/readme', () => require('@shell/pages/readme')],
  ['@shell/promptRemove/management.cattle.io.fleetworkspace', () => require('@shell/promptRemove/management.cattle.io.fleetworkspace')],
  ['@shell/promptRemove/management.cattle.io.globalrole', () => require('@shell/promptRemove/management.cattle.io.globalrole')],
  ['@shell/promptRemove/management.cattle.io.project', () => require('@shell/promptRemove/management.cattle.io.project')],
  ['@shell/promptRemove/management.cattle.io.roletemplate', () => require('@shell/promptRemove/management.cattle.io.roletemplate')],
  ['@shell/promptRemove/mixin/roleDeletionCheck', () => require('@shell/promptRemove/mixin/roleDeletionCheck')],
  ['@shell/promptRemove/pod', () => require('@shell/promptRemove/pod')],
  ['@shell/utils/async', () => require('@shell/utils/async')],
  ['@shell/utils/auth', () => require('@shell/utils/auth')],
  ['@shell/utils/autoscaler-utils', () => require('@shell/utils/autoscaler-utils')],
  ['@shell/utils/aws', () => require('@shell/utils/aws')],
  ['@shell/utils/axios', () => require('@shell/utils/axios')],
  ['@shell/utils/azure', () => require('@shell/utils/azure')],
  ['@shell/utils/back-off', () => require('@shell/utils/back-off')],
  ['@shell/utils/banners', () => require('@shell/utils/banners')],
  ['@shell/utils/brand', () => require('@shell/utils/brand')],
  ['@shell/utils/chart', () => require('@shell/utils/chart')],
  ['@shell/utils/clipboard', () => require('@shell/utils/clipboard')],
  ['@shell/utils/cluster', () => require('@shell/utils/cluster')],
  ['@shell/utils/color', () => require('@shell/utils/color')],
  ['@shell/utils/computed', () => require('@shell/utils/computed')],
  ['@shell/utils/config', () => require('@shell/utils/config')],
  ['@shell/utils/crypto/browserHashUtils', () => require('@shell/utils/crypto/browserHashUtils')],
  ['@shell/utils/crypto/browserMd5', () => require('@shell/utils/crypto/browserMd5')],
  ['@shell/utils/crypto/browserSha1', () => require('@shell/utils/crypto/browserSha1')],
  ['@shell/utils/crypto/browserSha256', () => require('@shell/utils/crypto/browserSha256')],
  ['@shell/utils/crypto/encryption', () => require('@shell/utils/crypto/encryption')],
  ['@shell/utils/crypto', () => require('@shell/utils/crypto')],
  ['@shell/utils/custom-validators', () => require('@shell/utils/custom-validators')],
  ['@shell/utils/dom', () => require('@shell/utils/dom')],
  ['@shell/utils/download', () => require('@shell/utils/download')],
  ['@shell/utils/duration', () => require('@shell/utils/duration')],
  ['@shell/utils/dynamic-content/config', () => require('@shell/utils/dynamic-content/config')],
  ['@shell/utils/dynamic-content/info', () => require('@shell/utils/dynamic-content/info')],
  ['@shell/utils/dynamic-content/new-release', () => require('@shell/utils/dynamic-content/new-release')],
  ['@shell/utils/dynamic-content/util', () => require('@shell/utils/dynamic-content/util')],
  ['@shell/utils/dynamic-importer', () => require('@shell/utils/dynamic-importer')],
  ['@shell/utils/error', () => require('@shell/utils/error')],
  ['@shell/utils/favicon', () => require('@shell/utils/favicon')],
  ['@shell/utils/fleet-appco', () => require('@shell/utils/fleet-appco')],
  ['@shell/utils/fleet-types', () => require('@shell/utils/fleet-types')],
  ['@shell/utils/fleet', () => require('@shell/utils/fleet')],
  ['@shell/utils/formatter', () => require('@shell/utils/formatter')],
  ['@shell/utils/fuzzy', () => require('@shell/utils/fuzzy')],
  ['@shell/utils/gatekeeper/util', () => require('@shell/utils/gatekeeper/util')],
  ['@shell/utils/gc/gc-interval', () => require('@shell/utils/gc/gc-interval')],
  ['@shell/utils/gc/gc-root-store', () => require('@shell/utils/gc/gc-root-store')],
  ['@shell/utils/gc/gc-route-changed', () => require('@shell/utils/gc/gc-route-changed')],
  ['@shell/utils/gc/gc-types', () => require('@shell/utils/gc/gc-types')],
  ['@shell/utils/gc/gc', () => require('@shell/utils/gc/gc')],
  ['@shell/utils/git', () => require('@shell/utils/git')],
  ['@shell/utils/grafana', () => require('@shell/utils/grafana')],
  ['@shell/utils/inactivity', () => require('@shell/utils/inactivity')],
  ['@shell/utils/ingress', () => require('@shell/utils/ingress')],
  ['@shell/utils/kontainer', () => require('@shell/utils/kontainer')],
  ['@shell/utils/kube', () => require('@shell/utils/kube')],
  ['@shell/utils/monitoring', () => require('@shell/utils/monitoring')],
  ['@shell/utils/namespace-filter', () => require('@shell/utils/namespace-filter')],
  ['@shell/utils/operation-cr', () => require('@shell/utils/operation-cr')],
  ['@shell/utils/parse-externalid', () => require('@shell/utils/parse-externalid')],
  ['@shell/utils/perf-setting.utils', () => require('@shell/utils/perf-setting.utils')],
  ['@shell/utils/platform', () => require('@shell/utils/platform')],
  ['@shell/utils/pod-security-admission', () => require('@shell/utils/pod-security-admission')],
  ['@shell/utils/poller-sequential', () => require('@shell/utils/poller-sequential')],
  ['@shell/utils/poller', () => require('@shell/utils/poller')],
  ['@shell/utils/position', () => require('@shell/utils/position')],
  ['@shell/utils/product', () => require('@shell/utils/product')],
  ['@shell/utils/promise', () => require('@shell/utils/promise')],
  ['@shell/utils/provider', () => require('@shell/utils/provider')],
  ['@shell/utils/queue', () => require('@shell/utils/queue')],
  ['@shell/utils/release-notes', () => require('@shell/utils/release-notes')],
  ['@shell/utils/require-asset', () => require('@shell/utils/require-asset')],
  ['@shell/utils/resource', () => require('@shell/utils/resource')],
  ['@shell/utils/scroll', () => require('@shell/utils/scroll')],
  ['@shell/utils/select', () => require('@shell/utils/select')],
  ['@shell/utils/selector-typed', () => require('@shell/utils/selector-typed')],
  ['@shell/utils/selector', () => require('@shell/utils/selector')],
  ['@shell/utils/socket', () => require('@shell/utils/socket')],
  ['@shell/utils/sort', () => require('@shell/utils/sort')],
  ['@shell/utils/stream', () => require('@shell/utils/stream')],
  ['@shell/utils/string', () => require('@shell/utils/string')],
  ['@shell/utils/style', () => require('@shell/utils/style')],
  ['@shell/utils/svg-filter', () => require('@shell/utils/svg-filter')],
  ['@shell/utils/time', () => require('@shell/utils/time')],
  ['@shell/utils/title', () => require('@shell/utils/title')],
  ['@shell/utils/type-helpers', () => require('@shell/utils/type-helpers')],
  ['@shell/utils/uiplugins', () => require('@shell/utils/uiplugins')],
  ['@shell/utils/units', () => require('@shell/utils/units')],
  ['@shell/utils/url', () => require('@shell/utils/url')],
  ['@shell/utils/v-sphere', () => require('@shell/utils/v-sphere')],
  ['@shell/utils/validators/cidr', () => require('@shell/utils/validators/cidr')],
  ['@shell/utils/validators/cluster-name', () => require('@shell/utils/validators/cluster-name')],
  ['@shell/utils/validators/container-images', () => require('@shell/utils/validators/container-images')],
  ['@shell/utils/validators/cron-schedule', () => require('@shell/utils/validators/cron-schedule')],
  ['@shell/utils/validators/flow-output', () => require('@shell/utils/validators/flow-output')],
  ['@shell/utils/validators/formRules', () => require('@shell/utils/validators/formRules')],
  ['@shell/utils/validators/logging-outputs', () => require('@shell/utils/validators/logging-outputs')],
  ['@shell/utils/validators/machine-pool', () => require('@shell/utils/validators/machine-pool')],
  ['@shell/utils/validators/monitoring-route', () => require('@shell/utils/validators/monitoring-route')],
  ['@shell/utils/validators/pod-affinity', () => require('@shell/utils/validators/pod-affinity')],
  ['@shell/utils/validators/private-registry', () => require('@shell/utils/validators/private-registry')],
  ['@shell/utils/validators/prometheusrule', () => require('@shell/utils/validators/prometheusrule')],
  ['@shell/utils/validators/role-template', () => require('@shell/utils/validators/role-template')],
  ['@shell/utils/validators/service', () => require('@shell/utils/validators/service')],
  ['@shell/utils/validators/setting', () => require('@shell/utils/validators/setting')],
  ['@shell/utils/validators/zod-helpers', () => require('@shell/utils/validators/zod-helpers')],
  ['@shell/utils/version', () => require('@shell/utils/version')],
  ['@shell/utils/versions', () => require('@shell/utils/versions')],
  ['@shell/utils/width', () => require('@shell/utils/width')],
  ['@shell/utils/window', () => require('@shell/utils/window')],
  ['@shell/utils/xccdf', () => require('@shell/utils/xccdf')],
];

// [name, source path, component] for every @components export. The path is the real
// .vue location; the DIRECTORY of that path is the package import path used in real code
// (e.g. '@components/Banner', '@components/Form/LabeledInput').
var RANCHER_COMPONENTS = [
  ['Accordion', '@components/Accordion/Accordion.vue', Accordion],
  ['BadgeState', '@components/BadgeState/BadgeState.vue', BadgeState],
  ['Banner', '@components/Banner/Banner.vue', Banner],
  ['Card', '@components/Card/Card.vue', Card],
  ['Checkbox', '@components/Form/Checkbox/Checkbox.vue', Checkbox],
  ['LabeledInput', '@components/Form/LabeledInput/LabeledInput.vue', LabeledInput],
  ['RadioButton', '@components/Form/Radio/RadioButton.vue', RadioButton],
  ['RadioGroup', '@components/Form/Radio/RadioGroup.vue', RadioGroup],
  ['TextAreaAutoGrow', '@components/Form/TextArea/TextAreaAutoGrow.vue', TextAreaAutoGrow],
  ['ToggleSwitch', '@components/Form/ToggleSwitch/ToggleSwitch.vue', ToggleSwitch],
  ['LabeledTooltip', '@components/LabeledTooltip/LabeledTooltip.vue', LabeledTooltip],
  ['RcCounterBadge', '@components/Pill/RcCounterBadge/RcCounterBadge.vue', RcCounterBadge],
  ['RcStatusBadge', '@components/Pill/RcStatusBadge/RcStatusBadge.vue', RcStatusBadge],
  ['RcStatusIndicator', '@components/Pill/RcStatusIndicator/RcStatusIndicator.vue', RcStatusIndicator],
  ['RcTag', '@components/Pill/RcTag/RcTag.vue', RcTag],
  ['RcButton', '@components/RcButton/RcButton.vue', RcButton],
  ['RcButtonSplit', '@components/RcButtonSplit/RcButtonSplit.vue', RcButtonSplit],
  ['RcDropdown', '@components/RcDropdown/RcDropdown.vue', RcDropdown],
  ['RcDropdownItem', '@components/RcDropdown/RcDropdownItem.vue', RcDropdownItem],
  ['RcDropdownItemCheckbox', '@components/RcDropdown/RcDropdownItemCheckbox.vue', RcDropdownItemCheckbox],
  ['RcDropdownItemSelect', '@components/RcDropdown/RcDropdownItemSelect.vue', RcDropdownItemSelect],
  ['RcDropdownMenu', '@components/RcDropdown/RcDropdownMenu.vue', RcDropdownMenu],
  ['RcDropdownSeparator', '@components/RcDropdown/RcDropdownSeparator.vue', RcDropdownSeparator],
  ['RcDropdownTrigger', '@components/RcDropdown/RcDropdownTrigger.vue', RcDropdownTrigger],
  ['RcIcon', '@components/RcIcon/RcIcon.vue', RcIcon],
  ['RcItemCard', '@components/RcItemCard/RcItemCard.vue', RcItemCard],
  ['RcItemCardAction', '@components/RcItemCard/RcItemCardAction.vue', RcItemCardAction],
  ['RcSection', '@components/RcSection/RcSection.vue', RcSection],
  ['RcSectionActions', '@components/RcSection/RcSectionActions.vue', RcSectionActions],
  ['RcSectionBadges', '@components/RcSection/RcSectionBadges.vue', RcSectionBadges],
  ['RcSeparator', '@components/RcSeparator/RcSeparator.vue', RcSeparator],
  ['StringList', '@components/StringList/StringList.vue', StringList],
];

// Register each @components component so it resolves the same way real code imports it:
//   - bare name:      'Banner'
//   - full .vue path: '@components/Banner/Banner.vue'  (and without extension)
//   - package dir:    '@components/Banner'             (named + default export)
// Each entry is an ES-module namespace ({ __esModule, default, [Name] }) so BOTH
//   import Banner from '@components/Banner'   and   import { Banner } from '@components/Banner'
// work. __esModule makes the loader's default-interop unwrap .default (else a default
// import would be the namespace object and Vue warns "missing render").
// ---- @shell modules: registered by PATH, executed only when a view actually imports one ----
//
// These used to be 753 eager `import * as` statements. That forced the host to initialise its
// entire @shell graph the moment the registry loaded — including the compliance/CIS models, which
// drag in js-yaml. js-yaml blew up during its own init ("Cannot set properties of undefined
// (setting 'options')" — its Type constructor invoked without `new`), which aborted this module's
// body, left SHELL_MODULES unassigned, and so broke EVERY custom-view import, not just the ones
// that wanted YAML. Nothing here needed to run at load time, so now nothing does: a path is only
// require()d when a view imports it, and one broken module can only affect the view that asked
// for it. This is the same rule the header states for @shell/components.
var shellIndexCache = null;
var shellResolved = {};

function buildShellIndex() {
  if (shellIndexCache) {
    return shellIndexCache;
  }

  if (!SHELL_MODULES) {
    throw new Error(
      'component-registry did not finish initialising — a module it statically imports threw while ' +
      'loading. The original error is logged earlier in the console.'
    );
  }

  const index = {};

  // The generated paths are extension-less; also accept the .vue/.js/.ts spellings.
  SHELL_MODULES.forEach(([path, load]) => {
    index[path] = load;
    index[`${ path }.vue`] = load;
    index[`${ path }.js`] = load;
    index[`${ path }.ts`] = load;
  });

  shellIndexCache = index;

  return shellIndexCache;
}

// Execute one @shell module (once) and hand back an ES-module namespace.
function resolveShell(id) {
  if (id in shellResolved) {
    return shellResolved[id];
  }

  const load = buildShellIndex()[id];

  if (!load) {
    return undefined;
  }

  const ns = { __esModule: true, ...load() };

  shellResolved[id] = ns;

  return ns;
}

// The registry map is built LAZILY, on first lookup, and cached in a `var`.
//
// This is load-bearing, not a style choice. In a production build webpack scope-hoists this module
// together with sfc-loader, and a circular import left the concatenated body unfinished: the hoisted
// function declarations (hasComponent/resolveComponent) stayed callable while a `const` map sat
// forever in the temporal dead zone, so EVERY custom-view import died with "Cannot access 'EXTRA'
// before initialization" and no code template could compile. A `var` + build-on-first-use has no
// TDZ, so a lookup can never observe a half-initialized module.
var extraCache = null; // eslint-disable-line no-var, vars-on-top

function buildExtra() {
  if (extraCache) {
    return extraCache;
  }

  // If a statically imported @shell module throws while IT initialises, this module's body stops
  // there: the hoisted function declarations below stay callable, but these arrays are never
  // assigned. Say so plainly instead of dying with "cannot read 'forEach' of undefined", which
  // hides the real failure several layers upstream.
  if (!SHELL_MODULES || !RANCHER_COMPONENTS) {
    throw new Error(
      'component-registry did not finish initialising — a module it statically imports threw while ' +
      'loading. The original error is logged above/earlier in the console.'
    );
  }

  const EXTRA = {};
  const dirExports = {};

  RANCHER_COMPONENTS.forEach(([name, filePath, comp]) => {
    const single = {
      __esModule: true, default: comp, [name]: comp
    };
    const dir = filePath.replace(/\/[^/]+\.vue$/, '');

    EXTRA[name] = single;
    EXTRA[filePath] = single;
    EXTRA[filePath.replace(/\.vue$/, '')] = single;

    // Accumulate named exports per package dir (a dir may hold several components).
    dirExports[dir] = dirExports[dir] || {};
    dirExports[dir][name] = comp;
  });

  Object.entries(dirExports).forEach(([dir, comps]) => {
    const dirName = dir.split('/').pop();

    EXTRA[dir] = {
      __esModule: true, ...comps, default: comps[dirName] || Object.values(comps)[0]
    };
  });

  // This extension's own widget components, so custom views can import them under a SYNTHETIC
  // "@shell/pages/c/_cluster/_template/<Name>.vue" path (see below). No such file exists in the
  // shell — the alias is this registry's, and it is what lets a stored template written against
  // these widgets keep resolving. Pulled in with
  // require() rather than a static import ON PURPOSE: a static import of ../components/* makes this
  // module depend on the package's main chunk, which depends back on the registry — the very cycle
  // that broke the build. require() defers that edge to first lookup, long after both have loaded.
  // Each is loaded in its OWN try: one of these failing used to take the rest down with it, so a
  // single moved file silently un-registered every widget instead of just its own.
  const own = [];
  const loaders = [
    // The NAME is the contract — it is what stored templates import — so it stays put even when the
    // file behind it moves. TemplateOverview now lives in widgets/ as WidgetOverview.
    // eslint-disable-next-line global-require
    ['TemplateOverview', () => require('../components/widgets/WidgetOverview.vue')],
    // eslint-disable-next-line global-require
    ['TemplateResourceList', () => require('../components/TemplateResourceList.vue')],
  ];

  loaders.forEach(([name, load]) => {
    try {
      own.push([name, interop(load())]);
    } catch (e) {
      // Never let one widget failing to load stop the others, or the whole registry, from building.
      // eslint-disable-next-line no-console
      console.warn(`[configurable-views] custom-view component "${ name }" could not be registered`, e);
    }
  });

  own.forEach(([name, comp]) => {
    const ns = { __esModule: true, default: comp };

    EXTRA[name] = ns;
    EXTRA[`@shell/pages/c/_cluster/_template/${ name }`] = ns;
    EXTRA[`@shell/pages/c/_cluster/_template/${ name }.vue`] = ns;
  });

  extraCache = EXTRA;

  return extraCache;
}

function interop(mod) {
  return mod && mod.__esModule ? mod.default : mod;
}

var keyMap = null;

// Build import-id -> context key WITHOUT executing any module.
function buildKeyMap() {
  if (keyMap) {
    return keyMap;
  }

  keyMap = {};

  ctx.keys().forEach((key) => {
    const rel = key.replace(/^\.\//, '');
    const parts = rel.replace(/\.vue$/, '').split('/');
    // For Foo/index.vue the component name/import id is the DIRECTORY (Foo), not "index".
    const isIndex = parts[parts.length - 1] === 'index' && parts.length > 1;
    const name = isIndex ? parts[parts.length - 2] : parts[parts.length - 1];
    const path = `@shell/components/${ rel }`;

    if (!(name in keyMap)) {
      keyMap[name] = key;
    }
    keyMap[path] = key;
    keyMap[path.replace(/\.vue$/, '')] = key;

    // Foo/index.vue is normally imported as '@shell/components/Foo' — add that key too.
    if (isIndex) {
      keyMap[`@shell/components/${ parts.slice(0, -1).join('/') }`] = key;
    }
  });

  return keyMap;
}

export function hasComponent(id) {
  return typeof id === 'string' && (id in buildExtra() || id in buildShellIndex() || id in buildKeyMap());
}

// Returns the requested module namespace (with .default), executing only that one module.
export function resolveComponent(id) {
  const extra = buildExtra();

  if (id in extra) {
    return extra[id];
  }

  const shell = resolveShell(id);

  if (shell) {
    return shell;
  }

  const key = id in buildKeyMap() ? buildKeyMap()[id] : null;

  return key ? ctx(key) : undefined;
}
