<script>
import * as d3 from 'd3';
// import { forcedData } from './forcedData';

export default {
  name:  'TreeChart',
  props: {
    data: {
      type:     [Array, Object],
      required: true
    },
  },
  data() {
    return {
      parsedData: null,
      root:       null,
      node:       null,
      link:       null,
      svg:        null,
      simulation:       null,
      index:      0
    };
  },
  computed: {
    someData() {
      console.log('computed changed!', this.data);
      this.parseData();
      this.updateChart();

      return this.data;
    }
  },
  // watch: {
  //   data(newValue) {
  //     if (newValue.id) {
  //       // eslint-disable-next-line no-console
  //       console.log('WATCHER TRIGGERED!', newValue);
  //       this.parseData();
  //       this.renderChart();
  //     }
  //   }
  // },
  methods: {
    parseData() {
      const repoChildren = this.data.bundles.map((bundle, i) => {
        const repoChild = {
          id:       bundle.id,
          label:    bundle.nameDisplay,
          rawData:    bundle,
          type:     'bundle',
          hasError: this.data?.stateObj?.error,
          children: []
        };

        if (bundle.status?.resourceKey?.length) {
          bundle.status.resourceKey.forEach((res, index) => {
            repoChild.children.push({
              id:       index,
              label:    res.name,
              rawData:  res,
              type:     'resource',
              hasError: this.data?.stateObj?.error,
            });
          });
        }

        return repoChild;
      });

      const finalData = {
        id:       this.data?.id,
        label:    this.data?.nameDisplay,
        rawData:  this.data,
        type:     'repo',
        hasError: this.data?.stateObj?.error,
        children: repoChildren
      };

      this.parsedData = finalData;
    },
    renderChart() {
      const width = 800;
      const height = 400;

      let i = 0;

      const root = d3.hierarchy(this.parsedData);
      // const transform = d3.zoomIdentity;
      let node, link;

      // clear any previous renders, if they exist...
      if (d3.select('#tree > svg')) {
        d3.select('#tree > svg').remove();
      }

      const svg = d3.select('#tree').append('svg')
        .attr('viewBox', `0 0 ${ width } ${ height }`)
        .call(d3.zoom().scaleExtent([1 / 2, 8]).on('zoom', zoomed))
        .append('g')
        .attr('transform', 'translate(40,0)');

      const simulation = d3.forceSimulation()
        .force('link', d3.forceLink().id((d) => {
          return d.id;
        }))
        .force('charge', d3.forceManyBody().strength(-15).distanceMax(300))
        .force('center', d3.forceCenter( width / 2, height / 4 ))
        .on('tick', ticked);

      function update() {
        const nodes = flatten(root);
        const links = root.links();

        link = svg
          .selectAll('.link')
          .data(links, (d) => {
            return d.target.id;
          });

        link.exit().remove();

        const linkEnter = link
          .enter()
          .append('line')
          .attr('class', 'link')
          .style('stroke', '#000' )
          .style('opacity', '0.2')
          .style('stroke-width', 2);

        link = linkEnter.merge(link);

        node = svg
          .selectAll('.node')
          .data(nodes, (d) => {
            return d.id;
          });

        node.exit().remove();

        const nodeEnter = node
          .enter()
          .append('g')
          .attr('class', 'node')
          .attr('stroke', hasChildrenColor)
          .attr('stroke-width', 2)
          .style('fill', color)
          .style('opacity', 1)
          .on('click', clicked)
          .call(d3.drag()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended));

        nodeEnter.append('circle')
          .attr('r', (d) => {
            // return Math.sqrt(d.data.size) / 10 || 4.5;
            return 10;
          })
          .style('text-anchor', (d) => {
            return d.children ? 'end' : 'start';
          })
          .text((d) => {
            return d.label;
          });

        node = nodeEnter.merge(node);
        simulation.nodes(nodes);
        simulation.force('link').links(links);
      }

      // function sizeContain(num) {
      //   num = num > 1000 ? num / 1000 : num / 100;
      //   if (num < 4) {
      //     num = 4;
      //   }

      //   return num;
      // }

      function color(d) {
        return '#ccc';
      }

      function hasChildrenColor(d) {
        return d._children ? '#000' : d.children ? '#000' : 'none'; // leaf node
      }

      // function radius(d) {
      //   return d._children ? 8 : d.children ? 8 : 4;
      // }

      function ticked() {
        link
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

        node
          .attr('transform', (d) => {
            return `translate(${ d.x }, ${ d.y })`;
          });
      }

      function clicked(ev, d) {
        if (!ev.defaultPrevented) {
          if (d.children) {
            d._children = d.children;
            d.children = null;
          } else {
            d.children = d._children;
            d._children = null;
          }
          update();
        }
      }

      function dragstarted(ev, d) {
        if (!ev.active) {
          simulation.alphaTarget(0.3).restart();
        }
        d.fx = d.x;
        d.fy = d.y;
      }

      function dragged(ev, d) {
        d.fx = ev.x;
        d.fy = ev.y;
      }

      function dragended(ev, d) {
        if (!ev.active) {
          simulation.alphaTarget(0);
        }
        d.fx = null;
        d.fy = null;
      }

      function flatten(root) {
        const nodes = [];

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

      function zoomed(ev) {
        svg.attr('transform', ev.transform);
      }

      // update();
    },
    renderChartRevised() {
      const width = 800;
      const height = 400;

      this.root = d3.hierarchy(this.parsedData);

      // clear any previous renders, if they exist...
      if (d3.select('#tree > svg')) {
        d3.select('#tree > svg').remove();
      }

      this.svg = d3.select('#tree').append('svg')
        .attr('viewBox', `0 0 ${ width } ${ height }`)
        .call(d3.zoom().scaleExtent([1 / 2, 8]).on('zoom', zoomed))
        .append('g')
        .attr('transform', 'translate(40,0)');

      this.simulation = d3.forceSimulation()
        .force('link', d3.forceLink().id((d) => {
          return d.id;
        }))
        .force('charge', d3.forceManyBody().strength(-15).distanceMax(300))
        .force('center', d3.forceCenter( width / 2, height / 4 ))
        .on('tick', ticked);

      function ticked() {
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
      }

      function zoomed(ev) {
        this.svg.attr('transform', ev.transform);
      }
    },
    updateChart() {
      const nodes = flatten(this.root);
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
        .attr('stroke', hasChildrenColor)
        .attr('stroke-width', 2)
        .style('fill', color)
        .style('opacity', 1)
        .on('click', clicked)
        .call(d3.drag()
          .on('start', dragstarted)
          .on('drag', dragged)
          .on('end', dragended));

      nodeEnter.append('circle')
        .attr('r', (d) => {
          // return Math.sqrt(d.data.size) / 10 || 4.5;
          return 10;
        })
        .style('text-anchor', (d) => {
          return d.children ? 'end' : 'start';
        })
        .text((d) => {
          return d.label;
        });

      this.node = nodeEnter.merge(this.node);
      this.simulation.nodes(nodes);
      this.simulation.force('link').links(links);

      function color(d) {
        return '#ccc';
      }

      function hasChildrenColor(d) {
        return d._children ? '#000' : d.children ? '#000' : 'none'; // leaf node
      }

      function clicked(ev, d) {
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
      }

      function dragstarted(ev, d) {
        if (!ev.active) {
          this.simulation.alphaTarget(0.3).restart();
        }
        d.fx = d.x;
        d.fy = d.y;
      }

      function dragged(ev, d) {
        d.fx = ev.x;
        d.fy = ev.y;
      }

      function dragended(ev, d) {
        if (!ev.active) {
          this.simulation.alphaTarget(0);
        }
        d.fx = null;
        d.fy = null;
      }

      function flatten(root) {
        const nodes = [];

        function recurse(node) {
          if (node.children) {
            node.children.forEach(recurse);
          }
          if (!node.id) {
            node.id = ++this.index;
          } else {
            ++this.index;
          }
          nodes.push(node);
        }
        recurse(root);

        return nodes;
      }
    }
  },
  mounted() {
    console.log('MOUNTED START!');
    this.renderChartRevised();
    console.log('MOUNTED END!');
  },
};
</script>

<template>
  <div>
    <!-- <p>{{ someData.id }}</p> -->
    <div id="tree">
    </div>
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
