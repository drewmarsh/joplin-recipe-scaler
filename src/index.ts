import joplin from 'api';
import { ContentScriptType, ToolbarButtonLocation } from 'api/types';

joplin.plugins.register({
    onStart: async function() {
        await registerContentScript();
        await registerCommand();
        await createToolbarButton();
    },
});

/**
 * Registers the content script for the recipe scaler.
 */
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

/**
 * Registers the command for scaling recipes.
 */
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

/**
 * Creates a toolbar button for the recipe scaler.
 */
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

/**
 * Executes the recipe scaling command.
 */
async function scaleRecipeCommand() {
    try {
        const note = await joplin.workspace.selectedNote();
        if (!note) {
            console.info('No note is selected.');
            return;
        }

        const scaledContent = scaleRecipeContent(note.body);
        await updateNoteContent(note.id, scaledContent);
        await refreshEditorView(note.id, scaledContent);
    } catch (error) {
        console.error('Failed to execute Scale Recipe command:', error);
    }
}

/**
 * Updates the content of a note.
 * @param {string} noteId - The ID of the note to update.
 * @param {string} content - The new content for the note.
 */
async function updateNoteContent(noteId: string, content: string) {
    try {
        await joplin.data.put(['notes', noteId], null, { body: content });
        console.info('Note content updated with scaled recipe.');
    } catch (error) {
        console.error('Failed to update note content:', error);
    }
}

/**
 * Refreshes the editor view with new content.
 * @param {string} noteId - The ID of the note to refresh.
 * @param {string} content - The new content to display in the editor.
 */
async function refreshEditorView(noteId: string, content: string) {
    try {
        await joplin.commands.execute('editor.setText', content);
        await joplin.commands.execute('editor.focus');
        console.info('Editor view refreshed.');
    } catch (error) {
        console.error('Failed to refresh editor view:', error);
    }
}

/**
 * Scales the content of a recipe.
 * @param {string} content - The original recipe content.
 * @returns {string} The scaled recipe content.
 */
function scaleRecipeContent(content: string): string {
    const lines = content.split('\n');
    const recipeInfoMatch = lines[0].match(/^\[(.+?)\]/);

    if (!recipeInfoMatch) {
        console.log('No recipe info found at the top of the note or invalid format.');
        return content;
    }

    const recipeInfo = parseRecipeInfo(recipeInfoMatch[1]);
    const originalServing = parseFloat(recipeInfo.original);
    let targetServing = parseFloat(recipeInfo.scaled);

    if (isNaN(originalServing)) {
        console.log('Invalid original serving size in recipe info.');
        return content;
    }

    if (isNaN(targetServing)) {
        // If no valid 'scaled' value, use the original serving
        targetServing = originalServing;
    }

    const scaleFactor = targetServing / originalServing;
    console.log('Scale factor:', scaleFactor);
    const showScaled = targetServing !== originalServing;

    // Scale the content
    for (let i = 1; i < lines.length; i++) {
        lines[i] = scaleLineContent(lines[i], scaleFactor, showScaled);
    }

    // Update the recipe info with new scaled value only if it's different from original
    if (showScaled) {
        recipeInfo.scaled = targetServing.toString();
    } else {
        // If not showing scaled, remove the 'scaled' property
        delete recipeInfo.scaled;
    }

    const newRecipeInfo = formatRecipeInfo(recipeInfo);

    // Replace the first line (recipe info) with the updated version
    lines[0] = `[${newRecipeInfo}]`;

    return lines.join('\n');
}

/**
 * Scales the content of a single line in the recipe.
 * @param {string} line - The line to scale.
 * @param {number} scaleFactor - The factor to scale by.
 * @param {boolean} showScaled - Whether to show the scaled values.
 * @returns {string} The scaled line content.
 */
function scaleLineContent(line: string, scaleFactor: number, showScaled: boolean): string {
    return line.replace(/\{(\d+(?:\.\d+)?)(?:,\s*(\d+(?:\.\d+)?|[¼½¾⅐⅑⅒⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]))?\}/g, (match, originalAmount, scaledAmount) => {
        const newAmount = evaluateAndScale(parseFloat(originalAmount), scaleFactor);
        return showScaled ? `{${originalAmount}, ${newAmount}}` : `{${originalAmount}}`;
    }).replace(/<([\d.]+(?:[\s-]+[\d\/]+)?|(?:[\d\/]+)|(?:[¼½¾⅐⅑⅒⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]+))(?:,\s*([\d\s¼½¾⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]+|(?:[\d.]+(?:[\s-]+[\d\/]+)?|(?:[\d\/]+))))?\s*>/g, (match, originalAmount, scaledAmount) => {
        const newAmount = scaleAndFormatFraction(originalAmount, scaleFactor);
        return showScaled ? `<${originalAmount}, ${newAmount}>` : `<${originalAmount}>`;
    });
}

