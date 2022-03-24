import { STATES, STATES_ENUM } from '@/plugins/steve/resource-class';
import {
  CONFIG_MAP,
  SECRET,
  WORKLOAD_TYPES,
  STORAGE_CLASS,
  SERVICE,
  PV,
  PVC,
  POD
} from '@/config/types';

// some default values
const defaultNodeRadius = 20;
const defaultNodePadding = 15;
const chartWidth = 800;
const chartHeight = 500;
const fdcStrength = -300;
const fdcDistanceMax = 500;
const fdcForceCollide = 75;

// setting up default sim params
const simulationParams = {
  fdcStrength,
  fdcDistanceMax,
  fdcForceCollide,
};

/**
 * Represents a config object for FDC type
 * @param {Function} parseData - Parses the specific data for each chart. Format must be compliant with d3 data format
 * @example data format => { parent: {..., children: [ {..., children: []} ] } }
 * @param {Function} extendNodeClass - Extends the classes for each node so that the styling is correctly applied
 * @param {Function} nodeDimensions - Sets the radius of the nodes according each data type
 * @param {Function} infoDetails - Prepares the data to be displayed in the info box on the right-side of the ForceDirectedTreeChart component
 */
export const gitRepoGraphConfig = {
  chartWidth,
  chartHeight,
  simulationParams,
  /**
     * data prop that is used to trigger the watcher in the component. Should follow format "data.xxxxxx"
     */
  watcherProp: 'data.bundles',
  /**
     * Mandatory params for a child object in parseData (for statuses to work)
     * @param {String} state
     * @param {String} stateDisplay
     * @param {String} stateColor
     * @param {String} matchingId
     */
  parseData:   (data) => {
    const totalClusterCount = data.status?.desiredReadyClusters;
    const repoChildren = data.bundles.map((bundle, i) => {
      const bundleLowercaseState = bundle.state ? bundle.state.toLowerCase() : 'unknown';
      const bundleStateColor = STATES[bundleLowercaseState].color;

      const repoChild = {
        id:             bundle.id,
        matchingId:     bundle.id,
        type:           bundle.type,
        state:          bundle.state,
        stateLabel:     bundle.stateDisplay,
        stateColor:     bundleStateColor,
        isBundle:       true,
        errorMsg:       bundle.stateDescription,
        detailLocation: bundle.detailLocation,
        children:       []
      };

      if (bundle.status?.resourceKey?.length) {
        bundle.status.resourceKey.forEach((res, index) => {
          const id = res.namespace ? `${ res.namespace }/${ res.name }` : res.name;
          const matchingId = `${ res.kind }-${ id }`;

          let type;
          let state;
          let stateLabel;
          let stateColor;
          let perClusterState;
          let detailLocation;

          if (data.status?.resources?.length) {
            const item = data.status?.resources?.find(resource => `${ resource.kind }-${ resource.id }` === matchingId);

            if (item) {
              type = item.type;
              state = item.state;
              perClusterState = item.perClusterState || [];
              detailLocation = item.detailLocation;
              const resourceLowerCaseState = item.state ? item.state.toLowerCase() : 'unknown';

              stateLabel = STATES[resourceLowerCaseState].label;
              stateColor = STATES[resourceLowerCaseState].color;
            }
          }

          repoChild.children.push({
            id,
            matchingId,
            type,
            state,
            stateLabel,
            stateColor,
            isResource: true,
            perClusterState,
            detailLocation,
            totalClusterCount
          });
        });
      }

      return repoChild;
    });

    const repoLowercaseState = data.state ? data.state.toLowerCase() : 'unknown';
    const repoStateColor = STATES[repoLowercaseState].color;

    const finalData = {
      id:             data.id,
      matchingId:     data.id,
      type:           data.type,
      state:          data.state,
      stateLabel:     data.stateDisplay,
      stateColor:     repoStateColor,
      isRepo:         true,
      errorMsg:       data.stateDescription,
      detailLocation: data.detailLocation,
      children:       repoChildren
    };

    return finalData;
  },
  /**
     * Used to add relevant classes to each main node instance
     */
  extendNodeClass: (d) => {
    const classArray = [];

    // node type
    d.data?.isRepo ? classArray.push('repo') : d.data?.isBundle ? classArray.push('bundle') : classArray.push('resource');

    // special bundle type
    if (d.data?.isBundle && d.data?.id.indexOf('helm') !== -1) {
      classArray.push('helm');
    }

    // special resource type
    if (d.data?.isResource && d.data?.type) {
      switch (d.data.type) {
      case WORKLOAD_TYPES.DEPLOYMENT:
        classArray.push('deployment');
        break;
      case SERVICE:
        classArray.push('service');
        break;
      case CONFIG_MAP:
        classArray.push('configmap');
        break;
      case WORKLOAD_TYPES.CRON_JOB:
        classArray.push('cronjob');
        break;
      case WORKLOAD_TYPES.DAEMON_SET:
        classArray.push('daemonset');
        break;
      case WORKLOAD_TYPES.JOB:
        classArray.push('job');
        break;
      case PV:
        classArray.push('persistentvolume');
        break;
      case PVC:
        classArray.push('persistentvolumeclaim');
        break;
      case POD:
        classArray.push('pod');
        break;
      case WORKLOAD_TYPES.REPLICA_SET:
        classArray.push('replicaset');
        break;
      case SECRET:
        classArray.push('secret');
        break;
      case WORKLOAD_TYPES.STATEFUL_SET:
        classArray.push('statefulset');
        break;
      case STORAGE_CLASS:
        classArray.push('storageclass');
        break;
      default:
        classArray.push('other');
        break;
      }
    }

    return classArray;
  },
  /**
     * Used to set node dimensions
     */
  nodeDimensions: (d) => {
    if (d.data?.isRepo) {
      return {
        radius:  defaultNodeRadius * 3,
        padding: defaultNodePadding * 2.5
      };
    }
    if (d.data?.isBundle) {
      return {
        radius:  defaultNodeRadius * 2,
        padding: defaultNodePadding
      };
    }

    return {
      radius:  defaultNodeRadius,
      padding: defaultNodePadding
    };
  },
  /**
     * Use @param {Obj} valueObj for compound values (usually associated with a template of some sort) or @param value for a simple straightforward value
     */
  infoDetails: (data) => {
    const moreInfo = [
      {
        type:     'title-link',
        labelKey: 'fleet.fdc.name',
        valueObj: {
          id:             data.id,
          detailLocation: data.detailLocation
        }
      },
      {
        labelKey:  'fleet.fdc.type',
        value:    data.type
      }
    ];

    if (!data.isResource) {
      moreInfo.push({
        type:     'state-badge',
        labelKey: 'fleet.fdc.state',
        valueObj: {
          stateColor: data.stateColor,
          stateLabel: data.stateLabel
        }
      });
    }

    if (data.errorMsg && !data.isResource) {
      moreInfo.push({
        type:     'single-error',
        labelKey: 'fleet.fdc.error',
        value:    data.errorMsg
      });
    }

    if (data.isResource) {
      const state = data.state?.toLowerCase();

      moreInfo.push({
        type:     'compound-status',
        labelKey: 'fleet.fdc.ready',
        valueObj: {
          badgeClass: STATES[state] ? STATES[state].color : `${ STATES[STATES_ENUM.UNKNOWN].color } bg-unmapped-state`,
          icon:       STATES[state] ? STATES[state].compoundIcon : `${ STATES[STATES_ENUM.UNKNOWN].compoundIcon } bg-unmapped-state`,
          value:      `${ data.totalClusterCount - data.perClusterState.length } / ${ data.totalClusterCount }`
        }
      });

      if (data.perClusterState.find(item => item.error)) {
        const err = [];

        data.perClusterState.forEach((item) => {
          err.push(`<p class="error">${ item.message } :::::: Cluster ID: ${ item.clusterId }</p>`);
        });

        moreInfo.push({
          type:     'multiple-error',
          labelKey: 'fleet.fdc.errors',
          value:    err
        });
      }
    }

    return moreInfo;
  }
};
