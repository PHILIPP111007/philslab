import "./Button.css"

export default function Button({ variant = 'secondary', size = 'md', icon, children, ...props }) {
    const variants = {
        primary: 'btn-primary',
        secondary: 'btn-secondary',
        success: 'btn-success',
        danger: 'btn-danger',
        warning: 'btn-warning',
        ghost: 'btn-ghost',
        link: 'btn-link',
    }
    const sizes = {
        sm: 'btn-sm',
        md: '',
        lg: 'btn-lg',
    }
    return (
        <button className={`btn ${variants[variant]} ${sizes[size]}`} {...props}>
            {icon && <span className="btn__icon">{icon}</span>}
            {children}
        </button>
    )
}