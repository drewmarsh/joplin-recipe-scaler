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
        console.log('No scale factor found at the top of the note or invalid format.');
        return content;
    }

    const [_, originalServing, targetServing] = scaleFactorMatch.map(parseFloat);
    const scaleFactor = targetServing / originalServing;

    lines.shift();

    const scaledContent = lines.map(line => {
        return line.replace(/\{\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*\}/g, (match, originalAmount, currentAmount) => {
            const newAmount = evaluateAndScale(parseFloat(originalAmount), scaleFactor);
            return `{${originalAmount}, ${newAmount}}`;
        }).replace(/<\s*([\d.]+(?:[\s-]+\d+\/\d+)?|(?:\d+\/\d+))(?:\s*,\s*([\d\s¼½¾⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]+))?\s*>/g, (match, originalAmount, currentAmount) => {
            const newAmount = scaleAndFormatFraction(originalAmount, scaleFactor);
            return `<${originalAmount}, ${newAmount}>`;
        });
    }).join('\n');

    return `{original=${originalServing}, scaled=${targetServing}}\n${scaledContent}`;
}

function evaluateAndScale(amount: number, scaleFactor: number): string {
    const scaledAmount = amount * scaleFactor;
    return Number.isInteger(scaledAmount) ? scaledAmount.toFixed(0) : scaledAmount.toFixed(2);
}

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

function textFractionToNumber(fraction: string): number {
    const parts = fraction.split(/[\s-]+/);
    if (parts.length === 1) {
        const [numerator, denominator] = parts[0].split('/');
        return parseInt(numerator) / parseInt(denominator);
    } else if (parts.length === 2) {
        const whole = parseInt(parts[0]);
        const [numerator, denominator] = parts[1].split('/');
        return whole + parseInt(numerator) / parseInt(denominator);
    }
    return NaN;
}

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