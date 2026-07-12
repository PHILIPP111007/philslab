import "./ProgressBar.css"


export default function ProgressBar({ variant = 'secondary', text, progress }) {
    const variants = {
        primary: 'primary',
        secondary: 'secondary',
        success: 'success',
        danger: 'danger',
        warning: 'warning',
    }

    return (
        <div className="progress-item">
            <div className="progress-item__label">
                <span>{text}</span>
                <span>{progress}%</span>
            </div>
            <div className="progress-track">
                <div className={`progress-fill progress-fill--${variants[variant]}`} style={{ width: `${progress}%` }} />
            </div>
        </div>
    )
}