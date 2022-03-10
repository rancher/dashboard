<script>
import * as d3 from 'd3';
import { STATES } from '@/plugins/steve/resource-class';
import BadgeState from '@/components/BadgeState';
import Loading from '@/components/Loading';

export default {
  name:       'ForceDirectedTreeChart',
  components: { BadgeState, Loading },
  props:      {
    data: {
      type:     [Array, Object],
      required: true
    },
    withContentLoader: {
      type:    Boolean,
      default: true
    }
  },
  data() {
    return {
      parsedInfo:       null,
      root:             null,
      allNodesData:     null,
      allLinks:         null,
      node:             null,
      link:             null,
      svg:              null,
      zoom:             null,
      simulation:       null,
      circleRadius:     20,
      nodeImagePadding: 15,
      isRendered:       false,
      moreInfo:         {}
    };
  },
  watch: {
    data: {
      handler(newValue) {
        if (newValue.bundles?.length) {
          // eslint-disable-next-line no-console
          console.log('WATCHER TRIGGERED!', JSON.stringify(newValue.bundles.length, null, 2), newValue);

          if (!this.isRendered) {
            window.d3 = d3;
            this.parsedInfo = this.parseData(newValue);

            // set details info to git repo and set active state
            this.setDetailsInfo(this.parsedInfo, false);
            this.parsedInfo.active = true;

            // render and update chart
            this.renderChart();
            this.updateChart(true, true);
            this.isRendered = true;

          // here we just look for changes in the status of the nodes and update them accordingly
          } else {
            const parsedInfo = this.parseData(newValue);
            const flattenedData = this.flatten(parsedInfo);
            let hasStatusChange = false;

            flattenedData.forEach((item) => {
              const index = this.allNodesData.findIndex(nodeData => item.matchingId === nodeData.data.matchingId);

              // apply status change to each node
              if (index > -1 && this.allNodesData[index].data.state !== item.state) {
                this.allNodesData[index].data.state = item.state;
                this.allNodesData[index].data.stateLabel = item.stateLabel;
                this.allNodesData[index].data.stateColor = item.stateColor;
                hasStatusChange = true;

                // if node is selected (active), update details info
                if (this.allNodesData[index].data.active) {
                  this.setDetailsInfo(this.allNodesData[index].data, false);
                }
              }
            });

            if (hasStatusChange) {
              this.updateChart(false, false);
            }
          }

          // DATA FORCES REFRESH EVERY TIME TEST...
          // this.parsedInfo = this.parseData(newValue);
          // console.log('ORIGINAL DATA flattened', this.flatten(this.parsedInfo));

          // if (!this.isRendered) {
          //   this.renderChart();
          //   this.isRendered = true;
          // }
          // this.updateChart(true, true);
        }
      }
    }
  },
  methods: {
    parseData(data) {
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
            const id = `${ res.namespace }/${ res.name }`;
            const matchingId = `${ res.kind }-${ res.namespace }/${ res.name }`;
            let type;
            let state;
            let stateLabel;
            let stateColor;
            let errorMsg;
            let detailLocation;

            if (data.status?.resources?.length) {
              const item = data.status?.resources?.find(resource => `${ resource.kind }-${ resource.id }` === matchingId);

              if (item) {
                type = item.type;
                state = item.state;
                errorMsg = item.stateDescription;
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
              errorMsg,
              detailLocation,
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
    renderChart() {
      const width = 800;
      const height = 800;

      // clear any previous renders, if they exist...
      // if (d3.select('#tree > svg')) {
      //   d3.select('#tree > svg').remove();
      // }

      const transform = d3.zoomIdentity.translate(0, 0);

      this.zoom = d3.zoom().scaleExtent([1 / 8, 16]).on('zoom', this.zoomed);

      this.svg = d3.select('#tree').append('svg')
        .attr('viewBox', `0 0 ${ width } ${ height }`)
        .attr('preserveAspectRatio', 'none')
        .call(this.zoom)
        .append('g')
        .attr('class', 'root-node')
        .attr('transform', transform);

      this.simulation = d3.forceSimulation()
        .force('charge', d3.forceManyBody().strength(-300).distanceMax(300))
        .force('collision', d3.forceCollide(this.circleRadius * 3.5))
        .force('center', d3.forceCenter( width / 2, height / 2 ))
        .on('tick', this.ticked);
    },
    updateChart(isStartingData, isSettingNodesAndLinks) {
      if (isStartingData) {
        this.root = d3.hierarchy(this.parsedInfo);
      }

      if (isSettingNodesAndLinks) {
        this.allNodesData = this.flatten(this.root);
        this.allLinks = this.root.links();
      }

      this.link = this.svg
        .selectAll('.link')
        .data(this.allLinks, (d) => {
          return d.target.id;
        });

      this.link.exit().remove();

      const linkEnter = this.link
        .enter()
        .append('line')
        .attr('class', 'link')
        .style('opacity', '0.2')
        .style('stroke-width', 2);

      this.link = linkEnter.merge(this.link);

      this.node = this.svg
        .selectAll('.node')
        .data(this.allNodesData, (d) => {
          return d.id;
        })
        // this is where we define which prop changes with any data update (status color)
        .attr('class', this.mainNodeClass);

      this.node.exit().remove();

      // define the node styling and function
      const nodeEnter = this.node
        .enter()
        .append('g')
        .attr('class', this.mainNodeClass)
        .style('opacity', 1)
        .on('click', (ev, d) => {
          this.setDetailsInfo(d.data, true);
        })
        .call(d3.drag()
          .on('start', this.dragstarted)
          .on('drag', this.dragged)
          .on('end', this.dragended));

      // draw status circle (inherits color from main node)
      nodeEnter.append('circle')
        .attr('r', this.setNodeRadius);

      nodeEnter.append('circle')
        .attr('r', (d) => {
          return this.setNodeRadius(d) - 5;
        })
        .attr('class', 'node-hover-layer');

      // node image
      nodeEnter.append('foreignObject')
        .attr('class', 'svg-img')
        .attr('x', this.nodeImagePosition)
        .attr('y', this.nodeImagePosition)
        .attr('height', this.nodeImageSize)
        .attr('width', this.nodeImageSize);

      this.node = nodeEnter.merge(this.node);

      this.simulation.nodes(this.allNodesData);
      this.simulation.force('link', d3.forceLink()
        .id((d) => {
          return d.id;
        })
        .distance(100)
        .links(this.allLinks));

      // if (isStartingData) {
      //   d3.select('.root-node').transition().on('end', this.zoomFit);
      // }
    },
    mainNodeClass(d) {
      const lowerCaseStatus = d.data?.state ? d.data.state.toLowerCase() : 'unkown_status';
      const stateColorDefinition = STATES[lowerCaseStatus] ? STATES[lowerCaseStatus].color : 'unknown_color';
      let classList;

      switch (stateColorDefinition) {
      case 'success':
        classList = 'node node-success';
        break;
      case 'warning':
        classList = 'node node-warning';
        break;
      case 'error':
        classList = 'node node-error';
        break;
      case 'info':
        classList = 'node node-info';
        break;
      default:
        classList = 'node node-default-fill';
        break;
      }

      if (d.data?.active) {
        classList += ' active';
      }

      const resourceTypeClass = d.data?.isRepo ? ' repo' : d.data?.isBundle ? ' bundle' : ' resource';

      if (d.data?.isBundle && d.data?.id.indexOf('helm') !== -1) {
        classList += ' helm';
      }

      classList += resourceTypeClass;

      return classList;
    },
    setNodeRadius(d) {
      return d.data?.isRepo ? this.circleRadius * 3 : d.data?.isBundle ? this.circleRadius * 2 : this.circleRadius;
    },
    nodeImageSize(d) {
      const size = this.setNodeRadius(d);

      return (size * 2) - this.nodeImagePadding;
    },
    nodeImagePosition(d) {
      const size = this.setNodeRadius(d);

      return -(((size * 2) - this.nodeImagePadding) / 2);
    },
    ticked() {
      this.link
        .attr('x1', (d) => {
          return d.source.x;
        })
        .attr('y1', (d) => {
          return d.source.y;
        })
        .attr('x2', (d) => {
          return d.target.x;
        })
        .attr('y2', (d) => {
          return d.target.y;
        });

      this.node
        .attr('transform', (d) => {
          return `translate(${ d.x }, ${ d.y })`;
        });
    },
    mainNodeChidlrenToggle(ev, d) {
      if (!ev.defaultPrevented) {
        // this is the same as directly tapping into this.root and changing properties...
        if (d.children) {
          d._children = d.children;
          d.children = null;
        } else {
          d.children = d._children;
          d._children = null;
        }
        this.updateChart(false, true);

        // this sets the link line to a "lower" level, much like z-index (otherwise it would appear above other "layers")
        this.link.lower();
      }
    },
    setDetailsInfo(data, toUpdate) {
      const moreInfo = {};

      Object.keys(data).forEach((key) => {
        if (['id', 'detailLocation', 'type', 'state', 'stateLabel', 'stateColor', 'errorMsg'].includes(key)) {
          moreInfo[key] = data[key];
        }
      });

      // needed to make ui reactive
      this.moreInfo = Object.assign({}, moreInfo);

      // update to the chart is needed when active state changes
      if (toUpdate) {
        this.allNodesData.forEach((item, i) => {
          if (item.data.matchingId === data.matchingId) {
            this.allNodesData[i].data.active = true;
          } else {
            this.allNodesData[i].data.active = false;
          }
        });

        this.updateChart(false, false);
      }
    },
    dragstarted(ev, d) {
      if (!ev.active) {
        this.simulation.alphaTarget(0.3).restart();
      }
      d.fx = d.x;
      d.fy = d.y;
    },
    dragged(ev, d) {
      d.fx = ev.x;
      d.fy = ev.y;
    },
    dragended(ev, d) {
      if (!ev.active) {
        this.simulation.alphaTarget(0);
      }
      d.fx = null;
      d.fy = null;
    },
    flatten(root) {
      const nodes = [];
      let i = 0;

      function recurse(node) {
        if (node.children) {
          node.children.forEach(recurse);
        }
        if (!node.id) {
          node.id = ++i;
        } else {
          ++i;
        }
        nodes.push(node);
      }
      recurse(root);

      return nodes;
    },
    zoomFit() {
      const rootNode = d3.select('.root-node');
      const paddingBuffer = 10;

      const chartDimentions = rootNode.node().getBoundingClientRect();
      const chartCoordinates = rootNode.node().getBBox();
      const parent = rootNode.node().parentElement;
      const fullWidth = parent.clientWidth;
      const fullHeight = parent.clientHeight;
      const width = chartDimentions.width;
      const height = chartDimentions.height;
      const midX = chartCoordinates.x + width / 2;
      const midY = chartCoordinates.y + height / 2;

      // console.log('fullWidth', fullWidth);
      // console.log('fullHeight', fullHeight);
      // console.log('width', width);
      // console.log('height', height);
      // console.log('midX', midX);
      // console.log('midY', midY);

      if (width === 0 || height === 0) {
        return;
      } // nothing to fit

      const scale = 1 / Math.max((width + paddingBuffer) / fullWidth, (width + height) / fullHeight);
      const translate = [fullWidth / 2 - scale * midX, fullHeight / 2 - scale * midY];

      // console.log('scale', scale);
      // console.log('translate', translate);

      const transform = d3.zoomIdentity
        .translate(translate[0], translate[1])
        .scale(scale);

      this.svg.attr('transform', transform);
    },
    zoomed(ev) {
      this.svg.attr('transform', ev.transform);
    }
  }
};
</script>

<template>
  <div>
    <div class="chart-container">
      <Loading
        v-if="withContentLoader && !isRendered"
        class="chart-loader"
        :loading="true"
        mode="free"
        :no-delay="true"
      />
      <div id="tree">
      </div>
      <div class="more-info">
        <ul
          v-if="Object.keys(moreInfo).length"
        >
          <li>
            <p>
              <span class="more-info-item-label">Name:</span>
              <span
                v-if="moreInfo.detailLocation"
                class="more-info-item-value"
              >
                <n-link
                  :to="moreInfo.detailLocation"
                >
                  {{ moreInfo.id }}
                </n-link>
              </span>
              <span
                v-else
                class="more-info-item-value"
              >{{ moreInfo.id }}</span>
            </p>
          </li>
          <li>
            <p>
              <span class="more-info-item-label">Type:</span>
              <span class="more-info-item-value">{{ moreInfo.type }}</span>
            </p>
          </li>
          <li>
            <p>
              <span class="more-info-item-label">State:</span>
              <span class="more-info-item-value">
                <BadgeState
                  :color="`bg-${moreInfo.stateColor}`"
                  :label="moreInfo.stateLabel"
                  class="state-bagde"
                />
              </span>
            </p>
          </li>
          <li v-show="moreInfo.errorMsg">
            <p>
              <span class="more-info-item-label">Error:</span>
              <span class="more-info-item-value error">{{ moreInfo.errorMsg }}</span>
            </p>
          </li>
        </ul>
      </div>
    </div>
    <button type="button" @click="zoomFit">
      ZOOM TO FIT CONTENT
    </button>
  </div>
</template>

<style lang="scss">
.chart-container {
  display: flex;
  background-color: var(--body-bg);
  position: relative;
  border: 1px solid var(--border);
  border-radius: var(--border-radius);

  .chart-loader {
    min-height: 200px;
  }

  #tree {
    width: 70%;

    svg {
      margin-top: 3px;
    }

    .link {
      stroke: var(--darker);
    }

    .node {
      cursor: pointer;

      &.active {
        .node-hover-layer {
          display: block;
        }
      }

      &.repo.active circle {
        transform: scale(1.1);
      }

      &.bundle.active circle {
        transform: scale(1.25);
      }

      &.resource.active circle {
        transform: scale(1.5);
      }

      &.node-default-fill {
        fill: #CCC;
      }
      &.node-success {
        fill: var(--success);
      }
      &.node-info {
        fill: var(--info);
      }
      &.node-warning {
        fill: var(--warning);
      }
      &.node-error {
        fill: var(--error);
      }

      .svg-img {
        background-repeat: no-repeat;
        background-size: cover;
        background-position: center center;
      }

      &.repo .svg-img {
        background-image: url('~assets/images/fleetForceDirectedChart/git.svg');
      }
      &.bundle .svg-img {
        background-image: url('~assets/images/fleetForceDirectedChart/compass.svg');
      }
      &.helm.bundle .svg-img {
        background-image: url('~assets/images/fleetForceDirectedChart/helm.svg');
      }
      &.resource .svg-img {
        background-image: url('~assets/images/fleetForceDirectedChart/folder.svg');
      }

      .node-hover-layer {
        stroke: var(--body-bg);
        stroke-width: 2;
        display: none;
      }
    }
  }

  .more-info {
    width: 30%;
    padding: 20px;
    border-left: 1px solid var(--border);
    background-color: var(--body-bg);
    position: relative;
    border-top-right-radius: var(--border-radius);
    border-bottom-right-radius: var(--border-radius);

    ul {
      list-style: none;
      margin: 0;
      padding: 0;

      li {
        margin: 0 0 8px 0;
        padding: 0;
        display: flex;
        align-items: center;

        .more-info-item-label {
          color: var(--darker);
          margin-right: 3px;
        }
        .more-info-item-value.error {
          color: var(--error);
        }
      }
    }
  }
}

</style>
