(() => {
const GENERIC_ERROR = 'Something went wrong. Please try again.';
const EMPTY_VALUE = '—';
const DELETE_CONFIRM = 'Delete this media item?';
const DELETE_ALL_CONFIRM = 'Delete all loaded media?';
const NO_COMPLETED_DOWNLOAD = 'No completed media to download.';
const DOWNLOAD_FILE_GAP_MS = 400;
const DOWNLOAD_MEDIA_GAP_MS = 400;
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
  const mediaFilesTemplate = root.dataset.mediaFilesTemplate;
  const mediaDownloadTemplate = root.dataset.mediaDownloadTemplate;
  const mediaDeleteTemplate = root.dataset.mediaDeleteTemplate;
  const mediaThumbnailTemplate = root.dataset.mediaThumbnailTemplate;
  const pageLimit = Number(root.dataset.pageLimit) || 20;
  const statusCompleted = root.dataset.statusCompleted || 'completed';

  const tableBodyElement = document.getElementById('downloads-table-body');
  const listElement = document.getElementById('downloads-list');
  const resultsElement = document.getElementById('downloads-results');
  const statusElement = document.getElementById('downloads-status');
  const errorElement = document.getElementById('downloads-error');
  const reloadButton = document.getElementById('downloads-reload');
  const downloadAllButton = document.getElementById('downloads-download-all');
  const deleteAllButton = document.getElementById('downloads-delete-all');
  const infoDialog = document.getElementById('downloads-info-dialog');
  const infoUrlElement = document.getElementById('downloads-info-url');
  const infoFileNamesElement = document.getElementById('downloads-info-file-names');
  const infoCreatedElement = document.getElementById('downloads-info-created');
  const infoCloseButton = document.getElementById('downloads-info-close');
  const filterInputs = [
    document.getElementById('filter-status-pending'),
    document.getElementById('filter-status-downloading'),
    document.getElementById('filter-status-completed'),
    document.getElementById('filter-status-failed'),
  ].filter(Boolean);

  let startIndex = 0;
  let loading = false;
  let exhausted = false;
  let infoRequestId = 0;
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

  function loadedItems() {
    return Array.from(itemsById.values());
  }

  function nearBottom() {
    const doc = document.documentElement;
    return window.innerHeight + window.scrollY >= doc.scrollHeight - SCROLL_NEAR_BOTTOM_PX;
  }

  function updateBulkButtons() {
    const items = loadedItems();
    const hasItems = items.length > 0;
    const hasCompleted = items.some((item) => item.status === statusCompleted);

    if (downloadAllButton) {
      downloadAllButton.disabled = loading || !hasCompleted
        || !mediaFilesTemplate
        || !mediaDownloadTemplate;
    }
    if (deleteAllButton) {
      deleteAllButton.disabled = loading || !hasItems || !mediaDeleteTemplate;
    }
  }

  function setBusy(isBusy) {
    loading = isBusy;
    if (reloadButton) {
      reloadButton.disabled = isBusy;
    }
    filterInputs.forEach((input) => {
      input.disabled = isBusy;
    });
    resultsElement?.querySelectorAll('[data-media-action]').forEach((button) => {
      button.disabled = isBusy;
    });
    updateBulkButtons();
  }

  async function readJson(response) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  function updateLoadedStatus() {
    if (!statusElement) {
      return;
    }
    const count = itemsById.size;
    if (count === 0) {
      statusElement.textContent = '';
      return;
    }
    statusElement.textContent = `${count} media item${count === 1 ? '' : 's'} loaded`;
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
      && Boolean(mediaFilesTemplate)
      && Boolean(mediaDownloadTemplate);
    if (canDownload) {
      buttons.push(
        `<button type="button" class="btn btn-outline btn-xs" data-media-action="download" data-media-id="${mediaId}">Download</button>`,
      );
    }

    if (!buttons.length) {
      return EMPTY_VALUE;
    }

    return `<div class="flex flex-wrap gap-2">${buttons.join('')}</div>`;
  }

  function thumbnailMarkup(item) {
    const mediaId = Number(item.id);
    const canPreview = item.status === statusCompleted
      && mediaThumbnailTemplate
      && Number.isInteger(mediaId)
      && mediaId >= 1;

    if (!canPreview) {
      return '<div class="h-16 w-16 rounded bg-base-300/60" aria-hidden="true"></div>';
    }

    const src = buildIdUrl(mediaThumbnailTemplate, mediaId);
    return `<img
      src="${escapeHtml(src)}"
      alt=""
      loading="lazy"
      width="64"
      height="64"
      class="h-16 w-16 rounded object-cover bg-base-300/60"
      onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'h-16 w-16 rounded bg-base-300/60'}))"
    >`;
  }

  function clearRows() {
    itemsById.clear();
    if (tableBodyElement) {
      tableBodyElement.innerHTML = '';
    }
    if (listElement) {
      listElement.innerHTML = '';
    }
  }

  function showEmptyRows() {
    if (tableBodyElement) {
      tableBodyElement.innerHTML =
        '<tr><td colspan="4" class="text-center text-base-content/65 py-4">No media found.</td></tr>';
    }
    if (listElement) {
      listElement.innerHTML =
        '<li class="text-sm text-base-content/65">No media found.</li>';
    }
  }

  function appendItemRows(items) {
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
      const preview = thumbnailMarkup(item);

      if (tableBodyElement) {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td class="w-20">${preview}</td>
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
          <div class="flex items-start gap-3">
            <div class="shrink-0">${preview}</div>
            <div class="min-w-0 flex-1">
              <div class="font-medium">${escapeHtml(sourceLabel)}</div>
              <div class="text-sm">${escapeHtml(statusLabel)}</div>
              ${errorNote}
            </div>
          </div>
          <div class="mt-1">${actions}</div>
        `;
        listElement.appendChild(li);
      }
    }
  }

  function renderRows(items, { append = false } = {}) {
    if (!append) {
      clearRows();
    }

    if (!items.length) {
      if (!append) {
        showEmptyRows();
      }
      return;
    }

    appendItemRows(items);
  }

  function wait(ms) {
    return new Promise((resolve) => {
      window.setTimeout(resolve, ms);
    });
  }

  function renderFileNames(files) {
    if (!infoFileNamesElement) {
      return;
    }

    const names = Array.isArray(files) && files.length
      ? files.map((file) => displayValue(file?.original_file_name))
      : [EMPTY_VALUE];

    infoFileNamesElement.innerHTML = names
      .map((name) => `<li class="break-all">${escapeHtml(name)}</li>`)
      .join('');
  }

  function saveName(file) {
    const raw = typeof file?.original_file_name === 'string'
      ? file.original_file_name.trim()
      : '';
    const base = raw.split(/[/\\]/).pop();
    if (base) {
      return base;
    }
    return `file-${file?.id || 'download'}`;
  }

  async function readMediaFiles(mediaId, { emptyWhenIncomplete = false } = {}) {
    const response = await fetch(buildIdUrl(mediaFilesTemplate, mediaId), {
      credentials: 'same-origin',
    });
    const body = await readJson(response);

    if (response.status === 401) {
      window.location.href = '/home/login';
      const error = new Error('not authenticated');
      error.status = 401;
      throw error;
    }

    if (response.status === 409 && emptyWhenIncomplete) {
      return [];
    }

    if (!response.ok) {
      const error = new Error(body?.error || GENERIC_ERROR);
      error.status = response.status;
      throw error;
    }

    return Array.isArray(body?.files) ? body.files : [];
  }

  async function saveDownloadedFile(file) {
    const response = await fetch(buildIdUrl(mediaDownloadTemplate, file.id), {
      credentials: 'same-origin',
    });

    if (response.status === 401) {
      window.location.href = '/home/login';
      return false;
    }

    if (!response.ok) {
      const body = await readJson(response);
      throw new Error(body?.error || GENERIC_ERROR);
    }

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = saveName(file);
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    return true;
  }

  async function openInfoDialog(item) {
    if (!infoDialog || !item) {
      return;
    }

    const requestId = infoRequestId + 1;
    infoRequestId = requestId;

    if (infoUrlElement) {
      infoUrlElement.textContent = displayValue(item.url);
    }
    if (infoFileNamesElement) {
      infoFileNamesElement.innerHTML = `<li class="break-all">${escapeHtml('Loading…')}</li>`;
    }
    if (infoCreatedElement) {
      infoCreatedElement.textContent = formatDate(item.created_at);
    }

    infoDialog.showModal();

    const mediaId = Number(item.id);
    if (!mediaFilesTemplate || !Number.isInteger(mediaId) || mediaId < 1) {
      return;
    }

    try {
      const files = await readMediaFiles(mediaId, { emptyWhenIncomplete: true });
      if (requestId !== infoRequestId || !infoDialog.open) {
        return;
      }
      renderFileNames(files);
    } catch (error) {
      if (requestId !== infoRequestId || error?.status === 401) {
        return;
      }
      renderFileNames([]);
      showError(errorElement, error.message || GENERIC_ERROR);
    }
  }

  async function downloadMediaFilesById(mediaId) {
    if (!mediaFilesTemplate || !mediaDownloadTemplate || !Number.isInteger(mediaId) || mediaId < 1) {
      return true;
    }

    const files = await readMediaFiles(mediaId);
    if (!files.length) {
      throw new Error('No files to download.');
    }

    for (let index = 0; index < files.length; index += 1) {
      const saved = await saveDownloadedFile(files[index]);
      if (!saved) {
        return false;
      }
      if (index < files.length - 1) {
        await wait(DOWNLOAD_FILE_GAP_MS);
      }
    }

    return true;
  }

  async function downloadMediaFiles(mediaId) {
    if (!mediaFilesTemplate || !mediaDownloadTemplate || !Number.isInteger(mediaId) || mediaId < 1) {
      return;
    }

    hideError(errorElement);
    setBusy(true);

    try {
      await downloadMediaFilesById(mediaId);
    } catch (error) {
      if (error?.status === 401) {
        return;
      }
      showError(errorElement, error.message || GENERIC_ERROR);
    } finally {
      setBusy(false);
    }
  }

  async function downloadAllCurrentPage() {
    if (loading) {
      return;
    }

    const mediaIds = loadedItems()
      .filter((item) => item.status === statusCompleted)
      .map((item) => Number(item.id))
      .filter((mediaId) => Number.isInteger(mediaId) && mediaId >= 1);

    if (!mediaIds.length) {
      showError(errorElement, NO_COMPLETED_DOWNLOAD);
      return;
    }

    hideError(errorElement);
    setBusy(true);

    try {
      for (let index = 0; index < mediaIds.length; index += 1) {
        try {
          const continued = await downloadMediaFilesById(mediaIds[index]);
          if (!continued) {
            return;
          }
        } catch (error) {
          if (error?.status === 401) {
            return;
          }
          showError(errorElement, error.message || GENERIC_ERROR);
        }

        if (index < mediaIds.length - 1) {
          await wait(DOWNLOAD_MEDIA_GAP_MS);
        }
      }
    } finally {
      setBusy(false);
    }
  }

  function closeInfoDialog() {
    if (!infoDialog?.open) {
      return;
    }
    infoDialog.close();
  }

  async function loadDownloads({ reset = false } = {}) {
    if (loading) {
      return;
    }
    if (!reset && exhausted) {
      return;
    }

    const statuses = selectedStatuses();
    hideError(errorElement);

    if (!statuses.length) {
      startIndex = 0;
      exhausted = true;
      clearRows();
      if (statusElement) {
        statusElement.textContent = 'Select at least one status.';
      }
      updateBulkButtons();
      return;
    }

    if (reset) {
      startIndex = 0;
      exhausted = false;
      clearRows();
    }

    const requestStartIndex = startIndex;
    const append = !reset && itemsById.size > 0;
    setBusy(true);

    if (statusElement) {
      statusElement.textContent = reset || !append
        ? 'Loading media…'
        : 'Loading more…';
    }

    try {
      const params = new URLSearchParams();
      params.set('start_index', String(requestStartIndex));
      params.set('status', statuses.join(','));

      const response = await fetch(`${mediaEndpoint}?${params.toString()}`, {
        credentials: 'same-origin',
      });
      const body = await readJson(response);
      if (!response.ok) {
        throw new Error(body?.error || GENERIC_ERROR);
      }

      const items = Array.isArray(body?.download_media) ? body.download_media : [];
      renderRows(items, { append });
      startIndex = requestStartIndex + items.length;
      exhausted = items.length < pageLimit;
      updateLoadedStatus();
      if (items.length === 0 && itemsById.size === 0 && statusElement) {
        statusElement.textContent = 'No media found.';
      }
      updateBulkButtons();
    } catch (error) {
      if (!append) {
        clearRows();
        showEmptyRows();
      }
      if (statusElement) {
        statusElement.textContent = 'Could not load media.';
      }
      showError(errorElement, error.message || GENERIC_ERROR);
      updateBulkButtons();
    } finally {
      setBusy(false);
    }
  }

  async function deleteMediaById(mediaId) {
    if (!mediaDeleteTemplate || !Number.isInteger(mediaId) || mediaId < 1) {
      return { ok: true };
    }

    const response = await fetch(buildIdUrl(mediaDeleteTemplate, mediaId), {
      method: 'DELETE',
      credentials: 'same-origin',
    });
    const body = await readJson(response);

    if (response.status === 401) {
      window.location.href = '/home/login';
      return { ok: false, unauthorized: true };
    }

    if (!response.ok) {
      const error = new Error(body?.error || GENERIC_ERROR);
      error.status = response.status;
      throw error;
    }

    return { ok: true };
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

    let shouldReload = false;

    try {
      const result = await deleteMediaById(mediaId);
      if (result.unauthorized) {
        return;
      }

      shouldReload = true;
    } catch (error) {
      showError(errorElement, error.message || GENERIC_ERROR);
    } finally {
      setBusy(false);
    }

    if (shouldReload) {
      await loadDownloads({ reset: true });
    }
  }

  async function deleteAllCurrentPage() {
    if (loading) {
      return;
    }

    const mediaIds = loadedItems()
      .map((item) => Number(item.id))
      .filter((mediaId) => Number.isInteger(mediaId) && mediaId >= 1);

    if (!mediaIds.length) {
      return;
    }

    if (!window.confirm(DELETE_ALL_CONFIRM)) {
      return;
    }

    hideError(errorElement);
    setBusy(true);
    let shouldReload = false;

    try {
      for (const mediaId of mediaIds) {
        try {
          const result = await deleteMediaById(mediaId);
          if (result.unauthorized) {
            return;
          }
          shouldReload = true;
        } catch (error) {
          showError(errorElement, error.message || GENERIC_ERROR);
        }
      }
    } catch (error) {
      showError(errorElement, error.message || GENERIC_ERROR);
    } finally {
      setBusy(false);
    }

    if (shouldReload) {
      await loadDownloads({ reset: true });
    }
  }

  function onScroll() {
    if (loading || exhausted) {
      return;
    }
    if (nearBottom()) {
      loadDownloads({ reset: false });
    }
  }

  reloadButton?.addEventListener('click', () => {
    loadDownloads({ reset: true });
  });

  downloadAllButton?.addEventListener('click', () => {
    downloadAllCurrentPage();
  });

  deleteAllButton?.addEventListener('click', () => {
    deleteAllCurrentPage();
  });

  filterInputs.forEach((input) => {
    input.addEventListener('change', () => {
      loadDownloads({ reset: true });
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

    if (action === 'download') {
      downloadMediaFiles(mediaId);
      return;
    }

    if (action === 'delete') {
      deleteMedia(mediaId, button);
    }
  });

  window.addEventListener('scroll', onScroll, { passive: true });
  loadDownloads({ reset: true });
}

const root = document.getElementById('downloads-page');
if (root) {
  createDownloadsPage(root);
}
})();
