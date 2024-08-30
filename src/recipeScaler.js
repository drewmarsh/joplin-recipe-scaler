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
                 * Lightens a given hex color.
                 * @param {string} color - The hex color to lighten.
                 * @param {number} percent - The percentage to lighten by (0-100).
                 * @returns {string} The lightened hex color.
                 */
                function lightenColor(color, percent) {
                    const num = parseInt(color.replace("#",""), 16),
                          amt = Math.round(2.55 * percent),
                          R = (num >> 16) + amt,
                          G = (num >> 8 & 0x00FF) + amt,
                          B = (num & 0x0000FF) + amt;
                    return "#" + (0x1000000 + (R<255?R<1?0:R:255)*0x10000 + (G<255?G<1?0:G:255)*0x100 + (B<255?B<1?0:B:255)).toString(16).slice(1);
                }

                /**
                 * Renders a recipe card HTML from recipe information.
                 * @param {Object} info - The recipe information object.
                 * @returns {string} HTML string for the recipe card.
                 */
                function renderRecipeCard(info) {
                    const defaultColor = '#ff8b25';
                    let accentColor = info.color ? info.color.toLowerCase() : defaultColor;
                
                    const colorMap = {
                        red: '#ff0000',     blue: '#0000ff',    green: '#008000',   yellow: '#ffd700',
                        orange: '#ff8b25',  brick: '#a52a2a',   black: '#000000',   sky: '#87ceeb',
                        white: '#ffffff',   gray: '#808080',    silver: '#c0c0c0',  wheat: '#f5deb3',
                        navy: '#000080',    teal: '#008080',    maroon: '#800000',  olive: '#808000',
                        lime: '#00ff00',    aqua: '#00ffff',    turquoise: '#40e0d0', indigo: '#4b0082',
                        purple: '#ee82ee',  magenta: '#ff00ff', tan: '#d2b48c',     chocolate: '#d2691e',
                        coral: '#ff7f50',   crimson: '#dc143c', khaki: '#f0e68c',   salmon: '#fa8072',  
                        pink: '#ffb6c1'
                    };
                
                    // Check if the color value is a color name, and replace it with the corresponding hex code if found
                    if (colorMap[accentColor]) {
                        accentColor = colorMap[accentColor];
                    } else if (!accentColor.startsWith('#')) {
                        // If the color value is not a valid hex code or color name, use the default color
                        accentColor = defaultColor;
                    }

                    // Create a lighter version of the accent color for the gradient
                    const lighterColor = lightenColor(accentColor, 30);

                    const mainStyle = `
                        background-color: transparent;
                        border: 6px solid;
                        border-image: linear-gradient(to right, ${accentColor}, ${lighterColor}) 1;
                        border-radius: 8px;
                        padding: 20px;
                        margin-bottom: 20px;
                        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                        display: inline-block;
                        max-width: 100%;
                    `;
                    const titleStyle = 'font-size: 32px; margin-bottom: 5px; border-bottom: none; padding-bottom: 10px;';
                    const detailsStyle = 'display: flex; flex-wrap: wrap; gap: 12px;';
                    const pairStyle = 'white-space: nowrap; display: inline-block;';
                    const labelStyle = `color: ${accentColor}; font-weight: bold; margin-right: 10px;`;

                    let html = `<div style="${mainStyle}">`;

                    if (info.title) {
                        html += `<h2 style="${titleStyle}">${info.title}</h2>`;
                    }

                    html += `<div style="${detailsStyle}">`;
                    if (info.original) {
                        if (info.scaled && info.original !== info.scaled) {
                            html += `<span style="${pairStyle}"><span style="${labelStyle}">originally served</span>${info.original}</span>`;
                            html += `<span style="${pairStyle}"><span style="${labelStyle}">scaled to serve</span>${info.scaled}</span>`;
                        } else {
                            html += `<span style="${pairStyle}"><span style="${labelStyle}">servings</span>${info.original}</span>`;
                        }
                    }

                    for (const [key, value] of Object.entries(info)) {
                        if (!['original', 'scaled', 'title', 'color'].includes(key)) {
                            html += `<span style="${pairStyle}"><span style="${labelStyle}">${key}</span>${value}</span>`;
                        }
                    }

                    html += '</div></div>';
                    return html;
                }                                        
            
                markdownIt.renderer.rules.text = function(tokens, idx, options, env, self) {
                    if (idx === 0) {
                        const recipeInfo = parseRecipeInfo(tokens[idx].content);
                        if (recipeInfo) {
                            const originalMarkdown = tokens[idx].content.match(/^\[.+?\]/)[0];
                            tokens[idx].content = tokens[idx].content.replace(/^\[.+?\]/, '');
                            
                            const renderedHtml = renderRecipeCard(recipeInfo);
                            
                            return `<div class="joplin-editable">
                                <pre class="joplin-source" data-joplin-language="json" data-joplin-source-open="[" data-joplin-source-close="]">${originalMarkdown.slice(1, -1)}</pre>
                                ${renderedHtml}
                            </div>` + defaultRender(tokens, idx, options, env, self);
                        }
                    }

                    let content = tokens[idx].content;
                    let originalContent = content;

                    // Function to clean up the display content
                    function cleanUpContent(content) {
                        // Handle scaled amounts in curly braces, including when values are equal
                        content = content.replace(/\{(\d+(?:\.\d+)?)(?:,\s*(\d+(?:\.\d+)?))?\}/g, (match, original, scaled) => {
                            return scaled || original;
                        });

                        // Handle scaled amounts in angle brackets, including when values are equal
                        content = content.replace(/<(\d+(?:\.\d+)?(?:[\s-]+[\d\/]+)?|(?:[\d\/]+)|(?:[¼½¾⅐⅑⅒⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]+))(?:,\s*([\d\s¼½¾⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]+|(?:[\d.]+(?:[\s-]+[\d\/]+)?|(?:[\d\/]+))))?\s*>/g, (match, original, scaled) => {
                            return scaled || original;
                        });

                        return content;
                    }

                    let cleanedContent = cleanUpContent(content);

                    if (cleanedContent !== content) {
                        // If the content was cleaned up, wrap it in joplin-editable
                        return `<div class="joplin-editable">
                            <pre class="joplin-source" data-joplin-language="markdown" data-joplin-source-open="" data-joplin-source-close="">${markdownIt.utils.escapeHtml(originalContent)}</pre>
                            ${cleanedContent}
                        </div>`;
                    }

                    return defaultRender(tokens, idx, options, env, self);
                };
            },
            assets: function() {
                return [];
            },
        }
    }
}