module.exports = {
    default: function(context) {
        return {
            plugin: function(markdownIt, _options) {
                const defaultRender = markdownIt.renderer.rules.text || function(tokens, idx, options, env, self) {
                    return self.renderToken(tokens, idx, options);
                };

                markdownIt.renderer.rules.text = function(tokens, idx, options, env, self) {
                    // Handle the new format for the scale factor line
                    tokens[idx].content = tokens[idx].content.replace(/\{\s*original\s*=\s*(\d+(?:\.\d+)?)\s*,\s*scaled\s*=\s*(\d+(?:\.\d+)?)\s*\}/, (match, originalAmount, scaledAmount) => {
                        
                        if (scaledAmount != originalAmount) { return `This recipe originally made ${originalAmount} serving(s) but has been scaled to make ${scaledAmount} serving(s)`; }
                        else { return `Makes ${originalAmount} serving(s)`; }
                    });

                    // Handle ingredient amounts
                    tokens[idx].content = tokens[idx].content.replace(/\{\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*\}/g, (match, originalAmount, scaledAmount) => {
                        return `${scaledAmount}`; // Replace with only the scaled amount
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