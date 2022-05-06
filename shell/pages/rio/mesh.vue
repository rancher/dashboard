<script>
import $ from 'jquery';
import { escapeHtml } from '@shell/utils/string';

const RADIUS = 5;

const INTERVAL = 10000;

/*
function randomStats() {
  return {
    'p50ms':       Math.random(),
    'p90ms':       Math.random() * 2,
    'p99ms':       Math.random() * 5,
    'rps':         Math.random() * 100,
    'successRate': Math.random(),
  };
}

function randomItem(ary) {
  const idx = Math.floor(Math.random() * ary.length);

  return ary[idx];
}

function randomData() {
  const nodes = [];
  const edges = [];

  ['foo', 'bar', 'baz', 'bat', 'qux'].forEach((name) => {
    nodes.push({
      'namespace': 'default',
      'app':       name,
      'version':   'v1',
      'stats':     randomStats(),
    });
  });

  ['a', 'b', 'c', 'd', 'e'].forEach((name) => {
    nodes.push({
      'namespace': 'another',
      'app':       name,
      'version':   'v1',
      'stats':     randomStats(),
    });
  });

  for ( let i = 0 ; i < 10 ; i++ ) {
    const from = randomItem(nodes);
    const crossNs = Math.random() < 0.2;
    const toChoices = nodes.filter((x) => {
      if ( x === from ) {
        return false;
      }

      if ( crossNs ) {
        return x.namespace !== from.namespace;
      } else {
        return x.namespace === from.namespace;
      }
    });
    const to = randomItem(toChoices);

    edges.push({
      fromNamespace: from.namespace,
      fromApp:       from.app,
      fromVersion:   from.version,
      toNamespace:   to.namespace,
      toApp:         to.app,
      toVersion:     to.version,
      stats:         randomStats(),
    });
  }

  return {
    nodes,
    edges
  };
}
*/

function nodeIdFor(obj) {
  return `${ obj.namespace }:${ obj.app }@${ obj.version }`;
}

function fromId(obj) {
  return `${ obj.fromNamespace }:${ obj.fromApp }@${ obj.fromVersion }`;
}

function toId(obj) {
  return `${ obj.toNamespace }:${ obj.toApp }@${ obj.toVersion }`;
}

async function loadData(store) {
  const data = await store.dispatch('rancher/request', { url: '/v1-metrics/meshsummary' });

  const known = {};

  data.nodes = data.nodes.filter(x => !!x.app && !!x.namespace);
  data.nodes.forEach((x) => {
    x.id = nodeIdFor(x);
    known[x.id] = true;
  });

  data.edges = data.edges.filter(x => known[fromId(x)] && known[toId(x)]);

  return data;
}

function round3Digits(num) {
  if ( !num ) {
    return 0;
  }

  if ( num > 100 ) {
    return Math.round(num);
  } else if ( num > 10 ) {
    return Math.round(num * 10) / 10;
  } else {
    return Math.round(num * 100) / 100;
  }
}

