import joplin from 'api';
import { ContentScriptType } from 'api/types';
import { ToolbarButtonLocation } from 'api/types';

joplin.plugins.register({
    onStart: async function() {
        console.log('Recipe Scaler plugin starting...');
        try {
            await joplin.contentScripts.register(
                ContentScriptType.MarkdownItPlugin,
                'recipeScaler',
                'recipeScaler.js'
            );
            console.log('Content script registered successfully.');
        } catch (error) {
            console.error('Failed to register content script:', error);
        }

        try {
            await joplin.commands.register({
                name: 'scaleRecipe',
                label: 'Scale Recipe',
                execute: async () => {
                    console.log('Scale Recipe command executed.');
                    try {
                        const note = await joplin.workspace.selectedNote();
                        if (note) {
                            console.log('Selected note:', note);
                            const scaledContent = scaleRecipeContent(note.body);

                            // Update the note content
                            await joplin.data.put(['notes', note.id], null, { body: scaledContent });
                            console.log('Note content updated with scaled recipe.');

                            // Check editor settings and refresh the view
                            const codeView = await joplin.settings.globalValue("editor.codeView");
                            const noteVisiblePanes = await joplin.settings.globalValue("noteVisiblePanes");

                            if (codeView) {
                                console.log('Editor is in code view.');
                                // Handle code view updates if necessary
                            }

                            if (noteVisiblePanes) {
                                console.log('Note has visible panes.');
                                // Handle pane visibility updates if necessary
                            }

                            await joplin.commands.execute("textSelectAll");
                            await joplin.commands.execute("replaceSelection", scaledContent);
                            console.log('Editor view refreshed.');
                        } else {
                            console.log('No note is selected.');
                        }
                    } catch (error) {
                        console.error('Failed to execute scaleRecipe command:', error);
                    }
                },
            });
            console.log('Command registered successfully.');
        } catch (error) {
            console.error('Failed to register command:', error);
        }

        try {
            await joplin.views.toolbarButtons.create('scaleRecipeButton', 'scaleRecipe', ToolbarButtonLocation.EditorToolbar);
            console.log('Toolbar button created successfully in the markdown editor.');
        } catch (error) {
            console.error('Failed to create toolbar button in the markdown editor:', error);
        }
    },
});

function scaleRecipeContent(content: string): string {
    console.log('Scaling recipe content.');
    const lines = content.split('\n');
    const scaleFactorMatch = lines[0].match(/^\{(\d+),(\d+)\}/);

    if (!scaleFactorMatch) {
        console.log('No scale factor found at the top of the note.');
        return content;
    }

    const [_, originalServing, targetServing] = scaleFactorMatch.map(Number);
    const scaleFactor = targetServing / originalServing;
    console.log(`Original serving: ${originalServing}, Target serving: ${targetServing}, Scale factor: ${scaleFactor}`);

    // Remove the scale factor line
    lines.shift();

    const scaledContent = lines.map(line => {
        return line.replace(/\{(\d+(?:\.\d+)?)(?:,\d+(?:\.\d+)?)*\}/g, match => {
            const amountMatch = match.match(/\{(\d+(?:\.\d+)?)(?:,\d+(?:\.\d+)?)*\}/);
            if (amountMatch) {
                const originalAmount = amountMatch[1];
                console.log(`Original amount: ${originalAmount}`);
                const scaledValue = evaluateAndScale(originalAmount, scaleFactor);
                console.log(`Scaled value for ${originalAmount}: ${scaledValue}`);
                return `{${originalAmount},${scaledValue}}`;
            }
            return match;
        });
    }).join('\n');

    // Add the scale factor back at the top
    return `{${originalServing},${targetServing}}\n${scaledContent}`;
}

function evaluateAndScale(amount: string, scaleFactor: number): string {
    console.log(`Evaluating and scaling amount: ${amount} with scale factor: ${scaleFactor}`);
    const scaledAmount = parseFloat(amount) * scaleFactor;
    console.log(`Scaled amount: ${scaledAmount}`);

    const roundedAmount = Math.round(scaledAmount * 100) / 100;
    console.log(`Rounded amount: ${roundedAmount}`);

    return formatAmount(roundedAmount);
}

function formatAmount(amount: number): string {
    console.log(`Formatting amount: ${amount}`);
    const rounded = Math.round(amount * 100) / 100;

    if (Math.floor(rounded) === rounded) {
        console.log(`Rounded amount (whole number): ${rounded}`);
        return rounded.toString();
    }

    console.log(`Rounded amount (decimal): ${rounded.toFixed(2)}`);
    return rounded.toFixed(2);
}
