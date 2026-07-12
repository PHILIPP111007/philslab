import { useTheme } from './ThemeContext'

export function ThemeToggle() {
    const { theme, toggleTheme, isDark } = useTheme()

    return (
        <button
            className="theme-toggle"
            onClick={toggleTheme}
            title={isDark ? 'Переключить на светлую тему' : 'Переключить на темную тему'}
        >
            <span className="theme-toggle__icon">
                {isDark ? '🌙' : '☀️'}
            </span>
            <span className="theme-toggle__label">
                {isDark ? 'Темная' : 'Светлая'}
            </span>
            <div className="theme-toggle__switch">
                <div className={`theme-toggle__slider ${isDark ? 'theme-toggle__slider--dark' : 'theme-toggle__slider--light'}`} />
            </div>
        </button>
    )
}