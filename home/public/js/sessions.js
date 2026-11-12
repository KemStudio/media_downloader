(() => {
const GENERIC_ERROR = 'Something went wrong. Please try again.';
const UNKNOWN_DEVICE = 'Unknown device';
const EMPTY_VALUE = '—';
const CURRENT_BADGE = 'Thiết bị này';

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

function deviceLabel(userAgent) {
  if (!userAgent || !String(userAgent).trim()) {
    return UNKNOWN_DEVICE;
  }

  return String(userAgent).trim();
}

function displayValue(value) {
  if (value === null || value === undefined || String(value).trim() === '') {
    return EMPTY_VALUE;
  }

  return String(value);
}

function buildLogoutUrl(template, sessionId) {
  return template.replace(':id', encodeURIComponent(sessionId));
}

function createSessionsPage(root) {
  const sessionsEndpoint = root.dataset.sessionsEndpoint;
  const logoutTemplate = root.dataset.logoutTemplate;
  const logoutOthersEndpoint = root.dataset.logoutOthersEndpoint;
  const pageLimit = Number(root.dataset.pageLimit) || 20;

  const resultsElement = document.getElementById('sessions-results');
  const tableBodyElement = document.getElementById('sessions-table-body');
  const listElement = document.getElementById('sessions-list');
  const statusElement = document.getElementById('sessions-status');
  const errorElement = document.getElementById('sessions-error');
  const pageInfoElement = document.getElementById('sessions-page-info');
  const prevButton = document.getElementById('sessions-prev');
  const nextButton = document.getElementById('sessions-next');
  const logoutOthersButton = document.getElementById('logout-others-button');

  let startIndex = 0;
  let total = 0;
  let loading = false;

  function hasRenderedSessions() {
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
    if (logoutOthersButton) {
      logoutOthersButton.disabled = isLoading;
    }
    resultsElement?.querySelectorAll('[data-logout-session-id]').forEach((button) => {
      button.disabled = isLoading;
    });
  }

  function sessionDisplayParts(session) {
    const device = escapeHtml(deviceLabel(session.userAgent));
    const ip = escapeHtml(displayValue(session.ip));
    const createdAt = escapeHtml(formatDate(session.createdAt));
    const lastSeenAt = escapeHtml(formatDate(session.lastSeenAt));
    const badge = session.isCurrent
      ? `<span class="badge badge-primary badge-sm">${CURRENT_BADGE}</span>`
      : '';
    const action = session.isCurrent
      ? ''
      : `<button type="button" class="btn btn-outline btn-error btn-sm" data-logout-session-id="${escapeHtml(session.id)}">Logout</button>`;

    return { device, ip, createdAt, lastSeenAt, badge, action };
  }

  function renderSessions(sessions) {
    if (!tableBodyElement && !listElement) {
      return;
    }

    if (!sessions.length) {
      if (tableBodyElement) {
        tableBodyElement.innerHTML = '';
      }
      if (listElement) {
        listElement.innerHTML = '';
      }
      if (statusElement) {
        statusElement.textContent = 'No active sessions found.';
      }
      return;
    }

    if (statusElement) {
      statusElement.textContent = '';
    }

    const rows = [];
    const cards = [];

    for (const session of sessions) {
      const { device, ip, createdAt, lastSeenAt, badge, action } = sessionDisplayParts(session);

      rows.push(`
        <tr>
          <td>
            <div class="flex flex-wrap items-center gap-2 min-w-0">
              <span class="font-medium break-all">${device}</span>
              ${badge}
            </div>
          </td>
          <td>${ip}</td>
          <td>${createdAt}</td>
          <td>${lastSeenAt}</td>
          <td>${action || EMPTY_VALUE}</td>
        </tr>
      `);

      cards.push(`
        <li class="bg-base-100 rounded-box p-4 shadow-sm flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div class="flex flex-col gap-1 min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <p class="font-semibold break-all">${device}</p>
              ${badge}
            </div>
            <p class="text-sm opacity-70">IP: ${ip}</p>
            <p class="text-sm opacity-70">Created: ${createdAt}</p>
            <p class="text-sm opacity-70">Last seen: ${lastSeenAt}</p>
          </div>
          <div class="flex-none">${action}</div>
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

  async function loadSessions(nextStartIndex = startIndex) {
    hideError(errorElement);
    setLoading(true);

    if (statusElement && !hasRenderedSessions()) {
      statusElement.textContent = 'Loading sessions…';
    }

    let requestStartIndex = nextStartIndex;

    try {
      while (true) {
        const url = new URL(sessionsEndpoint, window.location.origin);
        url.searchParams.set('start_index', String(requestStartIndex));

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

        renderSessions(payload.sessions || []);
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

  async function logoutSession(sessionId, button) {
    hideError(errorElement);
    setLoading(true);
    if (button) {
      button.disabled = true;
    }

    try {
      const response = await fetch(buildLogoutUrl(logoutTemplate, sessionId), {
        method: 'POST',
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

      await loadSessions(startIndex);
    } catch {
      showError(errorElement, GENERIC_ERROR);
    } finally {
      setLoading(false);
      updatePagination();
    }
  }

  async function logoutOthers() {
    hideError(errorElement);
    setLoading(true);

    try {
      const response = await fetch(logoutOthersEndpoint, {
        method: 'POST',
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

      await loadSessions(0);
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
    loadSessions(Math.max(0, startIndex - pageLimit));
  });

  nextButton?.addEventListener('click', () => {
    if (loading || startIndex + pageLimit >= total) {
      return;
    }
    loadSessions(startIndex + pageLimit);
  });

  logoutOthersButton?.addEventListener('click', () => {
    if (loading) {
      return;
    }
    logoutOthers();
  });

  resultsElement?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-logout-session-id]');
    if (!button || loading) {
      return;
    }

    const sessionId = button.getAttribute('data-logout-session-id');
    if (!sessionId) {
      return;
    }

    logoutSession(sessionId, button);
  });

  loadSessions(0);
}

function initSessions() {
  const root = document.getElementById('sessions-page');
  if (!root) {
    return;
  }

  createSessionsPage(root);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSessions);
} else {
  initSessions();
}
})();
