module.exports = {
    default: function(context) {
        return {
            plugin: function(markdownIt, _options) {
                const defaultRender = markdownIt.renderer.rules.text || function(tokens, idx, options, env, self) {
                    return self.renderToken(tokens, idx, options);
                };

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

                function convertToUnicodeFraction(amount) {
                    return amount.replace(/(\d+)\/(\d+)/g, (match, numerator, denominator) => {
                        return textFractionToUnicode(match) || match;
                    });
                }

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

                function renderRecipeCard(info) {
                    let html = '<div class="recipe-card">';
                    
                    if (info.title) {
                        html += `<h1 class="recipe-title">${info.title}</h1>`;
                    }

                    html += '<div class="recipe-details">';
                    if (info.original) {
                        if (info.scaled && info.original !== info.scaled) {
                            html += `<span class="recipe-serving"><span class="label">originally made</span> ${info.original}</span>`;
                            html += `<span class="recipe-serving"><span class="label">scaled to make</span> ${info.scaled}</span>`;
                        } else {
                            html += `<span class="recipe-serving"><span class="label">servings</span> ${info.original}</span>`;
                        }
                    }

                    for (const [key, value] of Object.entries(info)) {
                        if (!['original', 'scaled', 'title'].includes(key)) {
                            html += `<span class="recipe-info"><span class="label">${key}</span> ${value}</span>`;
                        }
                    }

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

                    tokens[idx].content = tokens[idx].content.replace(/\{(\d+(?:\.\d+)?)(?:,\s*(\d+(?:\.\d+)?))?\}/g, (match, originalAmount, scaledAmount) => {
                        return scaledAmount || originalAmount;
                    });
                
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