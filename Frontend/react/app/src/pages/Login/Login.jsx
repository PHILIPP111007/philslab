import './Login.css'
import { useState } from 'react'

export default function Login() {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        remember: false,
    })

    const [errors, setErrors] = useState({})
    const [isLoading, setIsLoading] = useState(false)

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

    const handleSubmit = (e) => {
        e.preventDefault()
        // Валидация
        const newErrors = {}
        if (!formData.email) {
            newErrors.email = 'Email обязателен'
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Введите корректный email'
        }
        if (!formData.password) {
            newErrors.password = 'Пароль обязателен'
        } else if (formData.password.length < 6) {
            newErrors.password = 'Пароль должен быть не менее 6 символов'
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors)
            return
        }

        // Здесь будет логика входа
        setIsLoading(true)
        console.log('📝 Данные формы:', formData)

        // Имитация загрузки
        setTimeout(() => {
            setIsLoading(false)
            // alert('Форма отправлена!')
        }, 1500)
    }

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
                        {/* Email */}
                        <div className="login-form-group">
                            <label className="login-label">
                                Email
                                <span className="login-required">*</span>
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className={`login-input ${errors.email ? 'login-input--error' : ''
                                    }`}
                                placeholder="Введите ваш email"
                                disabled={isLoading}
                            />
                            {errors.email && (
                                <span className="login-error">
                                    {errors.email}
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