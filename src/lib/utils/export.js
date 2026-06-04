/**
 * Export engine: transforms token sets into various output formats.
 * Inspired by Style Dictionary architecture.
 */
import { resolveToken, buildTokenMap } from './aliases.js';
import { applyModifier } from './color.js';

/** Resolve a token's display value given active sets */
function resolveValue(token, tokenMap) {
  const raw = token.value?.value ?? token.value;
  if (typeof raw === 'string' && raw.startsWith('{')) {
    const { value } = resolveToken(token.name, tokenMap);
    const modifier = token.metadata?.modifier;
    return modifier ? applyModifier(value ?? raw, modifier) : (value ?? raw);
  }
  const modifier = token.metadata?.modifier;
  return modifier ? applyModifier(raw, modifier) : raw;
}

/** CSS custom properties output with theme scoping */
export function toCssVariables(tokenSets, activeSetIds, themeName = 'root') {
  const tokenMap = buildTokenMap(tokenSets, activeSetIds);
  const lines = [];

  for (const setId of activeSetIds) {
    const set = tokenSets.find(s => s.id === setId);
    if (!set?.tokens) continue;
    for (const token of set.tokens) {
      const cssName = `--${token.name.replace(/\./g, '-')}`;
      const value = resolveValue(token, tokenMap);
      lines.push(`  ${cssName}: ${value};`);
    }
  }

  return `:${themeName} {\n${lines.join('\n')}\n}`;
}

/** Tailwind CSS config object */
export function toTailwindConfig(tokenSets, activeSetIds) {
  const tokenMap = buildTokenMap(tokenSets, activeSetIds);
  const result = { colors: {}, spacing: {}, fontSize: {}, borderRadius: {}, boxShadow: {} };

  for (const setId of activeSetIds) {
    const set = tokenSets.find(s => s.id === setId);
    if (!set?.tokens) continue;
    for (const token of set.tokens) {
      const value = resolveValue(token, tokenMap);
      const parts = token.name.split('-');

      if (token.type === 'color') {
        const group = parts.slice(1, -1).join('-') || 'default';
        const shade = parts[parts.length - 1];
        if (!result.colors[group]) result.colors[group] = {};
        result.colors[group][shade] = value;
      } else if (token.type === 'spacing') {
        result.spacing[token.name] = value;
      } else if (token.type === 'typography') {
        result.fontSize[token.name] = value;
      } else if (token.type === 'border') {
        result.borderRadius[token.name] = value;
      } else if (token.type === 'shadow') {
        result.boxShadow[token.name] = value;
      }
    }
  }

  return `module.exports = {\n  theme: {\n    extend: ${JSON.stringify(result, null, 4)}\n  }\n}`;
}

/** Swift iOS color definitions */
export function toSwift(tokenSets, activeSetIds) {
  const tokenMap = buildTokenMap(tokenSets, activeSetIds);
  const lines = ['import UIKit', '', 'extension UIColor {'];

  for (const setId of activeSetIds) {
    const set = tokenSets.find(s => s.id === setId);
    if (!set?.tokens) continue;
    for (const token of set.tokens.filter(t => t.type === 'color')) {
      const value = resolveValue(token, tokenMap);
      const swiftName = token.name.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      const hex = value?.replace('#', '');
      if (hex?.length === 6) {
        const r = parseInt(hex.slice(0, 2), 16) / 255;
        const g = parseInt(hex.slice(2, 4), 16) / 255;
        const b = parseInt(hex.slice(4, 6), 16) / 255;
        lines.push(`  static let ${swiftName} = UIColor(red: ${r.toFixed(3)}, green: ${g.toFixed(3)}, blue: ${b.toFixed(3)}, alpha: 1)`);
      }
    }
  }

  lines.push('}');
  return lines.join('\n');
}

/** Android XML color resources */
export function toAndroidXml(tokenSets, activeSetIds) {
  const tokenMap = buildTokenMap(tokenSets, activeSetIds);
  const lines = ['<?xml version="1.0" encoding="utf-8"?>', '<resources>'];

  for (const setId of activeSetIds) {
    const set = tokenSets.find(s => s.id === setId);
    if (!set?.tokens) continue;
    for (const token of set.tokens.filter(t => t.type === 'color')) {
      const value = resolveValue(token, tokenMap);
      const xmlName = token.name.replace(/-/g, '_');
      lines.push(`  <color name="${xmlName}">${value}</color>`);
    }
  }

  lines.push('</resources>');
  return lines.join('\n');
}

/** W3C Design Token Community Group JSON format */
export function toW3cJson(tokenSets, activeSetIds) {
  const result = {};
  const tokenMap = buildTokenMap(tokenSets, activeSetIds);

  for (const setId of activeSetIds) {
    const set = tokenSets.find(s => s.id === setId);
    if (!set?.tokens) continue;
    for (const token of set.tokens) {
      const parts = token.name.split('-');
      let obj = result;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!obj[parts[i]]) obj[parts[i]] = {};
        obj = obj[parts[i]];
      }
      const last = parts[parts.length - 1];
      const raw = token.value?.value ?? token.value;
      obj[last] = {
        $value: raw,
        $type: token.type,
        $description: token.description
      };
    }
  }

  return JSON.stringify(result, null, 2);
}
