import './Spinner.css'

export default function Spinner({
    size = 'md',
    variant = 'primary',
    type = 'dots', // circle, gradient, double, pulse, dots, bars
    label,
    className = '',
    ...props
}) {
    const sizes = {
        sm: 'spinner--sm',
        md: 'spinner--md',
        lg: 'spinner--lg',
        xl: 'spinner--xl',
    }

    const variants = {
        primary: 'spinner--primary',
        secondary: 'spinner--secondary',
        success: 'spinner--success',
        danger: 'spinner--danger',
        warning: 'spinner--warning',
        white: 'spinner--white',
    }

    const types = {
        circle: '',
        gradient: 'spinner--gradient',
        double: 'spinner--double',
        pulse: 'spinner--pulse',
        dots: 'spinner--dots',
        bars: 'spinner--bars',
    }

    // Для типов dots и bars используем специальный рендер
    if (type === 'dots') {
        return (
            <div className={`spinner-wrapper ${className}`} {...props}>
                <div className={`spinner ${types.dots} ${variants[variant]}`}>
                    <div className="spinner__dot"></div>
                    <div className="spinner__dot"></div>
                    <div className="spinner__dot"></div>
                </div>
                {label && <span className="spinner__label">{label}</span>}
            </div>
        )
    }

    if (type === 'bars') {
        return (
            <div className={`spinner-wrapper ${className}`} {...props}>
                <div className={`spinner ${types.bars} ${variants[variant]}`}>
                    <div className="spinner__bar"></div>
                    <div className="spinner__bar"></div>
                    <div className="spinner__bar"></div>
                    <div className="spinner__bar"></div>
                    <div className="spinner__bar"></div>
                </div>
                {label && <span className="spinner__label">{label}</span>}
            </div>
        )
    }

    return (
        <div className={`spinner-wrapper ${className}`} {...props}>
            <div className={`spinner ${sizes[size]} ${variants[variant]} ${types[type]}`}>
                <div className="spinner__circle"></div>
            </div>
            {label && <span className="spinner__label">{label}</span>}
        </div>
    )
}