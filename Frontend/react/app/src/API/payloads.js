const nullableText = (value) => {
    if (value === undefined || value === null) return null
    const text = String(value).trim()
    return text === '' ? null : text
}

const nullableNumber = (value) => {
    if (value === undefined || value === null || value === '') return null
    const number = Number(value)
    return Number.isFinite(number) ? number : null
}

export function buildSamplePayload(sample) {
    return {
        sample_code: nullableText(sample.sample_code),
        sample_group_code: nullableText(sample.sample_group_code),
        zlims_code: nullableText(sample.zlims_code),
        uin1: nullableText(sample.uin1),
        uin2: nullableText(sample.uin2),
        project_code: nullableText(sample.project_code),
        sample_index: nullableText(sample.sample_index),
        qc_1: nullableNumber(sample.qc_1),
        qc_2: nullableNumber(sample.qc_2),
        descr: nullableText(sample.descr),
        material_type: nullableText(sample.material_type),
    }
}
