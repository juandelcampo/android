export function getTerrainHeight(x, z) {
    // Frecuencia exacta para que los bordes de cada baldosa de 300m encajen a la perfección
    const k = (Math.PI * 2) / 300;
    return Math.sin(x * k) * Math.cos(z * k) * 3.5 +
           Math.sin(x * 2 * k + z * 2 * k) * 2.0;
}