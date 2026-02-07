import Video from "../model/videoModel.js";
import Short from "../model/shortModel.js";
import Playlist from "../model/playlistModel.js";
import Channel from "../model/channelModel.js"; // ✅ Channel import karo
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();
export const searchWithAi = async (req, res) => {
  try {
    const { input } = req.body;
    if (!input) {
      return res.status(400).json({ message: "Search query is required" });
    }

    // ✅ Step 1: AI se keyword nikalo (autocorrect + simplified)
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    const prompt = `You are a search assistant for a video streaming platform. 
The user query is: "${input}"

🎯 Your job:
- If query has typos, correct them.
- If query has multiple words, break them into meaningful keywords.
- Return only the corrected word(s), comma-separated.
- Do not explain, only return keyword(s).`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    let keyword = (response.text || input).trim().replace(/[\n\r]+/g, "");

    // ✅ Step 2: Split keywords for OR search
    const searchWords = keyword
      .split(",")
      .map((w) => w.trim())
      .filter(Boolean);

    // ✅ Helper: create OR regex query
    const buildRegexQuery = (fields) => {
      return {
        $or: searchWords.map((word) => ({
          $or: fields.map((field) => ({
            [field]: { $regex: word, $options: "i" },
          })),
        })),
      };
    };

    // 1️⃣ Channels
    const matchedChannels = await Channel.find(
      buildRegexQuery(["name"]),
    ).select("_id name avatar");

    const channelIds = matchedChannels.map((c) => c._id);

    // 2️⃣ Videos
    const videos = await Video.find({
      $or: [
        buildRegexQuery(["title", "description", "tags"]),
        { channel: { $in: channelIds } },
      ],
    }).populate("channel comments.author comments.replies.author");

    // 3️⃣ Shorts
    const shorts = await Short.find({
      $or: [
        buildRegexQuery(["title", "tags"]),
        { channel: { $in: channelIds } },
      ],
    })
      .populate("channel", "name avatar")
      .populate("likes", "username photoUrl");

    // 4️⃣ Playlists
    const playlists = await Playlist.find({
      $or: [
        buildRegexQuery(["title", "description"]),
        { channel: { $in: channelIds } },
      ],
    })
      .populate("channel", "name avatar")
      .populate({
        path: "videos",
        populate: { path: "channel", select: "name avatar" },
      });

    return res.status(200).json({
      keyword, // final corrected keyword used
      channels: matchedChannels,
      videos,
      shorts,
      playlists,
    });
  } catch (error) {
    console.error("Search error:", error);
    return res
      .status(500)
      .json({ message: `Failed to search: ${error.message}` });
  }
};

export const filterCategoryWithAi = async (req, res) => {
  try {
    const { input } = req.body;
    if (!input) {
      return res.status(400).json({ message: "Search query is required" });
    }

    // 🔹 Initialize Gemini
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    const categories = [
      "Music",
      "Gaming",
      "Movies",
      "TV Shows",
      "News",
      "Trending",
      "Entertainment",
      "Education",
      "Science & Tech",
      "Travel",
      "Fashion",
      "Cooking",
      "Sports",
      "Pets",
      "Art",
      "Comedy",
      "Vlogs",
    ];

    const prompt = `
You are a category classifier for a video streaming platform.

User query: "${input}"

Choose the most relevant categories ONLY from:
${categories.join(", ")}

Rules:
- Return comma-separated category names
- No explanation
- No JSON
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    // 🔹 Normalize + dedupe AI output
    const keywords = [
      ...new Set(
        response.text
          .toLowerCase()
          .split(",")
          .map((k) => k.trim())
          .filter(Boolean),
      ),
    ];

    if (!keywords.length) {
      return res.status(200).json({
        videos: [],
        shorts: [],
        keywords: [],
      });
    }

    // 🔹 Build SAFE query conditions
    const videoConditions = [];
    const shortConditions = [];

    keywords.forEach((kw) => {
      videoConditions.push(
        { category: { $regex: `^${kw}$`, $options: "i" } },
        { tags: kw },
      );

      shortConditions.push(
        { category: { $regex: `^${kw}$`, $options: "i" } },
        { tags: kw },
      );
    });

    // 🔹 Query DB
    const videosRaw = await Video.find({ $or: videoConditions })
      .populate("channel", "name avatar")
      .populate("comments.author", "username photoUrl")
      .populate("comments.replies.author", "username photoUrl");

    const shortsRaw = await Short.find({ $or: shortConditions })
      .populate("channel", "name avatar")
      .populate("likes", "username photoUrl");

    // 🔥 Deduplicate by Mongo _id
    const dedupeById = (arr) =>
      Array.from(
        new Map(arr.map((item) => [item._id.toString(), item])).values(),
      );

    const videos = dedupeById(videosRaw);
    const shorts = dedupeById(shortsRaw);

    return res.status(200).json({
      videos,
      shorts,
      keywords,
    });
  } catch (error) {
    console.error("Filter error:", error);
    return res.status(500).json({
      message: "Failed to filter content",
      error: error.message,
    });
  }
};
