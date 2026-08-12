import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import rememberPage from '../../modules/rememberPage';
import Header from '../components/Header/Header'
import Batches from "../components/Batch/Batches"

export default function AllBatches() {
    const params = useParams();

    useEffect(() => {
        rememberPage(`batches/${params.username}/`);
    }, [params.username]);

    return (
        <>
            <Header />
            <Batches username={params.username} />
        </>
    )
}
