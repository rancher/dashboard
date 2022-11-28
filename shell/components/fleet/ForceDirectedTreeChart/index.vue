<script>
import * as d3 from 'd3';
import { STATES } from '@shell/plugins/dashboard-store/resource-class';
import { BadgeState } from '@components/BadgeState';
import { getChartIcon } from './chartIcons.js';

export default {
  name:       'ForceDirectedTreeChart',
  components: { BadgeState },
  props:      {
    data: {
      type:     [Array, Object],
      required: true
    },
    fdcConfig: {
      type:     Object,
      required: true
    }
  },
  data() {
    return {
      dataWatcher:                         undefined,
      parsedInfo:                          undefined,
      root:                                undefined,
      allNodesData:                        undefined,
      allLinks:                            undefined,
      rootNode:                            undefined,
      node:                                undefined,
      link:                                undefined,
      svg:                                 undefined,
      zoom:                                undefined,
      simulation:                          undefined,
      isChartFirstRendered:                false,
      isChartFirstRenderAnimationFinished: false,
      moreInfo:                            {}
    };
  },
  methods: {
    watcherFunction(newValue) {
      if (newValue.length) {
        if (!this.isChartFirstRendered) {
          this.parsedInfo = this.fdcConfig.parseData(this.data);

          // set details info and set active state for node
          this.setDetailsInfo(this.parsedInfo, false);
          this.parsedInfo.active = true;

          // render and update chart
          this.renderChart();
          this.updateChart(true, true);
          this.isChartFirstRendered = true;

          // here we just look for changes in the status of the nodes and update them accordingly
        } else {
          const parsedInfo = this.fdcConfig.parseData(this.data);
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
      }
    },
    renderChart() {
      this.zoom = d3.zoom().scaleExtent([1 / 8, 16]).on('zoom', this.zoomed);
      const transform = d3.zoomIdentity.scale(1).translate(0, 0);

      this.rootNode = this.svg.append('g')
        .attr('class', 'root-node');

      this.svg.call(this.zoom);
      this.svg.call(this.zoom.transform, transform);

      this.simulation = d3.forceSimulation()
        .force('charge', d3.forceManyBody().strength(this.fdcConfig.simulationParams.fdcStrength).distanceMax(this.fdcConfig.simulationParams.fdcDistanceMax))
        .force('collision', d3.forceCollide(this.fdcConfig.simulationParams.fdcForceCollide))
        .force('center', d3.forceCenter( this.fdcConfig.chartWidth / 2, this.fdcConfig.chartHeight / 2 ))
        .alphaDecay(this.fdcConfig.simulationParams.fdcAlphaDecay)
        .on('tick', this.ticked)
        .on('end', () => {
          if (!this.isChartFirstRenderAnimationFinished) {
            this.zoomFit();
            this.isChartFirstRenderAnimationFinished = true;
          }
        });
    },
    updateChart(isStartingData, isSettingNodesAndLinks) {
      if (isStartingData) {
        this.root = d3.hierarchy(this.parsedInfo);
      }

      if (isSettingNodesAndLinks) {
        this.allNodesData = this.flatten(this.root);
        this.allLinks = this.root.links();
      }

      this.link = this.rootNode
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
        .style('stroke-width', 4);

      this.link = linkEnter.merge(this.link);

      this.node = this.rootNode
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
          .on('start', this.dragStarted)
          .on('drag', this.dragging)
          .on('end', this.dragEnded));

      // draw status circle (inherits color from main node)
      nodeEnter.append('circle')
        .attr('r', this.setNodeRadius);

      nodeEnter.append('circle')
        .attr('r', (d) => {
          return this.setNodeRadius(d) - 5;
        })
        .attr('class', 'node-hover-layer');

      nodeEnter.append('svg').html((d) => {
        const icon = this.fdcConfig.fetchNodeIcon(d);

        return getChartIcon(icon);
      })
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
        .links(this.allLinks)
      );
    },
    mainNodeClass(d) {
      const lowerCaseStatus = d.data?.state ? d.data.state.toLowerCase() : 'unkown_status';
      const defaultClassArray = ['node'];

      if (STATES[lowerCaseStatus] && STATES[lowerCaseStatus].color) {
        defaultClassArray.push(`node-${ STATES[lowerCaseStatus].color }`);
      } else {
        defaultClassArray.push(`node-default-fill`);
      }

      // node active (clicked)
      if (d.data?.active) {
        defaultClassArray.push('active');
      }

      // here we extend the node classes (different chart types)
      const extendedClassArray = this.fdcConfig.extendNodeClass(d).concat(defaultClassArray);

      return extendedClassArray.join(' ');
    },
    setNodeRadius(d) {
      const { radius } = this.fdcConfig.nodeDimensions(d);

      return radius;
    },
    nodeImageSize(d) {
      const { size } = this.fdcConfig.nodeDimensions(d);

      return size;
    },
    nodeImagePosition(d) {
      const { position } = this.fdcConfig.nodeDimensions(d);

      return position;
    },
    setDetailsInfo(data, toUpdate) {
      // get the data to be displayed on info box, per each different chart
      this.moreInfo = Object.assign([], this.fdcConfig.infoDetails(data));

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
    zoomFit() {
      const rootNode = d3.select('.root-node');
      const paddingBuffer = 30;

      const chartDimentions = rootNode.node().getBoundingClientRect();
      const chartCoordinates = rootNode.node().getBBox();
      const parent = rootNode.node().parentElement;
      const fullWidth = parent.clientWidth;
      const fullHeight = parent.clientHeight;
      const width = chartDimentions.width;
      const height = chartDimentions.height;
      const midX = chartCoordinates.x + width / 2;
      const midY = chartCoordinates.y + height / 2;

      if (width === 0 || height === 0) {
        return;
      } // nothing to fit

      const scale = 1 / Math.max(width / (fullWidth - paddingBuffer), height / (fullHeight - paddingBuffer));
      const translate = [fullWidth / 2 - scale * midX, fullHeight / 2 - scale * midY];

      const transform = d3.zoomIdentity
        .translate(translate[0], translate[1])
        .scale(scale);

      // this update the cached zoom state!!!!! very important so that any transforms from user interaction keep this base!
      this.svg.call(this.zoom.transform, transform);
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
    dragStarted(ev, d) {
      if (!ev.active) {
        this.simulation.alphaTarget(0.3).restart();
      }
      d.fx = d.x;
      d.fy = d.y;
    },
    dragging(ev, d) {
      d.fx = ev.x;
      d.fy = ev.y;
    },
    dragEnded(ev, d) {
      if (!ev.active) {
        this.simulation.alphaTarget(0);
      }
      d.fx = undefined;
      d.fy = undefined;
    },
    zoomed(ev) {
      this.rootNode.attr('transform', ev.transform);
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
    }
  },
  mounted() {
    // start by appending SVG to define height of chart area
    this.svg = d3.select('#tree').append('svg')
      .attr('viewBox', `0 0 ${ this.fdcConfig.chartWidth } ${ this.fdcConfig.chartHeight }`)
      .attr('preserveAspectRatio', 'none');

    // set watcher for the chart data
    this.dataWatcher = this.$watch(this.fdcConfig.watcherProp, function(newValue) {
      this.watcherFunction(newValue);
    });
  },
  unmounted() {
    this.dataWatcher();
  },
};
</script>

<template>
  <div>
    <div class="chart-container">
      <!-- loading status container -->
      <div
        v-if="!isChartFirstRenderAnimationFinished"
        class="loading-container"
      >
        <p v-show="!isChartFirstRendered">
          {{ t('fleet.fdc.loadingChart') }}
        </p>
        <p v-show="isChartFirstRendered && !isChartFirstRenderAnimationFinished">
          {{ t('fleet.fdc.renderingChart') }}
        </p>
        <i class="mt-10 icon-spinner icon-spin" />
      </div>
      <!-- main div for svg container -->
      <div id="tree" />
      <!-- info box -->
      <div class="more-info-container">
        <div class="more-info">
          <table>
            <tr
              v-for="(item, i) in moreInfo"
              :key="i"
            >
              <td
                v-if="item.type !== 'single-error'"
                :class="{'align-middle': item.type === 'state-badge'}"
              >
                <span class="more-info-item-label">{{ t(item.labelKey) }}:</span>
              </td>
              <!-- title template -->
              <td v-if="item.type === 'title-link'">
                <span v-if="item.valueObj.detailLocation">
                  <n-link
                    :to="item.valueObj.detailLocation"
                  >
                    {{ item.valueObj.id }}
                  </n-link>
                </span>
                <span v-else>{{ item.valueObj.id }}</span>
              </td>
              <!-- state-badge template -->
              <td
                v-else-if="item.type === 'state-badge'"
                class="align-middle"
              >
                <span>
                  <BadgeState
                    :color="`bg-${item.valueObj.stateColor}`"
                    :label="item.valueObj.stateLabel"
                    class="state-bagde"
                  />
                </span>
              </td>
              <!-- single-error template -->
              <td
                v-if="item.type === 'single-error'"
                class="single-error"
                colspan="2"
              >
                <p>{{ item.value }}</p>
              </td>
              <!-- default template -->
              <td v-else>
                {{ item.value }}
              </td>
            </tr>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
.chart-container {
  display: flex;
  background-color: var(--body-bg);
  position: relative;
  border: 1px solid var(--border);
  border-radius: var(--border-radius);
  min-height: 100px;

  .loading-container {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border-radius: var(--border-radius);
    background-color: var(--body-bg);
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;

    i {
      font-size: 24px;
    }
  }

  #tree {
    width: 70%;
    height: fit-content;

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

      &.repo.active > circle {
        transform: scale(1.2);
      }

      &.bundle.active > circle {
        transform: scale(1.35);
      }

      &.bundle-deployment.active > circle {
        transform: scale(1.6);
      }

      &.node-default-fill > circle,
      &.repo > circle {
        fill: var(--muted);
      }
      &:not(.repo).node-success > circle {
        fill: var(--success);
      }
      &:not(.repo).node-info > circle {
        fill: var(--info);
      }
      &:not(.repo).node-warning > circle {
        fill: var(--warning);
      }
      &:not(.repo).node-error > circle {
        fill: var(--error);
      }

      .node-hover-layer {
        stroke: var(--body-bg);
        stroke-width: 2;
        display: none;
      }
    }
  }

  .more-info-container {
    width: 30%;
    position: relative;
    border-left: 1px solid var(--border);
    background-color: var(--body-bg);
    border-top-right-radius: var(--border-radius);
    border-bottom-right-radius: var(--border-radius);
    overflow: hidden;

    .more-info {
      position: absolute;
      top: 0;
      left: 0;
      right:0;
      bottom:0;
      width: 100%;
      padding: 20px;
      border-top-right-radius: var(--border-radius);
      border-bottom-right-radius: var(--border-radius);
      overflow-y: auto;

      table {
        td {
          vertical-align: top;
          padding-bottom: 10px;

          &.align-middle {
            vertical-align: middle;
          }
        }

        .more-info-item-label {
          color: var(--darker);
          margin-right: 8px;
        }

        .single-error {
          color: var(--error);
        }

        p {
          line-height: 1.5em;
        }
      }
    }
  }
}
</style>
