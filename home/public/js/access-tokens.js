(() => {
const GENERIC_ERROR = 'Something went wrong. Please try again.';
const EMPTY_VALUE = '—';

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
  const pageInfoElement = document.getElementById('access-tokens-page-info');
  const prevButton = document.getElementById('access-tokens-prev');
  const nextButton = document.getElementById('access-tokens-next');
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
  let total = 0;
  let loading = false;

  function selectedStates() {
    return filterInputs
      .filter((input) => input.checked)
      .map((input) => input.value);
  }

  function hasRenderedTokens() {
    return Boolean(tableBodyElement?.children.length || listElement?.children.length);
  }

  function setLoading(isLoading) {
    loading = isLoading;
    if (prevButton) {
      prevButton.disabled = isLoading || startIndex <= 0;
    }
    if (nextButton) {
      nextButton.disabled = isLoading || startIndex + pageLimit >= total;
    }
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

  function renderTokens(tokens) {
    if (!tableBodyElement && !listElement) {
      return;
    }

    if (!tokens.length) {
      if (tableBodyElement) {
        tableBodyElement.innerHTML = '';
      }
      if (listElement) {
        listElement.innerHTML = '';
      }
      if (statusElement) {
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
      tableBodyElement.innerHTML = rows.join('');
    }
    if (listElement) {
      listElement.innerHTML = cards.join('');
    }
  }

  function updatePagination() {
    const from = total === 0 ? 0 : startIndex + 1;
    const to = Math.min(startIndex + pageLimit, total);

    if (pageInfoElement) {
      pageInfoElement.textContent = total === 0 ? '0 of 0' : `${from}–${to} of ${total}`;
    }

    if (prevButton) {
      prevButton.disabled = loading || startIndex <= 0;
    }
    if (nextButton) {
      nextButton.disabled = loading || startIndex + pageLimit >= total;
    }
  }

  async function loadAccessTokens(nextStartIndex = startIndex) {
    const states = selectedStates();

    hideError(errorElement);

    if (!states.length) {
      startIndex = 0;
      total = 0;
      renderTokens([]);
      if (statusElement) {
        statusElement.textContent = 'Select at least one state to load access tokens.';
      }
      updatePagination();
      return;
    }

    setLoading(true);

    if (statusElement && !hasRenderedTokens()) {
      statusElement.textContent = 'Loading access tokens…';
    }

    let requestStartIndex = nextStartIndex;

    try {
      while (true) {
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
          window.location.href = '/login';
          return;
        }

        if (!response.ok) {
          showError(errorElement, payload?.error || GENERIC_ERROR);
          if (statusElement) {
            statusElement.textContent = '';
          }
          return;
        }

        startIndex = payload.start_index ?? requestStartIndex;
        total = payload.total ?? 0;

        if (startIndex > 0 && startIndex >= total) {
          requestStartIndex = Math.max(0, Math.floor((total - 1) / pageLimit) * pageLimit);
          continue;
        }

        renderTokens(payload.access_tokens || []);
        updatePagination();
        return;
      }
    } catch {
      showError(errorElement, GENERIC_ERROR);
      if (statusElement) {
        statusElement.textContent = '';
      }
    } finally {
      setLoading(false);
      updatePagination();
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
        window.location.href = '/login';
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

      await loadAccessTokens(0);
    } catch {
      showError(createErrorElement, GENERIC_ERROR);
    } finally {
      setLoading(false);
      updatePagination();
    }
  }

  async function updateAccessTokenState(tokenId, nextState, button) {
    hideError(errorElement);
    setLoading(true);
    if (button) {
      button.disabled = true;
    }

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
        window.location.href = '/login';
        return;
      }

      if (!response.ok) {
        showError(errorElement, payload?.error || GENERIC_ERROR);
        return;
      }

      await loadAccessTokens(startIndex);
    } catch {
      showError(errorElement, GENERIC_ERROR);
    } finally {
      setLoading(false);
      updatePagination();
    }
  }

  async function deleteAccessToken(tokenId, button) {
    hideError(errorElement);
    setLoading(true);
    if (button) {
      button.disabled = true;
    }

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
        window.location.href = '/login';
        return;
      }

      if (!response.ok) {
        showError(errorElement, payload?.error || GENERIC_ERROR);
        return;
      }

      await loadAccessTokens(startIndex);
    } catch {
      showError(errorElement, GENERIC_ERROR);
    } finally {
      setLoading(false);
      updatePagination();
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

  prevButton?.addEventListener('click', () => {
    if (loading || startIndex <= 0) {
      return;
    }
    loadAccessTokens(Math.max(0, startIndex - pageLimit));
  });

  nextButton?.addEventListener('click', () => {
    if (loading || startIndex + pageLimit >= total) {
      return;
    }
    loadAccessTokens(startIndex + pageLimit);
  });

  filterInputs.forEach((input) => {
    input.addEventListener('change', () => {
      if (loading) {
        return;
      }
      loadAccessTokens(0);
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

  loadAccessTokens(0);
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
