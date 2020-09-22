import { convert, matching, convertSelectorObj } from '@/utils/selector';
import jsyaml from 'js-yaml';
import { escapeHtml } from '@/utils/string';
import { FLEET } from '@/config/types';
import { addObjects, findBy } from '@/utils/array';
import { set } from '@/utils/object';

export default {
  applyDefaults() {
    return () => {
      const spec = this.spec || {};
      const meta = this.metadata || {};

      spec.repo = spec.repo || '';

      if ( !spec.branch && !spec.revision ) {
        spec.branch = 'master';
      }

      spec.paths = spec.paths || [''];
      spec.clientSecretName = spec.clientSecretName || null;

      set(this, 'spec', spec);
      set(this, 'metadata', meta);
    };
  },

  targetClusters() {
    const clusters = this.$getters['all'](FLEET.CLUSTER);
    const groups = this.$getters['all'](FLEET.CLUSTER_GROUP);
    const out = [];

    if ( !this.spec.targets ) {
      const local = findBy(clusters, {
        'metadata.namespace': 'fleet-local',
        'metadata.name':      'local'
      });

      if ( local ) {
        return [local];
      }

      return [];
    }

    for ( const tgt of this.spec.targets ) {
      if ( tgt.clusterGroup ) {
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
  },

  github() {
    const match = this.spec.repo.match(/^https?:\/\/github\.com\/(.*?)(\.git)?\/*$/);

    if ( match ) {
      return match[1];
    }

    return false;
  },

  repoIcon() {
    if ( this.github ) {
      return 'icon icon-github icon-lg';
    }
  },

  repoDisplay() {
    let repo = this.spec.repo;

    repo = repo.replace(/.git$/, '');
    repo = repo.replace(/^https:\/\//, '');
    repo = repo.replace(/\/+$/, '');

    if ( this.github ) {
      return this.github;
    }

    return repo;
  },

  commitDisplay() {
    return this.status?.commit?.substr(0, 7);
  },

  targetInfo() {
    let mode = null;
    let cluster = null;
    let clusterGroup = null;
    let advanced = null;

    const targets = this.spec.targets || [];

    advanced = jsyaml.safeDump(targets);

    if ( advanced === '[]\n' ) {
      advanced = `# - name:
#  clusterSelector:
#    matchLabels:
#     foo: bar
#    matchExpressions:
#     - key: foo
#       op: In
#       values: [bar, baz]
#  clusterGroup: foo
#  clusterGroupSelector:
#    matchLabels:
#     foo: bar
#    matchExpressions:
#     - key: foo
#       op: In
#       values: [bar, baz]
`;
    }

    if ( this.metadata.namespace === 'fleet-local' ) {
      mode = 'local';
    } else if ( !targets.length ) {
      mode = 'all';
    } else if ( targets.length === 1) {
      const target = targets[0];

      if ( target.clusterGroup ) {
        clusterGroup = target.clusterGroup;

        if ( !mode ) {
          mode = 'clusterGroup';
        }
      }

      if ( target.clusterSelector ) {
        const expressions = convert(target.clusterSelector.matchLabels, target.clusterSelector.matchExpressions);

        if ( expressions.length === 1 &&
             expressions[0].key === 'name' &&
             expressions[0].operation === 'In' &&
             expressions[0].values.length === 1
        ) {
          cluster = expressions[0].values[0];
          if ( !mode ) {
            mode = 'cluster';
          }
        }
      }
    }

    if ( !mode ) {
      mode = 'advanced';
    }

    return {
      mode,
      modeDisplay: this.t(`fleet.gitRepo.targetDisplay."${ mode }"`, { name: cluster || clusterGroup || '?' }),
      cluster,
      clusterGroup,
      advanced
    };
  },

  groupByLabel() {
    const name = this.metadata.namespace;

    if ( name ) {
      return this.$rootGetters['i18n/t']('resourceTable.groupLabel.workspace', { name: escapeHtml(name) });
    } else {
      return this.$rootGetters['i18n/t']('resourceTable.groupLabel.notInAWorkspace');
    }
  },
};
