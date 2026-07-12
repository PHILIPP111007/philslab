import "./SuspenseLoading.css"
import Spinner from "../Spinner/Spinner"

export default function SuspenseLoading() {
    return (
        <div className="SuspenseLoading">
            <Spinner size="md" variant="secondary" type='dots' />
        </div>
    )
}