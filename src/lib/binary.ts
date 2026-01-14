export interface BinaryData {
    __binary: true;
    data: string; // Base64
    mimeType: string;
    fileName?: string;
    size?: number;
}

export function isBinaryData(value: any): value is BinaryData {
    return value && typeof value === 'object' && value.__binary === true;
}

export function createBinaryData(base64: string, mimeType: string, fileName?: string): BinaryData {
    return {
        __binary: true,
        data: base64,
        mimeType,
        fileName,
        size: Math.round((base64.length * 3) / 4),
    };
}