export default {

  /* (
  data() {
    return {
      loading: true,
      ...randomData(),
    };
  },
  */

  async asyncData({ store }) {
    const data = await loadData(store);

    return data;
  },
  computed: {
    namespaces() {
      return this.$store.getters['namespaces']();
    },

    displayNodes() {
      console.log('get displayNodes'); // eslint-disable-line no-console
      const namespaces = this.namespaces;

      const out = this.nodes.filter((x) => {
        return namespaces[x.namespace];
      });

      return out;
    },

    displayEdges() {
      console.log('get displayEdges'); // eslint-disable-line no-console
      const namespaces = this.namespaces;

      const out = this.edges.filter((x) => {
        const ns1 = x.fromNamespace;
        const ns2 = x.toNamespace;

        return namespaces[ns1] && namespaces[ns2];
      });

      return out;
    },
  },

  watch: {
    // Nodes isn't watched, but gets updated at the same time...
    nodes() {
      console.log('nodes updated'); // eslint-disable-line no-console
      this.updateGraph();
      this.renderGraph();
    },

    namespaces() {
      console.log('namespaces updated'); // eslint-disable-line no-console
      this.updateGraph();
      this.renderGraph();
    },

    edges() {
      console.log('edges updated'); // eslint-disable-line no-console
      this.updateGraph();
      this.renderGraph();
    },
  },

  async mounted() {
    console.log('Mounted'); // eslint-disable-line no-console
    this.timer = setInterval(() => {
      console.log('Timer'); // eslint-disable-line no-console
      this.refreshData();
    }, INTERVAL);

    await this.initGraph();
    this.updateGraph();
    this.renderGraph();

    window.m = this;
  },

  beforeDestroy() {
    clearInterval(this.timer);
  },

  methods: {
    async refreshData() {
      console.log('Refreshing...'); // eslint-disable-line no-console
      const neu = await loadData(this.$store);

      this.nodes = neu.nodes;
      this.edges = neu.edges;
      console.log('Refreshed'); // eslint-disable-line no-console
    },

    async initGraph() {
      const d3 = await import('d3');
      const dagreD3 = await import('dagre-d3');

      const g = new dagreD3.graphlib.Graph({ compound: true });

      g.setGraph({
        marginx: 0,
        marginy: 0,
        rankdir: 'LR',
        align:   'UL',
        ranker:  'longest-path', // 'tight-tree',
      });

      g.setDefaultEdgeLabel(() => {
        return {};
      });

      // Create the renderer
      const render = new dagreD3.render();

      // Add our custom arrow
      render.arrows().smaller = function normal(parent, id, edge, type) {
        const marker = parent.append('marker')
          .attr('id', id)
          .attr('viewBox', '0 0 12 12')
          .attr('refX', 6)
          .attr('refY', 6)
          .attr('markerUnits', 'userSpaceOnUse')
          .attr('markerWidth', 12)
          .attr('markerHeight', 12)
          .attr('orient', 'auto');
        const path = marker.append('path')
          .attr('class', 'arrowhead')
          .attr('d', 'M 6 0 L 0 6 L 6 12 L 12 6 z')
          .style('stroke-width', 1)
          .style('stroke-dasharray', '1,0');

        dagreD3.util.applyStyle(path, edge[`${ type }Style`]);
      };

      // Set up an SVG group so that we can translate the final graph.
      const svg = d3.select(this.$refs.mesh);
      const group = svg.append('g');

      const zoom = d3.zoom().on('zoom', () => {
        if ( d3.event.sourceEvent ) {
          this.lastZoom = d3.event.transform;
        }
        group.attr('transform', d3.event.transform);
      });

      svg.call(zoom);

      this.d3 = d3;
      this.dagreD3 = dagreD3;
      this.graph = g;
      this.render = render;
      this.group = group;
      this.zoom = zoom;
    },

    updateGraph() {
      // @TODO diff nodes/edges, remove unexpected and add missing ones
      console.log('Updating...'); // eslint-disable-line no-console

      const e = escapeHtml;
      const g = this.graph;

      const seenNamespaces = {};

      for ( const node of this.displayNodes ) {
        const nsId = ensureNamespace(node.namespace);
        const id = nodeIdFor(node);

        node.label = `${ node.app }@${ node.version }`;

        let p99 = node.stats.p99ms;
        let unit = 'ms';

        if ( p99 > 1000 ) {
          p99 /= 1000;
          unit = 's';
        }

        const html = `
          <div class="version">
            <h4>${ e(node.app) }@${ e(node.version) }</h4>
            <div class="row">
              <div class="col span-4 sr">
                <span>${ round3Digits(node.stats.successRate * 100) }</span><span class="unit">%</span>
              </div>
              <div class="col span-4 rps">
                <span>${ round3Digits(node.stats.rps) }</span>
              </div>
              <div class="col span-4 p99">
                <span>${ round3Digits(p99) }</span><span class="unit">${ unit }</span>
              </div>
            </div>
          </div>
        `;

        g.setNode(id, {
          labelType: 'html',
          label:     html,
          width:     158,
          height:    80,
          rx:        RADIUS,
          ry:        RADIUS,
        });
        g.setParent(id, nsId);
      }

      const rpses = this.displayEdges.map(x => x.stats.rps);
      const min = Math.min(...rpses);
      const max = Math.max(...rpses);

      for ( const edge of this.displayEdges ) {
        ensureNamespace(edge.fromNamespace);
        ensureNamespace(edge.toNamespace);
        const weight = Math.floor(4 * (edge.stats.rps - min) / (max - min)) + 1;

        g.setEdge(fromId(edge), toId(edge), {
          arrowhead:       'smaller',
          arrowheadClass:  'arrowhead',
          class:           `weight${ weight }`,
          curve:           this.d3.curveBasis,
          weight,
        });
      }

      function ensureNamespace(name) {
        const id = `ns:${ name }`;

        if ( !seenNamespaces[name] ) {
          seenNamespaces[name] = true;
          g.setNode(id, {
            label:           `Namespace: ${ name }`,
            clusterLabelPos: 'top',
            rx:              RADIUS,
            ry:              RADIUS
          });
        }

        return id;
      }
    },

    renderGraph() {
      console.log('Rendering...'); // eslint-disable-line no-console

      const d3 = this.d3;
      const svg = this.d3.select(this.$refs.mesh);
      const group = this.group;
      const g = this.graph;
      const render = this.render;
      const zoom = this.zoom;

      svg.call(zoom.transform, d3.zoomIdentity.translate(0, 0).scale(1));

      // Run the renderer. This is what draws the final graph.
      render(group, g);

      const graphWidth = g.graph().width;
      const graphHeight = g.graph().height;
      const width = parseInt(svg.style('width').replace(/px/, ''));
      const height = parseInt(svg.style('height').replace(/px/, ''));
      const scale = Math.min(width / graphWidth, height / graphHeight);
      const dX = (width / 2) - ((graphWidth * scale) / 2);
      const dY = (height / 2) - ((graphHeight * scale) / 2);

      console.log('render'); // eslint-disable-line no-console
      if ( this.lastZoom ) {
        svg.call(zoom.transform, d3.zoomIdentity.translate(this.lastZoom.x, this.lastZoom.y).scale(this.lastZoom.k));
      } else {
        svg.call(zoom.transform, d3.zoomIdentity.translate(dX, dY).scale(scale));
      }

      this.loading = false;
    },

    clicked(event) {
      const path = $(event.target).closest('.edgePath');

      console.log(path); // eslint-disable-line no-console
    }
  },
};
</script>
<template>
  <div class="mesh">
    <header>
      <h1>App Mesh</h1>
    </header>

    <svg id="mesh" ref="mesh" @click="clicked" />
  </div>
