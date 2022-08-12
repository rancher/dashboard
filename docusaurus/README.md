# Website

This website is built using [Docusaurus 2](https://docusaurus.io/), a modern static website generator.


### Installation

```
$ yarn docs:install
```

### Local Development

> Note this command will open a web browser on the locally served site (http://localhost:3000)

```
$ docs:start
```

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

> Note this command will open a web browser on the locally served site (http://localhost:3000)

### Build

```
$ docs:build
```

### Adding new documents

> Note: We are using `sidebars.js` file to generated custome sidebar.

1. Create a Markdown file, greeting.md, and place it under the docs directory.

2. Add file name in `sidebars.js`.