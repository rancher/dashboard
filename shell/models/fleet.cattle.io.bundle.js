import { escapeHtml, ucFirst } from '@shell/utils/string';
import SteveModel from '@shell/plugins/steve/steve-class';
import { addObject, addObjects, findBy } from '@shell/utils/array';
import { FLEET } from '@shell/config/types';
import { FLEET as FLEET_ANNOTATIONS } from '@shell/config/labels-annotations';
import { convertSelectorObj, matches, matching } from '@shell/utils/selector';
import FleetUtils from '@shell/utils/fleet';

export default class FleetBundle extends SteveModel {
  get lastUpdateTime() {
    return this.status?.conditions?.[0].lastUpdateTime;
  }

  get repoName() {
    const labels = this.metadata?.labels || {};

    return labels[FLEET_ANNOTATIONS.REPO_NAME];
  }

  get helmName() {
    const labels = this.metadata?.labels || {};

    return labels[FLEET_ANNOTATIONS.HELM_NAME];
  }

  get appSourceName() {
    return this.helmName || this.repoName;
  }

  get targetClusters() {
    const workspace = this.$getters['byId'](
      FLEET.WORKSPACE,
      this.metadata.namespace
    );
    const clusters = [...(workspace?.clusters || [])];
    const groups = [...(workspace?.clusterGroups || [])];
    const out = [];

    if (workspace.id === 'fleet-local') {
      const local = findBy(groups, 'id', 'fleet-local/default');

      if (local) {
        return local.targetClusters;
      }

      return [];
    }

    const allMappings = this.$getters['all'](FLEET.BUNDLE_NAMESPACE_MAPPING) || [];
    const bundleNs = this.metadata.namespace;

    for (const mapping of allMappings) {
      if (mapping.metadata?.namespace !== bundleNs) {
        continue;
      }

      if (mapping.bundleSelector) {
        const bundleExpressions = convertSelectorObj(mapping.bundleSelector);

        if (!matches(this, bundleExpressions)) {
          continue;
        }
      }

      if (mapping.namespaceSelector) {
        const allWorkspaces = this.$getters['all'](FLEET.WORKSPACE) || [];
        const nsExpressions = convertSelectorObj(mapping.namespaceSelector);

        for (const ws of allWorkspaces) {
          if (ws.metadata?.name === bundleNs) {
            continue;
          }

          const nsLabels = {
            ...(ws.metadata?.labels || {}),
            'kubernetes.io/metadata.name': ws.metadata?.name,
          };

          if (matches({ metadata: { labels: nsLabels } }, nsExpressions)) {
            addObjects(clusters, ws.clusters || []);
            addObjects(groups, ws.clusterGroups || []);
          }
        }
      }
    }

    for (const tgt of this.spec.targets) {
      if (tgt.clusterName) {
        const cluster = findBy(clusters, 'metadata.name', tgt.clusterName) || findBy(clusters, 'nameDisplay', tgt.clusterName);

        if (cluster) {
          addObject(out, cluster);
        }
      } else if (tgt.clusterGroup) {
        const group = findBy(groups, {
          'metadata.namespace': this.metadata.namespace,
          'metadata.name':      tgt.clusterGroup
        });

        if (group) {
          addObjects(out, group.targetClusters);
        }
      } else if (tgt.clusterGroupSelector) {
        const expressions = convertSelectorObj(tgt.clusterGroupSelector);
        const matchingGroups = matching(groups, expressions);

        for (const group of matchingGroups) {
          addObjects(out, group.targetClusters);
        }
      } else if (tgt.clusterSelector) {
        const expressions = convertSelectorObj(tgt.clusterSelector);
        const matchingClusters = matching(clusters, expressions);

        addObjects(out, matchingClusters);
      }
    }

    return out;
  }

  get readyCondition() {
    return this.status?.conditions?.find((c) => c.type === 'Ready');
  }

  get stateObj() {
    return FleetUtils.resourceStateObj(this.metadata?.state);
  }

  /**
   * The Ready condition carries the only human readable account of why a bundle is not ready, so it is
   * used for the description. Its `error` and `transitioning` flags are not used: the backend raises both
   * for every state that is not Ready, which would present states such as WaitingForDependency - a bundle
   * held back by a dependency, not a failure - as an error.
   *
   * The condition is absent, or carries no message, exactly when the bundle is ready.
   */
  get stateDescription() {
    const message = this.readyCondition?.message;

    return message ? ucFirst(message) : '';
  }

  get groupByLabel() {
    const name = this.metadata.namespace;

    if (name) {
      return this.$rootGetters['i18n/t']('resourceTable.groupLabel.workspace', { name: escapeHtml(name) });
    } else {
      return this.$rootGetters['i18n/t'](
        'resourceTable.groupLabel.notInAWorkspace'
      );
    }
  }
}
