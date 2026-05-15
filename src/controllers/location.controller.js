import { getJobLocationsService } from "../services/location.service.js";

const getJobLocationsController = async (req, res) => {
    try {
        const locations = await getJobLocationsService();
        return res.status(200).json({ status: "success", data: locations });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: error.message });
    }
};

export { getJobLocationsController };
