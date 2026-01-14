/**
 * Advanced Expression Engine for iSuite
 * Handles resolution of dynamic variables, system objects, and basic transformations.
 */

const SYSTEM_VARIABLES = {
    now: () => new Date().toISOString(),
    today: () => new Date().toLocaleDateString(),
    timestamp: () => Date.now(),
    random: () => Math.random().toString(36).substring(7),
};

const FILTERS: Record<string, (val: any, arg?: string) => any> = {
    json: (val) => JSON.stringify(val, null, 2),
    upper: (val) => String(val).toUpperCase(),
    lower: (val) => String(val).toLowerCase(),
    length: (val) => (Array.isArray(val) || typeof val === 'string' ? val.length : 0),
    count: (val) => (Array.isArray(val) ? val.length : (val ? 1 : 0)),
    first: (val) => (Array.isArray(val) ? val[0] : val),
    last: (val) => (Array.isArray(val) ? val[val.length - 1] : val),
    trim: (val) => String(val).trim(),
    default: (val, arg) => (val === undefined || val === null || val === '' ? (arg || '') : val),
    date: (val) => new Date(val).toLocaleDateString(),
};

export function resolveExpressions(
    data: any,
    context: Record<string, any>
): any {
    if (typeof data === 'string') {
        const trimmed = data.trim();
        // If it's JUST an expression like "{{ test.data }}", return the raw value (can be object/array)
        if (trimmed.startsWith('{{') && trimmed.endsWith('}}') && !trimmed.slice(2, -2).includes('{{')) {
            const inner = trimmed.slice(2, -2).trim();
            const [path, ...filterMatchParts] = inner.split('|');
            const filterMatch = filterMatchParts.join('|').trim();

            let value: any;
            if (path.startsWith('system.')) {
                const sysKey = path.split('.')[1] as keyof typeof SYSTEM_VARIABLES;
                value = SYSTEM_VARIABLES[sysKey] ? SYSTEM_VARIABLES[sysKey]() : undefined;
            } else {
                value = getNestedValue(context, path.trim());
            }

            if (value === undefined && !filterMatch.includes('default')) return data;

            if (filterMatch) {
                const filterParts = filterMatch.match(/^(\w+)(?:\((.*)\))?$/);
                if (filterParts) {
                    const [, filterName, arg] = filterParts;
                    if (FILTERS[filterName]) {
                        const cleanArg = arg ? arg.replace(/^['"](.*)['"]$/, '$1') : undefined;
                        value = FILTERS[filterName](value, cleanArg);
                    }
                }
            }
            return value;
        }
        return resolveString(data, context);
    }

    if (Array.isArray(data)) {
        return data.map((item) => resolveExpressions(item, context));
    }

    if (typeof data === 'object' && data !== null) {
        const resolved: any = {};
        for (const [key, value] of Object.entries(data)) {
            resolved[key] = resolveExpressions(value, context);
        }
        return resolved;
    }

    return data;
}

function resolveString(str: string, context: Record<string, any>): string {
    return str.replace(/\{\{\s*([^}|]+?)(?:\s*\|\s*([^}]+?))?\s*\}\}/g, (match, path, filterMatch) => {
        let value: any;

        if (path.startsWith('system.')) {
            const sysKey = path.split('.')[1] as keyof typeof SYSTEM_VARIABLES;
            value = SYSTEM_VARIABLES[sysKey] ? SYSTEM_VARIABLES[sysKey]() : undefined;
        } else {
            value = getNestedValue(context, path.trim());
        }

        if (value === undefined && !filterMatch?.includes('default')) return match;

        if (filterMatch) {
            const filterParts = filterMatch.trim().match(/^(\w+)(?:\((.*)\))?$/);
            if (filterParts) {
                const [, filterName, arg] = filterParts;
                if (FILTERS[filterName]) {
                    const cleanArg = arg ? arg.replace(/^['"](.*)['"]$/, '$1') : undefined;
                    value = FILTERS[filterName](value, cleanArg);
                }
            }
        }

        return typeof value === 'object' ? JSON.stringify(value) : String(value ?? "");
    });
}

function getNestedValue(obj: any, path: string): any {
    if (!path) return undefined;
    return path.split('.').reduce((prev, curr) => {
        if (prev === null || prev === undefined) return undefined;

        // Handle array index access like items[0]
        const arrayMatch = curr.match(/^(.+)\[(\d+)\]$/);
        if (arrayMatch) {
            const [, key, index] = arrayMatch;
            const arr = prev[key];
            return Array.isArray(arr) ? arr[parseInt(index)] : undefined;
        }

        return prev[curr];
    }, obj);
}
