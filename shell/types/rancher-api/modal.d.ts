/**
 * Configuration object for opening a modal.
 */
export interface ModalConfig {
  /**
   * TODO: Understand how this works with extensions
   *
   * The name of the component to be displayed inside the modal.
   *
   * The component must reside in the `dialog` directory, depending on the environment:
   *
   * 1. **When Using the Shell as Part of the Core Project**:
   *    - Components must live in the `@shell/dialog` directory.
   *    - Example:
   *      ```
   *      shell/dialog/MyCustomDialog.vue
   *      ```
   *
   * 2. **When Using the Shell as a Library (Extensions)**:
   *    - Components must live in the `pkg/<extension-pkg>/dialog` directory within the extension.
   *    - Example, in an extension named `my-extension`:
   *      ```
   *      <extension-root>/pkg/my-extension/dialog/MyCustomDialog.vue
   *      ```
   *
   * - The `component` value should still match the file name without the `.vue` extension.
   * - Example:
   *   ```ts
   *   component: 'MyCustomDialog' // Dynamically imports MyCustomDialog.vue
   *   ```
   *
   */
  component: string;

  /**
   * Optional props to pass directly to the component rendered inside the modal.
   * This can be a record of key-value pairs where keys are the prop names, and
   * values are the corresponding prop values for the component.
   *
   * Example:
   * ```ts
   * componentProps: { title: 'Hello Modal', isVisible: true }
   * ```
   */
  componentProps?: Record<string, any>;

  /**
   * Optional array of resources that the modal component might need.
   * These resources are passed directly to the modal's `resources` prop.
   *
   * Example:
   * ```ts
   * resources: [myResource, anotherResource]
   * ```
   */
  resources?: any[];

  /**
   * Custom width for the modal. Defaults to `600px`.
   * The width can be specified as a number (pixels) or as a string
   * with a valid unit, such as `px` or `%`.
   *
   * Example:
   * ```ts
   * modalWidth: '800px' // Width in pixels
   * modalWidth: '75%'   // Width as a percentage
   * ```
   */
  modalWidth?: string;

  /**
   * If true, clicking outside the modal will close it. Defaults to `true`.
   * Set this to `false` if you want the modal to remain open until the user
   * explicitly closes it.
   *
   * Example:
   * ```ts
   * closeOnClickOutside: false
   * ```
   */
  closeOnClickOutside?: boolean;
}