/**
 * Parses the recipe info string into an object.
 * @param {string} infoString - The recipe info string.
 * @returns {Object} An object containing the recipe info.
 */
function parseRecipeInfo(infoString: string): {[key: string]: string} {
    const info: {[key: string]: string} = {};
    infoString.split(',').forEach(pair => {
        const parts = pair.split('=').map(s => s.trim());
        if (parts.length === 1 && parts[0].toLowerCase() === 'card') {
            info['card'] = '';
        } else if (parts.length === 2) {
            const [key, value] = parts;
            info[key] = value;
        }
    });
    return info;
}

/**
 * Formats the recipe info object back into a string.
 * @param {Object} info - The recipe info object.
 * @returns {string} The formatted recipe info string.
 */
function formatRecipeInfo(info: {[key: string]: string}): string {
    return Object.entries(info)
        .map(([key, value]) => value === '' ? key : `${key}=${value}`)
        .join(', ');
}

/**
 * Evaluates and scales a numeric amount.
 * @param {number} amount - The original amount to scale.
 * @param {number} scaleFactor - The factor to scale by.
 * @returns {string} The scaled amount as a string.
 */
function evaluateAndScale(amount: number, scaleFactor: number): string {
    const scaledAmount = amount * scaleFactor;
    return scaledAmount.toFixed(2).replace(/\.00$/, '').replace(/\.(\d)0$/, '.$1');
}

/**
 * Converts a Unicode fraction to its numeric value.
 * @param {string} fraction - The Unicode fraction to convert.
 * @returns {number} The numeric value of the fraction.
 */
function unicodeFractionToNumber(fraction: string): number {
    const fractions: {[key: string]: number} = {
        '¼': 0.25, '½': 0.5, '¾': 0.75,
        '⅐': 1/7, '⅑': 1/9, '⅒': 1/10,
        '⅓': 1/3, '⅔': 2/3,
        '⅕': 0.2, '⅖': 0.4, '⅗': 0.6, '⅘': 0.8,
        '⅙': 1/6, '⅚': 5/6,
        '⅛': 0.125, '⅜': 0.375, '⅝': 0.625, '⅞': 0.875
    };
    return fractions[fraction] || NaN;
}

/**
 * Converts a text-based fraction to its numeric value.
 * @param {string} fraction - The text-based fraction to convert.
 * @returns {number} The numeric value of the fraction.
 */
function textFractionToNumber(fraction: string): number {
    const parts = fraction.trim().split(/[\s-]+/);
    let total = 0;
    
    for (const part of parts) {
        if (part.includes('/')) {
            const [numerator, denominator] = part.split('/');
            total += parseInt(numerator) / parseInt(denominator);
        } else {
            const unicodeFraction = unicodeFractionToNumber(part);
            if (!isNaN(unicodeFraction)) {
                total += unicodeFraction;
            } else {
                total += parseFloat(part);
            }
        }
    }
    
    return total;
}

/**
 * Scales and formats a fraction.
 * @param {string | number} amount - The original amount to scale.
 * @param {number} scaleFactor - The factor to scale by.
 * @returns {string} The scaled and formatted fraction.
 */
function scaleAndFormatFraction(amount: string | number, scaleFactor: number): string {
    let numericAmount: number;
    
    if (typeof amount === 'string') {
        numericAmount = textFractionToNumber(amount);
        if (isNaN(numericAmount)) {
            numericAmount = parseFloat(amount);
        }
    } else {
        numericAmount = amount;
    }

    const scaledAmount = numericAmount * scaleFactor;
    return formatFraction(scaledAmount);
}

/**
 * Formats a numeric value as a fraction.
 * @param {number} value - The numeric value to format.
 * @returns {string} The formatted fraction.
 */
function formatFraction(value: number): string {
    const wholePart = Math.floor(value);
    const fractionalPart = value - wholePart;

    if (fractionalPart === 0) {
        return wholePart.toString();
    }

    const fractions: [number, string][] = [
        [0.25, '¼'], [0.5, '½'], [0.75, '¾'],
        [1/3, '⅓'], [2/3, '⅔'],
        [0.2, '⅕'], [0.4, '⅖'], [0.6, '⅗'], [0.8, '⅘'],
        [1/6, '⅙'], [5/6, '⅚'],
        [0.125, '⅛'], [0.375, '⅜'], [0.625, '⅝'], [0.875, '⅞']
    ];

    let closestFraction = '';
    let minDifference = Infinity;

    for (const [fraction, unicode] of fractions) {
        const difference = Math.abs(fractionalPart - fraction);
        if (difference < minDifference) {
            minDifference = difference;
            closestFraction = unicode;
        }
    }

    return wholePart === 0 ? closestFraction : `${wholePart} ${closestFraction}`;
}