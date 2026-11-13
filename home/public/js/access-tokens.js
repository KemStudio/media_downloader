(() => {
const GENERIC_ERROR = 'Something went wrong. Please try again.';
const EMPTY_VALUE = '—';
const SCROLL_NEAR_BOTTOM_PX = 240;

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function showError(element, message) {
  if (!element) {
    return;
  }

  element.textContent = message;
  element.classList.remove('hidden');
}

function hideError(element) {
  if (!element) {
    return;
  }

  element.textContent = '';
  element.classList.add('hidden');
}

function formatDate(value) {
  if (!value) {
    return EMPTY_VALUE;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return EMPTY_VALUE;
  }

  return date.toLocaleString();
}

function displayValue(value) {
  if (value === null || value === undefined || String(value).trim() === '') {
    return EMPTY_VALUE;
  }

  return String(value);
}

function buildIdUrl(template, tokenId) {
  return template.replace(':id', encodeURIComponent(tokenId));
}

function createAccessTokensPage(root) {
  const accessTokensEndpoint = root.dataset.accessTokensEndpoint;
  const stateTemplate = root.dataset.stateTemplate;
  const deleteTemplate = root.dataset.deleteTemplate;
  const pageLimit = Number(root.dataset.pageLimit) || 20;
  const canCreate = root.dataset.canCreate === '1';
  const stateActive = root.dataset.stateActive;
  const stateDeactive = root.dataset.stateDeactive;
  const stateHide = root.dataset.stateHide;

  const resultsElement = document.getElementById('access-tokens-results');
  const tableBodyElement = document.getElementById('access-tokens-table-body');
  const listElement = document.getElementById('access-tokens-list');
  const statusElement = document.getElementById('access-tokens-status');
  const errorElement = document.getElementById('access-tokens-error');
  const openCreateButton = document.getElementById('access-token-open-create');
  const createDialog = document.getElementById('access-token-create-dialog');
  const createStep = document.getElementById('access-token-create-step');
  const createdStep = document.getElementById('access-token-created-step');
  const createForm = document.getElementById('access-token-create-form');
  const createErrorElement = document.getElementById('access-token-create-error');
  const nameInput = document.getElementById('access-token-name');
  const createButton = document.getElementById('access-token-create-button');
  const createCancelButton = document.getElementById('access-token-create-cancel');
  const createdValue = document.getElementById('access-token-created-value');
  const copyButton = document.getElementById('access-token-copy-button');
  const dismissButton = document.getElementById('access-token-dismiss-button');
  const filterInputs = [
    document.getElementById('filter-state-active'),
    document.getElementById('filter-state-deactive'),
    document.getElementById('filter-state-hide'),
  ].filter(Boolean);

  let startIndex = 0;
  let loading = false;
  let exhausted = false;

  function selectedStates() {
    return filterInputs
      .filter((input) => input.checked)
      .map((input) => input.value);
  }

  function hasRenderedTokens() {
    return Boolean(tableBodyElement?.children.length || listElement?.children.length);
  }

  function nearBottom() {
    const doc = document.documentElement;
    return window.innerHeight + window.scrollY >= doc.scrollHeight - SCROLL_NEAR_BOTTOM_PX;
  }

  function setLoading(isLoading) {
    loading = isLoading;
    filterInputs.forEach((input) => {
      input.disabled = isLoading;
    });
    if (openCreateButton) {
      openCreateButton.disabled = isLoading || !canCreate;
    }
    if (createButton) {
      createButton.disabled = isLoading;
    }
    if (nameInput) {
      nameInput.disabled = isLoading;
    }
    if (createCancelButton) {
      createCancelButton.disabled = isLoading;
    }
    resultsElement?.querySelectorAll('[data-token-action]').forEach((button) => {
      button.disabled = isLoading;
    });
  }

  function canChangeState(token) {
    return token.state !== stateHide;
  }

  function iconLabel(name, label) {
    if (window.MdIcons?.labeled) {
      return window.MdIcons.labeled(name, label);
    }

    return label;
  }

  function showCreateStep() {
    createStep?.classList.remove('hidden');
    createStep?.classList.add('flex');
    createdStep?.classList.add('hidden');
    createdStep?.classList.remove('flex');
    if (createdValue) {
      createdValue.textContent = '';
    }
    if (copyButton) {
      copyButton.textContent = 'Copy';
    }
    hideError(createErrorElement);
  }

  function showCreatedStep(token) {
    createStep?.classList.add('hidden');
    createStep?.classList.remove('flex');
    createdStep?.classList.remove('hidden');
    createdStep?.classList.add('flex');
    if (createdValue) {
      createdValue.textContent = token;
    }
  }

  function openCreateDialog() {
    if (!canCreate || !createDialog) {
      showError(errorElement, 'Only active accounts can create access tokens.');
      return;
    }

    hideError(errorElement);
    showCreateStep();
    if (nameInput) {
      nameInput.value = '';
    }
    createDialog.showModal();
    nameInput?.focus();
  }

  function closeCreateDialog() {
    if (!createDialog?.open) {
      return;
    }

    createDialog.close();
    showCreateStep();
    if (nameInput) {
      nameInput.value = '';
    }
  }

  function actionButtons(token) {
    const buttons = [];
    const tokenId = escapeHtml(token.id);

    if (canChangeState(token)) {
      if (token.state === stateActive) {
        buttons.push(
          `<button type="button" class="btn btn-outline btn-sm gap-1.5" data-token-action="state" data-token-id="${tokenId}" data-next-state="${escapeHtml(stateDeactive)}">${iconLabel('pause-circle', 'Deactive')}</button>`,
        );
      }

      if (token.state === stateDeactive) {
        buttons.push(
          `<button type="button" class="btn btn-outline btn-sm gap-1.5" data-token-action="state" data-token-id="${tokenId}" data-next-state="${escapeHtml(stateActive)}">${iconLabel('check-circle', 'Active')}</button>`,
        );
      }

      buttons.push(
        `<button type="button" class="btn btn-outline btn-warning btn-sm gap-1.5" data-token-action="state" data-token-id="${tokenId}" data-next-state="${escapeHtml(stateHide)}">${iconLabel('eye-slash', 'Hide')}</button>`,
      );
    }

    if (token.state === stateHide) {
      buttons.push(
        `<button type="button" class="btn btn-outline btn-error btn-sm gap-1.5" data-token-action="delete" data-token-id="${tokenId}">${iconLabel('trash', 'Delete')}</button>`,
      );
    }

    if (!buttons.length) {
      return EMPTY_VALUE;
    }

    return `<div class="flex flex-wrap gap-2">${buttons.join('')}</div>`;
  }

  function clearTokens() {
    if (tableBodyElement) {
      tableBodyElement.innerHTML = '';
    }
    if (listElement) {
      listElement.innerHTML = '';
    }
  }

  function renderTokens(tokens, { append = false } = {}) {
    if (!tableBodyElement && !listElement) {
      return;
    }

    if (!append) {
      clearTokens();
    }

    if (!tokens.length) {
      if (!append && statusElement) {
        statusElement.textContent = 'No access tokens found.';
      }
      return;
    }

    if (statusElement) {
      statusElement.textContent = '';
    }

    const rows = [];
    const cards = [];

    for (const token of tokens) {
      const name = escapeHtml(displayValue(token.name));
      const prefix = escapeHtml(displayValue(token.token_prefix));
      const state = escapeHtml(displayValue(token.state));
      const updatedAt = escapeHtml(formatDate(token.updated_at));
      const actions = actionButtons(token);

      rows.push(`
        <tr>
          <td class="font-medium break-all">${name}</td>
          <td><code class="text-xs">${prefix}</code></td>
          <td>${state}</td>
          <td>${updatedAt}</td>
          <td>${actions}</td>
        </tr>
      `);

      cards.push(`
        <li class="md-surface p-4 flex flex-col gap-3">
          <div class="flex flex-col gap-1 min-w-0">
            <p class="font-semibold break-all">${name}</p>
            <p class="text-sm opacity-70">Prefix: <code class="text-xs">${prefix}</code></p>
            <p class="text-sm opacity-70">State: ${state}</p>
            <p class="text-sm opacity-70">Updated: ${updatedAt}</p>
          </div>
          <div class="flex-none">${actions}</div>
        </li>
      `);
    }

    if (tableBodyElement) {
      if (append) {
        tableBodyElement.insertAdjacentHTML('beforeend', rows.join(''));
      } else {
        tableBodyElement.innerHTML = rows.join('');
      }
    }
    if (listElement) {
      if (append) {
        listElement.insertAdjacentHTML('beforeend', cards.join(''));
      } else {
        listElement.innerHTML = cards.join('');
      }
    }
  }

  async function loadAccessTokens({ reset = false } = {}) {
    if (loading) {
      return;
    }
    if (!reset && exhausted) {
      return;
    }

    const states = selectedStates();

    hideError(errorElement);

    if (!states.length) {
      startIndex = 0;
      exhausted = true;
      clearTokens();
      if (statusElement) {
        statusElement.textContent = 'Select at least one state to load access tokens.';
      }
      return;
    }

    if (reset) {
      startIndex = 0;
      exhausted = false;
      clearTokens();
    }

    const requestStartIndex = startIndex;
    setLoading(true);

    if (statusElement) {
      statusElement.textContent = reset || !hasRenderedTokens()
        ? 'Loading access tokens…'
        : 'Loading more…';
    }

    try {
      const url = new URL(accessTokensEndpoint, window.location.origin);
      url.searchParams.set('start_index', String(requestStartIndex));
      url.searchParams.set('state', states.join(','));

      const response = await fetch(url, {
        method: 'GET',
        credentials: 'same-origin',
      });

      let payload = null;
      try {
        payload = await response.json();
      } catch {
        payload = null;
      }

      if (response.status === 401) {
        window.location.href = '/home/login';
        return;
      }

      if (!response.ok) {
        showError(errorElement, payload?.error || GENERIC_ERROR);
        if (statusElement) {
          statusElement.textContent = '';
        }
        return;
      }

      const tokens = Array.isArray(payload?.access_tokens) ? payload.access_tokens : [];
      renderTokens(tokens, { append: !reset && hasRenderedTokens() });
      startIndex = requestStartIndex + tokens.length;
      exhausted = tokens.length < pageLimit;

      if (statusElement && tokens.length === 0 && !hasRenderedTokens()) {
        statusElement.textContent = 'No access tokens found.';
      } else if (statusElement) {
        statusElement.textContent = '';
      }
    } catch {
      showError(errorElement, GENERIC_ERROR);
      if (statusElement) {
        statusElement.textContent = '';
      }
    } finally {
      setLoading(false);
    }
  }

  async function createAccessToken(event) {
    event.preventDefault();
    hideError(createErrorElement);
    hideError(errorElement);

    if (!canCreate) {
      showError(createErrorElement, 'Only active accounts can create access tokens.');
      return;
    }

    const name = nameInput?.value?.trim() || '';
    if (!name) {
      showError(createErrorElement, 'name is required');
      return;
    }

    setLoading(true);
    let shouldReload = false;

    try {
      const response = await fetch(accessTokensEndpoint, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      });

      let payload = null;
      try {
        payload = await response.json();
      } catch {
        payload = null;
      }

      if (response.status === 401) {
        window.location.href = '/home/login';
        return;
      }

      if (!response.ok) {
        showError(createErrorElement, payload?.error || GENERIC_ERROR);
        return;
      }

      if (nameInput) {
        nameInput.value = '';
      }

      if (payload?.token) {
        showCreatedStep(payload.token);
      } else {
        closeCreateDialog();
      }

      shouldReload = true;
    } catch {
      showError(createErrorElement, GENERIC_ERROR);
    } finally {
      setLoading(false);
    }

    if (shouldReload) {
      await loadAccessTokens({ reset: true });
    }
  }

  async function updateAccessTokenState(tokenId, nextState, button) {
    hideError(errorElement);
    setLoading(true);
    if (button) {
      button.disabled = true;
    }

    let shouldReload = false;

    try {
      const response = await fetch(buildIdUrl(stateTemplate, tokenId), {
        method: 'PATCH',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ state: nextState }),
      });

      let payload = null;
      try {
        payload = await response.json();
      } catch {
        payload = null;
      }

      if (response.status === 401) {
        window.location.href = '/home/login';
        return;
      }

      if (!response.ok) {
        showError(errorElement, payload?.error || GENERIC_ERROR);
        return;
      }

      shouldReload = true;
    } catch {
      showError(errorElement, GENERIC_ERROR);
    } finally {
      setLoading(false);
    }

    if (shouldReload) {
      await loadAccessTokens({ reset: true });
    }
  }

  async function deleteAccessToken(tokenId, button) {
    hideError(errorElement);
    setLoading(true);
    if (button) {
      button.disabled = true;
    }

    let shouldReload = false;

    try {
      const response = await fetch(buildIdUrl(deleteTemplate, tokenId), {
        method: 'DELETE',
        credentials: 'same-origin',
      });

      let payload = null;
      try {
        payload = await response.json();
      } catch {
        payload = null;
      }

      if (response.status === 401) {
        window.location.href = '/home/login';
        return;
      }

      if (!response.ok) {
        showError(errorElement, payload?.error || GENERIC_ERROR);
        return;
      }

      shouldReload = true;
    } catch {
      showError(errorElement, GENERIC_ERROR);
    } finally {
      setLoading(false);
    }

    if (shouldReload) {
      await loadAccessTokens({ reset: true });
    }
  }

  function onScroll() {
    if (loading || exhausted) {
      return;
    }
    if (nearBottom()) {
      loadAccessTokens({ reset: false });
    }
  }

  openCreateButton?.addEventListener('click', () => {
    if (loading) {
      return;
    }
    openCreateDialog();
  });

  createCancelButton?.addEventListener('click', () => {
    if (loading) {
      return;
    }
    closeCreateDialog();
  });

  createDialog?.addEventListener('cancel', (event) => {
    if (loading) {
      event.preventDefault();
      return;
    }
    showCreateStep();
    if (nameInput) {
      nameInput.value = '';
    }
  });

  createForm?.addEventListener('submit', createAccessToken);

  copyButton?.addEventListener('click', async () => {
    const value = createdValue?.textContent || '';
    if (!value) {
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      copyButton.textContent = 'Copied';
      window.setTimeout(() => {
        copyButton.textContent = 'Copy';
      }, 1500);
    } catch {
      showError(createErrorElement, 'Could not copy token to clipboard.');
    }
  });

  dismissButton?.addEventListener('click', () => {
    closeCreateDialog();
  });

  filterInputs.forEach((input) => {
    input.addEventListener('change', () => {
      if (loading) {
        return;
      }
      loadAccessTokens({ reset: true });
    });
  });

  resultsElement?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-token-action]');
    if (!button || loading) {
      return;
    }

    const tokenId = button.getAttribute('data-token-id');
    const action = button.getAttribute('data-token-action');
    if (!tokenId || !action) {
      return;
    }

    if (action === 'state') {
      const nextState = button.getAttribute('data-next-state');
      if (!nextState) {
        return;
      }
      updateAccessTokenState(tokenId, nextState, button);
      return;
    }

    if (action === 'delete') {
      deleteAccessToken(tokenId, button);
    }
  });

  window.addEventListener('scroll', onScroll, { passive: true });
  loadAccessTokens({ reset: true });
}

function initAccessTokens() {
  const root = document.getElementById('access-tokens-page');
  if (!root) {
    return;
  }

  createAccessTokensPage(root);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAccessTokens);
} else {
  initAccessTokens();
}
})();