</template>

<style lang="scss">
  #mesh {
    width: 100%;
    height: calc(100vh - 165px);

    .version {
      width: 158px;
      height: 80px;
      color: #b6b6c2;
      text-align: center;

      .row {
        margin: 0;
      }

      H4 {
        color: #b6b6c2;
        display: block;
        border-bottom: 1px solid #555;
        text-align: left;
        padding-bottom: 5px;
        margin-bottom: 5px;
      }

      .sr, .rps, .p99 {
        font-size: 20px;

        .unit {
          font-size: 12px;
        }
      }

      .sr:before, .rps:before, .p99:before {
        color: white;
        font-weight: bold;
        font-size: 15px;
        display: block;
      }

      .sr:before {
        content: 'SR';
      }

      .rps:before {
        content: 'RPS';
      }

      .p99:before {
        content: '99%';
      }

    }

    .clusters .label text {
      fill: #b6b6c2;
      font-weight: bold;
    }

    .clusters RECT {
      fill: #222;
      stroke: #555;
    }

    .arrowhead {
      fill: #6c6c76;
    }

    .node RECT {
      fill: #111;
      stroke: #555;
    }

    PATH {
      stroke: #6c6c76;
    }

    .edgePath {
      cursor: pointer;
    }

    .weight1 { stroke-width: 2px; }
    .weight2 { stroke-width: 3px; }
    .weight3 { stroke-width: 4px; }
    .weight4 { stroke-width: 5px; }
    .weight5 { stroke-width: 6px; }
  }
</style>
