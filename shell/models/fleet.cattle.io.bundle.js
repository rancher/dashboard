import { escapeHtml, ucFirst } from '@shell/utils/string';
import SteveModel from '@shell/plugins/steve/steve-class';
import typeHelper from '@shell/utils/type-helpers';
import { addObject, addObjects, findBy } from '~shell/utils/array';
import { FLEET } from '~shell/config/types';
import { convertSelectorObj, matching } from '~shell/utils/selector';

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

  get stateDescription() {
    const error = this.stateObj?.error || false;
    const message = this.stateObj?.message;

    return error ? ucFirst(message) : '';
  }

  get stateObj() {
    const errorState = this.status?.conditions?.find((item) => {
      const { error, message } = item;
      const errState = !!error;

      /**
       * error.trainsitioning = true when error applied. So checking non existance of tranistioning is not enough.
       * {
       *  "error": true,
       *    "lastUpdateTime": "2022-03-03T08:28:15Z",
       *    "message": "ErrApplied(1) [Cluster test-do/c-b5rsv: rendered manifests contain a resource that already exists. Unable to continue with install: Service \"frontend\" in namespace \"fleet-mc-helm-kustomize-example\" exists and cannot be imported into the current release: invalid ownership metadata; annotation validation error: key \"meta.helm.sh/release-name\" must equal \"sf-mchk-multi-cluster-helm-kustomize\": current value is \"test-bug-multi-cluster-helm-kustomize\"]; NotReady(1) [Cluster test-do/c-5fhtx]; deployment.apps fleet-mc-helm-kustomize-example/redis-master [progressing] Deployment does not have minimum availability., Available: 0/1; deployment.apps shavin/frontend extra; deployment.apps shavin/redis-master extra; deployment.apps shavin/redis-slave extra; service.v1 shavin/frontend extra",
       *    "status": "False",
       *    "transitioning": true,
       *    "type": "Ready"
       *    },
       */
      const hasErrorMessage = message?.toLowerCase().includes('errapplied') || message?.toLowerCase().includes('error');

      return errState && hasErrorMessage;
    });

    if (errorState) {
      errorState.name = errorState.message?.toLowerCase().includes('errapplied') ? 'errapplied' : 'error';

      return errorState;
    }

    return { ...this.metadata.state };
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
