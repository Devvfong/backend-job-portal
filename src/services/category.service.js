import { prisma } from "../config/db.js";

const getCategoriesService = async () => {
    // Group jobs by category and return title + count
    const groups = await prisma.job.groupBy({
        by: ["category"],
        where: { category: { not: null } },
        _count: { category: true },
        orderBy: { _count: { category: "desc" } },
    });

    // Map to { title, count } for frontend compatibility
    return groups.map((g) => ({
        title: g.category,
        count: String(g._count.category),
    }));
};

export { getCategoriesService };
