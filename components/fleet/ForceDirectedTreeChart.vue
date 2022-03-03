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
      root:         undefined,
      nodesData:         undefined,
      allLinks:         undefined,
      node:         undefined,
      link:         undefined,
      svg:          undefined,
      simulation:   undefined,
      circleRadius: 15,
      isRendered:   false
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
        this.nodesData = this.flatten(this.root);
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
        .data(this.nodesData, (d) => {
          return d.id;
        });

      this.node.exit().remove();

      const nodeEnter = this.node
        .enter()
        .append('g')
        .attr('class', 'node')
        .style('fill', this.statusColor)
        .style('opacity', 1)
        .on('click', this.clicked)
        .call(d3.drag()
          .on('start', this.dragstarted)
          .on('drag', this.dragged)
          .on('end', this.dragended));

      nodeEnter.append('circle')
        .attr('stroke', this.hasChildrenStrokeColor)
        .attr('stroke-width', 3)
        .attr('r', (d) => {
          return d.data?.isRepo ? this.circleRadius * 2 : this.circleRadius;
        });

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

      this.node = nodeEnter.merge(this.node);

      this.simulation.nodes(this.nodesData);
      this.simulation.force('link', d3.forceLink().id((d) => {
        return d.id;
      }).distance(100).links(this.allLinks));
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
    clicked(ev, d) {
      if (!ev.defaultPrevented) {
        if (d.children) {
          d._children = d.children;
          d.children = null;
        } else {
          d.children = d._children;
          d._children = null;
        }
        this.updateChart();
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

      console.log('FLATTEN BEFORE', root);

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

      console.log('FLATTEN AFTER', nodes);

      return nodes;
    },
    zoomed(ev) {
      this.svg.attr('transform', ev.transform);
    },
    changeNodeStatus() {
      console.log('CHANGE NODE STATUS CLICKED!', this.nodesData)
      const index = this.nodesData.findIndex(item => item.data.id === 'item3');
      this.nodesData[index].data.status = 'warning';

      this.updateChart();
    },
    addNode() {
      this.parsedData.children[1].children.push({
        id:       'newID',
        children: []
      });

      // eslint-disable-next-line no-console
      console.log('CLICKED', this.parsedData.children[1].children);

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
    <div id="tree">
    </div>
    <button class="mt-20" @click="changeNodeStatus">
      CHANGE BUNDLE NODE FROM ACTIVE TO WARNING
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

.node {
  cursor: pointer;
}
</style>
