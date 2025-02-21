## Resource Models

The ES6 class models in the `models` directory are used to represent Kubernetes resources. The class applies properties and methods to the resource, which defines how the resource can function in the UI and what other components can do with it. Different APIs return models in different structures, but the implementation of the models allows some common functionality to be available for any of them, such as `someModel.name`, `someModel.description`, `setLabels` or `setAnnotations`.

Much of the reused functionality for each model is taken from the Steve plugin. The class-based models use functionality from `plugins/dashboard-store/resource-class.js`.

The `Resource` class in `plugins/dashboard-store/resource-class.js` should not have any fields defined that conflict with any key ever returned by the APIs (e.g. name, description, state, etc used to be a problem). The `SteveModel` (`plugins/steve/steve-class.js`) and `NormanModel` (`plugins/steve/norman-class.js`) know how to handle those keys separately now, so the computed name/description/etc is only in the Steve implementation. It is no longer needed to use names like `_name` to avoid naming conflicts.

### Extending Models

The `Resource` class in `plugins/dashboard-store/resource-class.js` is the base class for everything and should not be directly extended. (There is a proxy-based counterpart of `Resource` which is the default export from `plugins/dashboard-store/resource-instance.js` as well.) If a model needs to extend the basic functionality of a resource, it should extend one of these three models:

- `NormanModel`: For a Rancher management type being loaded via the Norman API (/v3, the Rancher store). These have names, descriptions and labels at the root of the object. 
- `HybridModel`: This model is used for old Rancher types, such as a Project (mostly in management.cattle.io), that are loaded with the Steve API (/v1, the cluster/management stores). These have the name and description at the root, but labels under metadata.
- `SteveModel`: Use this model for normal Kubernetes types such as workloads and secrets. The name, description and labels are under metadata.

The Norman and Hybrid models extend the basic Resource class. The Hybrid model is extended by the Steve model.

#### Model Creation

The Rancher API returns plain objects containing resource data, but we need to convert that data into classes so that we can use methods on them.

Whenever we get an object from the API, we run the `classify` function (at `plugins/dashboard-store/classify.js`) which looks at the type field and figures out what type it is supposed to be. That file gives you an instance of a model which you can use to access the properties.

## Examining the Contents of a Resource

Due to the way Dashboard resources are constructed examining the contents of one can sometimes provide unexpected results. It's recommended to read the sections covering resource proxy and resource instance before continuing.

- When viewing the object via template `{{ resource }}` the `resource-instance.js` `toString` method will print out a basic interpretation
- When printing the object via console the resource's [Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy/Proxy) will be displayed. To make this simpler to view use `JSON.parse(JSON.stringify(<resource>))`.

> Q Why are my resource's `nameDisplay`, `description`, etc missing?
>
> A These are part of the common underlying `resource-instance.js` or, if the resource type has it, the type's own `model`.