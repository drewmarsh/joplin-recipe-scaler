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

                markdownIt.renderer.rules.text = function(tokens, idx, options, env, self) {
                    tokens[idx].content = tokens[idx].content.replace(/^\{\s*original\s*=\s*(\d+(?:\.\d+)?)\s*(?:,\s*scaled\s*=\s*(\d+(?:\.\d+)?))?\s*\}/, (match, originalAmount, scaledAmount) => {
                        if (scaledAmount && parseFloat(scaledAmount) !== parseFloat(originalAmount)) {
                            return `This recipe originally made ${originalAmount} serving(s) but has been scaled to make ${scaledAmount} serving(s)`;
                        } else {
                            return `Makes ${originalAmount} serving(s)`;
                        }
                    });
                
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