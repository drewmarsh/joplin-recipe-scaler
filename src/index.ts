import joplin from 'api';
import { ContentScriptType, ToolbarButtonLocation } from 'api/types';

joplin.plugins.register({
    onStart: async function() {
        await registerContentScript();
        await registerCommand();
        await createToolbarButton();
    },
});

async function registerContentScript() {
    try {
        await joplin.contentScripts.register(
            ContentScriptType.MarkdownItPlugin,
            'recipeScaler',
            './recipeScaler.js'
        );
        console.info('Recipe Scaler content script registered successfully.');
    } catch (error) {
        console.error('Failed to register Recipe Scaler content script:', error);
    }
}

async function registerCommand() {
    try {
        await joplin.commands.register({
            name: 'scaleRecipe',
            label: 'Scale Recipe',
            execute: scaleRecipeCommand,
        });
        console.info('Scale Recipe command registered successfully.');
    } catch (error) {
        console.error('Failed to register Scale Recipe command:', error);
    }
}

async function createToolbarButton() {
    try {
        await joplin.views.toolbarButtons.create(
            'scaleRecipeButton',
            'scaleRecipe',
            ToolbarButtonLocation.EditorToolbar
        );
        console.info('Scale Recipe toolbar button created successfully.');
    } catch (error) {
        console.error('Failed to create Scale Recipe toolbar button:', error);
    }
}

async function scaleRecipeCommand() {
    try {
        const note = await joplin.workspace.selectedNote();
        if (!note) {
            console.info('No note is selected.');
            return;
        }

        const scaledContent = scaleRecipeContent(note.body);
        await updateNoteContent(note.id, scaledContent);
        await refreshEditorView(scaledContent);
    } catch (error) {
        console.error('Failed to execute Scale Recipe command:', error);
    }
}

async function updateNoteContent(noteId: string, content: string) {
    await joplin.data.put(['notes', noteId], null, { body: content });
    console.info('Note content updated with scaled recipe.');
}

async function refreshEditorView(content: string) {
    await joplin.commands.execute('textSelectAll');
    await joplin.commands.execute('replaceSelection', content);
    console.info('Editor view refreshed.');
}

function scaleRecipeContent(content: string): string {
    const lines = content.split('\n');
    const scaleFactorMatch = lines[0].match(/^\{\s*original\s*=\s*(\d+(?:\.\d+)?)\s*,\s*scaled\s*=\s*(\d+(?:\.\d+)?)\s*\}/);

    if (!scaleFactorMatch) {
        console.info('No scale factor found at the top of the note or invalid format.');
        return content;
    }

    const [_, originalServing, targetServing] = scaleFactorMatch.map(parseFloat);
    const scaleFactor = targetServing / originalServing;

    lines.shift(); // Remove the scale factor line

    const scaledContent = lines.map(line => scaleRecipeLine(line, scaleFactor)).join('\n');

    return `{original=${originalServing}, scaled=${targetServing}}\n${scaledContent}`;
}

function scaleRecipeLine(line: string, scaleFactor: number): string {
    return line.replace(/\{\s*(\d+(?:\.\d+)?)\s*(?:,\s*\d+(?:\.\d+)?)?\s*\}/g, (match, amount) => {
        const originalAmount = parseFloat(amount);
        const scaledValue = evaluateAndScale(originalAmount, scaleFactor);
        return `{${originalAmount}, ${scaledValue}}`;
    });
}

function evaluateAndScale(amount: number, scaleFactor: number): string {
    const scaledAmount = amount * scaleFactor;
    return formatAmount(scaledAmount);
}

function formatAmount(amount: number): string {
    const rounded = Math.round(amount * 100) / 100;
    return rounded % 1 === 0 ? rounded.toString() : rounded.toFixed(2);
}