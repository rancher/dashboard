
# Forms

By default, all resources can be edited in YAML. A more compelling edit experience can be created by adding a resource type component in `/edit/`. Forms for creating and editing resources are in the `edit` directory as a convention.

Wrapping an edit component in `CruResource` will provide generic error handling and cancel/save buttons. This customisation should also support the `as=config` param, where the form is displayed and populated but is not editable.

 Common functionality for the create/edit forms is reused by importing `CreateEditView` from `/mixins/create-edit-view`. For example, the `registerBeforeHook` is used across many create/edit forms to save the form data before a resource is created.

## Background

The reusable CruResource component and its mixins were created to solve a problem particular to Kubernetes resource management. In older Rancher versions, Rancher sometimes restricted fields from being edited or added form validation in Norman, the backend API that predated Steve. Originally, Norman was designed to restrict users from editing resources in the Kubernetes cluster directly so that Norman could control how resources were configured.

But in modern DevOps, many users want the ability to automate their workflows with GitOps, which usually requires tracking all of the YAML files for Kubernetes resources in a Git repository, and also requires users to be able to edit resources through config files instead of only manipulating them through the UI.

The problem was that when Rancher exposed access to Kubernetes clusters directly, users could not only access Kubernetes resources through Norman, but they could also edit the resource’s YAML config files and bypass the restrictions that Norman could impose.

Rancher’s reusable forms are intended to be flexible enough to allow YAML files to be created and edited through the Rancher UI, while also providing form validation for those files at the same time. The reusability also allows Rancher to quickly adapt to new Kubernetes custom resources that are introduced for Helm chart apps that are not primarily developed in-house, such as the monitoring and logging applications.

## Creating a New Create/Edit Form for a Resource

This section describes the workflow for creating forms to create or edit resources in Rancher. We recommend using the CruResource component for create/edit forms because it is designed to handle resource that can also be managed through YAML config files, with process automated through GitOps.

You will need to create a file for the create/edit form. For normal Kubernetes resources, this file should be located in the `@shell/components/edit` directory.

The file will need these imports:
```
import CreateEditView from '@shell/mixins/create-edit-view/impl';
// An example types file 
import { POD } from '@shell/config/types';
import { exceptionToErrorsArray } from '@shell/utils/error';
import CruResource from '@shell/components/CruResource.vue';

```

The edit component takes a `value` as a prop. For all `/edit` components, the store creates a new instance of the model to use as the `value`. This allows the component to access any prop or method on the resource model by taking it from the newly instantiated value. The value is then passed into CruResource using the`resource` prop.

The CruResource component takes a few important props, such as `save` and `done`, that you don’t have to pass in manually because they are automatically made available from the `CreateEditView` mixin:

- The `save` method from CreateEditView cleans the data. It also populates `exceptionToErrorsArray`, which controls validation errors for the form as a whole. In other words, these validation errors don’t appear next to individual fields, but they each appear at the bottom of the form after the submit button is clicked, and each error includes the name of the field that has a problem.
- `done` is used to redirect the user after the form is successfully submitted.
- `actuallySave` makes the asynchronous API call to create the resource and it gets the appropriate API route from the resource schema itself. So in this way, the `save` method is reused across many create/edit forms, while the API route called to save the resource is still configured at the resource level. However, any method for managing a resource, including `save`, can be overridden by adding methods of the same name to the resource’s class model.

# Forms in Modals

If a form element was repeated for every row in a table, it would make the UI slower. To increase performance, components such as `ActionMenu` and `PromptModal` are not repeated for every row in a table, and they don't directly interact with the data from a table row. Instead, they communicate with each row indirectly through the store. All the information about the actions that should be available for a certain resource is contained in a model, and the `ActionMenu` or `PromptModal` components take that information about the selected resource from the store. Modals and menus are opened by telling the store that they should be opened. For example, this call to the store  `this.$store.commit('action-menu/togglePromptModal');` is used to open the action menu. Then each component uses the `dispatch` method to get all the information it needs from the store.

