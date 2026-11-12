const GENERIC_ERROR = 'Something went wrong. Please try again.';

document.addEventListener('DOMContentLoaded', () => {
  const logoutButton = document.getElementById('logout-button');
  if (!logoutButton) {
    return;
  }

  logoutButton.addEventListener('click', async () => {
    const endpoint = logoutButton.dataset.endpoint;
    const redirect = logoutButton.dataset.redirect || '/login';

    logoutButton.disabled = true;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        credentials: 'same-origin',
      });

      if (!response.ok) {
        window.alert(GENERIC_ERROR);
        return;
      }

      window.location.href = redirect;
    } catch {
      window.alert(GENERIC_ERROR);
    } finally {
      logoutButton.disabled = false;
    }
  });
});
