(() => {
const GENERIC_ERROR = 'Something went wrong. Please try again.';
const EMPTY_VALUE = '—';
const DELETE_CONFIRM = 'Delete this media item?';

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
  const date = new Date(value.includes('T') ? value : `${value.replace(' ', 'T')}Z`);
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

function buildIdUrl(template, id) {
  return template.replace(':id', encodeURIComponent(id));
}

function createDownloadsPage(root) {
  const mediaEndpoint = root.dataset.mediaEndpoint;
  const mediaDownloadEndpoint = root.dataset.mediaDownloadEndpoint;
  const mediaDeleteTemplate = root.dataset.mediaDeleteTemplate;
  const pageLimit = Number(root.dataset.pageLimit) || 20;
  const statusCompleted = root.dataset.statusCompleted || 'completed';

  const tableBodyElement = document.getElementById('downloads-table-body');
  const listElement = document.getElementById('downloads-list');
  const resultsElement = document.getElementById('downloads-results');
  const statusElement = document.getElementById('downloads-status');
  const errorElement = document.getElementById('downloads-error');
  const pageInfoElement = document.getElementById('downloads-page-info');
  const prevButton = document.getElementById('downloads-prev');
  const nextButton = document.getElementById('downloads-next');
  const reloadButton = document.getElementById('downloads-reload');
  const infoDialog = document.getElementById('downloads-info-dialog');
  const infoUrlElement = document.getElementById('downloads-info-url');
  const infoFileNameElement = document.getElementById('downloads-info-file-name');
  const infoCreatedElement = document.getElementById('downloads-info-created');
  const infoCloseButton = document.getElementById('downloads-info-close');
  const filterInputs = [
    document.getElementById('filter-status-pending'),
    document.getElementById('filter-status-downloading'),
    document.getElementById('filter-status-completed'),
    document.getElementById('filter-status-failed'),
  ].filter(Boolean);

  let page = 1;
  let total = 0;
  let loading = false;
  const itemsById = new Map();

  function selectedStatuses() {
    return filterInputs
      .filter((input) => input.checked)
      .map((input) => input.value);
  }

  function iconLabel(name, label) {
    if (window.MdIcons?.labeled) {
      return window.MdIcons.labeled(name, label);
    }
    return label;
  }

  function setBusy(isBusy) {
    loading = isBusy;
    if (reloadButton) {
      reloadButton.disabled = isBusy;
    }
    filterInputs.forEach((input) => {
      input.disabled = isBusy;
    });
    if (prevButton) {
      prevButton.disabled = isBusy || page <= 1;
    }
    if (nextButton) {
      nextButton.disabled = isBusy || page * pageLimit >= total;
    }
    resultsElement?.querySelectorAll('[data-media-action]').forEach((button) => {
      button.disabled = isBusy;
    });
  }

  async function readJson(response) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  function updatePagination() {
    if (pageInfoElement) {
      if (total === 0) {
        pageInfoElement.textContent = 'No media';
      } else {
        const from = (page - 1) * pageLimit + 1;
        const to = Math.min(page * pageLimit, total);
        pageInfoElement.textContent = `${from}–${to} of ${total}`;
      }
    }
    if (prevButton) {
      prevButton.disabled = loading || page <= 1;
    }
    if (nextButton) {
      nextButton.disabled = loading || page * pageLimit >= total;
    }
  }

  function actionButtons(item) {
    const mediaId = Number(item.id);
    const hasId = Number.isInteger(mediaId) && mediaId >= 1;
    const buttons = [];

    if (hasId) {
      buttons.push(
        `<button type="button" class="btn btn-outline btn-xs" data-media-action="info" data-media-id="${mediaId}">Info</button>`,
      );
      buttons.push(
        `<button type="button" class="btn btn-outline btn-error btn-xs gap-1" data-media-action="delete" data-media-id="${mediaId}">${iconLabel('trash', 'Delete')}</button>`,
      );
    }

    const canDownload = item.status === statusCompleted
      && hasId
      && Boolean(mediaDownloadEndpoint);
    if (canDownload) {
      const downloadHref = `${mediaDownloadEndpoint}/${mediaId}`;
      buttons.push(
        `<a href="${escapeHtml(downloadHref)}" class="btn btn-outline btn-xs">Download</a>`,
      );
    }

    if (!buttons.length) {
      return EMPTY_VALUE;
    }

    return `<div class="flex flex-wrap gap-2">${buttons.join('')}</div>`;
  }

  function renderRows(items) {
    itemsById.clear();
    if (tableBodyElement) {
      tableBodyElement.innerHTML = '';
    }
    if (listElement) {
      listElement.innerHTML = '';
    }

    if (!items.length) {
      if (tableBodyElement) {
        tableBodyElement.innerHTML =
          '<tr><td colspan="3" class="text-center text-base-content/65 py-4">No media found.</td></tr>';
      }
      if (listElement) {
        listElement.innerHTML =
          '<li class="text-sm text-base-content/65">No media found.</li>';
      }
      return;
    }

    for (const item of items) {
      const mediaId = Number(item.id);
      if (Number.isInteger(mediaId) && mediaId >= 1) {
        itemsById.set(mediaId, item);
      }

      const sourceLabel = `${displayValue(item.source)} / ${displayValue(item.site)}`;
      const statusLabel = displayValue(item.status);
      const errorNote = item.status === 'failed' && item.error_message
        ? `<div class="text-xs text-error mt-1">${escapeHtml(item.error_message)}</div>`
        : '';
      const actions = actionButtons(item);

      if (tableBodyElement) {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${escapeHtml(sourceLabel)}</td>
          <td>
            <div>${escapeHtml(statusLabel)}</div>
            ${errorNote}
          </td>
          <td>${actions}</td>
        `;
        tableBodyElement.appendChild(row);
      }

      if (listElement) {
        const li = document.createElement('li');
        li.className = 'md-surface p-3 flex flex-col gap-1';
        li.innerHTML = `
          <div class="font-medium">${escapeHtml(sourceLabel)}</div>
          <div class="text-sm">${escapeHtml(statusLabel)}</div>
          ${errorNote}
          <div class="mt-1">${actions}</div>
        `;
        listElement.appendChild(li);
      }
    }
  }

  function openInfoDialog(item) {
    if (!infoDialog || !item) {
      return;
    }

    if (infoUrlElement) {
      infoUrlElement.textContent = displayValue(item.url);
    }
    if (infoFileNameElement) {
      infoFileNameElement.textContent = displayValue(item.original_file_name);
    }
    if (infoCreatedElement) {
      infoCreatedElement.textContent = formatDate(item.created_at);
    }

    infoDialog.showModal();
  }

  function closeInfoDialog() {
    if (!infoDialog?.open) {
      return;
    }
    infoDialog.close();
  }

  async function loadDownloads({ keepPage = true } = {}) {
    if (loading) {
      return;
    }

    const statuses = selectedStatuses();
    if (!statuses.length) {
      hideError(errorElement);
      total = 0;
      page = 1;
      renderRows([]);
      if (statusElement) {
        statusElement.textContent = 'Select at least one status.';
      }
      updatePagination();
      return;
    }

    if (!keepPage) {
      page = 1;
    }

    setBusy(true);
    hideError(errorElement);
    if (statusElement) {
      statusElement.textContent = 'Loading media…';
    }

    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('status', statuses.join(','));

      const response = await fetch(`${mediaEndpoint}?${params.toString()}`, {
        credentials: 'same-origin',
      });
      const body = await readJson(response);
      if (!response.ok) {
        throw new Error(body?.error || GENERIC_ERROR);
      }

      const items = Array.isArray(body?.download_media) ? body.download_media : [];
      total = Number.isInteger(body?.total) ? body.total : 0;
      if (Number.isInteger(body?.page) && body.page >= 1) {
        page = body.page;
      }

      renderRows(items);
      if (statusElement) {
        statusElement.textContent = `${total} media item${total === 1 ? '' : 's'}`;
      }
      updatePagination();
    } catch (error) {
      renderRows([]);
      total = 0;
      if (statusElement) {
        statusElement.textContent = 'Could not load media.';
      }
      showError(errorElement, error.message || GENERIC_ERROR);
      updatePagination();
    } finally {
      setBusy(false);
    }
  }

  async function deleteMedia(mediaId, button) {
    if (!mediaDeleteTemplate || !Number.isInteger(mediaId) || mediaId < 1) {
      return;
    }

    if (!window.confirm(DELETE_CONFIRM)) {
      return;
    }

    hideError(errorElement);
    setBusy(true);
    if (button) {
      button.disabled = true;
    }

    try {
      const response = await fetch(buildIdUrl(mediaDeleteTemplate, mediaId), {
        method: 'DELETE',
        credentials: 'same-origin',
      });
      const body = await readJson(response);

      if (response.status === 401) {
        window.location.href = '/home/login';
        return;
      }

      if (!response.ok) {
        showError(errorElement, body?.error || GENERIC_ERROR);
        return;
      }

      setBusy(false);
      await loadDownloads();
    } catch (error) {
      showError(errorElement, error.message || GENERIC_ERROR);
    } finally {
      setBusy(false);
    }
  }

  reloadButton?.addEventListener('click', () => {
    loadDownloads();
  });

  prevButton?.addEventListener('click', () => {
    if (loading || page <= 1) {
      return;
    }
    page -= 1;
    loadDownloads();
  });

  nextButton?.addEventListener('click', () => {
    if (loading || page * pageLimit >= total) {
      return;
    }
    page += 1;
    loadDownloads();
  });

  filterInputs.forEach((input) => {
    input.addEventListener('change', () => {
      loadDownloads({ keepPage: false });
    });
  });

  infoCloseButton?.addEventListener('click', () => {
    closeInfoDialog();
  });

  infoDialog?.addEventListener('click', (event) => {
    if (event.target === infoDialog) {
      closeInfoDialog();
    }
  });

  resultsElement?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-media-action]');
    if (!button || loading) {
      return;
    }

    const mediaId = Number(button.dataset.mediaId);
    if (!Number.isInteger(mediaId) || mediaId < 1) {
      return;
    }

    const action = button.dataset.mediaAction;
    if (action === 'info') {
      openInfoDialog(itemsById.get(mediaId));
      return;
    }

    if (action === 'delete') {
      deleteMedia(mediaId, button);
    }
  });

  loadDownloads({ keepPage: false });
}

const root = document.getElementById('downloads-page');
if (root) {
  createDownloadsPage(root);
}
})();
