(() => {
const GENERIC_ERROR = 'Something went wrong. Please try again.';
const EMPTY_VALUE = '—';
const ROLE_ROOT = 'root';
const ROLE_ADMIN = 'admin';
const ROLE_USER = 'user';
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

function buildIdUrl(template, accountId) {
  return template.replace(':id', encodeURIComponent(accountId));
}

function createAccountsPage(root) {
  const accountsEndpoint = root.dataset.accountsEndpoint;
  const stateTemplate = root.dataset.stateTemplate;
  const roleTemplate = root.dataset.roleTemplate;
  const deleteTemplate = root.dataset.deleteTemplate;
  const pageLimit = Number(root.dataset.pageLimit) || 20;
  const viewerRole = root.dataset.viewerRole || '';
  const canDelete = root.dataset.canDelete === '1';
  const canChangeRole = root.dataset.canChangeRole === '1';
  const stateActive = root.dataset.stateActive;
  const stateDeactive = root.dataset.stateDeactive;
  const stateHide = root.dataset.stateHide;
  const roleUser = root.dataset.roleUser || ROLE_USER;
  const roleAdmin = root.dataset.roleAdmin || ROLE_ADMIN;

  const resultsElement = document.getElementById('accounts-results');
  const tableBodyElement = document.getElementById('accounts-table-body');
  const listElement = document.getElementById('accounts-list');
  const statusElement = document.getElementById('accounts-status');
  const errorElement = document.getElementById('accounts-error');
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

  function hasRenderedAccounts() {
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
    resultsElement?.querySelectorAll('[data-account-action]').forEach((button) => {
      button.disabled = isLoading;
    });
  }

  function canChangeState(account) {
    if (account.state === stateHide) {
      return false;
    }

    if (viewerRole === ROLE_ADMIN && account.role === ROLE_ROOT) {
      return false;
    }

    return true;
  }

  function canDeactivateOrHide(account) {
    return canChangeState(account) && account.role === roleUser;
  }

  function iconLabel(name, label) {
    if (window.MdIcons?.labeled) {
      return window.MdIcons.labeled(name, label);
    }

    return label;
  }

  function actionButtons(account) {
    const buttons = [];
    const accountId = escapeHtml(account.id);

    if (
      canChangeRole
      && account.state === stateActive
      && account.role === roleUser
    ) {
      buttons.push(
        `<button type="button" class="btn btn-outline btn-sm gap-1.5" data-account-action="role" data-account-id="${accountId}" data-next-role="${escapeHtml(roleAdmin)}">${iconLabel('shield', 'Admin')}</button>`,
      );
    }

    if (
      canChangeRole
      && account.state === stateActive
      && account.role === roleAdmin
    ) {
      buttons.push(
        `<button type="button" class="btn btn-outline btn-sm gap-1.5" data-account-action="role" data-account-id="${accountId}" data-next-role="${escapeHtml(roleUser)}">${iconLabel('user', 'User')}</button>`,
      );
    }

    if (canChangeState(account)) {
      if (account.state === stateActive && canDeactivateOrHide(account)) {
        buttons.push(
          `<button type="button" class="btn btn-outline btn-sm gap-1.5" data-account-action="state" data-account-id="${accountId}" data-next-state="${escapeHtml(stateDeactive)}">${iconLabel('pause-circle', 'Deactive')}</button>`,
        );
      }

      if (account.state === stateDeactive) {
        buttons.push(
          `<button type="button" class="btn btn-outline btn-sm gap-1.5" data-account-action="state" data-account-id="${accountId}" data-next-state="${escapeHtml(stateActive)}">${iconLabel('check-circle', 'Active')}</button>`,
        );
      }

      if (canDeactivateOrHide(account)) {
        buttons.push(
          `<button type="button" class="btn btn-outline btn-warning btn-sm gap-1.5" data-account-action="state" data-account-id="${accountId}" data-next-state="${escapeHtml(stateHide)}">${iconLabel('eye-slash', 'Hide')}</button>`,
        );
      }
    }

    if (account.state === stateHide && canDelete) {
      buttons.push(
        `<button type="button" class="btn btn-outline btn-error btn-sm gap-1.5" data-account-action="delete" data-account-id="${accountId}">${iconLabel('trash', 'Delete')}</button>`,
      );
    }

    if (!buttons.length) {
      return EMPTY_VALUE;
    }

    return `<div class="flex flex-wrap gap-2">${buttons.join('')}</div>`;
  }

  function clearAccounts() {
    if (tableBodyElement) {
      tableBodyElement.innerHTML = '';
    }
    if (listElement) {
      listElement.innerHTML = '';
    }
  }

  function renderAccounts(accounts, { append = false } = {}) {
    if (!tableBodyElement && !listElement) {
      return;
    }

    if (!append) {
      clearAccounts();
    }

    if (!accounts.length) {
      if (!append && statusElement) {
        statusElement.textContent = 'No accounts found.';
      }
      return;
    }

    if (statusElement) {
      statusElement.textContent = '';
    }

    const rows = [];
    const cards = [];

    for (const account of accounts) {
      const username = escapeHtml(displayValue(account.username));
      const role = escapeHtml(displayValue(account.role));
      const state = escapeHtml(displayValue(account.state));
      const updatedAt = escapeHtml(formatDate(account.updated_at));
      const actions = actionButtons(account);

      rows.push(`
        <tr>
          <td class="font-medium break-all">${username}</td>
          <td>${role}</td>
          <td>${state}</td>
          <td>${updatedAt}</td>
          <td>${actions}</td>
        </tr>
      `);

      cards.push(`
        <li class="md-surface p-4 flex flex-col gap-3">
          <div class="flex flex-col gap-1 min-w-0">
            <p class="font-semibold break-all">${username}</p>
            <p class="text-sm opacity-70">Role: ${role}</p>
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

  async function loadAccounts({ reset = false } = {}) {
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
      clearAccounts();
      if (statusElement) {
        statusElement.textContent = 'Select at least one state to load accounts.';
      }
      return;
    }

    if (reset) {
      startIndex = 0;
      exhausted = false;
      clearAccounts();
    }

    const requestStartIndex = startIndex;
    setLoading(true);

    if (statusElement) {
      statusElement.textContent = reset || !hasRenderedAccounts()
        ? 'Loading accounts…'
        : 'Loading more…';
    }

    try {
      const url = new URL(accountsEndpoint, window.location.origin);
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

      if (response.status === 403) {
        window.location.href = '/';
        return;
      }

      if (!response.ok) {
        showError(errorElement, payload?.error || GENERIC_ERROR);
        if (statusElement) {
          statusElement.textContent = '';
        }
        return;
      }

      const accounts = Array.isArray(payload?.accounts) ? payload.accounts : [];
      renderAccounts(accounts, { append: !reset && hasRenderedAccounts() });
      startIndex = requestStartIndex + accounts.length;
      exhausted = accounts.length < pageLimit;

      if (statusElement && accounts.length === 0 && !hasRenderedAccounts()) {
        statusElement.textContent = 'No accounts found.';
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

  async function updateAccountState(accountId, nextState, button) {
    hideError(errorElement);
    setLoading(true);
    if (button) {
      button.disabled = true;
    }

    let shouldReload = false;

    try {
      const response = await fetch(buildIdUrl(stateTemplate, accountId), {
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

      if (response.status === 403) {
        showError(errorElement, payload?.error || 'Forbidden');
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
      await loadAccounts({ reset: true });
    }
  }

  async function updateAccountRole(accountId, nextRole, button) {
    hideError(errorElement);
    setLoading(true);
    if (button) {
      button.disabled = true;
    }

    let shouldReload = false;

    try {
      const response = await fetch(buildIdUrl(roleTemplate, accountId), {
        method: 'PATCH',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: nextRole }),
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

      if (response.status === 403) {
        showError(errorElement, payload?.error || 'Forbidden');
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
      await loadAccounts({ reset: true });
    }
  }

  async function deleteAccount(accountId, button) {
    hideError(errorElement);
    setLoading(true);
    if (button) {
      button.disabled = true;
    }

    let shouldReload = false;

    try {
      const response = await fetch(buildIdUrl(deleteTemplate, accountId), {
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

      if (response.status === 403) {
        showError(errorElement, payload?.error || 'Forbidden');
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
      await loadAccounts({ reset: true });
    }
  }

  function onScroll() {
    if (loading || exhausted) {
      return;
    }
    if (nearBottom()) {
      loadAccounts({ reset: false });
    }
  }

  filterInputs.forEach((input) => {
    input.addEventListener('change', () => {
      if (loading) {
        return;
      }
      loadAccounts({ reset: true });
    });
  });

  resultsElement?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-account-action]');
    if (!button || loading) {
      return;
    }

    const accountId = button.getAttribute('data-account-id');
    const action = button.getAttribute('data-account-action');
    if (!accountId || !action) {
      return;
    }

    if (action === 'state') {
      const nextState = button.getAttribute('data-next-state');
      if (!nextState) {
        return;
      }
      updateAccountState(accountId, nextState, button);
      return;
    }

    if (action === 'role') {
      const nextRole = button.getAttribute('data-next-role');
      if (!nextRole) {
        return;
      }
      updateAccountRole(accountId, nextRole, button);
      return;
    }

    if (action === 'delete') {
      deleteAccount(accountId, button);
    }
  });

  window.addEventListener('scroll', onScroll, { passive: true });
  loadAccounts({ reset: true });
}

function initAccounts() {
  const root = document.getElementById('accounts-page');
  if (!root) {
    return;
  }

  createAccountsPage(root);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAccounts);
} else {
  initAccounts();
}
})();
