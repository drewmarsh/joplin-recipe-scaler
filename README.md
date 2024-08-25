<p align="center">
  <img src="https://github.com/user-attachments/assets/828f4bcc-ecd4-46c7-8a26-ebde3e20bc2d" width="400" height="400">
</p>

# ⚖️ Features
TODO: Add the list of features.

# 🛠️ Building the plugin
#### 🛑 If you're not a developer, then you can ignore everything below this line of text. Unless you're a rebel. In that case, I won't stop you. But seriously, stop looking.

To help develop this plugin further then you'll need to know how to build the plugin once you make your changes.

The plugin is built using Webpack, which creates the compiled code in `/dist`. A JPL archive will also be created at the root, which can be used to distribute the plugin.

To build the plugin, simply run `npm run dist`.

If this returns an error, you likely need to first install Webpack globally with `npm install -g webpack`.

# 🧪 Testing the plugin in Joplin dev mode

Once the plugin is built, it's best to test things out in Joplin dev mode. To access dev mode, open the normal Joplin application and navigate to `Help > Copy dev mode command to clipboard > OK`. You can now close out of the normal Joplin window. Then, open the terminal and paste this command and then click enter. A dev mode version of Joplin will launch.

Next, in Joplin dev mode, navigate to `Tools > Options > Plugins > Show Advanced Settings`.  Add the plugin path into the `Development plugins` text field. This should be the path to your main plugin root directory, i.e. C:\Users\username\Desktop\joplin-recipe-scaler.
