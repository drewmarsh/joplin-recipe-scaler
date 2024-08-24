## 🛠️ Building the plugin

If you plan to help develop this plugin further then you'll need to know how to build the plugin once you make your changes.

The plugin is built using Webpack, which creates the compiled code in `/dist`. A JPL archive will also be created at the root, which can be used to distribute the plugin.

To build the plugin, simply run `npm run dist`.

If this returns an error, you likely need to first install Webpack globally with `npm install -g webpack`.