# Validation

In order to improve the user experience in the future, we are moving toward individual field validation errors that appear as soon as the user types or selects incorrect input. Where possible, you should add pre-submit form validation to input components such as LabeledInput and LabeledSelect. Ideally, the button to submit the form should be disabled by default until the entire form is valid, and no errors should appear next to inputs that haven’t been touched.

## Field Validation

Live validation for fields is the primary method for providing feedback to the user that a value they've entered is invalid. In most cases, the preferred feedback is a simple error message next to the field. To this end, the LabeledInput and LabeledSelect components accept a "rules" parameter which allows the developer to pass in an array of functions capable of generating the validation messages appropriate to the field.

Existing validation functions can be found at `shell/utils/validators/formRules` in the dashboard codebase but it is possible to create custom functions to accomplish the same purpose if need be. A form rule validator must meet the following criteria in order to be useful for this purpose:

1. The function must accept a single parameter which will be the value of the field to be validated. Such as: `const truthy = val => !val ? 'Value should be truthy' : undefined;`
2. If the validation is passed, the function returns `undefined`.
3. If the validation fails, the function returns a string to be rendered by the field component as an error.

In addition to the "rules" parameter existing on the LabeledInput and LabeledSelect form components, an additional component called Error (found at `shell/components/form/Error`) exists which can also accept a value and rules. This allows the developer to display an error message which may not be tied to a specific field or tied to a field that is somehow incapable of displaying its own validation message.

Should a field displaying a validation message be hidden from the user due to form navigation elements like a non-active tab, the developer should still take care to communicate that a validation error exists. To that end, the `Tab` component accepts a simple parameter called "Error" which is simply a boolean value. When true, the "Error" parameter on the `Tab` component will display an error icon provided the tab is not currently active (if the tab is active, the field in question should provide feedback to the user).

## Form Validation

While individual fields are typically responsible for displaying their own validation messages, the form itself should also contain logic to disable the save button should validation errors exist, display errors not bound to a specific field, and/or display errors returned by the API. This is mostly accomplished via a mixin called `form-validation` (found at `shell/mixins/form-validation.js`). Eventually, this mixin will be embedded into the existing `CreateEditView` mixin already used by every form but is currently separate to facilitate a safer implementation of the new Form Validation logic.

To use the `form-validation` mixin, import the mixin and include it in `mixins` in the component like any other mixin. Once included, ensure the following:
1. Set the "validation-passed" property on the `CruResource` component to "fvFormIsValid" (computed property provided by the mixin). This conditionally disables the "save" button on the form.
2. Set the "errors" property on the `CruResource` component to "fvUnreportedValidationErrors" (computed property provided by the mixin) or some other value that aggregates errors not otherwise shown in the form as a fallback means of displaying error state to the user.

The `form-validation` mixin itself includes most of the information a developer will need to use it in comments in the file itself but a high-level summary would cover the following points:

1. The specific rules to be validated by the form should be located in a data property for the component named `fvFormRuleSets` which is an array of objects defining the specific rulesets for specific paths in the forms value to validate. The specific properties of the objects required by this array are defined in the mixin file itself as comments.
2. Additional rules to be validated by the form are also pulled directly from the resource model's `modelValidationRules` property which converts the model's customValidationRules into a format useable by the `form-validation` mixin. The combined `fvFormRuleSets` and the `modelValidationRules` can be viewed in a single array under the computed property `rulesets` provided by the mixin.
3. Should you wish to inject validation rules that either use the context of the component form or you simply wish to inject a component method into your validation rules used by the mixin, you can create a computed property called `fvExtraRules` which should return a simple object that contains a key for each validator function you wish to inject into the form-validation rules. See comments in the mixin file itself for additional details.
4. In order to avoid duplication of validator definitions, it is recommended to pull the function array for a field's "rules" property directly from the components `fvFormRuleSets`. The `form-validation` mixin provides two helper methods for this named `fvGetPathRules` and `fvGetAndReportPathRules`, the specifics as to which one to use and when are defined in the comments in the mixin file itself.

