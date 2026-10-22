
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";

let getAccessToken = () => null;
let refreshAccessToken = async () => null;

export function configureApiAuth({ getToken, refresh }) {
  getAccessToken = getToken;
  refreshAccessToken = refresh;
}

async function sendRequest(path, options, token) {
  const { headers = {}, ...requestOptions } = options;

  return fetch(`${API_BASE_URL}${path}`, {
    ...requestOptions,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}

async function parseResponse(response) {
  let result;

  try {
    result = await response.json();
  } catch {
    throw new Error("The server returned an invalid response.");
  }

  if (!response.ok || result.success === false) {
    const error = new Error(
      result.message || `Request failed with status ${response.status}.`,
    );

    error.status = response.status;
    throw error;
  }

  return result;
}



export async function apiRequest(path, options = {}) {
  const isAuthRequest = path.startsWith("/auth/");
  const token = getAccessToken();

  let response;

  try {
    response = await sendRequest(path, options, token);
  } catch {
    throw new Error(
      "Unable to connect to SpendWise. Check that the backend server is running.",
    );
  }

  // Never attempt automatic refresh for authentication endpoints.
  if (response.status === 401 && token && !isAuthRequest) {
    const newToken = await refreshAccessToken();

    if (!newToken) {
      const error = new Error(
        "Your session has expired. Please log in again.",
      );
      error.status = 401;
      throw error;
    }

    try {
      response = await sendRequest(path, options, newToken);
    } catch {
      throw new Error(
        "Unable to connect to SpendWise. Check that the backend server is running.",
      );
    }
  }

  return parseResponse(response);
}
