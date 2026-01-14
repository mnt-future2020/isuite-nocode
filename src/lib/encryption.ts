import Cryptr from "cryptr";

const DEFAULT_KEY = process.env.ENCRYPTION_KEY || "default-dev-key";

export const encrypt = (text: string, salt: string = "") => {
    const cryptr = new Cryptr(DEFAULT_KEY + salt);
    return cryptr.encrypt(text);
};

export const decrypt = (text: string, salt: string = "") => {
    const cryptr = new Cryptr(DEFAULT_KEY + salt);
    return cryptr.decrypt(text);
};