A very simple form implementing form validation might look like this:
```javascript
<script>
import CreateEditView from '@shell/mixins/create-edit-view';
import FormValidation from '@shell/mixins/form-validation';
import CruResource from '@shell/components/CruResource';
import LabeledInput from '@shell/components/form/LabeledInput';

export default {
  components: {
    CruResource, LabeledInput
  },

  mixins: [CreateEditView, FormValidation],
  data() {
    return {
      fvFormRuleSets: [{ path: 'value', rules: ['required'] }],
    };
  },
};
</script>
<template>
  <CruResource
    :errors="fvUnreportedValidationErrors"
    :resource="value"
    :validation-passed="fvFormIsValid"
  >
    <LabeledInput
      v-model="value.name"
      label="Name"
      :rules="fvGetAndReportPathRules('name')"
    />
  </CruResource>
</template>
```

*It is highly recommended to read through the comments in the `form-validation` mixin to understand its various properties and their suggested use-cases.

## Custom Model Validators 

Adding custom validation logic to forms and models requires changes to three different parts of Dashboard:

1. Create a new validation function to `utils/validators` (legacy)
2. Export the new validation function `utils/custom-validators.js` (legacy)
3. Add `customValidationRules` prop to appropriate model under `models`

### 1. Create a new model validation function (legacy)

*Most (if not all) of these types of validation functions have been replaced by the newer simpler versions designed for field and form validation. This section of the docs remains until the legacy code may be completely removed safely.

Custom validators are stored under `utils/validators`. Validation functions should define positional parameters of `value, getters, errors, validatorArgs` with an optional fifth `displayKey` parameter: 

```javascript
export function exampleValidator(value, getters, errors, validatorArgs, displayKey) {
  ...
}
```

Make sure the validation function pushes a value to the `error` collection in order to display error messages on the form:

> In this example, we're making use of i18n getters to produce a localized error message. 

```javascript
export function exampleValidator(value, getters, errors, validatorArgs, displayKey) {
  ... 

  if (validationFails) {
    errors.push(getters['i18n/t']('validation.setting.serverUrl.https'));
  }

  ...
}
```

### 2. Export new validation function

*Most (if not all) of these types of validation functions have been replaced by the newer simpler versions designed for field and form validation. This section of the docs remains until the legacy code may be completely removed safely.

In order to make a custom validator available for usage in forms and component, it will need to exposed by importing the new validator function into `utils/custom-validators.js`:

```diff
import { podAffinity } from '@shell/utils/validators/pod-affinity';
import { roleTemplateRules } from '@shell/utils/validators/role-template';
import { clusterName } from '@shell/utils/validators/cluster-name';
+ import { exampleValidator } from '@shell/utils/validators/setting';
```

and add it to the default exports:

```diff
export default {
  containerImages,
  cronSchedule,
  podAffinity,
- roleTemplateRules
+ roleTemplateRules,
+ exampleValidator
};
```

### 3. Add `customValidationRules` to model

Locate the model that will make use of the custom validation function and add `customValidationRules` property if one does not already exist. `customValidationRules` returns a collection of validation rules to run against the model:

```javascript
customValidationRules() {
  return [
    {
      path: 'value',
      validators: [`exampleValidator`] // the validator listed here should correspond the validation function located in `shell/utils/validators/formRules`
    }
  ]
}
```

> #### A validation rule can contain the following keys:
> 
> `path` {string}: the model property to validate
> 
> `nullable` {boolean}: asserts if property accepts `null` value
> 
> `required` {boolean}: asserts if property requires a value
> 
> `translationKey` {string}: path to validation key in `assets/translations`
> 
> `type` {string}: name of built-in validation rule to assert
> 
> `validators` {string}: name of custom validation rule to assert

Add `:${arg}` to pass custom arguments to a validation function:

```javascript
customValidationRules() {
  return [
    {
      path: 'value',
      validators: [`exampleValidator:${ this.metadata.name }`]
    }
  ]
}
```

