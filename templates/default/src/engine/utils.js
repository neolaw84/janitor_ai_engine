export function sanitizeInput(value) {
    if (Array.isArray(value)) {
        return value;
    } else if (typeof value === 'object' && value !== null) {
        return [value];
    } else {
        if (typeof value === 'string' && value.trim().length > 0) {
            return [{ what: value }];
        } else {
            return [{}];
        }
    }
}

export function findBestMatch(providedValue, allowedMap) {
    let bestMatchKey = null;

    if (typeof providedValue === 'string') {
        const lowerValue = providedValue.toLowerCase().trim();
        if (allowedMap[lowerValue]) {
            bestMatchKey = lowerValue;
        } else {
            for (const key in allowedMap) {
                if (lowerValue.includes(key)) {
                    bestMatchKey = key;
                    break;
                }
            }
        }
    }

    return bestMatchKey;
}
