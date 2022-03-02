import { escapeHtml } from '@/utils/string';
import SteveModel from '@/plugins/steve/steve-class';
import typeHelper from '@/utils/type-helpers';
import { addObject, addObjects, findBy } from '~/utils/array';
import { FLEET } from '~/config/types';
import { convertSelectorObj, matching } from '~/utils/selector';

export default class FleetBundle extends SteveModel {
  get deploymentInfo() {
    const ready = this.status?.summary?.ready || 0;
    const total = this.status?.summary?.desiredReady || 0;

    return {
      ready,
      unready: total - ready,
      total,
    };
  }

  get lastUpdateTime() {
    return this.status.conditions[0].lastUpdateTime;
  }

  get bundleType() {
    if (typeHelper.memberOfObject(this.spec, 'helm')) {
      return 'helm';
    }

    return '';
  }

  get repoName() {
    return this.metadata.labels['fleet.cattle.io/repo-name'];
  }

  get targetClusters() {
    const workspace = this.$getters['byId'](FLEET.WORKSPACE, this.metadata.namespace);
    const clusters = workspace?.clusters || [];
    const groups = workspace?.clusterGroups || [];
    const out = [];

    if ( workspace.id === 'fleet-local' ) {
      const local = findBy(groups, 'id', 'fleet-local/default');

      if ( local ) {
        return local.targetClusters;
      }

      return [];
    }

    for ( const tgt of this.spec.targets ) {
      if ( tgt.clusterName ) {
        const cluster = findBy(clusters, 'metadata.name', tgt.clusterName);

        if ( cluster ) {
          addObject(out, cluster);
        }
      } else if ( tgt.clusterGroup ) {
        const group = findBy(groups, {
          'metadata.namespace': this.metadata.namespace,
          'metadata.name':      tgt.clusterGroup,
        });

        if ( group ) {
          addObjects(out, group.targetClusters);
        }
      } else if ( tgt.clusterGroupSelector ) {
        const expressions = convertSelectorObj(tgt.clusterGroupSelector);
        const matchingGroups = matching(groups, expressions);

        for ( const group of matchingGroups ) {
          addObjects(out, group.targetClusters);
        }
      } else if ( tgt.clusterSelector ) {
        const expressions = convertSelectorObj(tgt.clusterSelector);
        const matchingClusters = matching(clusters, expressions);

        addObjects(out, matchingClusters);
      }
    }

    return out;
  }

  get groupByLabel() {
    const name = this.metadata.namespace;

    if ( name ) {
      return this.$rootGetters['i18n/t']('resourceTable.groupLabel.workspace', { name: escapeHtml(name) });
    } else {
      return this.$rootGetters['i18n/t']('resourceTable.groupLabel.notInAWorkspace');
    }
  }
}
