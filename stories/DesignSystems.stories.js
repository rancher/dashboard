import centered from '@storybook/addon-centered/vue';
export default {
  title:      'Design Systems',
  components: {},
  decorators: [centered],
};
// Buttons
export const buttons = () => ({
  components: {},
  template:   `
  <table>
  <tr>
  <td></td>
  <th scope="col">Normal</th>
  <th scope="col">Hover</th>
  <th scope="col">Focus</th>
  <th scope="col">Disabled</th>
  </tr>
  <tr>
  <th scope="row">Primary</th>
  <td><button class="btn role-primary">Primary</button></td>
  <td><button class="btn role-primary">Primary</button></td>
  <td><button class="btn role-primary">Primary</button></td>
  <td><button class="btn role-primary">Primary</button></td>
  </tr>
  <tr>
  <th scope="row">Secondary</th>
  <td><button class="btn role-secondary">Secondary</button></td>
  <td><button class="btn role-secondary">Secondary</button></td>
  <td><button class="btn role-secondary">Secondary</button></td>
  <td><button class="btn role-secondary">Secondary</button></td>
  </tr>
  <tr>
  <th scope="row">Tertiary</th>
  <td><button class="btn role-tertiary">Tertiary</button></td>
  <td><button class="btn role-tertiary">Tertiary</button></td>
  <td><button class="btn role-tertiary">Tertiary</button></td>
  <td><button class="btn role-tertiary">Tertiary</button></td>
  </tr>
  <tr>
  <th scope="row">Link</th>
  <td><button class="btn bg-transparent role-link">Button Link</button></td>
  <td><button class="btn bg-transparent role-link">Button Link</button></td>
  <td><button class="btn bg-transparent role-link">Button Link</button></td>
  <td><button class="btn bg-transparent role-link">Button Link</button></td>
  </tr>
  <tr>
  <th scope="row">Dropdown</th>
  <td><button class="btn bg-primary">Button Dropdown</button></td>
  <td><button class="btn bg-primary">Button Dropdown</button></td>
  <td><button class="btn bg-primary">Button Dropdown</button></td>
  <td><button class="btn bg-primary">Button Dropdown</button></td>
  </tr>
  </table>`
});

{/* <button type="button" class="btn btn-sm role-multi-action actions"><i class="icon icon-actions"></i></button> */}

// Headers
export const headers = () => ({
  components: {},
  template:   `
    <div class="row">
    <div class="col span-12">
    <h1>Header One</h1>
    <h2>Header Two</h2>
    <h3>Header Three</h3>
    <h4>Header Four</h4>
    </div>
    </div>`
});

// Text Colors
export const textColor = () => ({
  components: {},
  template:   `
    <div class="row">
    <div class="col span-12">
    <h1>Header One</h1>
    <h2>Header Two</h2>
    <h3>Header Three</h3>
    <h4>Header Four</h4>
    </div>
    </div>`
});

export const primaryText = () => ({
  components: {},
  template:   `<div class="bg-link">Header One</div>`
});
export const secondaryText = () => ({
  components: {},
  template:   `<div class="bg-link">Header One</div>`
});
export const interactiveText = () => ({
  components: {},
  template:   `<div class="bg-link">Header One</div>`
});
export const disabledText = () => ({
  components: {},
  template:   `<div class="bg-link">Header One</div>`
});