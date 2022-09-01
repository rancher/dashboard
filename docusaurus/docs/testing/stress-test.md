# Stress Testing

In some situations it is useful to test the Dashboard UI with large numbers of resources (e.g. node, deployments) without having
to actually have a system available with that scale.

When run in development mode, you can enable simple scale simulation by setting the `PERF_TEST` environment variable to `true`, for example:

```
PERF_TEST=true yarn dev
```

When the `PERF_TEST` environment variable is set, the UI adds an intercept into the `loadAll` function in the store - this allows
the code in `plugins/peformanceTesting.js` to modify the resources when they are loaded into the store.

Note that this only intercepts the initial load, not subsequent updates.

Developers can modify `plugins/peformanceTesting.js` to simulate the scale that they wish to test with.

Modify the `PERF_DATA` object in this file - each key is the name of a type whose scale you wish to change, for example:

```
const PERF_DATA = {
  node: {
    count:     800,
    statusRow: 2,
  }
};
```

This will simulate 800 nodes and ensure that every 1 in 2 (on average) nodes will have a status set that will cause a status row to appear in the list views.

The code in peformanceTesting will use the existing resources for the given type as templates and round-robin copy them to generate a list with the required number.

The copied resources will have their age reset to the current date and time and have names and ids generated.

You may also specify a custom function in a `custom` field for a type, this function takes the resource and index, for example below we will set every generated resource to have an error state:

```
const PERF_DATA = {
  node: {
    count:     800,
    statusRow: 2,
    custom:    (node, index) => { node.metadata.state.error = true}
  }
};
```
  
The custom fucntion is only applied to generated resources, not the existing resources that are used to generate them.
