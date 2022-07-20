So I've got an idea for hopefully improving performance and memory usage in the front end.

At the moment say we load 4000 deployments and 4000 pods. They all go in the store and we get 8000 resources wrapped by vue for reactivity, at a factor 25x memory. Regardless of what the user is doing, or which page of resources they are looking at, any change to any of those 8000 resources results in an update to the list page they might be looking at.Anything watching pods or deployments will update, computed properties get re-calculated and watches evaluated.

If we had a backend API that supported pagination, sorting and filtering then we could request only the page of resources that we are interested in. We'd only hold a page worth's, so 50 or 100 of a resource. Memory usage would be reduced since we have lesss reactive objects and updates to resources not in the current page would not be seen and would not therefore cause any updates to the list.

This feels like where we need to get to.

Problem is we don't have that backend API.

But - why don't we introduce a data layer in a web worker. When we load resources or get updates to resources, we just store the raw json objects in a map in the web worker. No reactivity. No wrapping by vue, so memory kept small.

Instead of the frontend calling `fetchAll`, in calls a new action `fetchPage` with appropriate page arguments (number, sort, filter).

fetchPage is handled by the web worker. If it doesn't have the data, if makes the request to get the data from the backend. It then sorts, filters and returns only the requested page of resources. It keeps a note of the list that was requested, so if any changes come in for resources that are in the current page, it sends through the updates.s

Let's move the list handling into that web worker too. When a user goes to a page that list resources (eg deployments), it registers a list with the web worker. The web worker sorts,filters the paginates the resources and makes a note of which resources are in the current page. It sends load messages to the store to populate the resources from the raw json data (