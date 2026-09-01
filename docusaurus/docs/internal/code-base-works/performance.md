# Performance

## Upstream Documentation

The Kubernetes documentation has useful information on efficiently detecting changes: https://kubernetes.io/docs/reference/using-api/api-concepts/#efficient-detection-of-changes 

## Scale Testing Tools

For performance testing with many clusters or many nodes, the tool that the backend devs use for performance testing is https://github.com/rancher/rancher2-scaling.

For quickly deploying a lot of resources on the same cluster, the QA team is considering this tool called `clusterloader2`: https://github.com/kubernetes/perf-tests/tree/master/clusterloader2

For simulating a larger cluster than what the hardware actually provides, you can use K3d to simlate more space. With K3d it is possible to deploy more resources as you can simulate three times the CPU and memory that is actually available.

## Flame Graph

To inspect performance in the Rancher UI, open the Chrome developer tools and click the **Performance** tab. From there, you can see a flame chart to see what tasks take the most time. You can record performance, analyze local time vs. network time, and analyze whether some network calls can be made serially or in parallel.

The flame charts have more useful function names when the dashboard is running locally because in that case, the UI isn't minified.

## Initial Page Load

To decrease wait times for the user overall, the UI loads as much data on the initial page load as possible. After page load we wait for the schemas to load, because the schemas determine what the logged-in user has access to. After the schemas load, other resources can be loaded.

## List Views

List views can become slow to load when the UI attempts to load too much information. For example, a list of ingresses should not separately fetch services for each item in the list.

## Deferring Duplicate Requests

In `plugins/dashboard-store/actions.js`, if there are multiple requests for the same URL including the same path and headers, the store will recognize that a similar request already exists. Instead of making another request, it will defer it, and at the end it will only send one API call. This works for all resources in general.

# Pagination

The UI renders pages for display purposes only. The Kubernetes API supports pagination (https://kubernetes.io/docs/reference/using-api/api-concepts/#retrieving-large-results-sets-in-chunks), but the Rancher UI doesn't use that feature because it supports text-based sorting and filtering on the client side that is not supported on the server side.

## Streaming

When the server responds with a large JSON object, the user might have to wait a long time for the entire object, so we split it into separate documents. If we stream the data we can start parsing data earlier.

Vince built a streaming parser that works a little faster than loading large JSON objects. However, it is currently disabled for two reasons:

- QA reported that the streaming caused a performance bug in Chrome.
- The performance benefit of streaming in Rancher was modest because a lot of wait time in the UI was due to waiting for a response to begin. The gain wouldn't be large unless the backend implemented it all the way down to etcd, which they may not do.

The code that supports streaming is in `plugins/steve/actions.js`. Only the Steve API supports streaming. The `supportsStream` properties in `store/index.js` have been set to false. They could be turned on again if the bug is fixed, but because the back end doesn't stream directly from etcd, the performance gain would not be large.