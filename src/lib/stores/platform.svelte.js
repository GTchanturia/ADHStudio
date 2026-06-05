/**
 * Central reactive state for the Design Token Management Platform.
 * Uses Svelte 5 runes via .svelte.js module.
 */
import { supabase } from '../utils/supabase.js';
import { buildTokenMap, validateAliases } from '../utils/aliases.js';

// ─── App State ────────────────────────────────────────────────────────────────

export const appState = $state({
  project: null,
  organization: null,
  tokenSets: [],
  activeSetIds: [],
  themes: [],
  activeThemeId: null,
  selectedTokenId: null,
  selectedSetId: null,
  inspectorOpen: true,
  exportPanelOpen: false,
  livePreviewOpen: false,
  searchQuery: '',
  filterType: 'all',
  filterLayer: 'all',
  isLoading: false,
  isSaving: false,
  notification: null
});

// ─── Derived state (exported as getter functions per Svelte 5 module rules) ───

export function tokenMap() {
  return buildTokenMap(appState.tokenSets, appState.activeSetIds);
}

export function allTokens() {
  return appState.tokenSets
    .filter(s => appState.activeSetIds.includes(s.id))
    .flatMap(s => s.tokens ?? []);
}

export function filteredTokens() {
  let tokens = allTokens();
  if (appState.filterType !== 'all') {
    tokens = tokens.filter(t => t.type === appState.filterType);
  }
  if (appState.filterLayer !== 'all') {
    tokens = tokens.filter(t => t.layer === appState.filterLayer);
  }
  if (appState.searchQuery) {
    const q = appState.searchQuery.toLowerCase();
    tokens = tokens.filter(t =>
      t.name.toLowerCase().includes(q) ||
      t.description?.toLowerCase().includes(q) ||
      String(t.value?.value ?? t.value ?? '').toLowerCase().includes(q)
    );
  }
  return tokens;
}

export function selectedToken() {
  if (!appState.selectedTokenId) return null;
  return allTokens().find(t => t.id === appState.selectedTokenId) ?? null;
}

export function aliasErrors() {
  return validateAliases(tokenMap());
}

// ─── Actions ─────────────────────────────────────────────────────────────────

export async function loadProject(projectId) {
  appState.isLoading = true;
  try {
    const [{ data: project }, { data: tokenSets }, { data: themes }] = await Promise.all([
      supabase.from('projects').select('*, organizations(*)').eq('id', projectId).maybeSingle(),
      supabase.from('token_sets').select('*, tokens(*)').eq('project_id', projectId).order('order_index'),
      supabase.from('themes').select('*').eq('project_id', projectId)
    ]);

    appState.project = project;
    appState.organization = project?.organizations ?? null;
    appState.tokenSets = tokenSets ?? [];
    appState.themes = themes ?? [];
    appState.activeSetIds = tokenSets?.map(s => s.id) ?? [];
    if (themes?.[0]) appState.activeThemeId = themes[0].id;
  } finally {
    appState.isLoading = false;
  }
}

export async function createTokenSet(name, projectId) {
  const { data, error } = await supabase
    .from('token_sets')
    .insert({ name, project_id: projectId, order_index: appState.tokenSets.length })
    .select('*, tokens(*)')
    .single();

  if (error) { notify(error.message, 'error'); throw error; }
  appState.tokenSets = [...appState.tokenSets, data];
  appState.activeSetIds = [...appState.activeSetIds, data.id];
  notify('Token set created');
  return data;
}

export async function deleteTokenSet(setId) {
  const { error } = await supabase.from('token_sets').delete().eq('id', setId);
  if (error) { notify(error.message, 'error'); throw error; }
  appState.tokenSets = appState.tokenSets.filter(s => s.id !== setId);
  appState.activeSetIds = appState.activeSetIds.filter(id => id !== setId);
  if (appState.selectedSetId === setId) appState.selectedSetId = null;
  notify('Token set deleted', 'info');
}

export async function renameTokenSet(setId, newName) {
  const { data, error } = await supabase
    .from('token_sets')
    .update({ name: newName, updated_at: new Date().toISOString() })
    .eq('id', setId)
    .select('*, tokens(*)')
    .single();
  if (error) { notify(error.message, 'error'); throw error; }
  appState.tokenSets = appState.tokenSets.map(s => s.id === setId ? data : s);
  notify('Token set renamed');
}

