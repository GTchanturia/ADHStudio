/**
 * LCH color space utilities for maintaining perceptual uniformity
 * Uses the culori library for accurate color math
 */
import { parse, formatHex, lch, oklch, wcagContrast, clampChroma } from 'culori';

/** Convert any CSS color string to LCH object */
export function toLch(color) {
  const parsed = parse(color);
  if (!parsed) return null;
  return lch(parsed);
}

/** Convert LCH object to hex string */
export function lchToHex(lchColor) {
  try {
    const clamped = clampChroma(lchColor, 'lch');
    return formatHex(clamped);
  } catch {
    return '#000000';
  }
}

/** Apply lighten modifier using LCH space */
export function lighten(color, amount) {
  const lchColor = toLch(color);
  if (!lchColor) return color;
  return lchToHex({ ...lchColor, l: Math.min(100, lchColor.l + amount * 100) });
}

/** Apply darken modifier using LCH space */
export function darken(color, amount) {
  const lchColor = toLch(color);
  if (!lchColor) return color;
  return lchToHex({ ...lchColor, l: Math.max(0, lchColor.l - amount * 100) });
}

/** Mix two colors in LCH space */
export function mix(color1, color2, weight = 0.5) {
  const lch1 = toLch(color1);
  const lch2 = toLch(color2);
  if (!lch1 || !lch2) return color1;
  return lchToHex({
    mode: 'lch',
    l: lch1.l * (1 - weight) + lch2.l * weight,
    c: lch1.c * (1 - weight) + lch2.c * weight,
    h: lch1.h * (1 - weight) + lch2.h * weight
  });
}

/** Calculate WCAG contrast ratio between two colors */
export function getContrastRatio(color1, color2) {
  try {
    return wcagContrast(color1, color2);
  } catch {
    return 1;
  }
}

/** Check WCAG compliance levels */
export function checkWcag(fg, bg) {
  const ratio = getContrastRatio(fg, bg);
  return {
    ratio: Math.round(ratio * 100) / 100,
    aa: ratio >= 4.5,
    aaLarge: ratio >= 3,
    aaa: ratio >= 7,
    aaaLarge: ratio >= 4.5
  };
}

/** Generate a perceptually uniform color scale from a base color */
export function generateScale(baseColor, steps = 10) {
  const lchBase = toLch(baseColor);
  if (!lchBase) return [];

  return Array.from({ length: steps }, (_, i) => {
    const t = i / (steps - 1);
    const l = 98 - t * 90;
    return {
      step: (i + 1) * 100,
      hex: lchToHex({ ...lchBase, l }),
      lch: { l, c: lchBase.c, h: lchBase.h }
    };
  });
}

/** Parse LCH modifier string like "lighten(0.2)" */
export function applyModifier(color, modifier) {
  if (!modifier) return color;
  const match = modifier.match(/^(lighten|darken|mix)\(([^)]+)\)$/);
  if (!match) return color;
  const [, fn, args] = match;
  const parts = args.split(',').map(a => a.trim());
  if (fn === 'lighten') return lighten(color, parseFloat(parts[0]));
  if (fn === 'darken') return darken(color, parseFloat(parts[0]));
  if (fn === 'mix') return mix(color, parts[0], parseFloat(parts[1] ?? '0.5'));
  return color;
}
