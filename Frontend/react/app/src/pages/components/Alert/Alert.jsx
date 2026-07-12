import "./Alert.css"

export default function Alert({ type = 'info', icon, children }) {
    const types = {
        info: 'alert-info',
        success: 'alert-success',
        warning: 'alert-warning',
        error: 'alert-error',
    }
    return (
        <div className={`alert ${types[type]}`}>
            <span className="alert__icon">{icon}</span>
            <div>{children}</div>
        </div>
    )
}