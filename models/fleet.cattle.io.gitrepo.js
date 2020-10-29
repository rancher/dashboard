import { convert, matching, convertSelectorObj } from '@/utils/selector';
import jsyaml from 'js-yaml';
import { escapeHtml } from '@/utils/string';
import { FLEET } from '@/config/types';
import { FLEET as FLEET_ANNOTATIONS } from '@/config/labels-annotations';
import { addObjects, findBy, insertAt } from '@/utils/array';
import { set } from '@/utils/object';

function quacksLikeAHash(str) {
  if ( str.match(/^[a-f0-9]{40,}$/i) ) {
    return true;
  }

  return false;
}

export default {
  applyDefaults() {
    return () => {
      const spec = this.spec || {};
      const meta = this.metadata || {};

      meta.namespace = this.$rootGetters['workspace'];

      spec.repo = spec.repo || '';

      if ( !spec.branch && !spec.revision ) {
        spec.branch = 'master';
      }

      spec.paths = spec.paths || [];
      spec.clientSecretName = spec.clientSecretName || null;

      set(this, 'spec', spec);
      set(this, 'metadata', meta);
    };
  },

  _availableActions() {
    const out = this._standardActions;

    insertAt(out, 0, {
      action:     'pause',
      label:      'Pause',
      icon:       'icon icon-pause',
      bulkable:    true,
      enabled:    !!this.links.update && !this.spec?.paused
    });

    insertAt(out, 1, {
      action:     'unpause',
      label:      'Unpause',
      icon:       'icon icon-play',
      bulkable:    true,
      enabled:    !!this.links.update && this.spec?.paused === true
    });

    insertAt(out, 2, {
      action:     'forceUpdate',
      label:      'Force Update',
      icon:       'icon icon-refresh',
      bulkable:    true,
      enabled:    !!this.links.update
    });

    insertAt(out, 3, { divider: true });

    return out;
  },

  pause() {
    this.spec.paused = true;
    this.save();
  },

  unpause() {
    this.spec.paused = false;
    this.save();
  },

  state() {
    if ( this.spec?.paused === true ) {
      return 'paused';
    }

    return this.metadata?.state?.name || 'unknown';
  },

  forceUpdate() {
    const now = this.spec.forceSyncGeneration || 1;

    this.spec.forceSyncGeneration = now + 1;
    this.save();
  },

  targetClusters() {
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
      return 'icon icon-github';
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
    const spec = this.spec;
    const hash = this.status?.commit?.substr(0, 7);

    if ( !spec || !spec.repo ) {
      return;
    }

    if ( spec.revision && quacksLikeAHash(spec.revision) ) {
      return spec.revision.substr(0, 7);
    } else if ( spec.revision ) {
      return spec.revision;
    } else if ( spec.branch ) {
      return spec.branch + (hash ? ` @ ${ hash }` : '');
    }

    return hash;
  },

  clusterInfo() {
    const ready = this.status?.readyClusters || 0;
    const total = this.status?.desiredReadyClusters || 0;

    return {
      ready,
      unready: total - ready,
      total,
    };
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
      mode = 'none';
    } else if ( targets.length === 1) {
      const target = targets[0];

      if ( target.clusterGroup ) {
        clusterGroup = target.clusterGroup;

        if ( !mode ) {
          mode = 'clusterGroup';
        }
      }

      if ( target.clusterSelector ) {
        if ( Object.keys(target.clusterSelector).length === 0 ) {
          mode = 'all';
        } else {
          const expressions = convert(target.clusterSelector.matchLabels, target.clusterSelector.matchExpressions);

          if ( expressions.length === 1 &&
              expressions[0].key === FLEET_ANNOTATIONS.CLUSTER_NAME &&
              expressions[0].operator === 'In' &&
              expressions[0].values.length === 1
          ) {
            cluster = expressions[0].values[0];
            if ( !mode ) {
              mode = 'cluster';
            }
          }
        }
      }
    }

    if ( !mode ) {
      mode = 'advanced';
    }

    return {
      mode,
      modeDisplay: this.t(`fleet.gitRepo.targetDisplay."${ mode }"`),
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
