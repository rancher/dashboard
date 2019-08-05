<template>
  <div>
    Test
    <ul v-for="thing in things" :key="thing.name">
      <li>{{ thing.name }} - {{ thing.foo }}</li>
    </ul>
    <button @click="a">
      a
    </button>
  </div>
</template>

<script>
import Resource from '@/models/Resource';

export default {
  data: () => ({
    things: [
      { name: 'thing1', foo: 'bar' },
      { name: 'thing2', foo: 'baz' },
      { name: 'thing3', foo: 'bat' },
    ]
  }),

  methods: {
    a() {
      Object.assign(this.things[0], this.things[1]);
      this.$set(this.things, 0, this.things[0]);

      const r = Resource;
      const x = new Resource({ foo: 'bar' });
      const y = new Resource({ baz: 'bat' });

      debugger;
    }
  }
};
</script>
