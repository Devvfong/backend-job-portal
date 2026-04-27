import CryptoJS from 'crypto-js';

const secretKey = process.env.ENCRYPTION_KEY || 'default-secret-key-change-in-prod';

const decryptParam = (encrypted) => {
    try {
        const bytes = CryptoJS.AES.decrypt(encrypted, secretKey);
        return bytes.toString(CryptoJS.enc.Utf8);
    } catch (e) {
        throw new Error('Invalid encrypted parameter');
    }
};

const decryptMiddleware = (req, res, next) => {
    if (req.params.id) {
        try {
            req.params.id = decryptParam(req.params.id);
        } catch (e) {
            return res.status(400).json({ error: 'Invalid ID parameter' });
        }
    }
    next();
};

export default decryptMiddleware;