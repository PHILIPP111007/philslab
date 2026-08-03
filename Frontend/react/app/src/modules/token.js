// import { CacheKeys } from "../data/enums.js"

// export function getToken() {
//     return localStorage.getItem(CacheKeys.TOKEN)
// }

// export function setToken({ token }) {
//     localStorage.setItem(CacheKeys.TOKEN, token)
// }

// export function deleteToken() {
//     localStorage.removeItem(CacheKeys.TOKEN)
// }


import { CacheKeys } from "../data/enums.js";

// Вспомогательные функции для работы с куками
function getCookie(name) {
    const matches = document.cookie.match(
        new RegExp("(?:^|; )" + name.replace(/([.$?*|{}()\[\]\\\/+^])/g, '\\$1') + "=([^;]*)")
    );
    return matches ? decodeURIComponent(matches[1]) : null;
}

function setCookie(name, value, options = {}) {
    const defaultOptions = { path: '/' };
    const opts = { ...defaultOptions, ...options };

    if (opts.expires instanceof Date) {
        opts.expires = opts.expires.toUTCString();
    }

    let cookieString = encodeURIComponent(name) + "=" + encodeURIComponent(value);
    for (const key in opts) {
        cookieString += "; " + key;
        if (opts[key] !== true) {
            cookieString += "=" + opts[key];
        }
    }
    document.cookie = cookieString;
}

function deleteCookie(name) {
    setCookie(name, "", { 'max-age': -1 });
}

// Экспортируемые функции (интерфейс остаётся прежним)
export function getToken() {
    return getCookie(CacheKeys.TOKEN);
}

export function setToken({ token }) {
    setCookie(CacheKeys.TOKEN, token);
}

export function deleteToken() {
    deleteCookie(CacheKeys.TOKEN);
}