export function getTerrainHeight(x, z) {
    return Math.sin(x * 0.03) * Math.cos(z * 0.03) * 2.5 +
           Math.sin(x * 0.012 + z * 0.018) * 4.0;
}