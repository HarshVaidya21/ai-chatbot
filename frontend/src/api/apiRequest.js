const BASE_URL = 'http://localhost:5000/api/auth';

async function apiRequest(url, options = {}) {
    // Step 1: Get the current access token from localStorage
    let accessToken = localStorage.getItem('token');

    // Step 2: Build headers — attach Authorization + whatever headers were passed in
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
        Authorization: `Bearer ${accessToken}`,
    };

    // Step 3: Make the actual request
    let response = await fetch(url, { ...options, headers });

    // Step 4: If token expired (401), try to refresh
    if (response.status === 401) {
        const refreshed = await tryRefreshToken();

        if (!refreshed) {
            // TODO 1: refresh failed too — redirect to login
            // hint: window.location.href = '/login'
            // then return response; (nothing more we can do)
            window.location.href = '/login';
            return response;
        }

        // TODO 2: refresh succeeded — get the NEW token from localStorage again
        // (tryRefreshToken already saved it there, just re-read it)
        accessToken = localStorage.getItem('token');


        // TODO 3: rebuild headers with the new token (same shape as Step 2)
        const newHeaders = {
            'Content-Type': 'application/json',
            ...options.headers,
            Authorization: `Bearer ${accessToken}`,
        };

        // TODO 4: retry the original request ONE more time with new headers
        // hint: response = await fetch(url, { ...options, headers: newHeaders });
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