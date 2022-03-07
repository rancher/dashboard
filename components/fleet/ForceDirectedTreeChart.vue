<script>
import * as d3 from 'd3';
import { STATES } from '@/plugins/steve/resource-class';

export default {
  name:  'ForceDirectedTreeChart',
  props: {
    data: {
      type:     [Array, Object],
      required: true
    },
  },
  data() {
    return {
      parsedData:   null,
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
      moreInfo:     null
    };
  },
  watch: {
    data: {
      handler(newValue) {
        if (newValue.bundles?.length) {
          // eslint-disable-next-line no-console
          console.log('WATCHER TRIGGERED!', JSON.stringify(newValue.bundles.length, null, 2));

          if (!this.isRendered) {
            this.parsedData = this.parse(newValue);
            console.log('ORIGINAL DATA flattened', this.flatten(this.parsedData));
            this.renderChart();
            this.updateChart(true, true);
            this.isRendered = true;
          } else {
            const parsedData = this.parse(newValue);
            const flattenedData = this.flatten(parsedData);
            let hasStatusChange = false;

            flattenedData.forEach((item) => {
              const index = this.allNodesData.findIndex(nodeData => item.id === nodeData.data.id);

              if (index > -1 && this.allNodesData[index].data.status !== item.status) {
                this.allNodesData[index].data.status = item.status;
                hasStatusChange = true;
              }
            });

            if (hasStatusChange) {
              this.updateChart(false, false);
            }
          }
        }
      }
    }
  },
  methods: {
    changeNodeStatus() {
      console.log('NODE STATUS TOGGLED between active and warning!');
      const index = this.allNodesData.findIndex(item => item.data.id === 'item3');

      this.allNodesData[index].data.status = this.allNodesData[index].data.status === 'warning' ? 'active' : 'warning';
      this.updateChart(false, false);
    },
    parse(data) {
      const repoChildren = data.bundles.map((bundle, i) => {
        const repoChild = {
          id:       bundle.id,
          label:    bundle.nameDisplay,
          rawData:    bundle,
          type:     'bundle',
          isBundle: true,
          status:   bundle.state,
          hasError: data?.stateObj?.error,
          children: []
        };

        if (bundle.status?.resourceKey?.length) {
          bundle.status.resourceKey.forEach((res, index) => {
            const id = `${ res.kind }-${ res.namespace }/${ res.name }`;
            let status;

            if (data.status?.resources?.length) {
              const item = data.status?.resources?.find(resource => `${ resource.kind }-${ resource.id }` === id);

              if (item) {
                status = item.state;
              }
            }

            repoChild.children.push({
              id,
              label:      res.name,
              rawData:    res,
              type:       'resource',
              isResource: true,
              status,
              hasError:   data?.stateObj?.error,
            });
          });
        }

        return repoChild;
      });

      const finalData = {
        id:       data?.id,
        label:    data?.nameDisplay,
        rawData:  data,
        type:     'repo',
        isRepo:   true,
        status:   data?.state,
        hasError: data?.stateObj?.error,
        children: repoChildren
      };

      return finalData;
    },
    renderChart() {
      const width = 800;
      const height = 300;

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
        .force('collision', d3.forceCollide(this.circleRadius * 1.5))
        .force('center', d3.forceCenter( width / 2, height / 2 ))
        .on('tick', this.ticked);
    },
    updateChart(isStartingData, isSettingNodesAndLinks) {
      if (isStartingData) {
        this.root = d3.hierarchy(this.parsedData);
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
        .style('stroke', '#000' )
        .style('opacity', '0.2')
        .style('stroke-width', 2);

      this.link = linkEnter.merge(this.link);

      this.node = this.svg
        .selectAll('.node')
        .data(this.allNodesData, (d) => {
          return d.id;
        })
        // this is where we define which prop changes with any data update (status color)
        .style('fill', this.statusColor);

      this.node.exit().remove();

      // define the node styling and function
      const nodeEnter = this.node
        .enter()
        .append('g')
        .attr('class', 'node')
        .style('fill', this.statusColor)
        .style('opacity', 1)
        .on('click', this.mainNodeClick)
        .call(d3.drag()
          .on('start', this.dragstarted)
          .on('drag', this.dragged)
          .on('end', this.dragended));

      // draw status circle (inherits color from main node)
      nodeEnter.append('circle')
        .attr('stroke', this.hasChildrenStrokeColor)
        .attr('stroke-width', 3)
        .attr('r', (d) => {
          return d.data?.isRepo ? this.circleRadius * 2 : this.circleRadius;
        });

      // sets inner label
      nodeEnter.append('text')
        .attr('x', 0)
        .attr('y', 0 + 8)
        .attr('text-anchor', 'middle')
        .attr('font-size', '24px')
        .attr('font-weight', 'lighter')
        .attr('fill', 'black')
        .attr('id', (d, i) => {
          return `text${ i }`;
        })
        .text(this.generateLabel);

      nodeEnter.append('text')
        .attr('x', (d) => {
          return d.data?.isRepo ? this.circleRadius * 2 + 10 : this.circleRadius + 10;
        })
        .attr('y', (d) => {
          return d.data?.isRepo ? this.circleRadius * 2 + 10 : this.circleRadius + 10;
        })
        .attr('text-anchor', 'middle')
        .attr('font-size', '16px')
        .attr('font-weight', 'lighter')
        .attr('fill', 'black')
        .text('+info')
        .on('click', (ev, d) => {
          ev.stopPropagation();this.moreInfoClick(ev, d);
        });

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
    statusColor(d) {
      const lowerCaseStatus = d.data?.status ? d.data.status.toLowerCase() : 'unkown_status';
      const stateColorDefinition = STATES[lowerCaseStatus] ? STATES[lowerCaseStatus].color : 'unknown_color';

      switch (stateColorDefinition) {
      case 'success':
        return '#5D995D';
      case 'warning':
        return '#DAC342';
      case 'error':
        return '#F64747';
      case 'info':
        return '#3D98D3';
      default:
        return '#CCC';
      }
    },
    hasChildrenStrokeColor(d) {
      return d.children ? 'black' : d._children ? 'black' : '';
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
      }
    },
    moreInfoClick(ev, d) {
      if (!ev.defaultPrevented) {
        console.log('MORE INFO CLICK!', d.data.id);
        this.moreInfo = d.data?.rawData ? d.data?.rawData : d.data;
      }
    },
    closeMoreInfo() {
      this.moreInfo = null;
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
    <div class="chartContainer">
      <div id="tree">
      </div>
      <div v-show="moreInfo" class="more-info">
        <p>{{ moreInfo }}</p>
        <span @click="closeMoreInfo">X</span>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
.chartContainer {
  display: flex;

  #tree {
    width: 80%;
    border: 2px solid red;

    .node {
      cursor: pointer;
    }
  }

  .more-info {
    width: 20%;
    border: 2px solid blue;
    padding: 10px 40px 10px 10px;
    position: relative;

    span {
      position: absolute;
      top: 0;
      right: 0;
      padding: 10px;
      cursor: pointer;
    }
  }
}

</style>
