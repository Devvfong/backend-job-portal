import generateToken from "../utils/generateToken.js";
import {
  findUserByEmail,
  createUser,
  verifyPassword,
} from "../services/auth.service.js";

const register = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    // Check if user already exists
    const userExists = await findUserByEmail(email);
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Create user (hashing handled in service)
    const user = await createUser({
      name,
      email,
      password,
      role: "job_seeker", //prevent hacker patch if leak endpoint, only allow register as job seeker, company admin must be created by admin
    });

    // Generate token and set cookie
    const token = generateToken(user.id, res);

    return res.status(201).json({
      status: "success",
      message: "User registered successfully",
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
        token,
      },
    });
  } catch (error) {
    console.error("Error registering user:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    // Check if user exists
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Check if password is correct
    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Generate token and set cookie
    const token = generateToken(user.id, res);

    return res.status(200).json({
      status: "success",
      message: "User logged in successfully",
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
        token,
      },
    });
  } catch (error) {
    console.error("Error logging in:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

const logout = async (req, res) => {
  res.cookie("jwt", "", {
    expires: new Date(0),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
  return res.status(200).json({
    status: "success",
    message: "Logged out successfully",
  });
};
const getMe = async (req, res) => {
  const token = generateToken(req.user.id, res); // Refresh token on profile access
  try {
    return res.status(200).json({
      status: "success",
      data: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
      },
      token,
    });
  } catch (e) {
    return res.status(500).json({ message: "Server error" });
  }
};
export { register, login, logout, getMe };
