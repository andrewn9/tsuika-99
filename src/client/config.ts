export const boxWidth = 710;
export const boxHeight = 790;
export const appWidth = 1920
export const appHeight = 1080;

export const lerp = (a: number, b: number, t: number) => a + t * (b - a);
export const clamp = (x: number, min: number, max: number) => Math.max(min, Math.min(x, max));