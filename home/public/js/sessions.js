(() => {
const GENERIC_ERROR = 'Something went wrong. Please try again.';
const UNKNOWN_DEVICE = 'Unknown device';
const EMPTY_VALUE = '—';
const CURRENT_BADGE = 'This device';
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
  const logoutOthersButton = document.getElementById('logout-others-button');

  let startIndex = 0;
  let loading = false;
  let exhausted = false;

  function hasRenderedSessions() {
    return Boolean(tableBodyElement?.children.length || listElement?.children.length);
  }

  function nearBottom() {
    const doc = document.documentElement;
    return window.innerHeight + window.scrollY >= doc.scrollHeight - SCROLL_NEAR_BOTTOM_PX;
  }

  function setLoading(isLoading) {
    loading = isLoading;
    if (logoutOthersButton) {
      logoutOthersButton.disabled = isLoading;
    }
    resultsElement?.querySelectorAll('[data-logout-session-id]').forEach((button) => {
      button.disabled = isLoading;
    });
  }

  function iconLabel(name, label) {
    if (window.MdIcons?.labeled) {
      return window.MdIcons.labeled(name, label);
    }

    return label;
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
      : `<button type="button" class="btn btn-outline btn-error btn-sm gap-1.5" data-logout-session-id="${escapeHtml(session.id)}">${iconLabel('sign-out', 'Sign out')}</button>`;

    return { device, ip, createdAt, lastSeenAt, badge, action };
  }

  function clearSessions() {
    if (tableBodyElement) {
      tableBodyElement.innerHTML = '';
    }
    if (listElement) {
      listElement.innerHTML = '';
    }
  }

  function renderSessions(sessions, { append = false } = {}) {
    if (!tableBodyElement && !listElement) {
      return;
    }

    if (!append) {
      clearSessions();
    }

    if (!sessions.length) {
      if (!append && statusElement) {
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
        <li class="md-surface p-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
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

  async function loadSessions({ reset = false } = {}) {
    if (loading) {
      return;
    }
    if (!reset && exhausted) {
      return;
    }

    hideError(errorElement);

    if (reset) {
      startIndex = 0;
      exhausted = false;
      clearSessions();
    }

    const requestStartIndex = startIndex;
    setLoading(true);

    if (statusElement) {
      statusElement.textContent = reset || !hasRenderedSessions()
        ? 'Loading sessions…'
        : 'Loading more…';
    }

    try {
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

      const sessions = Array.isArray(payload?.sessions) ? payload.sessions : [];
      renderSessions(sessions, { append: !reset && hasRenderedSessions() });
      startIndex = requestStartIndex + sessions.length;
      exhausted = sessions.length < pageLimit;

      if (statusElement && sessions.length === 0 && !hasRenderedSessions()) {
        statusElement.textContent = 'No active sessions found.';
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

  async function logoutSession(sessionId, button) {
    hideError(errorElement);
    setLoading(true);
    if (button) {
      button.disabled = true;
    }

    let shouldReload = false;

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
      await loadSessions({ reset: true });
    }
  }

  async function logoutOthers() {
    hideError(errorElement);
    setLoading(true);

    let shouldReload = false;

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
      await loadSessions({ reset: true });
    }
  }

  function onScroll() {
    if (loading || exhausted) {
      return;
    }
    if (nearBottom()) {
      loadSessions({ reset: false });
    }
  }

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

  window.addEventListener('scroll', onScroll, { passive: true });
  loadSessions({ reset: true });
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
