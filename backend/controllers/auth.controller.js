import bcrypt from "bcryptjs"; // for password hashing
import User from "../models/user.model.js";
import { generateTokenAndSetCookie } from "../lib/utils/generateToken.js";

export const signup = async (req, res) => {
  try {
    const { fullName, username, email, password } = req.body;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // regex for email validation
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    const existUser = await User.findOne({ username });
    if (existUser) {
      return res.status(400).json({ error: "Username is already taken" });
    }

    const existEmail = await User.findOne({ email });
    if (existEmail) {
      return res.status(400).json({ error: "Email is already taken" });
    }

    const salt = await bcrypt.genSalt(10); // generate salt for password hashing
    const hashedPassword = await bcrypt.hash(password, salt); // hash the password

    const newUser = new User({
      fullName,
      username,
      email,
      password: hashedPassword,
    });

    if (newUser) {
      generateTokenAndSetCookie(newUser._id, res); // generate token and set cookie
      await newUser.save();
    } else {
      return res.status(400).json({ error: "Failed to create user" });
    }
  } catch (error) {
    console.log("Error on signup", error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const login = async (req, res) => {
  res.json({
    data: "you hit login endpoint",
  });
};

export const logout = async (req, res) => {
  res.json({
    data: "you hit logout endpoint",
  });
};
