import { getJobLocationsService } from "../services/location.service.js";

const getJobLocationsController = async (req, res, next) => {
    try {
        const locations = await getJobLocationsService();
        return res.status(200).json({ status: "success", data: locations });
    } catch (error) {
        next(error);
    }
};

export { getJobLocationsController };
