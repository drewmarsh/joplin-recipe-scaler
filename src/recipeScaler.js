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
                    const pairs = match[1].split(',').map(s => s.trim());
                    
                    pairs.forEach(pair => {
                        const [key, ...valueParts] = pair.split('=').map(s => s.trim());
                        const value = valueParts.join('=');
                        
                        if (key === 'chip') {
                            if (!info.chips) info.chips = [];
                            info.chips.push(value);
                        } else {
                            info[key] = value;
                        }
                    });
                
                    return info;
                }

                /**
                 * Generates a CSS gradient string from given colors.
                 * @param {string[]} colors - Array of color strings (hex or color names).
                 * @returns {string} CSS gradient string.
                 */
                function generateGradient(colors) {
                    const validColors = colors.map(color => getValidColor(color));
                    if (validColors.length === 1) {
                        const lighterColor = lightenColor(validColors[0], 30);
                        return `linear-gradient(to right, ${validColors[0]}, ${lighterColor})`;
                    }
                    return `linear-gradient(to right, ${validColors.join(', ')})`;
                }

                /**
                 * Validates and returns a proper color value.
                 * @param {string} color - Color string to validate.
                 * @returns {string} Valid color string.
                 */
                function getValidColor(color) {
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

                    color = color.toLowerCase().trim();
                    if (colorMap[color]) {
                        return colorMap[color];
                    } else if (color.match(/^#[0-9A-Fa-f]{6}$/)) {
                        return color;
                    }
                    return '#ff8b25'; // Default color if invalid
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
                 * Converts a hex color to RGB values.
                 * @param {string} hex - The hex color to convert.
                 * @returns {Object} An object with r, g, and b properties.
                 */
                function hexToRgb(hex) {
                    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
                    hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
                    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
                    return result ? {
                        r: parseInt(result[1], 16),
                        g: parseInt(result[2], 16),
                        b: parseInt(result[3], 16)
                    } : null;
                }

                /**
                 * Calculates the relative luminance of a color.
                 * @param {Object} rgb - An object with r, g, and b properties.
                 * @returns {number} The relative luminance value.
                 */
                function calculateLuminance(rgb) {
                    const a = [rgb.r, rgb.g, rgb.b].map(v => {
                        v /= 255;
                        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
                    });
                    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
                }

                /**
                 * Calculates the contrast ratio between two colors.
                 * @param {string} color1 - The first color in hex format.
                 * @param {string} color2 - The second color in hex format.
                 * @returns {number} The contrast ratio.
                 */
                function getContrastRatio(color1, color2) {
                    const lum1 = calculateLuminance(hexToRgb(color1));
                    const lum2 = calculateLuminance(hexToRgb(color2));
                    const brightest = Math.max(lum1, lum2);
                    const darkest = Math.min(lum1, lum2);
                    return (brightest + 0.05) / (darkest + 0.05);
                }

                /**
                 * Determines whether to use black or white text based on the background color.
                 * @param {string} bgColor - The background color in hex format.
                 * @returns {string} The text color ('black' or 'white').
                 */
                function getTextColor(bgColor) {
                    const contrastWithBlack = getContrastRatio(bgColor, '#000000');
                    const contrastWithWhite = getContrastRatio(bgColor, '#FFFFFF');
                    return contrastWithWhite > contrastWithBlack ? '#FFFFFF' : '#000000';
                }

                /**
                 * Renders a recipe card HTML from recipe information.
                 * @param {Object} info - The recipe information object.
                 * @returns {string} HTML string for the recipe card.
                 */
                function renderRecipeCard(info) {
                    const defaultColor = '#ff8b25';
                    let colors = info.color ? info.color.split('-') : [defaultColor];
                    
                    const gradientString = generateGradient(colors);
                    const primaryColor = getValidColor(colors[0]);
                    const textColor = getTextColor(primaryColor);

                    const mainStyle = `
                        background-color: transparent;
                        border: 6px solid;
                        border-image: ${gradientString} 1;
                        border-radius: 8px;
                        padding: 20px;
                        margin-bottom: 20px;
                        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                        display: inline-block;
                        max-width: 100%;
                    `;
                    const titleStyle = 'font-size: 32px; border-bottom: none; margin-top: -5px; margin-bottom: 5px;';
                    const labelStyle = `color: ${primaryColor}; font-weight: bold; margin-right: 10px;`;
                    const detailsStyle = 'display: flex; flex-wrap: wrap; gap: 12px;';
                    const pairStyle = 'white-space: nowrap; display: inline-block; margin-left: 5px; margin-right: 5px;';
                    
                    const chipStyle = `
                        display: inline-block;
                        background-color: ${primaryColor};
                        padding: 2px 8px;
                        border-radius: 12px;
                        margin: 5px;
                        font-size: 0.9em;
                    `;

                    const chipTextStyle = `
                        color: ${textColor};
                        font-weight: bold;
                    `;

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
                        if (!['original', 'scaled', 'title', 'color', 'chips'].includes(key)) {
                            html += `<span style="${pairStyle}"><span style="${labelStyle}">${key}</span>${value}</span>`;
                        }
                    }

                    html += '</div>';

                    if (info.chips && info.chips.length > 0) {
                        html += `<div style="margin-top: 10px;">`;
                        info.chips.forEach(chip => {
                            html += `
                                <span style="${chipStyle}">
                                    <span style="${chipTextStyle}">${chip.trim()}</span>
                                </span>
                            `;
                        });
                        html += '</div>';
                    }         

                    html += '</div>';
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

                    /**
                     * Cleans up the content by handling scaled amounts.
                     * @param {string} content - The content to clean up.
                     * @returns {string} The cleaned up content.
                     */
                    function cleanUpContent(content) {
                        // Handle scaled amounts in curly braces
                        content = content.replace(/\{(\d+(?:\.\d+)?)(?:,\s*(\d+(?:\.\d+)?))?\}/g, (match, original, scaled) => {
                            return scaled || original;
                        });

                        // Handle scaled amounts in angle brackets
                        content = content.replace(/<(\d+(?:\.\d+)?(?:[\s-]+[\d\/]+)?|(?:[\d\/]+)|(?:[¼½¾⅐⅑⅒⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]+))(?:,\s*([\d\s¼½¾⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]+|(?:[\d.]+(?:[\s-]+[\d\/]+)?|(?:[\d\/]+))))?\s*>/g, (match, original, scaled) => {
                            return scaled || original;
                        });

                        return content;
                    }

                    let cleanedContent = cleanUpContent(content);

                    if (cleanedContent !== content) {
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