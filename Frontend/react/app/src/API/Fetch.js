import { HttpMethod, APIVersion } from "../data/enums.js"
import { DEVELOPMENT, PROD_FETCH_URL, DEVELOPMENT_DJANGO_FETCH_URL, DEVELOPMENT_FASTAPI_FETCH_URL } from "../data/constants.js"
import { getToken } from "../modules/token.js"
import { notify_error } from "../modules/notify.js"

async function parseResponse(response) {
    const rawBody = response.status === 204 ? "" : await response.text()
    let payload = null

    if (rawBody) {
        try {
            payload = JSON.parse(rawBody)
        } catch {
            payload = { data: rawBody }
        }
    }

    if (!response.ok) {
        const error = payload?.error || payload?.detail || `HTTP ${response.status}`
        return { ok: false, error }
    }

    if (payload === null) return { ok: true, data: null }
    if (typeof payload !== "object") return { ok: true, data: payload }
    return payload
}

function reportApiError(data) {
    if (data?.ok !== false) return

    const message = data.error || data.detail
    if (!message) return

    const logMessage = `Not 2xx response: ${message}`
    console.warn(logMessage)
    notify_error(message)
}

export default async function Fetch({ api_version, action, method, body, token, is_uploading_file, params, signal }) {

    // External token gives by auth() func

    if (!token && token !== "") {
        token = getToken()
    }

    var url
    var data

    if (params) {
        const query = new URLSearchParams()
        Object.entries(params).forEach(([key, value]) => {
            if (value === undefined || value === null) return
            if (Array.isArray(value)) {
                value.forEach(item => query.append(key, item))
            } else {
                query.set(key, value)
            }
        })
        const queryString = query.toString()
        if (queryString) {
            action = `${action}${action.includes('?') ? '&' : '?'}${queryString}`
        }
    }

    if (DEVELOPMENT == "1") {
        if (api_version === APIVersion.V1) {
            url = `${DEVELOPMENT_DJANGO_FETCH_URL}api/v${api_version}/${action}`
        } else if (api_version === APIVersion.V2) {
            url = `${DEVELOPMENT_FASTAPI_FETCH_URL}api/v${api_version}/${action}`
        }
    } else {
        url = `${PROD_FETCH_URL}api/v${api_version}/${action}`
    }

    var credentials = api_version === APIVersion.V2 ? "include" : "same-origin"

    if (method === HttpMethod.GET) {
        try {
            data = await fetch(url, {
            method: "GET",
            headers: {
                "Accept": "application/json;text/plain",
                "Content-Type": "application/json;charset=UTF-8",
                "Authorization": token ? `Token ${token}` : "",
            },
            mode: "cors",
            credentials: credentials,
            signal: signal,
            }).then(parseResponse)
        } catch (error) {
            if (error?.name !== "AbortError") console.error(error)
            return { ok: false, error: error?.message || "Ошибка сетевого запроса" }
        }

        reportApiError(data)
        return data

    } else {
        var headers

        if (is_uploading_file) {
            headers = {
                "Accept": "application/json;text/plain",
                "Authorization": token ? `Token ${token}` : "",
            }
        } else {
            body = body ? JSON.stringify(body) : ""
            headers = {
                "Accept": "application/json;text/plain",
                "Content-Type": "application/json;charset=UTF-8",
                "Authorization": token ? `Token ${token}` : "",
            }
        }

        try {
            data = await fetch(url, {
            method: method,
            headers: headers,
            mode: "cors",
            body: body,
            credentials: credentials,
            signal: signal,
            }).then(parseResponse)
        } catch (error) {
            if (error?.name !== "AbortError") console.error(error)
            return { ok: false, error: error?.message || "Ошибка сетевого запроса" }
        }

        reportApiError(data)
        return data
    }
}
