export const VatTreatments = {
    VATABLE: 'vatable_12',
    ZERO_RATED: 'zero_rated_0',
    EXEMPT: 'exempt',
};

export const treatmentLabels = {
    [VatTreatments.VATABLE]: 'VATable 12%',
    [VatTreatments.ZERO_RATED]: 'Zero-rated 0%',
    [VatTreatments.EXEMPT]: 'VAT Exempt',
};

function sanitizeNumber(value, fallback = 0) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
}

export function calculateVat({ amount = 0, rate = 0.12, inclusive = true, treatment = VatTreatments.VATABLE }) {
    const normalizedAmount = Math.max(0, sanitizeNumber(amount));
    const normalizedRate = Math.max(0, sanitizeNumber(rate));
    let net = 0;
    let vat = 0;
    let gross = 0;

    if (treatment === VatTreatments.VATABLE && normalizedRate > 0) {
        if (inclusive) {
            vat = (normalizedAmount * normalizedRate) / (1 + normalizedRate);
            net = normalizedAmount - vat;
            gross = normalizedAmount;
        } else {
            net = normalizedAmount;
            vat = net * normalizedRate;
            gross = net + vat;
        }
    } else {
        net = normalizedAmount;
        vat = 0;
        gross = normalizedAmount;
    }

    const round = (value, precision) => Number(value.toFixed(precision));

    return {
        gross_amount: round(gross, 2),
        net_amount: round(net, 2),
        vat_amount: round(vat, 2),
        rate_used: round(normalizedRate, 4),
        treatment,
        inclusive,
    };
}
