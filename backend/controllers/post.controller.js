import { v2 as cloudinary } from "cloudinary";
import Post from "../models/post.model.js";
import User from "../models/user.model.js";
import Notifacation from "../models/notification.model.js";

export const commentOnPost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user._id;

    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Comment cannot be empty" });
    }
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    const comment = { user: userId, text }; // Create a new comment object
    post.comments.push(comment); // Add comment to the post
    await post.save();
    res.status(200).json(post);
  } catch (error) {
    console.log("Error on commentOnPost", error.message);
    return res.status(500).json({ error: error.message });
  }
};

export const createPost = async (req, res) => {
  try {
    const { text } = req.body;
    let { img } = req.body;
    const userId = req.user._id.toString(); // Convert userId from Object to String

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    if (!text && !img) {
      return res
        .status(400)
        .json({ error: "Post must have either text or image" });
    }
    if (img) {
      const cloudinaryResponse = await cloudinary.uploader.upload(img); // Upload image to Cloudinary
      img = cloudinaryResponse.secure_url; // Get the secure_url of the uploaded image
    }

    const newPost = new Post({
      text,
      img,
      user: userId,
    });
    await newPost.save();
    res.status(201).json(newPost);
  } catch (error) {
    console.log("Error on likeUnlikePost", error.message);
    return res.status(500).json({ error: error.message });
  }
};

export const likeUnlikePost = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id: postId } = req.params;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    const isLiked = post.likes.includes(userId); // Check if user has already liked the post
    if (isLiked) {
      // Unlike the post
      await Post.updateOne({ _id: postId }, { $pull: { likes: userId } }); // Remove user post's from likes
      await Post.updateOne({ _id: userId }, { $pull: { likePosts: postId } }); // Remove post from user's likePosts
      return res.status(200).json({ message: "Post unliked successfully" });
    } else {
      // Like the post
      post.likes.push(userId); // Push user to post's likes
      await Post.updateOne({ _id: userId }, { $push: { likePosts: postId } }); // Push post to user's likePosts
      await post.save();
    }

    const notifacation = new Notifacation({
      from: userId,
      to: post.user,
      type: "like",
    });
    await notifacation.save();

    return res.status(200).json({ message: "Post liked successfully" });
  } catch (error) {
    console.log("Error on likeUnlikePost", error.message);
    return res.status(500).json({ error: error.message });
  }
};

export const getAllPosts = async (req, res) => {
  try {
    // `find()` for show all posts,
    // `sort({ createdAt: -1 })` for show in descending order (latest post first)
    // `populate("user")` for show user's fields in post (like username, fullName, profileImg...)
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate({
        path: "user",
        select: "-password",
      })
      .populate({
        path: "comments.user",
        select: "-password",
      });
    if (posts.length === 0) {
      return res.status(200).json([]);
    }

    res.status(200).json(posts);
  } catch (error) {
    console.log("Error on getPosts", error.message);
    return res.status(500).json({ error: error.message });
  }
};

export const getFollowingPosts = async (req, res) => {
  try {
    const userId = req.user._id; // Get userId from req.user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const following = user.following;
    const feedPosts = await Post.find({ user: { $in: following } })
      .sort({ createdAt: -1 })
      .populate({
        path: "user",
        select: "-password",
      })
      .populate({
        path: "comments.user",
        select: "-password",
      });
    res.status(200).json(feedPosts);
  } catch (error) {
    console.log("Error on getFollowingPosts", error.message);
    return res.status(500);
  }
};

export const getLikePosts = async (req, res) => {
  const userId = req.params.id;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const likePosts = await Post.find({ likes: userId })
      .populate({
        path: "user",
        select: "-password",
      })
      .populate({
        path: "comments.user",
        select: "-password",
      });

    res.status(200).json(likePosts);
  } catch (error) {
    console.log("Error on getLikePost", error.message);
    return res.status(500).json({ error: error.message });
  }
};

export const getUserPosts = async (req, res) => {
  try {
    const { username } = req.params;

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const userPosts = await Post.find({ user: user._id })
      .sort({ createdAt: -1 })
      .populate({
        path: "user",
        select: "-password",
      })
      .populate({
        path: "comments.user",
        select: "-password",
      });
    res.status(200).json(userPosts);
  } catch (error) {
    console.log("Error on getUserPosts", error.message);
    return res.status(500).json({ error: error.message });
  }
};

export const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }
    if (post.user.toString() !== req.user._id.toString()) {
      // Check if the user is the owner of the post
      return res.status(401).json({ error: "You are not authorized" });
    }

    if (post.img) {
      const imgId = post.img.split("/").pop().split(".")[0]; // Get the id of the image
      await cloudinary.uploader.destroy(imgId); // Delete image from Cloudinary
    }
    await Post.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    console.log("Error on deletePost", error.message);
    return res.status(500).json({ error: error.message });
  }
};
