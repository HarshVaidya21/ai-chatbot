const BASE_URL = 'http://localhost:5000/api/auth';

async function apiRequest(url, options = {}) {
  let accessToken = localStorage.getItem('token');

  const isFormData = options.body instanceof FormData;

  const headers = {
    ...(!isFormData && { 'Content-Type': 'application/json' }),
    ...options.headers,
    Authorization: `Bearer ${accessToken}`,
  };

  let response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    const refreshed = await tryRefreshToken();

    if (!refreshed) {
      window.location.href = '/login';
      return response;
    }

    accessToken = localStorage.getItem('token');

    const newHeaders = {
      ...(!isFormData && { 'Content-Type': 'application/json' }),
      ...options.headers,
      Authorization: `Bearer ${accessToken}`,
    };

    response = await fetch(url, { ...options, headers: newHeaders });
  }

  return response;
}

async function tryRefreshToken() {
  const refreshToken = localStorage.getItem('refreshToken');

  if (!refreshToken) return false;

  try {
    const res = await fetch(`${BASE_URL}/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) return false;

    const data = await res.json();
    localStorage.setItem('token', data.accessToken);
    return true;

  } catch (err) {
    return false;
  }
}

export default apiRequest;