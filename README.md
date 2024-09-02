<p align="center">
  <a href="https://github.com/drewmarsh/joplin-recipe-scaler">
    <img src="https://github.com/user-attachments/assets/62b8d818-b382-4747-b312-a966bdf463c1" width="400" height="400">
  </a>
</p>

# 🍽️ Features
### ✨ Recipe Cards
Recipe cards can be used to efficently display all of your recipe information in as many beautiful and highly-customizable sections of information as you desire.

These cards are encapsulated between square brackets ```[ ]``` in the Markdown editor and can take in many different ```attributes``` that tell the plugin how you want the card to behave.

The available ```attributes``` are as listed below:

```
[card,

original= 12,

scaled= 24,

title= Example Title,

color= #hex_code,

chip= Example Chip]
```

### ⚖️ Recipe Scaling
The first step in using the scaling feature is to have a recipe card at the **top** of your note that specifies your desired effect. While you can add as many recipe cards throughout your recipe as you want, the one at the very **top** of your note is the only one that will enforce scaling logic.

If you have a recipe that originally made 12 cookies but you want to scale it to make 24, your recipe card would look like this:
- ```[card, original=12, scaled=24]```

This is the very minumum that your recipe card will need to specify in order for the scaling feature to function. However, many more customization options are also available.

For the plugin to know what values to scale throughout your recipe, these values will need to be encapsulated in either curly braces ```{ }``` or angled brackets ```< >``` depending on the unit being scaled.

For example, values that should be scaled decimally (grams, pounds, ounces) should be closed between curly braces ```{ }``` in the Markdown editor. This could look like:
- ```{15} grams honey```
- ```{2.5}lbs of chicken breast or rougly {5} to {7} breasts```
- ```{8} ounces of shredded mozzerlla```

Alternatively, values that should be scaled fractionally (cups, teaspoons, tablespoons) should be closed between angled brackets ```< >``` in the Markdown editor. The following formats are acceptable:
- ```<9 ¾>``` teaspoons salt
- ```<9 3/4>``` cups sugar
- ```<9-3/4>``` tablespoons baking soda
- ```<9>``` pints milk
- ```<3/4>``` tablespoons butter
- ```<¾>``` quart honey

# 🛠️ Building the plugin
#### 🛑 If you're not a developer then you can ignore everything below this line of text. Unless you're a rebel. In that case, I won't stop you. But seriously, stop looking.

To help develop this plugin further then you'll need to know how to build the plugin once you make your changes.

The plugin is built using Webpack, which creates the compiled code in `/dist`. A JPL archive will also be created at the root, which can be used to distribute the plugin.

To build the plugin, simply run `npm run dist`.

If this returns an error, you likely need to first install Webpack globally with `npm install -g webpack`.

# 🧪 Testing the plugin in Joplin dev mode

Once the plugin is built, it's best to test things out in Joplin dev mode. To access dev mode, open the normal Joplin application and navigate to `Help > Copy dev mode command to clipboard > OK`. You can now close out of the normal Joplin window. Then, open the terminal and paste this command and press enter. A dev mode version of Joplin will launch.

Next, in Joplin dev mode, navigate to `Tools > Options > Plugins > Show Advanced Settings`.  Add the plugin path into the `Development plugins` text field. This should be the path to your main plugin directory which will look something like: `C:\Users\username\Downloads\joplin-recipe-scaler`.
