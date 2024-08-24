module.exports = {
    default: function(context) {
        return {
            plugin: function(markdownIt, _options) {
                const defaultRender = markdownIt.renderer.rules.text || function(tokens, idx, options, env, self) {
                    return self.renderToken(tokens, idx, options);
                };

                markdownIt.renderer.rules.text = function(tokens, idx, options, env, self) {
                    // Remove the curly braces and keep only the scaled amount
                    tokens[idx].content = tokens[idx].content.replace(/\{(\d+(?:\.\d+)?),(\d+(?:\.\d+)?)\}/g, (match, originalAmount, scaledAmount) => {
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