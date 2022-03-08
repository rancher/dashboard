<script>
import * as d3 from 'd3';
import { STATES } from '@/plugins/steve/resource-class';
import BadgeState from '@/components/BadgeState';

export default {
  name:       'ForceDirectedTreeChart',
  components: { BadgeState },
  props:      {
    data: {
      type:     [Array, Object],
      required: true
    },
  },
  data() {
    return {
      parsedInfo:   null,
      root:         null,
      allNodesData: null,
      allLinks:     null,
      node:         null,
      link:         null,
      svg:          null,
      zoom:         null,
      simulation:   null,
      circleRadius: 15,
      isRendered:   false,
      moreInfo:     undefined
    };
  },
  watch: {
    data: {
      handler(newValue) {
        // if (newValue.bundles?.length) {

        // eslint-disable-next-line no-console
        console.log('WATCHER TRIGGERED!', JSON.stringify(newValue.bundles.length, null, 2), newValue);

        if (!this.isRendered) {
          this.parsedInfo = this.parseData(newValue);
          // console.log('ORIGINAL DATA flattened', this.flatten(this.parsedInfo));
          this.renderChart();
          this.updateChart(true, true);
          this.isRendered = true;
        } else {
          const parsedInfo = this.parseData(newValue);
          const flattenedData = this.flatten(parsedInfo);
          let hasStatusChange = false;

          flattenedData.forEach((item) => {
            const index = this.allNodesData.findIndex(nodeData => item.matchingId === nodeData.data.matchingId);

            if (index > -1 && this.allNodesData[index].data.state !== item.state) {
              this.allNodesData[index].data.state = item.state;
              hasStatusChange = true;
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

        // }
      }
    }
  },
  methods: {
    parseData(data) {
      const repoChildren = data.bundles.map((bundle, i) => {
        const bundleLowercaseState = bundle.state ? bundle.state.toLowerCase() : 'unknown';
        const bundleStateColor = STATES[bundleLowercaseState].color;

        const repoChild = {
          id:         bundle.id,
          matchingId: bundle.id,
          type:       bundle.type,
          state:      bundle.state,
          stateLabel: bundle.stateDisplay,
          stateColor: bundleStateColor,
          isBundle:   true,
          hasError:   data?.stateObj?.error,
          children:   []
        };

        if (bundle.status?.resourceKey?.length) {
          bundle.status.resourceKey.forEach((res, index) => {
            const id = `${ res.namespace }/${ res.name }`;
            const matchingId = `${ res.kind }-${ res.namespace }/${ res.name }`;
            let type;
            let state;
            let stateLabel;
            let stateColor;

            if (data.status?.resources?.length) {
              const item = data.status?.resources?.find(resource => `${ resource.kind }-${ resource.id }` === matchingId);

              if (item) {
                type = item.type;
                state = item.state;
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
              hasError:   data?.stateObj?.error,
            });
          });
        }

        return repoChild;
      });

      const repoLowercaseState = data.state ? data.state.toLowerCase() : 'unknown';
      const repoStateColor = STATES[repoLowercaseState].color;

      const finalData = {
        id:         data.id,
        matchingId: data.id,
        type:       data.type,
        state:      data.state,
        stateLabel: data.stateDisplay,
        stateColor: repoStateColor,
        isRepo:     true,
        hasError:   data.stateObj?.error,
        children:   repoChildren
      };

      return finalData;
    },
    renderChart() {
      const width = 800;
      const height = 400;

      // clear any previous renders, if they exist...
      // if (d3.select('#tree > svg')) {
      //   d3.select('#tree > svg').remove();
      // }
      this.zoom = d3.zoom().scaleExtent([1 / 8, 16]).on('zoom', this.zoomed);

      this.svg = d3.select('#tree').append('svg')
        .attr('viewBox', `0 0 ${ width } ${ height }`)
        .call(this.zoom)
        .append('g')
        .attr('transform', 'translate(40,0)');

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
        .attr('class', this.statusClassColor);

      this.node.exit().remove();

      // define the node styling and function
      const nodeEnter = this.node
        .enter()
        .append('g')
        .attr('class', this.statusClassColor)
        .style('opacity', 1)
        .on('click', this.mainNodeClick)
        .on('mouseover', this.handleDetailsInfo)
        .on('mouseout', this.handleDetailsInfo)
        .call(d3.drag()
          .on('start', this.dragstarted)
          .on('drag', this.dragged)
          .on('end', this.dragended));

      // draw status circle (inherits color from main node)
      nodeEnter.append('circle')
        .attr('r', this.setNodeRadius);

      // node image
      nodeEnter.append('foreignObject')
        .attr('class', this.nodeImageClass)
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
      //   this.zoomFit(0.95, 500);
      // }
    },
    statusClassColor(d) {
      const lowerCaseStatus = d.data?.state ? d.data.state.toLowerCase() : 'unkown_status';
      const stateColorDefinition = STATES[lowerCaseStatus] ? STATES[lowerCaseStatus].color : 'unknown_color';

      switch (stateColorDefinition) {
      case 'success':
        return 'node node-success';
      case 'warning':
        return 'node node-warning';
      case 'error':
        return 'node node-error';
      case 'info':
        return 'node node-info';
      default:
        return 'node node-default-fill';
      }
    },
    setNodeRadius(d) {
      return d.data?.isRepo ? this.circleRadius * 3 : d.data?.isBundle ? this.circleRadius * 2 : this.circleRadius;
    },
    nodeImageClass(d) {
      return d.data?.isRepo ? 'svg-img repo' : d.data?.isBundle ? 'svg-img bundle' : 'svg-img resource';
    },
    nodeImageSize(d) {
      const size = this.setNodeRadius(d);

      return (size * 2) - 10;
    },
    nodeImagePosition(d) {
      const size = this.setNodeRadius(d);

      return -(((size * 2) - 10) / 2);
    },
    generateLabel(d) {
      return d.data.isRepo ? 'GIT' : d.data.isBundle ? 'B' : 'r';
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
    mainNodeClick(ev, d) {
      if (!ev.defaultPrevented) {
        console.log('SIMPLE NODE CLICK should toggle children!', d.data);
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
    handleDetailsInfo(ev, d) {
      const data = d.data?.rawData ? d.data?.rawData : d.data;

      if (ev.type === 'mouseover') {
        Object.keys(data).forEach((key) => {
          if (['id', 'type', 'state', 'stateLabel', 'stateColor', 'error'].includes(key)) {
            if (!this.moreInfo) {
              this.moreInfo = {};
            }
            this.moreInfo[key] = data[key];
          }
        });
      } else if (ev.type === 'mouseout') {
        this.moreInfo = undefined;
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
    zoomFit(paddingPercent, transitionDuration) {
      const bounds = this.root.node().getBBox();
      const parent = this.root.node().parentElement;
      const fullWidth = parent.clientWidth;
      const fullHeight = parent.clientHeight;
      const width = bounds.width;
      const height = bounds.height;
      const midX = bounds.x + width / 2;
      const midY = bounds.y + height / 2;

      if (width === 0 || height === 0) {
        return;
      } // nothing to fit
      const scale = (paddingPercent || 0.75) / Math.max(width / fullWidth, height / fullHeight);
      const translate = [fullWidth / 2 - scale * midX, fullHeight / 2 - scale * midY];

      console.trace('zoomFit', translate, scale);
      const transform = d3.zoomIdentity
        .translate(translate[0], translate[1])
        .scale(scale);

      this.root
        .transition()
        .duration(transitionDuration || 0) // milliseconds
        .call(this.zoom.transform, transform);
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
      <div id="tree">
      </div>
      <div class="more-info">
        <!-- <p class="more-info-header">
          Node Details
        </p> -->
        <span
          v-show="!moreInfo"
          class="more-info-no-info"
        >Hover a chart node for more information...</span>
        <ul
          v-if="moreInfo"
        >
          <li>
            <p>
              <span class="more-info-item-label">Name:</span>
              <span class="more-info-item-value">{{ moreInfo.id }}</span>
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
        </ul>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
.chart-container {
  display: flex;
  background-color: var(--body-bg);
  box-shadow: 0 0 20px var(--shadow);
  border-radius: calc(var(--border-radius) * 2);

  #tree {
    width: 70%;

    .link {
      stroke: var(--darker);
    }

    .node {
      cursor: pointer;

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

        &.repo {
          background-image: url('~assets/images/fleetForceDirectedChart/globe.svg');
        }
        &.bundle {
          background-image: url('~assets/images/fleetForceDirectedChart/compass.svg');
        }
        &.resource {
          background-image: url('~assets/images/fleetForceDirectedChart/folder.svg');
        }
      }
    }
  }

  .more-info {
    width: 30%;
    margin: 20px 20px 0 20px;
    padding: 20px;
    background-color: var(--box-bg);
    position: relative;

    &-header {
      text-decoration: underline;
      margin-bottom: 20px;
    }

    &-no-info {
      font-style: italic;
    }

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
      }
    }
  }
}

</style>
