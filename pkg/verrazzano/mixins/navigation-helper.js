// Added by Verrazzano
export default {
  methods: {

    // join multiple names with an underscore to create a key.
    // if the name is empty, just skip it.
    createTabName(...args) {
      const scrubbedArgs = args.filter(arg => !!arg);

      return scrubbedArgs.join('_');
    },

    // find a key value for a new nodes entry that hasn't been used.
    // if the nodes list is empty or not established, just return the prefix.
    getNextName(nodes, key, prefix) {
      const usedNames = [];
      let nextName = prefix;

      if (typeof nodes !== 'undefined') {
        nodes.forEach((node) => {
          usedNames.push(this.get(node, key));
        });

        let index = 0;

        while (usedNames.includes(nextName)) {
          index++;
          nextName = `${ prefix }-${ index }`;
        }
      }

      return nextName;
    },

    // insert a navigation node into a parent node,
    // maintaining its order by weight.
    insertNavigationNode(node, parent) {
      let nextIndex = parent.children.findIndex(element => element.weight > node.weight);

      nextIndex = (nextIndex < 0) ? parent.children.length : nextIndex;

      parent.children.splice(nextIndex, 0, node);
    }
  }
};
