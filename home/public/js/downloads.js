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

function createDownloadsPage(root) {
  const mediaEndpoint = root.dataset.mediaEndpoint;
  const mediaDownloadEndpoint = root.dataset.mediaDownloadEndpoint;
  const pageLimit = Number(root.dataset.pageLimit) || 20;
  const statusCompleted = root.dataset.statusCompleted || 'completed';

  const tableBodyElement = document.getElementById('downloads-table-body');
  const listElement = document.getElementById('downloads-list');
  const statusElement = document.getElementById('downloads-status');
  const errorElement = document.getElementById('downloads-error');
  const pageInfoElement = document.getElementById('downloads-page-info');
  const prevButton = document.getElementById('downloads-prev');
  const nextButton = document.getElementById('downloads-next');
  const reloadButton = document.getElementById('downloads-reload');
  const filterInputs = [
    document.getElementById('filter-status-pending'),
    document.getElementById('filter-status-downloading'),
    document.getElementById('filter-status-completed'),
    document.getElementById('filter-status-failed'),
  ].filter(Boolean);

  let page = 1;
  let total = 0;
  let loading = false;

  function selectedStatuses() {
    return filterInputs
      .filter((input) => input.checked)
      .map((input) => input.value);
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
        pageInfoElement.textContent = 'No downloads';
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

  function renderRows(items) {
    if (tableBodyElement) {
      tableBodyElement.innerHTML = '';
    }
    if (listElement) {
      listElement.innerHTML = '';
    }

    if (!items.length) {
      if (tableBodyElement) {
        tableBodyElement.innerHTML =
          '<tr><td colspan="6" class="text-center text-base-content/65 py-4">No downloads found.</td></tr>';
      }
      if (listElement) {
        listElement.innerHTML =
          '<li class="text-sm text-base-content/65">No downloads found.</li>';
      }
      return;
    }

    for (const item of items) {
      const sourceLabel = `${displayValue(item.source)} / ${displayValue(item.site)}`;
      const fileLabel = displayValue(item.original_file_name || item.disk_file_name);
      const urlLabel = displayValue(item.url);
      const statusLabel = displayValue(item.status);
      const createdLabel = formatDate(item.created_at);
      const errorNote = item.status === 'failed' && item.error_message
        ? `<div class="text-xs text-error mt-1">${escapeHtml(item.error_message)}</div>`
        : '';
      const canDownload = item.status === statusCompleted
        && Number.isInteger(item.id)
        && item.id >= 1
        && Boolean(mediaDownloadEndpoint);
      const downloadHref = canDownload
        ? `${mediaDownloadEndpoint}/${item.id}`
        : '';
      const downloadAction = canDownload
        ? `<a href="${escapeHtml(downloadHref)}" class="btn btn-outline btn-xs">Download</a>`
        : EMPTY_VALUE;

      if (tableBodyElement) {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${escapeHtml(sourceLabel)}</td>
          <td class="max-w-xs truncate" title="${escapeHtml(urlLabel)}">${escapeHtml(urlLabel)}</td>
          <td>
            <div>${escapeHtml(statusLabel)}</div>
            ${errorNote}
          </td>
          <td class="max-w-[12rem] truncate" title="${escapeHtml(fileLabel)}">${escapeHtml(fileLabel)}</td>
          <td>${escapeHtml(createdLabel)}</td>
          <td>${downloadAction}</td>
        `;
        tableBodyElement.appendChild(row);
      }

      if (listElement) {
        const li = document.createElement('li');
        li.className = 'md-surface p-3 flex flex-col gap-1';
        li.innerHTML = `
          <div class="font-medium">${escapeHtml(sourceLabel)}</div>
          <div class="text-sm break-all">${escapeHtml(urlLabel)}</div>
          <div class="text-sm">${escapeHtml(statusLabel)}</div>
          ${errorNote}
          <div class="text-sm text-base-content/65">${escapeHtml(fileLabel)}</div>
          <div class="text-xs text-base-content/65">${escapeHtml(createdLabel)}</div>
          ${canDownload ? `<div class="mt-1">${downloadAction}</div>` : ''}
        `;
        listElement.appendChild(li);
      }
    }
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
      statusElement.textContent = 'Loading downloads…';
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
        statusElement.textContent = `${total} download${total === 1 ? '' : 's'}`;
      }
      updatePagination();
    } catch (error) {
      renderRows([]);
      total = 0;
      if (statusElement) {
        statusElement.textContent = 'Could not load downloads.';
      }
      showError(errorElement, error.message || GENERIC_ERROR);
      updatePagination();
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

  loadDownloads({ keepPage: false });
}

const root = document.getElementById('downloads-page');
if (root) {
  createDownloadsPage(root);
}
})();
