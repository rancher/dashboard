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
        children: [
          {
            id:       'item2',
            children: [
              {
                id:       'item4',
                children: []
              },
              {
                id:       'item5',
                children: []
              },
              {
                id:       'item6',
                children: []
              },
              {
                id:       'item7',
                children: []
              },
              {
                id:       'item8',
                children: []
              },
              {
                id:       'item9',
                children: []
              },
            ]
          },
          {
            id:       'item3',
            children: []
          }
        ]
      },
      root:       undefined,
      node:       undefined,
      link:       undefined,
      svg:        undefined,
      simulation:       undefined,
      isRendered: false
    };
  },
  methods: {
    renderChart() {
      const width = 800;
      const height = 400;

      // clear any previous renders, if they exist...
      // if (d3.select('#tree > svg')) {
      //   d3.select('#tree > svg').remove();
      // }

      this.svg = d3.select('#tree').append('svg')
        .attr('viewBox', `0 0 ${ width } ${ height }`)
        .call(d3.zoom().scaleExtent([1 / 2, 8]).on('zoom', this.zoomed))
        .append('g')
        .attr('transform', 'translate(40,0)');

      this.simulation = d3.forceSimulation()
        .force('link', d3.forceLink().id((d) => {
          return d.id;
        }))
        .force('charge', d3.forceManyBody().strength(-15).distanceMax(300))
        .force('center', d3.forceCenter( width / 2, height / 4 ))
        .on('tick', this.ticked);
    },
    updateChart() {
      this.root = d3.hierarchy(this.parsedData);
      const nodes = this.flatten(this.root);
      const links = this.root.links();

      this.link = this.svg
        .selectAll('.link')
        .data(links, (d) => {
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
        .data(nodes, (d) => {
          return d.id;
        });

      this.node.exit().remove();

      const nodeEnter = this.node
        .enter()
        .append('g')
        .attr('class', 'node')
        .attr('stroke', this.hasChildrenColor)
        .attr('stroke-width', 2)
        .style('fill', this.color)
        .style('opacity', 1)
        .on('click', this.clicked)
        .call(d3.drag()
          .on('start', this.dragstarted)
          .on('drag', this.dragged)
          .on('end', this.dragended));

      nodeEnter.append('circle')
        .attr('r', (d) => {
          // return Math.sqrt(d.data.size) / 10 || 4.5;
          return 10;
        })
        .style('text-anchor', (d) => {
          return d.children ? 'end' : 'start';
        });
      // .text((d) => {
      //   return d.label;
      // });

      this.node = nodeEnter.merge(this.node);
      this.simulation.nodes(nodes);
      this.simulation.force('link').links(links);
    },
    color(d) {
      return '#ccc';
    },
    hasChildrenColor(d) {
      return d.data.id === 'item1' ? 'red' : d._children ? '#000' : d.children ? '#000' : 'none'; // leaf node
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
    addNode() {
      this.parsedData.children[1].children.push({
        id:       'newID',
        children: []
      });

      // eslint-disable-next-line no-console
      console.log('CLICKED', this.parsedData.children[1].children);

      this.updateChart();
    }
  },
  mounted() {
    this.renderChart();
    this.updateChart();
  },
};
</script>

<template>
  <div>
    <div id="tree">
    </div>
    <button @click="addNode">
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

// .node text { font: 14px sans-serif; }

.link {
  fill: none;
  stroke: #ccc;
  stroke-width: 2px;
}
</style>
