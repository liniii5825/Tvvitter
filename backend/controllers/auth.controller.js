import bcrypt from "bcryptjs"; // for password hashing
import User from "../models/user.model.js";
import { generateTokenAndSetCookie } from "../lib/utils/generateToken.js";

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password"); // find user by id and exclude password
    res.status(200).json(user); // send user data
  } catch (error) {
    console.log("Error on getMe", error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const signup = async (req, res) => {
  try {
    const { fullName, username, email, password } = req.body;

    // Next few if are to check if any field is invalid
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
    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters long" });
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
      res.status(201).json({
        _id: newUser._id,
        fullName: newUser.fullName,
        username: newUser.username,
        email: newUser.email,
        followers: newUser.followers,
        following: newUser.following,
        profileImg: newUser.profileImg,
        coverImg: newUser.coverImg,
      }); // send user data
    } else {
      return res.status(400).json({ error: "Failed to create user" });
    }
  } catch (error) {
    console.log("Error on signup", error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    const isPasswordValid = await bcrypt.compare(
      password,
      user?.password || ""
    ); // compare password, empty if user is null
    if (!user || !isPasswordValid) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    generateTokenAndSetCookie(user._id, res); // generate token and set cookie

    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      followers: user.followers,
      following: user.following,
      profileImg: user.profileImg,
      coverImg: user.coverImg,
    }); // send user data
  } catch (error) {
    console.log("Error on login", error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const logout = async (req, res) => {
  try {
    res.cookie("jwt", "", { maxAge: 0 }); // clear cookie
    res.status(200).json({ message: "Logout successfully" });
  } catch (error) {
    console.log("Error on logout", error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};