Multiple custom arguments can be passed to a validator function; each argument is separated by `:`, for example:

```javascript
validators: [`exampleValidator:${ this.metadata.name }:'customString':42]
```

## Custom Deletion Warnings
To warn users about deleting a certain resource, you can customize the message that is shown to the user when they attempt to delete a resource.
You can add the error message to the resource class model in this format:
```ts
get warnDeletionMessage() {
  return this.t('path.to.delete.warning');
}
```

## Auto-focusing Form Elements

Automatically give focus to the first field in a form with the `v-focus` directive. Auto-focusing the first form element saves the user an additional click and provides a clear starting point.

Example:

```html
  <LabeledInput 
    v-focus
    v-model="value" 
  />
```

## Forms without CruResource
This section describes how to make create/edit forms without CruResource or the CreateEditView mixin.

There may be a situation where you need to make a create/edit form that doesn’t automatically get the resource value passed into it because the component is located outside of the same `/edit` folder as the other create/edit forms. In this case, you will need to manually create the skeleton resource from a class model and use that as the form value so that the methods passed into AsyncButton have access to enough information to save the resource.

There may be a situation where you need Rancher to create and edit data that is not a Kubernetes resource. But even in this situation, we recommend using the same basic architecture as is used for saving Kubernetes resources. The reason is that many users want to automate their workflows with GitOps, and they want to be able to manipulate data with both config files and with forms in the Rancher UI. This means that even if it is not currently possible to manage the resource in YAML, that ability may be added later because of the industry’s overarching need for automation and GitOps. The new Rancher UI will need to be able to consistently support GitOps workflows.

A custom create component would typically need at least these imports:

```ts
import AsyncButton from '@shell/components/AsyncButton';
import { _CREATE } from '@shell/config/query-params';
import { exceptionToErrorsArray } from '@shell/utils/error';
```

The AsyncButton should be used to save the resource, and it will show a loading message if the resource takes time to be saved. The below example shows a minimal usage of AsyncButton:

```html
<AsyncButton
  :disabled="!validationPassed"
  :mode="mode"
  @click="onSubmit"
/>
```

You can maintain the form validation state in `data()`:

```ts
data() {
    return {
      errors:           [],
      value:           { name: '' },
      submitted:       false,
      mode:            _CREATE
    };
  },
```

You will also need to provide the resource schema so that it can be used by `save()` to create the resource by calling the appropriate back end route for creating the resource.

When a skeleton resource is not passed into your create/edit form as a value, you can create the new resource instance with a `dispatch` to the store as soon as the form is rendered. Then you can use it as the initial value for your form. An example of calling the store to create the initial resource value is below:

```ts
this.value = await this.$store.dispatch('cluster/create', {
  type:     'chartInstallAction',
  metadata: {
    namespace: this.forceNamespace || this.$store.getters['defaultNamespace'],
    name:      this.existing?.spec?.name || this.query.appName || '',
  }
});
```

When the resource is saved, it should call a `save` method. This can be the `save`defined in the CreateEditView mixin, or it can be a `save` method defined a form containing an AsyncButton. For example, this method is used in the `PromptChangePassword` component and provides a `buttonCb` callback to the AsyncButton:

```ts
async submit(buttonCb) {
  try {
    await this.$refs.changePassword.save();
    this.show(false);
    buttonCb(true);
  } catch (err) {
    buttonCb(false);
  }
}
```

The corresponding AsyncButton is:

```html
<AsyncButton
  type="submit"
  mode="apply"
  class="btn bg-error ml-10"
  :disabled="!valid"
  value="LOGIN"
  @click="submit"
/>
```

Whichever implementation of `save()` is used, it will need to call `_save()` on the resource. That `_save` method is defined on the root `resource-class` model, which every other model extends.

Note:

When creating a non-standard flow for creating or editing a resource, you may want to ask Lauren to review the design and makes sure it follows the Storybook documentation for how components are meant to be used.
