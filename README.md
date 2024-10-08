<!---
Copyright (c) 2024 Drew Marshall
--->

<p align="center">
  <a href="https://github.com/drewmarsh/joplin-recipe-scaler">
    <img src="/preview/logo.svg" width="325" height="325" alt="Logo">
  </a>
</p>

![hawaiian-ice-example](/preview/hawaiian-ice-example.png)

![cherry-limeade-example](/preview/cherry-limeade-example.png)

<br>

# 🍽️ The 5 Courses
### [📥 Installation](#installation)
### [✨ Recipe Cards](#recipe-cards)
### [⚖️ Recipe Scaling](#recipe-scaling)
### [📜 Example Note](#example-note)
### [🛠️ Contributing](#contributing)

<br>

<a name="recipe-cards"></a>
# ✨ Recipe Cards
Recipe cards can be used to efficiently display recipe information in as many beautiful and highly-customizable cards as you desire.

These cards are encapsulated between square brackets ```[ ]``` in the Markdown editor and can take in many different **attributes** that tell the plugin how you want the card to behave.

The available **attributes** are as listed below:

- #### ```card```

  - Necessary to tell the plugin that you're trying to render a new recipe card. It is **not** necessary to set it equal to anything.

- #### ```title=```

  - Adds a title to the recipe card.

- #### ```original=``` and ```scaled=```

  - These two **attributes** should be only used in *one recipe card per note* and the Markdown for this card should be at the *very top* of the note. They tell the plugin how many servings the original recipe made and how many servings you want to scale the recipe to. If you don't plan to use the [recipe scaling](#recipe-scaling) feature, these **attributes**  can be omitted from the note entirely.

- #### ```label= value```

  - This **attribute** is different from the rest as it's fully customizable. You don't actually write ```label``` or ```value```. Instead, you can write anything you want, such as: ```calories= 481```, ```protein= 51g```,  ```carbs= 62```, ```fat = 34g```, ```sugars= 2g```. These label/value pairs will be neatly organized in a list.

- #### ```chip=```

  - Adds chip(s) to the recipe card. This can either be one chip: ```chip = Example Chip``` or multiple chips like this: ```chip= Chip 1+Chip 2+Chip 3```

- #### ```color=```

  - Assigns color(s) to the recipe card. This can either be one solid color: ```color= red``` / ```color= #ff0000``` or you can make it a gradient like this: ```color= red+white+blue```.

<br>

An example of a recipe card that utilizes each and every one of the above **attributes** would look like this in the Markdown editor:

```[card, title=🍇 Example Title, original= 12, scaled= 24, example label 1 = example value 1, example label 2 = example value 2, chip= Example Chip 1+Example Chip 2, color= indigo+#ee82ee]```

And would come out rendered in the Rich Text Editor like this:

![recipe-card+border_example](/preview/recipe-card+border_example.png)


Of course, the background of this card depends on your Joplin theme.

<br>

<a name="recipe-scaling"></a>
# ⚖️ Recipe Scaling
The first step in using the scaling feature is to have a recipe card at the *top* of your note that specifies your desired effect. 

> [!NOTE]
>
> While you can add as many recipe cards throughout your recipe as you want, the one at the very *top* of your note is the only one that will enforce scaling logic.

If you have a recipe that originally made 12 cookies but you want to scale it to make 24, your recipe card would look like this:
- ```[card, original= 12, scaled= 24]```

