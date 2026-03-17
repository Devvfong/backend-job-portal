import { prisma } from "../config/db.js";

const createProfile = async (data, id) => {
  return prisma.user.create({
    data: {
      ...data,
      id,
    },
  });
};

const getProfile = async (data, id) => {
  const user = await prisma.user.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      companyId: true,
      headline: true,
      bio: true,
      location: true,
      phone: true,
      avatar: true,
      skills: true,
      resume: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return user;
};
const updateProfile = async (data, id) => {
  const user = await prisma.user.findUnique({
    where: {
      id,
    },
  });
  return prisma.user.update({
    where: {
      id,
    },
    data: {
      name: data.name || user.name,
      email: data.email || user.email,
      headline: data.headline || user.headline,
      bio: data.bio || user.bio,
      location: data.location || user.location,
      phone: data.phone || user.phone,
      avatar: data.avatar || user.avatar,
      resume: data.resume || user.resume,
    },
  });
};

export { getProfile, updateProfile, createProfile };
