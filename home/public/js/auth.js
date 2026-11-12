const GENERIC_ERROR = 'Something went wrong. Please try again.';

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

function getFormValues(form) {
  const formData = new FormData(form);
  return {
    username: String(formData.get('username') || '').trim(),
    password: String(formData.get('password') || ''),
    confirmPassword: String(formData.get('confirmPassword') || ''),
  };
}

function validateAuthForm(mode, values) {
  if (!values.username || !values.password) {
    return 'username and password are required';
  }

  if (mode === 'register' && values.password !== values.confirmPassword) {
    return 'Passwords do not match';
  }

  return null;
}

async function submitAuthForm(form) {
  const errorElement = document.getElementById('auth-error');
  const endpoint = form.dataset.endpoint;
  const mode = form.dataset.mode || 'login';
  const values = getFormValues(form);

  hideError(errorElement);

  const validationError = validateAuthForm(mode, values);
  if (validationError) {
    showError(errorElement, validationError);
    return;
  }

  const submitButton = form.querySelector('button[type="submit"]');
  if (submitButton) {
    submitButton.disabled = true;
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'same-origin',
      body: JSON.stringify({
        username: values.username,
        password: values.password,
      }),
    });

    let payload = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    if (!response.ok) {
      showError(errorElement, payload?.error || GENERIC_ERROR);
      return;
    }

    window.location.href = '/';
  } catch {
    showError(errorElement, GENERIC_ERROR);
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('auth-form');
  if (!form) {
    return;
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    submitAuthForm(form);
  });
});