This is the very minimum that your recipe card will need to specify in order for the scaling feature to function. However, [many more customization options are also available](#recipe-cards).

For the plugin to know what values to scale throughout your recipe, these values will need to be encapsulated in either curly braces ```{ }``` or angled brackets ```< >``` depending on the unit being scaled.

For example, values that should be scaled decimally (grams, pounds, ounces) should be closed between curly braces ```{ }``` in the Markdown editor. This could look like:
- ```{15} grams honey```
- ```{2.5}lbs of chicken breast or roughly {6} breasts```
- ```{8} ounces of shredded mozzarella```

Alternatively, values that should be scaled fractionally (cups, teaspoons, tablespoons) should be closed between angled brackets ```< >``` in the Markdown editor. The following formats are acceptable:
- ```<9 ¾>``` teaspoons salt
- ```<9 3/4>``` cups sugar
- ```<9-3/4>``` tablespoons baking soda
- ```<9>``` pints milk
- ```<3/4>``` tablespoons butter
- ```<¾>``` quart honey

After updating the ```original=```, ```scaled=```, or any scalable values throughout your note, you have to click the ```gear icon``` on your toolbar to trigger the plugin to update the note accordingly.

![recipe-card+border_example](/preview/gear-icon+border_example.png)

<br>

<a name="example-note"></a>
#  📜 Example Note
This example demonstrates how to use the recipe card and recipe scaling features in a Joplin note. It showcases the Markdown syntax and the resulting rendered output in the Rich Text Editor.
#### Markdown:
``` 
[card, original=6, scaled=12, title=🌯 Savory Chicken Burritos, calories=620, protein=52g, carbs=79g, fat=17g, color=orange+brick, chip=Freezable+High Protein]

**INGREDIENTS**

- <6, 12> Large Tortillas (see above recipe)
- {700, 1400} g of cooked chicken breast (roughly {3, 6} breasts), cubed
- {8, 16} oz ({226, 452} g) part skim shredded mozzarella cheese
- {4, 8} wedges of Laughing Cow Cream Cheese (Original)
- {1, 2} lime or <1, 2> Tbsp lime juice concentrate
- {1, 2} can tri-blend beans or beans of choice
- {1, 2} can tomato sauce
- {1, 2} bell pepper (yellow)
- {1, 2} Jalapeño
- Cilantro (optional)

**INSTRUCTIONS**

- [ ] Dice peppers
- [ ] Cook peppers and beans in a bit of water to soften
- [ ] Mix in tomato sauce and spices
- [ ] Add in prepped chicken and both cheeses
- [ ] Add lime juice if desired
- [ ] Cool mixture in fridge for 20 minutes, uncovered
- [ ] Evenly disperse mixture across {6, 12} large tortillas and fold
- [ ] Store in freezer in parchment paper until ready to eat

[💡= tip: Heat up the tortillas before rolling to reduce the chance of tearing, color=yellow+orange, card]

**REHEATING**

- Ideally, you'd defrost overnight and then heat for ~1 minute on both sides
- If heating from frozen then heat for ~2 minutes and then flip the burrito and cut it in half before heating for another ~2 minutes
```
#### Rich Text Editor:

<img src="/preview/example-note+border.png" width="700" alt="Example Note">

<br>

<a name="installation"></a>
# 📥 Installation
-  Open Joplin
- Navigate to settings (“Tools > Options” on Windows/Linux, “Joplin > Settings” on a Mac)
- Click on 'Plugins' in the sidebar.
- Search for “Recipe Scaler”.
- Click 'Install'.

<br>

<a name="contributing"></a>
# 🛠️ Contributing
#### 🚧 Building the plugin
To help develop this plugin further then you'll need to know how to build the plugin once you make your changes.

The plugin is built using Webpack, which creates the compiled code in `/dist`. A JPL archive will also be created at the root, which can be used to distribute the plugin.

To build the plugin, simply run `npm run dist`.

If this returns an error, you likely need to first install Webpack globally with `npm install -g webpack`.

#### 🧪 Testing the plugin in Joplin dev mode

Once the plugin is built, it's best to test things out in Joplin dev mode. To access dev mode, open the normal Joplin application and navigate to `Help > Copy dev mode command to clipboard > OK`. You can now close out of the normal Joplin window. Then, open the terminal and paste this command and press enter. A dev mode version of Joplin will launch.

Next, in Joplin dev mode, navigate to `Tools > Options > Plugins > Show Advanced Settings`.  Add the plugin path into the `Development plugins` text field. This should be the path to your main plugin directory which will look something like: `C:\Users\username\Downloads\joplin-recipe-scaler`.
