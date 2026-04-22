import { getCategoriesService } from "../services/category.service.js";

const getCategoriesController = async (req, res) => {
    try {
        const categories = await getCategoriesService();
        return res.status(200).json({ status: "success", data: categories });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: error.message });
    }
};

export { getCategoriesController };
