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
          rawData:    bundle,
          children: []
        };

        if (bundle.status?.resourceKey?.length) {
          bundle.status.resourceKey.forEach((res, index) => {
            repoChild.children.push({
              id:      index,
              label:   res.name,
              rawData: res
            });
          });
        }

        return repoChild;
      });

      const finalData = {
        id:       this.data?.id,
        label:    this.data?.nameDisplay,
        rawData:  this.data,
        children: repoChildren
      };

      this.parsedData = finalData;
    },
    renderVerticalTree() {
      const margin = {
        top: 20, right: 20, bottom: 20, left: 20
      };
      const width = 1200;
      const height = 400;

      const rectW = 70;
      const rectH = 40;

      // declares a tree layout and assigns the size
      const treemap = d3.tree()
        // .nodeSize([rectW, rectH]);
        .size([width - margin.left - margin.right, height - margin.top - margin.bottom]);

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
        .attr('viewBox', `0 0 ${ width } ${ height }`);
      const g = svg.append('g')
        .attr('transform',
          `translate(${ margin.left },${ margin.top })`);

      // adds the links between the nodes
      g.selectAll('.link')
        .data(nodes.descendants().slice(1))
        .enter().append('path')
        .attr('class', 'link')
        // .attr('d', (d) => {
        //   return `M${ d.x },${ d.y
        //   }C${ d.x },${ (d.y + d.parent.y) / 2
        //   } ${ d.parent.x },${ (d.y + d.parent.y) / 2
        //   } ${ d.parent.x },${ d.parent.y }`;
        // })
        .attr('d', (d) => {
          return `M${ d.x },${ d.y
          }L${ d.parent.x },${ d.parent.y }`;
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
          alert(JSON.stringify(d.data));
        });

      node.append('rect')
        .attr('x', -rectW / 2)
        .attr('y', -rectH / 2)
        .attr('width', rectW)
        .attr('height', rectH)
        .attr('stroke', 'black')
        .attr('stroke-width', 2)
        .style('fill', (d) => {
          return d._children ? 'lightsteelblue' : '#fff';
        });

      node.append('text')
        .attr('x', 0)
        .attr('y', 0 + 7)
        .attr('text-anchor', 'middle')
        .attr('id', (d, i) => {
          return `text${ i }`;
        })
        .text((d) => {
          return d.data.label;
        });

      svg.selectAll('rect')
        .attr('width', (d, i) => {
          return document.getElementById(`text${ i }`).getBBox().width + 20;
        })
        .attr('x', (d, i) => {
          return -10 - document.getElementById(`text${ i }`).getBBox().width / 2;
        });
    }
  }
};
</script>

<template>
  <div>
    <div id="tree">
    </div>
  </div>
</template>

<style lang="scss">
#tree {
  width: 100%;
}
.node {
  cursor: pointer;
}
.node text { font: 14px sans-serif; }

.link {
  fill: none;
  stroke: #ccc;
  stroke-width: 2px;
}
</style>
