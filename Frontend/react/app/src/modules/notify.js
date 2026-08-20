import toast from "react-hot-toast"

export var notify = (msg) => {
    toast.remove()
    toast(msg)
}

export var notify_success = (msg) => {
    toast.remove()
    toast.success(msg)
}
export var notify_error = (msg) => {
    toast.remove()
    const message = typeof msg === 'object' ? JSON.stringify(msg) : String(msg)
    toast.error(message)
}