(() => {
  const GENERIC_ERROR = 'Something went wrong. Please try again.';

  function initLogout() {
    const logoutButton = document.getElementById('logout-button');
    if (!logoutButton) {
      return;
    }

    // Keep dropdown open long enough for the click to register (DaisyUI :focus-within).
    logoutButton.addEventListener('mousedown', (event) => {
      event.preventDefault();
    });

    logoutButton.addEventListener('click', async () => {
      const endpoint = logoutButton.dataset.endpoint;
      const redirect = logoutButton.dataset.redirect || '/home/login';

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
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLogout);
  } else {
    initLogout();
  }
})();
