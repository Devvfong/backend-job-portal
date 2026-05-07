import { decryptId } from "../utils/crypto.js";

// Only attempt decryption for non-numeric ids. If the param is already numeric,
// leave it unchanged so controllers receive the numeric id.
const decryptMiddleware = (req, res, next) => {
    const id = req.params?.id;
    if (!id) return next();

    // If the id is all digits, treat as numeric and skip decryption
    if (/^\d+$/.test(id)) return next();

    try {
        const decrypted = decryptId(id);
        // Ensure decrypted value is numeric
        if (!/^\d+$/.test(String(decrypted).trim())) {
            return res.status(400).json({ error: "Invalid ID parameter" });
        }
        req.params.id = String(Number(decrypted));
        return next();
    } catch (err) {
        return res.status(400).json({ error: "Invalid ID parameter" });
    }
};

export default decryptMiddleware;