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
  <th scope="row" align="right">Primary</th>
  <td><button class="btn role-primary">Primary</button></td>
  <td><button class="btn role-primary">Primary</button></td>
  <td><button class="btn role-primary">Primary</button></td>
  <td><button class="btn role-primary btn-disabled">Primary</button></td>
  </tr>
  <tr>
  <th scope="row" align="right">Secondary</th>
  <td><button class="btn role-secondary">Secondary</button></td>
  <td><button class="btn role-secondary">Secondary</button></td>
  <td><button class="btn role-secondary">Secondary</button></td>
  <td><button class="btn role-secondary btn-disabled">Secondary</button></td>
  </tr>
  <tr>
  <th scope="row" align="right">Tertiary</th>
  <td><button class="btn role-tertiary">Tertiary</button></td>
  <td><button class="btn role-tertiary">Tertiary</button></td>
  <td><button class="btn role-tertiary">Tertiary</button></td>
  <td><button class="btn role-tertiary btn-disabled">Tertiary</button></td>
  </tr>
  <tr>
  <th scope="row" align="right">Link</th>
  <td><button class="btn bg-transparent role-link">Button Link</button></td>
  <td><button class="btn bg-transparent role-link">Button Link</button></td>
  <td><button class="btn bg-transparent role-link">Button Link</button></td>
  <td><button class="btn bg-transparent role-link btn-disabled">Button Link</button></td>
  </tr>
  <tr>
  <th scope="row" align="right">Dropdown and Action</th>
  <td><button class="btn role-multi-action">Button Dropdown</button></td>
  <td><button class="btn role-multi-action">Button Dropdown</button></td>
  <td><button class="btn role-multi-action">Button Dropdown</button></td>
  <td><button class="btn role-multi-action">Button Dropdown</button></td>
  </tr>
  </table>`
});

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
    <p class="">Primary Text</p>
    <p class="text-secondary">Secondary Text</p>
    <p class="text-primary">Interactive Text</p>
    <p class="text-muted">Disable Text</p>
    </div>
    </div>`
});

// All colors
export const allColors = () => ({
  components: {},
  template:   `
    <div class="row">
    <div class="col span-12">
    <div><div style="background: #141419; height: 25px; width: 25px;"></div><p>Dark: Sidebar & Block Light: Primary Text</p></div>
    <div><div style="background: #1B1C21; height: 25px; width: 25px;"></div><p>Dark: Body Background Light: None</p></div>
    <div><div style="background: #27292E; height: 25px; width: 25px;"></div><p>Dark: Input Fill Light: None</p></div>
    <div><div style="background: #4A4B52; height: 25px; width: 25px;"></div><p>Dark: Borders & Buttons Light: None</p></div>
    <div><div style="background: #6C6C76; height: 25px; width: 25px;"></div><p>Dark: Disabled Text Light: Secondary Text</p></div>
    <div><div style="background: #B6B6C2; height: 25px; width: 25px;"></div><p>Dark: Secondary Text Light: Disabled</p></div>
    <div><div style="background: #DCDEE7; height: 25px; width: 25px;"></div><p>Dark: None Light: Borders & Buttons</p></div>
    <div><div style="background: #EEEFF4; height: 25px; width: 25px;"></div><p>Dark: None Light: Input Fill</p></div>
    <div><div style="background: #F4F5FA; height: 25px; width: 25px;"></div><p>Dark: None Light: Sidebar and Block</p></div>
    <div><div style="background: #FFFFFF; height: 25px; width: 25px;"></div><p>Dark: Primary Text Light: Body Background</p></div>
    </div>
    </div>`
});
