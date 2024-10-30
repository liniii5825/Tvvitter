import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import {
  commentOnPost,
  createPost,
  likeUnlikePost,
  getAllPosts,
  getFollowingPosts,
  getLikePosts,
  getUserPosts,
  deletePost,
} from "../controllers/post.controller.js";

const router = express.Router();

router.get("/all", protectRoute, getAllPosts);
router.get("/following/", protectRoute, getFollowingPosts);
router.get("/likes/:id", protectRoute, getLikePosts);
router.get("/user/:username", protectRoute, getUserPosts);
router.post("/comment/:id", protectRoute, commentOnPost);
router.post("/create", protectRoute, createPost);
router.post("/like/:id", protectRoute, likeUnlikePost);
router.delete("/:id", protectRoute, deletePost);

export default router;
