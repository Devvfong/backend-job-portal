import { prisma } from "../config/db.js";

const createProfile = async (data, id) => {
  // Profile should update existing user, not create a new user row
  const user = await prisma.user.findUnique({
    where: {
      id, // Find the user by their unique ID
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return prisma.user.update({
    where: {
      id,
    },
    // Update the user's profile information, but keep existing values if not provided in the update data
    data: {
      headline: data.headline || user.headline,
      bio: data.bio || user.bio,
      location: data.location || user.location,
      phone: data.phone || user.phone,
      avatar: data.avatar || user.avatar,
      skills: data.skills || user.skills,
      resume: data.resume || user.resume,
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
};

const getProfile = async (id) => {
  const user = await prisma.user.findUnique({
    where: {
      id,
    },
    // Only select the fields that are relevant for the profile
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

  if (!user) {
    throw new Error("User not found");
  }

  return prisma.user.update({
    where: {
      id,
    },
    data: {
      name: data.name || user.name, // Allow updating name, but keep existing if not provided
      email: data.email || user.email,
      headline: data.headline || user.headline,
      bio: data.bio || user.bio,
      location: data.location || user.location,
      phone: data.phone || user.phone,
      avatar: data.avatar || user.avatar,
      skills: data.skills || user.skills,
      resume: data.resume || user.resume,
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
};

const updateUserAvatar = async (userId, avatarUrl) => {
  return prisma.user.update({
    where: { id: userId },
    data: { avatar: avatarUrl },
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
    },
  });
};

const updateUserResume = async (userId, resumeUrl) => {
  return prisma.user.update({
    where: { id: userId },
    data: { resume: resumeUrl },
    select: {
      id: true,
      name: true,
      email: true,
      resume: true,
    },
  });
};

export { getProfile, updateProfile, createProfile, updateUserAvatar, updateUserResume };
