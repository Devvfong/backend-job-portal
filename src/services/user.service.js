import { prisma } from "../config/db.js";
import dotenv from "dotenv";
dotenv.config();  
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

const getAllUsers = async () => {
  const [user, total] = await Promise.all([
    prisma.user.findMany({
      where: {
        role: {
          not: process.env.SERVER, // Exclude the high-level admins
        },
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
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.user.count({
      where: {
        role: {
          not: process.env.SERVER,
        },
      },
    }),
  ]);

  return { user, total };
};

const deleteUser = async (id) => {
  const user = await prisma.user.findUnique({
    where: {
      id: Number(id),
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return prisma.user.delete({
    where: {
      id: Number(id),
    },
  });
};
const updateProfile = async (data, id, currentUser) => {
  // Check permissions: only the owner or a user with the SERVER role can update this profile
  if (currentUser.id !== Number(id) && currentUser.role !== process.env.SERVER) {
    throw new Error("Forbidden: You cannot update this profile");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: Number(id),
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const updateData = {
    name: data.name || user.name,
    email: data.email || user.email,
    headline: data.headline || user.headline,
    bio: data.bio || user.bio,
    location: data.location || user.location,
    phone: data.phone || user.phone,
    avatar: data.avatar || user.avatar,
    skills: data.skills || user.skills,
    resume: data.resume || user.resume,
  };

  // Only process.env.SERVER can change role or companyId
  if (currentUser.role === process.env.SERVER) {
    if (data.role) updateData.role = data.role; // this for change role of user
    if (data.companyId) updateData.companyId = Number(data.companyId); // this for change company of user
  }

  return prisma.user.update({
    where: {
      id: Number(id),
    },
    data: updateData, // this for update user profile
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
const getUserStatsService = async (userId) => {
  const [totalApplications, totalSavedJobs, user] = await Promise.all([
    prisma.application.count({ where: { userId } }), // this for count total applications of user
    prisma.savedJob.count({ where: { userId } }), // this for count total saved jobs of user
    prisma.user.findUnique({ where: { id: userId } }), // this for get user data
  ]);

  // Calculate profile strength (completeness)
  const profileFields = [
    "headline",
    "bio",
    "location",
    "phone",
    "avatar",
    "resume",
    "skills",
  ];
  const filledFields = profileFields.filter((field) => {
    if (field === "skills") return user.skills && user.skills.length > 0;
    return !!user[field];
  });
  const profileStrength = Math.round(
    (filledFields.length / profileFields.length) * 100,
  );

  return {
    totalApplications,
    totalSavedJobs,
    profileStrength,
  };
};

export {
  getProfile,
  updateProfile,
  createProfile,
  updateUserAvatar,
  updateUserResume,
  getAllUsers,
  deleteUser,
  getUserStatsService,
};
