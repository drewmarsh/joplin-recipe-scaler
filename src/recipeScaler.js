/**
 * Recipe Scaler Plugin for Joplin
 * 
 * This plugin enhances recipe notes in Joplin by adding scaling functionality
 * and improved visual representation of recipe information.
 * 
 * @module recipeScaler
 * @version 1.0.0
 */

module.exports = {
    default: function(context) {
        return {
            plugin: function(markdownIt, _options) {
                const defaultRender = markdownIt.renderer.rules.text || function(tokens, idx, options, env, self) {
                    return self.renderToken(tokens, idx, options);
                };

                /**
                 * Color utilities
                 */
                const ColorUtils = {
                    /**
                     * Maps color names to their hex values.
                     * @type {Object.<string, string>}
                     */
                    colorMap: {
                        red: '#ff0000', blue: '#0000ff', green: '#008000', yellow: '#ffd700',
                        orange: '#ff8b25', brick: '#a52a2a', black: '#000000', sky: '#87ceeb',
                        white: '#ffffff', gray: '#808080', silver: '#c0c0c0', wheat: '#f5deb3',
                        navy: '#000080', teal: '#008080', maroon: '#800000', olive: '#808000',
                        lime: '#00ff00', aqua: '#00ffff', turquoise: '#40e0d0', indigo: '#4b0082',
                        purple: '#ee82ee', magenta: '#ff00ff', tan: '#f4ba86', chocolate: '#d2691e',
                        coral: '#ff7f50', crimson: '#dc143c', khaki: '#f0e68c', salmon: '#fa8072',  
                        pink: '#ffb6c1'
                    },

                    /**
                     * Validates and returns a proper color value.
                     * @param {string} color - Color string to validate.
                     * @returns {string} Valid color string.
                     */
                    getValidColor: function(color) {
                        color = color.toLowerCase().trim();
                        if (this.colorMap[color]) {
                            return this.colorMap[color];
                        } else if (color.match(/^#[0-9A-Fa-f]{6}$/)) {
                            return color;
                        }
                        return '#ff8b25'; // Default color if invalid
                    },

                    /**
                     * Converts a hex color to RGB values.
                     * @param {string} hex - The hex color to convert.
                     * @returns {Object} An object with r, g, and b properties.
                     */
                    hexToRgb: function(hex) {
                        const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
                        hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
                        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
                        return result ? {
                            r: parseInt(result[1], 16),
                            g: parseInt(result[2], 16),
                            b: parseInt(result[3], 16)
                        } : null;
                    },

                    /**
                     * Calculates the relative luminance of a color.
                     * @param {Object} rgb - An object with r, g, and b properties.
                     * @returns {number} The relative luminance value.
                     */
                    calculateLuminance: function(rgb) {
                        const a = [rgb.r, rgb.g, rgb.b].map(v => {
                            v /= 255;
                            return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
                        });
                        return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
                    },

                    /**
                     * Calculates the contrast ratio between two colors.
                     * @param {string} color1 - The first color in hex format.
                     * @param {string} color2 - The second color in hex format.
                     * @returns {number} The contrast ratio.
                     */
                    getContrastRatio: function(color1, color2) {
                        const lum1 = this.calculateLuminance(this.hexToRgb(color1));
                        const lum2 = this.calculateLuminance(this.hexToRgb(color2));
                        const brightest = Math.max(lum1, lum2);
                        const darkest = Math.min(lum1, lum2);
                        return (brightest + 0.05) / (darkest + 0.05);
                    },

                    /**
                     * Determines whether to use black or white text based on the background color.
                     * @param {string} bgColor - The background color in hex format.
                     * @returns {string} The text color ('#000000' or '#FFFFFF').
                     */
                    getTextColor: function(bgColor) {
                        const contrastWithBlack = this.getContrastRatio(bgColor, '#000000');
                        const contrastWithWhite = this.getContrastRatio(bgColor, '#FFFFFF');
                        return contrastWithWhite > contrastWithBlack ? '#FFFFFF' : '#000000';
                    },

                    /**
                     * Generates a CSS gradient string from given colors.
                     * @param {string[]} colors - Array of color strings (hex or color names).
                     * @returns {string} CSS gradient string.
                     */
                    generateGradient: function(colors) {
                        const validColors = colors.map(color => this.getValidColor(color));
                        if (validColors.length === 1) {
                            return `linear-gradient(to right, ${validColors[0]}, ${validColors[0]})`;
                        }
                        return `linear-gradient(to right, ${validColors.join(', ')})`;
                    }
                };

                /**
                 * Fraction utilities
                 */
                const FractionUtils = {
                    /**
                     * Maps text fractions to their Unicode equivalents.
                     * @type {Object.<string, string>}
                     */
                    fractionMap: {
                        '1/4': '¼', '1/2': '½', '3/4': '¾',
                        '1/3': '⅓', '2/3': '⅔',
                        '1/5': '⅕', '2/5': '⅖', '3/5': '⅗', '4/5': '⅘',
                        '1/6': '⅙', '5/6': '⅚',
                        '1/8': '⅛', '3/8': '⅜', '5/8': '⅝', '7/8': '⅞'
                    },

                    /**
                     * Converts a text fraction to its Unicode equivalent.
                     * @param {string} fraction - The text fraction to convert.
                     * @returns {string} The Unicode fraction or the original fraction if no match.
                     */
                    textFractionToUnicode: function(fraction) {
                        return this.fractionMap[fraction] || fraction;
                    },

                    /**
                     * Converts text fractions to Unicode fractions within a given string.
                     * @param {string} content - The content string to convert.
                     * @returns {string} The content with Unicode fractions.
                     */
                    convertFractionsToUnicode: function(content) {
                        return content.replace(/(\d+)?[-\s]?(\d+)\/(\d+)/g, (match, whole, numerator, denominator) => {
                            const fractionPart = this.textFractionToUnicode(`${numerator}/${denominator}`);
                            return whole ? `${whole} ${fractionPart}` : fractionPart;
                        });
                    }
                };

                /**
                 * Recipe information parser
                 */
                const RecipeInfoParser = {
                    /**
                     * Parses recipe information from the content string.
                     * @param {string} content - The content string to parse.
                     * @returns {Object|null} An object containing recipe info, or null if not found or invalid.
                     */
                    parse: function(content) {
                        const match = content.match(/^\[(.+?)\]/);
                        if (!match) return null;
                    
                        const info = {};
                        const pairs = match[1].split(',').map(s => s.trim());
                        let isCard = false;
                    
                        pairs.forEach(pair => {
                            if (pair.toLowerCase() === 'card') {
                                isCard = true;
                            } else {
                                const [key, ...valueParts] = pair.split('=').map(s => s.trim());
                                const value = valueParts.join('=');
                    
                                if (key === 'chip') {
                                    info.chip = value; // Store the entire chip string
                                } else {
                                    info[key] = value;
                                }
                            }
                        });
                    
                        // Only return the info object if 'card' is present
                        return isCard ? info : null;
                    }
                };

                /**
                 * Recipe card renderer
                 */
                const RecipeCardRenderer = {
                    /**
                     * Renders a recipe card HTML from recipe information.
                     * @param {Object} info - The recipe information object.
                     * @returns {string} HTML string for the recipe card.
                     */
                    render: function(info) {
                        const defaultColor = '#ff8b25';
                        let colors = info.color ? info.color.split('+') : [defaultColor];
                        
                        const gradientString = ColorUtils.generateGradient(colors);
                        const primaryColor = ColorUtils.getValidColor(colors[0]);
                        const textColor = ColorUtils.getTextColor(primaryColor);
                    
                        const styles = this.generateStyles(primaryColor, gradientString, textColor);
                    
                        let html = `<div style="${styles.main}">`;
                    
                        if (info.title) {
                            html += `<h2 style="${styles.title}">${info.title}</h2>`;
                        }
                    
                        html += `<div style="${styles.details}">`;
                        html += this.renderServings(info, styles);
                        html += this.renderOtherInfo(info, styles);
                        html += '</div>';
                    
                        if (info.chip) {
                            html += this.renderChips(info.chip, styles);
                        }
                    
                        html += '</div>';
                        return html;
                    },

                    /**
                     * Generates styles for the recipe card.
                     * @param {string} primaryColor - The primary color for the card.
                     * @param {string} gradientString - The gradient string for the border.
                     * @param {string} textColor - The text color for chips.
                     * @returns {Object} An object containing style strings.
                     */
                    generateStyles: function(primaryColor, gradientString, textColor) {
                        return {
                            main: `
                                background-color: transparent;
                                border: 6px solid;
                                border-image: ${gradientString} 1;
                                border-radius: 8px;
                                padding: 20px;
                                margin-bottom: 20px;
                                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                                display: inline-block;
                                max-width: 100%;
                            `,
                            title: 'font-size: 32px; border-bottom: none; margin-top: -5px; margin-bottom: 5px;',
                            label: `color: ${primaryColor}; font-weight: bold; margin-right: 10px;`,
                            details: 'display: flex; flex-wrap: wrap; gap: 12px;',
                            pair: 'white-space: nowrap; display: inline-block; margin-left: 5px; margin-right: 5px;',
                            chip: `
                                display: inline-block;
                                background-color: ${primaryColor};
                                padding: 2px 8px;
                                border-radius: 12px;
                                margin: 5px;
                                font-size: 0.9em;
                            `,
                            chipText: `
                                color: ${textColor};
                                font-weight: bold;
                            `
                        };
                    },

                    /**
                     * Renders the servings information.
                     * @param {Object} info - The recipe information object.
                     * @param {Object} styles - The styles object.
                     * @returns {string} HTML string for servings information.
                     */
                    renderServings: function(info, styles) {
                        let html = '';
                        if (info.original) {
                            if (info.scaled && info.original !== info.scaled) {
                                html += `<span style="${styles.pair}"><span style="${styles.label}">originally served</span>${info.original}</span>`;
                                html += `<span style="${styles.pair}"><span style="${styles.label}">scaled to serve</span>${info.scaled}</span>`;
                            } else {
                                html += `<span style="${styles.pair}"><span style="${styles.label}">servings</span>${info.original}</span>`;
                            }
                        }
                        return html;
                    },

                    /**
                     * Renders other recipe information.
                     * @param {Object} info - The recipe information object.
                     * @param {Object} styles - The styles object.
                     * @returns {string} HTML string for other recipe information.
                     */
                    renderOtherInfo: function(info, styles) {
                        let html = '';
                        for (const [key, value] of Object.entries(info)) {
                            if (!['original', 'scaled', 'title', 'color', 'chip'].includes(key)) {
                                html += `<span style="${styles.pair}"><span style="${styles.label}">${key}</span>${value}</span>`;
                            }
                        }
                        return html;
                    },

                    /**
                     * Renders recipe chips.
                     * @param {string} chipString - The chip string from recipe info.
                     * @param {Object} styles - The styles object.
                     * @returns {string} HTML string for recipe chips.
                     */
                    renderChips: function(chipString, styles) {
                        let html = `<div style="margin-top: 10px;">`;
                        chipString.split('+').forEach(chip => {
                            html += `
                                <span style="${styles.chip}">
                                    <span style="${styles.chipText}">${chip.trim()}</span>
                                </span>
                            `;
                        });
                        html += '</div>';
                        return html;
                    }
                };

                /**
                 * Content processor for recipe scaling and formatting
                 */
                const ContentProcessor = {
                    /**
                     * Processes the content of a recipe, scaling amounts and converting fractions.
                     * @param {string} content - The original content to process.
                     * @returns {string} The processed content.
                     */
                    process: function(content) {
                        return this.handleScaledAmounts(content);
                    },

                    /**
                     * Handles scaled amounts in curly braces and angle brackets.
                     * @param {string} content - The content to process.
                     * @returns {string} The content with handled scaled amounts.
                     */
                    handleScaledAmounts: function(content) {
                        // Handle scaled amounts in curly braces
                        content = content.replace(/\{(\d+(?:\.\d+)?)(?:,\s*(\d+(?:\.\d+)?))?\}/g, (match, original, scaled) => {
                            return scaled || original;
                        });

                        // Handle scaled amounts in angle brackets, including fraction conversion
                        content = content.replace(/<([\d\s¼½¾⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞\/\-]+)(?:,\s*([\d\s¼½¾⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞\/\-]+))?\s*>/g, (match, original, scaled) => {
                            let result = scaled || original;
                            return FractionUtils.convertFractionsToUnicode(result);
                        });

                        return content;
                    }
                };

                /**
                 * Custom renderer for Markdown text tokens
                 * @param {Array} tokens - The array of tokens
                 * @param {number} idx - The index of the current token
                 * @param {Object} options - Rendering options
                 * @param {Object} env - The environment
                 * @param {Object} self - The renderer itself
                 * @returns {string} The rendered HTML
                 */
                markdownIt.renderer.rules.text = function(tokens, idx, options, env, self) {
                    if (idx === 0) {
                        const recipeInfo = RecipeInfoParser.parse(tokens[idx].content);
                        if (recipeInfo) {
                            const originalMarkdown = tokens[idx].content.match(/^\[.+?\]/)[0];
                            tokens[idx].content = tokens[idx].content.replace(/^\[.+?\]/, '');
                            
                            const renderedHtml = RecipeCardRenderer.render(recipeInfo);
                            
                            return `<div class="joplin-editable">
                                <pre class="joplin-source" data-joplin-language="json" data-joplin-source-open="[" data-joplin-source-close="]">${markdownIt.utils.escapeHtml(originalMarkdown.slice(1, -1))}</pre>
                                ${renderedHtml}
                            </div>` + defaultRender(tokens, idx, options, env, self);
                        }
                    }
                
                    let content = tokens[idx].content;
                    let processedContent = ContentProcessor.process(content);
                
                    if (processedContent !== content) {
                        return `<span class="joplin-editable"><span class="joplin-source" data-joplin-language="markdown" data-joplin-source-open="" data-joplin-source-close="">${markdownIt.utils.escapeHtml(content)}</span>${processedContent}</span>`;
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