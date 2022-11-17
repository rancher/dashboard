import { STATES } from '@shell/plugins/dashboard-store/resource-class';
import { FLEET } from '@shell/config/types';

// some default values
const defaultNodeRadius = 20;
const defaultNodePadding = 15;
const chartWidth = 800;
const chartHeight = 500;
const fdcStrength = -300;
const fdcDistanceMax = 500;
const fdcForceCollide = 80;
const fdcAlphaDecay = 0.05;

// setting up default sim params
// check documentation here: https://github.com/d3/d3-force#forceSimulation
const simulationParams = {
  fdcStrength,
  fdcDistanceMax,
  fdcForceCollide,
  fdcAlphaDecay
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
     * @param {String} matchingId (this can be different than the actual ID, depends on the usecase)
     */
  parseData:   (data) => {
    const bundles = data.bundles.map((bundle, i) => {
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

      const bds = data.bundleDeployments.filter(bd => bundle.id === `${ bd.metadata?.labels?.['fleet.cattle.io/bundle-namespace'] }/${ bd.metadata?.labels?.['fleet.cattle.io/bundle-name'] }`);

      bds.forEach((bd) => {
        const bdLowercaseState = bd.state ? bd.state.toLowerCase() : 'unknown';
        const bdStateColor = STATES[bdLowercaseState]?.color;

        const cluster = data.clustersList.find((cluster) => {
          const clusterString = `${ cluster.namespace }-${ cluster.name }`;

          return bd.id.includes(clusterString);
        });

        repoChild.children.push({
          id:                    bd.id,
          matchingId:            bd.id,
          type:                  bd.type,
          clusterId:             cluster ? cluster.id : undefined,
          clusterDetailLocation: cluster ? cluster.detailLocation : undefined,
          state:                 bd.state,
          stateLabel:            bd.stateDisplay,
          stateColor:            bdStateColor,
          isBundleDeployment:    true,
          errorMsg:              bd.stateDescription,
          detailLocation:        bd.detailLocation,
        });
      });

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
      children:       bundles
    };

    return finalData;
  },
  /**
     * Used to add relevant classes to each main node instance
     */
  extendNodeClass: ({ data }) => {
    const classArray = [];

    // node type
    data?.isRepo ? classArray.push('repo') : data?.isBundle ? classArray.push('bundle') : classArray.push('bundle-deployment');

    return classArray;
  },
  /**
     * Used to add the correct icon to each node
     */
  fetchNodeIcon: ({ data }) => {
    if (data?.isRepo) {
      return 'git';
    }

    if ( data?.isBundle) {
      if (data?.id.indexOf('helm') !== -1) {
        return 'helm';
      }

      return 'bundle';
    }

    if (data?.isBundleDeployment) {
      return 'node';
    }
  },
  /**
     * Used to set node dimensions
     */
  nodeDimensions: ({ data }) => {
    if (data?.isRepo) {
      const radius = defaultNodeRadius * 3;
      const padding = defaultNodePadding * 2.5;

      return {
        radius,
        size:     (radius * 2) - padding,
        position: -(((radius * 2) - padding) / 2)
      };
    }
    if (data?.isBundle) {
      const radius = defaultNodeRadius * 2;
      const padding = defaultNodePadding;

      if (data?.id.indexOf('helm') !== -1) {
        return {
          radius,
          size:     (radius * 1.5) - padding,
          position: -(((radius * 1.5) - padding) / 2)
        };
      }

      return {
        radius,
        size:     (radius * 1.7) - padding,
        position: -(((radius * 1.7) - padding) / 2)
      };
    }

    return {
      radius:   defaultNodeRadius,
      size:     (defaultNodeRadius * 2) - defaultNodePadding,
      position: -(((defaultNodeRadius * 2) - defaultNodePadding) / 2)
    };
  },
  /**
     * Use @param {Obj} valueObj for compound values (usually associated with a template of some sort on the actual component)
     * or @param value for a simple straightforward value
     */
  infoDetails: (data) => {
    let dataType;

    switch (data.type) {
    case FLEET.GIT_REPO:
      dataType = 'GitRepo';
      break;
    case FLEET.BUNDLE:
      dataType = 'Bundle';
      break;
    case FLEET.BUNDLE_DEPLOYMENT:
      dataType = 'BundleDeployment';
      break;
    default:
      dataType = data.type;
      break;
    }

    const moreInfo = [
      {
        labelKey: 'fleet.fdc.type',
        value:    dataType
      },
      {
        type:     'title-link',
        labelKey: 'fleet.fdc.id',
        valueObj: {
          id:             data.id,
          detailLocation: data.detailLocation
        }
      }
    ];

    if (data.isBundleDeployment) {
      moreInfo.push({
        type:     'title-link',
        labelKey: 'fleet.fdc.cluster',
        valueObj: {
          id:             data.clusterId,
          detailLocation: data.clusterDetailLocation
        }
      });
    }

    moreInfo.push({
      type:     'state-badge',
      labelKey: 'fleet.fdc.state',
      valueObj: {
        stateColor: data.stateColor,
        stateLabel: data.stateLabel
      }
    });

    if (data.errorMsg) {
      moreInfo.push({
        type:     'single-error',
        labelKey: 'fleet.fdc.error',
        value:    data.errorMsg
      });
    }

    return moreInfo;
  }
};
