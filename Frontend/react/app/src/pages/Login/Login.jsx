import './Login.css'
import { useState, use, useEffect } from 'react'
import { useNavigate } from "react-router-dom"
import Fetch from "../../API/Fetch"
import { AuthContext, UserContext } from "../../data/context.js"
import { HttpMethod, CacheKeys, APIVersion } from "../../data/enums.js"
import getToken from "../../modules/getToken.js"
import { notify_success } from "../../modules/notify.js"

export default function Login() {
    var { setIsAuth } = use(AuthContext)
    var { user, setUser } = use(UserContext)
    const [formData, setFormData] = useState({
        username: '',
        password: '',
    })

    const [errors, setErrors] = useState({})
    const [isLoading, setIsLoading] = useState(false)
    var navigate = useNavigate()

    async function auth() {
        var token = getToken()
        var data = await Fetch({ api_version: APIVersion.V1, action: "auth/users/me/", method: HttpMethod.GET })

        if (data && !data.detail && data.username && token) {
            setUser({ ...user, ...data })
            setIsAuth(true)

            var path = localStorage.getItem(CacheKeys.REMEMBER_PAGE)
            if (path !== null) {
                path = `/${path}/`
            } else {
                path = `/users/${data.username}/`
            }
            setIsLoading(false)
            navigate(path)
        }
    }

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }))
        // Очищаем ошибку при вводе
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }))
        }
    }

    async function handleSubmit(e) {
        e.preventDefault()
        // Валидация
        const newErrors = {}
        if (!formData.username) {
            newErrors.username = 'Юзернейм обязателен'
        }
        if (!formData.password) {
            newErrors.password = 'Пароль обязателен'
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors)
            return
        }

        setIsLoading(true)
        var data = await Fetch({ api_version: APIVersion.V1, action: "token/login/", method: HttpMethod.POST, body: formData, token: "" })

        if (data && !data.detail && data.auth_token) {
            localStorage.setItem(CacheKeys.TOKEN, data.auth_token)
            setIsAuth(true)

            setUser({ ...user, password: formData.password })
            notify_success('Вы успешно вошли!')

            auth()
        }
    }

    useEffect(() => {
        auth()
    }, [])

    return (
        <div className="login-page">
            <div className="login-container">
                <div className="login-card">
                    {/* Заголовок */}
                    <div className="login-header">
                        <div className="login-logo">
                            <img id="btc_logo" src='/btc_logo.png' />
                        </div>
                        <h1 className="login-title">Вход в систему</h1>
                    </div>

                    {/* Форма */}
                    <form className="login-form" onSubmit={handleSubmit}>
                        {/* username */}
                        <div className="login-form-group">
                            <label className="login-label">
                                Логин
                                <span className="login-required">*</span>
                            </label>
                            <input
                                type="text"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                className={`login-input ${errors.username ? 'login-input--error' : ''
                                    }`}
                                placeholder="Введите ваш логин"
                                disabled={isLoading}
                            />
                            {errors.username && (
                                <span className="login-error">
                                    {errors.username}
                                </span>
                            )}
                        </div>

                        {/* Пароль */}
                        <div className="login-form-group">
                            <label className="login-label">
                                Пароль
                                <span className="login-required">*</span>
                            </label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className={`login-input ${errors.password ? 'login-input--error' : ''
                                    }`}
                                placeholder="Введите ваш пароль"
                                disabled={isLoading}
                            />
                            {errors.password && (
                                <span className="login-error">
                                    {errors.password}
                                </span>
                            )}
                        </div>

                        {/* Кнопка входа */}
                        <button
                            type="submit"
                            className={`login-button login-button--secondary ${isLoading ? 'login-button--loading' : ''}`}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <span className="login-spinner"></span>
                                    Вход...
                                </>
                            ) : (
                                'Войти'
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}