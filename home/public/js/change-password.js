const GENERIC_ERROR = 'Something went wrong. Please try again.';
const SUCCESS_MESSAGE = 'Password changed. Other sessions have been logged out.';

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

function getFormValues(form) {
  const formData = new FormData(form);
  return {
    currentPassword: String(formData.get('currentPassword') || ''),
    newPassword: String(formData.get('newPassword') || ''),
    confirmPassword: String(formData.get('confirmPassword') || ''),
  };
}

function validateChangePasswordForm(form, values) {
  const minLength = Number(form.dataset.passwordMin) || 8;
  const maxLength = Number(form.dataset.passwordMax) || 128;

  if (!values.currentPassword || !values.newPassword || !values.confirmPassword) {
    return 'current password and new password are required';
  }

  if (values.newPassword !== values.confirmPassword) {
    return 'Passwords do not match';
  }

  if (values.newPassword.length < minLength || values.newPassword.length > maxLength) {
    return `password must be between ${minLength} and ${maxLength} characters`;
  }

  if (values.currentPassword === values.newPassword) {
    return 'new password must be different from current password';
  }

  return null;
}

async function submitChangePasswordForm(form) {
  const errorElement = document.getElementById('change-password-error');
  const successElement = document.getElementById('change-password-success');
  const endpoint = form.dataset.endpoint;
  const values = getFormValues(form);

  hideMessage(errorElement);
  hideMessage(successElement);

  const validationError = validateChangePasswordForm(form, values);
  if (validationError) {
    showMessage(errorElement, validationError);
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
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      }),
    });

    let payload = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    if (!response.ok) {
      showMessage(errorElement, payload?.error || GENERIC_ERROR);
      return;
    }

    form.reset();
    showMessage(successElement, SUCCESS_MESSAGE);
  } catch {
    showMessage(errorElement, GENERIC_ERROR);
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('change-password-form');
  if (!form) {
    return;
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    submitChangePasswordForm(form);
  });
});
