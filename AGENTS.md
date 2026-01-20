# AGENTS.md

## Unit Testing Instructions

When writing unit tests, consider the following:

- Prefer `shallowMount` over `mount` for component testing. This helps to isolate the component being tested and avoids issues with child component dependencies.
- To assert the text content of a banner component, access its children directly, for example: `banner.vm.$slots.default()[0].children`.
- For components whose props are defined by a mixin (e.g., `labeledSelect`), access the props via `component.attributes().propName` instead of `component.props().propName`. For example, `labeledSelect.attributes().mode`.

## Dev Environment Tips

- Prefer `yarn` for package management. Ensure it used for all dependency operations and running commands.
