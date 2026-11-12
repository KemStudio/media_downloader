(() => {
const GENERIC_ERROR = 'Something went wrong. Please try again.';
const EMPTY_VALUE = '—';
const ROLE_ROOT = 'root';
const ROLE_ADMIN = 'admin';

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
  const deleteTemplate = root.dataset.deleteTemplate;
  const pageLimit = Number(root.dataset.pageLimit) || 20;
  const viewerRole = root.dataset.viewerRole || '';
  const canDelete = root.dataset.canDelete === '1';
  const stateActive = root.dataset.stateActive;
  const stateDeactive = root.dataset.stateDeactive;
  const stateHide = root.dataset.stateHide;

  const resultsElement = document.getElementById('accounts-results');
  const tableBodyElement = document.getElementById('accounts-table-body');
  const listElement = document.getElementById('accounts-list');
  const statusElement = document.getElementById('accounts-status');
  const errorElement = document.getElementById('accounts-error');
  const pageInfoElement = document.getElementById('accounts-page-info');
  const prevButton = document.getElementById('accounts-prev');
  const nextButton = document.getElementById('accounts-next');
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

  function hasRenderedAccounts() {
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

  function iconLabel(name, label) {
    if (window.MdIcons?.labeled) {
      return window.MdIcons.labeled(name, label);
    }

    return label;
  }

  function actionButtons(account) {
    const buttons = [];
    const accountId = escapeHtml(account.id);

    if (canChangeState(account)) {
      if (account.state === stateActive) {
        buttons.push(
          `<button type="button" class="btn btn-outline btn-sm gap-1.5" data-account-action="state" data-account-id="${accountId}" data-next-state="${escapeHtml(stateDeactive)}">${iconLabel('pause-circle', 'Deactive')}</button>`,
        );
      }

      if (account.state === stateDeactive) {
        buttons.push(
          `<button type="button" class="btn btn-outline btn-sm gap-1.5" data-account-action="state" data-account-id="${accountId}" data-next-state="${escapeHtml(stateActive)}">${iconLabel('check-circle', 'Active')}</button>`,
        );
      }

      buttons.push(
        `<button type="button" class="btn btn-outline btn-warning btn-sm gap-1.5" data-account-action="state" data-account-id="${accountId}" data-next-state="${escapeHtml(stateHide)}">${iconLabel('eye-slash', 'Hide')}</button>`,
      );
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

  function renderAccounts(accounts) {
    if (!tableBodyElement && !listElement) {
      return;
    }

    if (!accounts.length) {
      if (tableBodyElement) {
        tableBodyElement.innerHTML = '';
      }
      if (listElement) {
        listElement.innerHTML = '';
      }
      if (statusElement) {
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

  async function loadAccounts(nextStartIndex = startIndex) {
    const states = selectedStates();

    hideError(errorElement);

    if (!states.length) {
      startIndex = 0;
      total = 0;
      renderAccounts([]);
      if (statusElement) {
        statusElement.textContent = 'Select at least one state to load accounts.';
      }
      updatePagination();
      return;
    }

    setLoading(true);

    if (statusElement && !hasRenderedAccounts()) {
      statusElement.textContent = 'Loading accounts…';
    }

    let requestStartIndex = nextStartIndex;

    try {
      while (true) {
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
          window.location.href = '/login';
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

        startIndex = payload.start_index ?? requestStartIndex;
        total = payload.total ?? 0;

        if (startIndex > 0 && startIndex >= total) {
          requestStartIndex = Math.max(0, Math.floor((total - 1) / pageLimit) * pageLimit);
          continue;
        }

        renderAccounts(payload.accounts || []);
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

  async function updateAccountState(accountId, nextState, button) {
    hideError(errorElement);
    setLoading(true);
    if (button) {
      button.disabled = true;
    }

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
        window.location.href = '/login';
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

      await loadAccounts(startIndex);
    } catch {
      showError(errorElement, GENERIC_ERROR);
    } finally {
      setLoading(false);
      updatePagination();
    }
  }

  async function deleteAccount(accountId, button) {
    hideError(errorElement);
    setLoading(true);
    if (button) {
      button.disabled = true;
    }

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
        window.location.href = '/login';
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

      await loadAccounts(startIndex);
    } catch {
      showError(errorElement, GENERIC_ERROR);
    } finally {
      setLoading(false);
      updatePagination();
    }
  }

  prevButton?.addEventListener('click', () => {
    if (loading || startIndex <= 0) {
      return;
    }
    loadAccounts(Math.max(0, startIndex - pageLimit));
  });

  nextButton?.addEventListener('click', () => {
    if (loading || startIndex + pageLimit >= total) {
      return;
    }
    loadAccounts(startIndex + pageLimit);
  });

  filterInputs.forEach((input) => {
    input.addEventListener('change', () => {
      if (loading) {
        return;
      }
      loadAccounts(0);
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

    if (action === 'delete') {
      deleteAccount(accountId, button);
    }
  });

  loadAccounts(0);
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