export async function createToken(tokenData) {
  const { data, error } = await supabase
    .from('tokens')
    .insert(tokenData)
    .select('*')
    .single();

  if (error) { notify(error.message, 'error'); throw error; }

  appState.tokenSets = appState.tokenSets.map(s =>
    s.id === tokenData.token_set_id
      ? { ...s, tokens: [...(s.tokens ?? []), data] }
      : s
  );

  notify('Token created');
  return data;
}

export async function bulkCreateTokens(tokenDataArray) {
  const { data, error } = await supabase
    .from('tokens')
    .insert(tokenDataArray)
    .select('*');

  if (error) { notify(error.message, 'error'); throw error; }

  // Group returned tokens by set and update state
  const bySet = new Map();
  for (const t of (data ?? [])) {
    if (!bySet.has(t.token_set_id)) bySet.set(t.token_set_id, []);
    bySet.get(t.token_set_id).push(t);
  }

  appState.tokenSets = appState.tokenSets.map(s => {
    const newTokens = bySet.get(s.id);
    return newTokens
      ? { ...s, tokens: [...(s.tokens ?? []), ...newTokens] }
      : s;
  });

  notify(`${data?.length ?? 0} tokens imported`);
  return data;
}

export async function updateToken(tokenId, updates) {
  const { data, error } = await supabase
    .from('tokens')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', tokenId)
    .select('*')
    .single();

  if (error) { notify(error.message, 'error'); throw error; }

  appState.tokenSets = appState.tokenSets.map(s => ({
    ...s,
    tokens: s.tokens?.map(t => t.id === tokenId ? data : t) ?? []
  }));

  notify('Token updated');
  return data;
}

export async function deleteToken(tokenId) {
  const { error } = await supabase.from('tokens').delete().eq('id', tokenId);
  if (error) { notify(error.message, 'error'); throw error; }
  appState.tokenSets = appState.tokenSets.map(s => ({
    ...s,
    tokens: s.tokens?.filter(t => t.id !== tokenId) ?? []
  }));
  if (appState.selectedTokenId === tokenId) appState.selectedTokenId = null;
  notify('Token deleted', 'info');
}

// ─── Theme CRUD ────────────────────────────────────────────────────────────────

export async function createTheme(projectId, name) {
  const { data, error } = await supabase
    .from('themes')
    .insert({ project_id: projectId, name, token_set_ids: [...appState.activeSetIds] })
    .select()
    .single();

  if (error) { notify(error.message, 'error'); throw error; }
  appState.themes = [...appState.themes, data];
  appState.activeThemeId = data.id;
  notify('Theme created');
  return data;
}

export async function updateTheme(themeId, updates) {
  const { data, error } = await supabase
    .from('themes')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', themeId)
    .select()
    .single();

  if (error) { notify(error.message, 'error'); throw error; }
  appState.themes = appState.themes.map(t => t.id === themeId ? data : t);
  notify('Theme updated');
  return data;
}

export async function deleteTheme(themeId) {
  const { error } = await supabase.from('themes').delete().eq('id', themeId);
  if (error) { notify(error.message, 'error'); throw error; }
  appState.themes = appState.themes.filter(t => t.id !== themeId);
  if (appState.activeThemeId === themeId) {
    appState.activeThemeId = appState.themes[0]?.id ?? null;
  }
  notify('Theme deleted', 'info');
}

export async function saveCurrentTheme() {
  if (!appState.activeThemeId) return;
  return updateTheme(appState.activeThemeId, { token_set_ids: [...appState.activeSetIds] });
}

// ─── UI Actions ───────────────────────────────────────────────────────────────

export function selectToken(tokenId) {
  appState.selectedTokenId = tokenId;
  if (!appState.inspectorOpen) appState.inspectorOpen = true;
}

export function toggleSetActive(setId) {
  if (appState.activeSetIds.includes(setId)) {
    appState.activeSetIds = appState.activeSetIds.filter(id => id !== setId);
  } else {
    appState.activeSetIds = [...appState.activeSetIds, setId];
  }
}

export function applyTheme(themeId) {
  const theme = appState.themes.find(t => t.id === themeId);
  if (!theme) return;
  appState.activeThemeId = themeId;
  appState.activeSetIds = [...(theme.token_set_ids ?? [])];
}

export function clearFilters() {
  appState.searchQuery = '';
  appState.filterType = 'all';
  appState.filterLayer = 'all';
}

export function notify(message, type = 'success') {
  appState.notification = { message, type };
  setTimeout(() => { appState.notification = null; }, 3000);
}
