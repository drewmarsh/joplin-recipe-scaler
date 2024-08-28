module.exports = {
    default: function(context) {
        return {
            plugin: function(markdownIt, _options) {
                const defaultRender = markdownIt.renderer.rules.text || function(tokens, idx, options, env, self) {
                    return self.renderToken(tokens, idx, options);
                };

                /**
                 * Converts a text fraction to its Unicode equivalent.
                 * @param {string} fraction - The text fraction to convert.
                 * @returns {string} The Unicode fraction or the original fraction if no match.
                 */
                function textFractionToUnicode(fraction) {
                    const fractions = {
                        '1/4': '¼', '1/2': '½', '3/4': '¾',
                        '1/3': '⅓', '2/3': '⅔',
                        '1/5': '⅕', '2/5': '⅖', '3/5': '⅗', '4/5': '⅘',
                        '1/6': '⅙', '5/6': '⅚',
                        '1/8': '⅛', '3/8': '⅜', '5/8': '⅝', '7/8': '⅞'
                    };
                    return fractions[fraction] || fraction;
                }

                /**
                 * Converts all text fractions in a string to Unicode fractions.
                 * @param {string} amount - The string containing fractions to convert.
                 * @returns {string} The string with Unicode fractions.
                 */
                function convertToUnicodeFraction(amount) {
                    return amount.replace(/(\d+)\/(\d+)/g, (match, numerator, denominator) => {
                        return textFractionToUnicode(match) || match;
                    });
                }

                /**
                 * Parses recipe information from the content string.
                 * @param {string} content - The content string to parse.
                 * @returns {Object|null} An object containing recipe info, or null if not found.
                 */
                function parseRecipeInfo(content) {
                    const match = content.match(/^\[(.+?)\]/);
                    if (!match) return null;

                    const info = {};
                    match[1].split(',').forEach(pair => {
                        const [key, value] = pair.split('=').map(s => s.trim());
                        info[key] = value;
                    });

                    return info;
                }

                /**
                 * Renders a recipe card HTML from recipe information.
                 * @param {Object} info - The recipe information object.
                 * @returns {string} HTML string for the recipe card.
                 */
                function renderRecipeCard(info) {
                    const pairSpacing = '20px'; // Spacing between each label-value pair
                    const labelValueGap = '10px'; // Spacing between the label and its corresponding value
                
                    // Create a label-value pair with specified spacing
                    function createLabelValuePair(label, value) {
                        return `<span style="margin-right: ${pairSpacing}; white-space: nowrap; display: inline-block;" spellcheck="false">
                                    <span class="label" style="color: #ff8b25f9; font-weight: bold; margin-right: ${labelValueGap};" spellcheck="false">${label}</span> 
                                    ${value}
                                </span>`;
                    }
                
                    // Start building the HTML for the recipe card container
                    let html = `<div style="background-color: transparent; border: 6px solid #ff8b25f9; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); display: inline-block; max-width: 100%;">`;
                    
                    // Add the recipe title if it exists
                    if (info.title) {
                        html += `<h2 style="font-size: 32px; margin-bottom: 5px; border-bottom: none; padding-bottom: 10px;">${info.title}</h2>`;
                    }
                
                    // Add the serving information
                    html += '<div class="recipe-details">';
                    if (info.original) {
                        if (info.scaled && info.original !== info.scaled) {
                            html += createLabelValuePair('originally served', info.original);
                            html += createLabelValuePair('scaled to serve', info.scaled);
                        } else {
                            html += createLabelValuePair('servings', info.original);
                        }
                    }
                
                    // Add any other recipe details
                    for (const [key, value] of Object.entries(info)) {
                        if (!['original', 'scaled', 'title'].includes(key)) {
                            html += createLabelValuePair(key, value);
                        }
                    }
                    
                    // Close the container and return the complete HTML
                    html += '</div></div>';
                    return html;
                }                                                 
            
                markdownIt.renderer.rules.text = function(tokens, idx, options, env, self) {
                    if (idx === 0) {
                        const recipeInfo = parseRecipeInfo(tokens[idx].content);
                        if (recipeInfo) {
                            tokens[idx].content = tokens[idx].content.replace(/^\[.+?\]/, '');
                            return renderRecipeCard(recipeInfo) + defaultRender(tokens, idx, options, env, self);
                        }
                    }
                    
                    // Hide curly braces from WYSIWYG editor output
                    tokens[idx].content = tokens[idx].content.replace(/\{(\d+(?:\.\d+)?)(?:,\s*(\d+(?:\.\d+)?))?\}/g, (match, originalAmount, scaledAmount) => {
                        return scaledAmount || originalAmount;
                    });
                
                    // Hide angled brackets from WYSIWYG editor output
                    tokens[idx].content = tokens[idx].content.replace(/<([\d.]+(?:[\s-]+[\d\/]+)?|(?:[\d\/]+)|(?:[¼½¾⅐⅑⅒⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]+))(?:\s*,\s*([\d\s¼½¾⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]+|(?:[\d.]+(?:[\s-]+[\d\/]+)?|(?:[\d\/]+))))?\s*>/g, (match, originalAmount, scaledAmount) => {
                        return convertToUnicodeFraction(scaledAmount || originalAmount);
                    });
                
                    return defaultRender(tokens, idx, options, env, self);
                };
            },
            assets: function() {
                return [
                    { name: 'recipeScaler.css' }
                ];
            },
        }
    }
}