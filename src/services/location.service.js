import { prisma } from "../config/db.js";

const getJobLocationsService = async () => {
    const groups = await prisma.job.groupBy({
        by: ["location"],
        where: { location: { not: "" } },
        _count: { location: true },
        orderBy: { _count: { location: "desc" } },
        take: 6
    });

    return groups.map((g) => ({
        city: g.location,
        jobs: g._count.location,
        // Fallback images since we don't have location images in DB
        img: `https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=600&q=80`
    }));
};

export { getJobLocationsService };
