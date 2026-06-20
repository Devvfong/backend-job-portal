import { BadRequestError } from '../lib/errors.js';
import { decryptId } from "../utils/crypto.js";

const decryptMiddleware = (req, res, next) => {
    const id = req.params?.id;
    if (!id) return next();

    if (/^\d+$/.test(id)) return next();

    try {
        const decrypted = decryptId(id);
        if (!/^\d+$/.test(String(decrypted).trim())) {
            return next(new BadRequestError("Invalid ID parameter"));
        }
        req.params.id = String(Number(decrypted));
        return next();
    } catch (err) {
        return next(new BadRequestError("Invalid ID parameter"));
    }
};

export default decryptMiddleware;
