<script>
import * as d3 from 'd3';

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
      parsedData: {
        id:       'item1',
        isRepo:   true,
        status:   'active',
        children: [
          {
            id:       'item2',
            children: [
              {
                id:       'item4',
                children: [],
                status:   'warning',
              },
              {
                id:       'item5',
                children: [],
                status:   'active',
              },
              {
                id:       'item6',
                children: [],
                status:   'active',
              },
              {
                id:       'item7',
                children: [],
                status:   'active',
              },
              {
                id:       'item8',
                children: [],
                status:   'error',
              },
              {
                id:       'item9',
                children: [],
                status:   'active',
              },
            ],
            isBundle: true,
            status:   'error',
          },
          {
            id:       'item3',
            children: [
              {
                id:       'item301',
                status:   'active',
                children: []
              },
              {
                id:       'item302',
                status:   'active',
                children: []
              },
              {
                id:       'item303',
                status:   'active',
                children: []
              },
              {
                id:       'item304',
                status:   'active',
                children: []
              },
            ],
            isBundle: true,
            status:   'active',
          },
          {
            id:       'item110',
            children: [
              {
                id:       'item111',
                status:   'active',
                children: []
              },
              {
                id:       'item112',
                status:   'warning',
                children: []
              }
            ],
            isBundle: true,
            status:   'active',
          }
        ]
      },
      root:         null,
      allNodesData: null,
      allLinks:     null,
      node:         null,
      link:         null,
      svg:          null,
      simulation:   null,
      circleRadius: 15,
      isRendered:   false,
      moreInfo:     null
    };
  },
  methods: {
    renderChart() {
      const width = 800;
      const height = 600;

      // clear any previous renders, if they exist...
      if (d3.select('#tree > svg')) {
        d3.select('#tree > svg').remove();
      }

      this.svg = d3.select('#tree').append('svg')
        .attr('viewBox', `0 0 ${ width } ${ height }`)
        .call(d3.zoom().scaleExtent([1 / 2, 8]).on('zoom', this.zoomed))
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
    },
    statusColor(d) {
      switch (d.data.status) {
      case 'active':
        return 'green';
      case 'warning':
        return 'yellow';
      case 'error':
        return 'red';
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
        console.log('SIMPLE NODE CLICK should toggle children!', d.data.id);
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
        this.moreInfo = d.data;
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
    zoomed(ev) {
      this.svg.attr('transform', ev.transform);
    },
    changeNodeStatus() {
      console.log('NODE STATUS TOGGLED between active and warning!');
      const index = this.allNodesData.findIndex(item => item.data.id === 'item3');

      this.allNodesData[index].data.status = this.allNodesData[index].data.status === 'warning' ? 'active' : 'warning';
      this.updateChart(false, false);
    },
    addNode() {
      this.parsedData.children.push({
        id:       'newID',
        isBundle: true,
        status:   'active',
        children: [
          {
            id:       'newID1',
            status:   'error',
            children: []
          }
        ]
      });

      // eslint-disable-next-line no-console
      console.log('NODE ADDED! - bundle status active + resource status error');

      this.renderChart();
      this.updateChart(true, true);
    }
  },
  mounted() {
    this.renderChart();
    this.updateChart(true, true);
  },
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
    <button class="mt-20" @click="changeNodeStatus">
      TOGGLE BUNDLE NODE STATUS BETWEEN ACTIVE AND WARNING
    </button>
    <button class="mt-20" @click="addNode">
      ADD A NEW NODE TO THE CHART
    </button>
  </div>
</template>

<style lang="scss">
#tree {
  width: 100%;
  border: 2px solid red;
}

.more-info {
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

.node {
  cursor: pointer;
}
</style>
