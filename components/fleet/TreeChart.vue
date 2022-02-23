<script>
import * as d3 from 'd3';

export default {
  name:  'TreeChart',
  props: {
    data: {
      type:     [Array, Object],
      required: true
    },
  },
  data() {
    return { parsedData: null };
  },
  watch: {
    data(newValue) {
      if (newValue.id) {
        // eslint-disable-next-line no-console
        console.log('WATCHER TRIGGERED!', newValue);
        this.parseData();
        this.renderVerticalTree();
      }
    }
  },
  methods: {
    parseData() {
      const repoChildren = this.data.bundles.map((bundle, i) => {
        const repoChild = {
          id:       bundle.id,
          label:    bundle.nameDisplay,
          value:    15,
          children: []
        };

        if (bundle.status?.resourceKey?.length) {
          bundle.status.resourceKey.forEach((res, index) => {
            repoChild.children.push({
              id:    index,
              label: res.name,
              value: 15
            });
          });
        }

        return repoChild;
      });

      const finalData = {
        id:       this.data?.id,
        label:    this.data?.nameDisplay,
        value:    15,
        children: repoChildren
      };

      this.parsedData = finalData;
    },
    renderVerticalTree() {
      const margin = {
        top: 40, right: 90, bottom: 50, left: 90
      };
      const width = 660 - margin.left - margin.right;
      const height = 500 - margin.top - margin.bottom;

      // declares a tree layout and assigns the size
      const treemap = d3.tree()
        .size([width, height]);

      //  assigns the data to a hierarchy using parent-child relationships
      let nodes = d3.hierarchy(this.parsedData);

      // maps the node data to the tree layout
      nodes = treemap(nodes);

      // clear any previous renders, if they exist...
      if (d3.select('#tree > svg')) {
        d3.select('#tree > svg').remove();
      }

      // append the svg object
      // appends a 'group' element to 'svg'
      // moves the 'group' element to the top left margin
      const svg = d3.select('#tree').append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom);
      const g = svg.append('g')
        .attr('transform',
          `translate(${ margin.left },${ margin.top })`);

      // adds the links between the nodes
      g.selectAll('.link')
        .data(nodes.descendants().slice(1))
        .enter().append('path')
        .attr('class', 'link')
        .attr('d', (d) => {
          return `M${ d.x },${ d.y
          }C${ d.x },${ (d.y + d.parent.y) / 2
          } ${ d.parent.x },${ (d.y + d.parent.y) / 2
          } ${ d.parent.x },${ d.parent.y }`;
        });

      // adds each node as a group
      const node = g.selectAll('.node')
        .data(nodes.descendants())
        .enter().append('g')
        .attr('class', (d) => {
          return `node${
            d.children ? ' node--internal' : ' node--leaf' }`;
        })
        .attr('transform', (d) => {
          return `translate(${ d.x },${ d.y })`;
        })
        .on('click', (ev, d) => {
          console.log('CLICK DATA', d);
        });

      // adds the circle to the node
      // node.append('circle')
      //   .attr('r', 10);

      // // adds the text to the node
      // node.append('text')
      //   .attr('dy', '.35em')
      //   .attr('y', (d) => {
      //     return d.children ? -20 : 20;
      //   })
      //   .style('text-anchor', 'middle')
      //   .text((d) => {
      //     return d.data.label;
      //   });

      const rectW = 60;
      const rectH = 30;

      const textElem = node.append('text')
        .attr('x', -99999)
        .attr('y', -99999)
        .text((d) => {
          return d.data.label;
        });

      // console.log('SELECT TEXT', textElem.node().getBBox());

      node.append('rect')
        .attr('width', node.select('text').node().getBBox().width + 20)
        .attr('height', node.select('text').node().getBBox().height + 20)
        .attr('stroke', 'black')
        .attr('stroke-width', 1)
        .style('fill', (d) => {
          return d._children ? 'lightsteelblue' : '#fff';
        });

      node.append('text')
        .attr('x', (node.select('text').node().getBBox().width + 20) / 2)
        .attr('y', (node.select('text').node().getBBox().height + 20) / 2)
        .attr('dy', '.35em')
        .attr('text-anchor', 'middle')
        .text((d) => {
          return d.data.label;
        });

      textElem.node().remove();
    }
  }
};
</script>

<template>
  <div id="tree">
  </div>
</template>

<style lang="scss">

.node text { font: 16px sans-serif; }

.link {
  fill: none;
  stroke: #ccc;
  stroke-width: 2px;
}
</style>
