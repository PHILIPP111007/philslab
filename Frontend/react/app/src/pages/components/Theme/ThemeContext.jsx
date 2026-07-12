import { createContext, useContext, useState, useEffect } from 'react'
import { Theme } from "../../../data/enums"

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
    // Проверяем сохраненную тему или системные настройки
    const getInitialTheme = () => {
        const savedTheme = localStorage.getItem('theme')
        if (savedTheme) return savedTheme

        // Проверяем системные настройки
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
            return Theme.LIGHT
        }
        return Theme.DARK
    }

    const [theme, setTheme] = useState(getInitialTheme)

    useEffect(() => {
        // Сохраняем тему в localStorage
        localStorage.setItem('theme', theme)

        // Применяем тему к document
        document.documentElement.setAttribute('data-theme', theme)
    }, [theme])

    const toggleTheme = () => {
        setTheme(prev => prev === Theme.DARK ? Theme.LIGHT : Theme.DARK)
    }

    const value = {
        theme,
        toggleTheme,
        isDark: theme === Theme.DARK,
        isLight: theme === Theme.LIGHT,
    }

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    )
}

export function useTheme() {
    const context = useContext(ThemeContext)
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider')
    }
    return context
}