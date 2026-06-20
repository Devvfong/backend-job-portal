import { getCategoriesService } from "../services/category.service.js";

const getCategoriesController = async (req, res, next) => {
    try {
        const categories = await getCategoriesService();
        return res.status(200).json({ status: "success", data: categories });
    } catch (error) {
        next(error);
    }
};

export { getCategoriesController };
