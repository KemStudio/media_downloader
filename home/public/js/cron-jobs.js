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

function showMessage(element, message) {
  if (!element) {
    return;
  }
  element.textContent = message;
  element.classList.remove('hidden');
}

function hideMessage(element) {
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

function formatDuration(ms) {
  if (!Number.isInteger(ms) || ms < 0) {
    return EMPTY_VALUE;
  }
  if (ms < 1000) {
    return `${ms}ms`;
  }
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatSchedule(job) {
  if (job.schedule_mode === 'interval' && Number.isInteger(job.interval_ms) && job.interval_ms > 0) {
    const seconds = job.interval_ms / 1000;
    const label = Number.isInteger(seconds) ? String(seconds) : seconds.toFixed(1);
    return `Every ${label}s after each run`;
  }
  return job.cron_expression || EMPTY_VALUE;
}

function intervalSeconds(job) {
  if (!Number.isInteger(job.interval_ms) || job.interval_ms <= 0) {
    return 1;
  }
  const seconds = job.interval_ms / 1000;
  return Number.isInteger(seconds) ? seconds : Math.max(1, Math.round(seconds));
}

function mergeJobs(listJobs, lastRuns) {
  const lastByKey = {};
  for (const item of lastRuns || []) {
    if (item?.key) {
      lastByKey[item.key] = item;
    }
  }
  return (listJobs || []).map((job) => {
    const last = lastByKey[job.key] || {};
    return {
      ...job,
      last_run_at: last.last_run_at || null,
      last_status: last.last_status || null,
      last_error: last.last_error || null,
      last_duration_ms: last.last_duration_ms == null ? null : last.last_duration_ms,
    };
  });
}

function statusLabel(status) {
  if (status === 'success') {
    return 'Success';
  }
  if (status === 'error') {
    return 'Error';
  }
  if (status === 'skipped') {
    return 'Skipped';
  }
  return EMPTY_VALUE;
}

function createCronJobsPage(root) {
  const listEndpoint = root.dataset.listEndpoint;
  const lastRunEndpoint = root.dataset.lastRunEndpoint;
  const enabledEndpoint = root.dataset.enabledEndpoint;
  const intervalEndpoint = root.dataset.intervalEndpoint;
  const intervalMinSeconds = Number(root.dataset.intervalMinSeconds) || 1;

  const tableBodyElement = document.getElementById('cron-jobs-table-body');
  const listElement = document.getElementById('cron-jobs-list');
  const statusElement = document.getElementById('cron-jobs-status');
  const errorElement = document.getElementById('cron-jobs-error');
  const infoElement = document.getElementById('cron-jobs-info');
  const reloadButton = document.getElementById('cron-jobs-reload');

  const editDialog = document.getElementById('cron-job-edit-dialog');
  const editTitle = document.getElementById('cron-job-edit-title');
  const editError = document.getElementById('cron-job-edit-error');
  const editIntervalFields = document.getElementById('cron-job-edit-interval-fields');
  const editIntervalInput = document.getElementById('cron-job-edit-interval');
  const editCronText = document.getElementById('cron-job-edit-cron-text');
  const editCancelButton = document.getElementById('cron-job-edit-cancel');
  const editSaveButton = document.getElementById('cron-job-edit-save');

  const logDialog = document.getElementById('cron-job-log-dialog');
  const logTitle = document.getElementById('cron-job-log-title');
  const logRunAt = document.getElementById('cron-job-log-run-at');
  const logStatus = document.getElementById('cron-job-log-status');
  const logError = document.getElementById('cron-job-log-error');
  const logDuration = document.getElementById('cron-job-log-duration');
  const logCloseButton = document.getElementById('cron-job-log-close');

  let loading = false;
  let saving = false;
  let editingJob = null;

  async function readJson(response) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  async function fetchJobs() {
    const [listResponse, lastRunResponse] = await Promise.all([
      fetch(listEndpoint, { credentials: 'same-origin' }),
      fetch(lastRunEndpoint, { credentials: 'same-origin' }),
    ]);

    const listBody = await readJson(listResponse);
    const lastRunBody = await readJson(lastRunResponse);

    if (!listResponse.ok) {
      throw new Error(listBody?.error || GENERIC_ERROR);
    }
    if (!lastRunResponse.ok) {
      throw new Error(lastRunBody?.error || GENERIC_ERROR);
    }

    return mergeJobs(listBody?.jobs, lastRunBody?.jobs);
  }

  function setBusy(isBusy) {
    loading = isBusy;
    if (reloadButton) {
      reloadButton.disabled = isBusy;
    }
    root.querySelectorAll('[data-cron-action]').forEach((button) => {
      button.disabled = isBusy;
    });
  }

  function openEdit(job) {
    editingJob = job;
    const title = job.title || job.key || '';
    editTitle.textContent = `Edit schedule: ${title}`;
    hideMessage(editError);

    const isInterval = job.schedule_mode === 'interval';
    editIntervalFields.classList.toggle('hidden', !isInterval);
    editCronText.classList.toggle('hidden', isInterval);
    editSaveButton.classList.toggle('hidden', !isInterval);

    if (isInterval) {
      editIntervalInput.value = String(intervalSeconds(job));
      editIntervalInput.min = String(intervalMinSeconds);
    } else {
      editCronText.textContent = job.cron_expression || EMPTY_VALUE;
    }

    editDialog?.showModal();
  }

  function openLog(job) {
    const title = job.title || job.key || '';
    logTitle.textContent = `Last run: ${title}`;
    logRunAt.textContent = formatDate(job.last_run_at);
    logStatus.textContent = statusLabel(job.last_status);
    logError.textContent = job.last_error || EMPTY_VALUE;
    logDuration.textContent = formatDuration(job.last_duration_ms);
    logDialog?.showModal();
  }

  async function toggleJob(job) {
    const response = await fetch(enabledEndpoint, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key: job.key,
        enabled: !job.enabled,
      }),
    });
    const body = await readJson(response);
    if (!response.ok) {
      throw new Error(body?.error || GENERIC_ERROR);
    }
    const title = job.title || job.key;
    showMessage(
      infoElement,
      job.enabled ? `Disabled ${title}.` : `Enabled ${title}. Job will run now.`,
    );
  }

  async function saveInterval() {
    if (!editingJob || saving) {
      return;
    }

    const seconds = Number(editIntervalInput.value);
    if (!Number.isInteger(seconds) || seconds < intervalMinSeconds) {
      showMessage(editError, 'The interval is invalid.');
      return;
    }

    saving = true;
    editSaveButton.disabled = true;
    hideMessage(editError);

    try {
      const response = await fetch(intervalEndpoint, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: editingJob.key,
          interval_ms: seconds * 1000,
        }),
      });
      const body = await readJson(response);
      if (!response.ok) {
        throw new Error(body?.error || GENERIC_ERROR);
      }

      const title = editingJob.title || editingJob.key;
      editDialog?.close();
      showMessage(infoElement, `Saved schedule for ${title}.`);
      await loadJobs({ keepInfo: true });
    } catch (error) {
      showMessage(editError, error.message || GENERIC_ERROR);
    } finally {
      saving = false;
      editSaveButton.disabled = false;
    }
  }

  function renderJobs(jobs) {
    if (tableBodyElement) {
      tableBodyElement.innerHTML = '';
    }
    if (listElement) {
      listElement.innerHTML = '';
    }

    if (!jobs.length) {
      if (tableBodyElement) {
        tableBodyElement.innerHTML =
          '<tr><td colspan="4" class="text-center text-base-content/65 py-4">No cron jobs registered.</td></tr>';
      }
      if (listElement) {
        listElement.innerHTML =
          '<li class="text-sm text-base-content/65">No cron jobs registered.</li>';
      }
      return;
    }

    for (const job of jobs) {
      const title = job.title || job.key || '';
      const description = job.description || '';
      const enabledLabel = job.enabled ? 'Enabled' : 'Disabled';
      const toggleLabel = job.enabled ? 'Disable' : 'Enable';

      if (tableBodyElement) {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>
            <div class="font-medium">${escapeHtml(title)}</div>
            ${description ? `<div class="text-xs text-base-content/65">${escapeHtml(description)}</div>` : ''}
          </td>
          <td>${escapeHtml(formatSchedule(job))}</td>
          <td>${escapeHtml(enabledLabel)}</td>
          <td>
            <div class="flex flex-wrap gap-2">
              <button type="button" class="btn btn-outline btn-xs" data-cron-action="toggle">${escapeHtml(toggleLabel)}</button>
              <button type="button" class="btn btn-outline btn-xs" data-cron-action="edit">Edit</button>
              <button type="button" class="btn btn-outline btn-xs" data-cron-action="log">Log</button>
            </div>
          </td>
        `;
        row.querySelector('[data-cron-action="toggle"]')?.addEventListener('click', async () => {
          if (loading) {
            return;
          }
          try {
            hideMessage(errorElement);
            setBusy(true);
            await toggleJob(job);
            await loadJobs({ keepInfo: true, skipBusy: true });
          } catch (error) {
            showMessage(errorElement, error.message || GENERIC_ERROR);
          } finally {
            setBusy(false);
          }
        });
        row.querySelector('[data-cron-action="edit"]')?.addEventListener('click', () => openEdit(job));
        row.querySelector('[data-cron-action="log"]')?.addEventListener('click', () => openLog(job));
        tableBodyElement.appendChild(row);
      }

      if (listElement) {
        const item = document.createElement('li');
        item.className = 'md-surface p-3 flex flex-col gap-3';
        item.innerHTML = `
          <div>
            <div class="font-medium">${escapeHtml(title)}</div>
            ${description ? `<div class="text-xs text-base-content/65">${escapeHtml(description)}</div>` : ''}
            <div class="mt-2 text-sm">${escapeHtml(formatSchedule(job))}</div>
            <div class="mt-1 text-sm">${escapeHtml(enabledLabel)}</div>
          </div>
          <div class="flex flex-wrap gap-2">
            <button type="button" class="btn btn-outline btn-xs" data-cron-action="toggle">${escapeHtml(toggleLabel)}</button>
            <button type="button" class="btn btn-outline btn-xs" data-cron-action="edit">Edit</button>
            <button type="button" class="btn btn-outline btn-xs" data-cron-action="log">Log</button>
          </div>
        `;
        item.querySelector('[data-cron-action="toggle"]')?.addEventListener('click', async () => {
          if (loading) {
            return;
          }
          try {
            hideMessage(errorElement);
            setBusy(true);
            await toggleJob(job);
            await loadJobs({ keepInfo: true, skipBusy: true });
          } catch (error) {
            showMessage(errorElement, error.message || GENERIC_ERROR);
          } finally {
            setBusy(false);
          }
        });
        item.querySelector('[data-cron-action="edit"]')?.addEventListener('click', () => openEdit(job));
        item.querySelector('[data-cron-action="log"]')?.addEventListener('click', () => openLog(job));
        listElement.appendChild(item);
      }
    }
  }

  async function loadJobs({ keepInfo = false, skipBusy = false } = {}) {
    if (loading && !skipBusy) {
      return;
    }

    if (!skipBusy) {
      setBusy(true);
    }
    if (!keepInfo) {
      hideMessage(infoElement);
    }
    hideMessage(errorElement);
    if (statusElement) {
      statusElement.textContent = 'Loading cron jobs…';
    }

    try {
      const jobs = await fetchJobs();
      renderJobs(jobs);
      if (statusElement) {
        statusElement.textContent = `${jobs.length} job${jobs.length === 1 ? '' : 's'}`;
      }
    } catch (error) {
      renderJobs([]);
      if (statusElement) {
        statusElement.textContent = 'Could not load cron jobs.';
      }
      showMessage(errorElement, error.message || GENERIC_ERROR);
    } finally {
      if (!skipBusy) {
        setBusy(false);
      }
    }
  }

  reloadButton?.addEventListener('click', () => {
    loadJobs();
  });

  editCancelButton?.addEventListener('click', () => {
    editDialog?.close();
  });

  editSaveButton?.addEventListener('click', () => {
    saveInterval();
  });

  logCloseButton?.addEventListener('click', () => {
    logDialog?.close();
  });

  loadJobs();
}

const root = document.getElementById('cron-jobs-page');
if (root) {
  createCronJobsPage(root);
}
})();
