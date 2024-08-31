/**
 * Determines the appropriate font color (black or white) based on the background color.
 * @param bgColor - The background color in hex format (e.g., "#RRGGBB")
 * @returns "#000" for black or "#fff" for white
 */
export function setFontColor(bgColor: string): string {
    let r = parseInt(bgColor.substring(1, 3), 16);
    let g = parseInt(bgColor.substring(3, 5), 16);
    let b = parseInt(bgColor.substring(5, 7), 16);

    const bgDelta = (r * 0.299) + (g * 0.587) + (b * 0.114);
    return (255 - bgDelta < 105) ? "#000" : "#fff";
}

/**
 * Validates and returns a proper color value.
 * @param color - Color string to validate.
 * @returns Valid color string.
 */
export function getValidColor(color: string): string {
    const colorMap: {[key: string]: string} = {
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