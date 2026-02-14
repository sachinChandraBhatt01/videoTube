import axios from "axios";
import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  FaThumbsUp,
  FaThumbsDown,
  FaComment,
  FaPlay,
  FaDownload,
  FaBookmark,
  FaArrowDown,
  FaVolumeMute,
  FaVolumeUp,
} from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { serverUrl } from "../App";
import { ClipLoader } from "react-spinners";
import { setRecommendationData } from "../redux/contentSlice";
import Description from "../component/Description";
import { setSubscribeChannel } from "../redux/userSlice";
// import [setSubscribeChannel]

const WatchShortPage = () => {
  const { shortId } = useParams();
  const { userData, subscribeChannel } = useSelector(
    (state) => state.user,
  );
  const { allShortData, recommendationData } = useSelector(
    (state) => state.content,
  );

  const [subscribeData, setSubscribeData] = useState(subscribeChannel);

  // const [subscribeChannel] = useSelector()

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const selectedShort = allShortData?.find((s) => s._id === shortId);

  const [shortsList, setShortsList] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [pausedIndex, setPausedIndex] = useState(null);
  const [muted, setMuted] = useState(false);
  const [openCommentShortId, setOpenCommentShortId] = useState(null);
  const [comments, setComments] = useState({});
  const [newComment, setNewComment] = useState("");
  const [replyText, setReplyText] = useState({});
  const [viewedShorts, setViewedShorts] = useState(new Set());
  const [loadingChannelId, setLoadingChannelId] = useState(null);

  const containerRef = useRef(null);
  const videoRefs = useRef([]);

  // Prepare shorts order
  useEffect(() => {
    if (!allShortData?.length) return;

    if (selectedShort) {
      const remaining = allShortData.filter((s) => s._id !== selectedShort._id);
      setShortsList([selectedShort, ...remaining]);
      setActiveIndex(0);
    } else {
      setShortsList(allShortData);
    }
  }, [allShortData, selectedShort]);

  // Add view only once
  const handleAddView = useCallback(
    async (id) => {
      if (!id || viewedShorts.has(id)) return;

      try {
        await axios.put(
          `${serverUrl}/api/content/short/${id}/add-view`,
          {},
          { withCredentials: true },
        );

        setViewedShorts((prev) => new Set(prev).add(id));

        if (!recommendationData) return;

        const updated = {
          ...recommendationData,
          recommendedShorts:
            recommendationData.recommendedShorts?.map((s) =>
              s._id === id ? { ...s, views: s.views + 1 } : s,
            ) || [],
          remainingShorts:
            recommendationData.remainingShorts?.map((s) =>
              s._id === id ? { ...s, views: s.views + 1 } : s,
            ) || [],
        };

        dispatch(setRecommendationData(updated));
      } catch (err) {
        console.error(err);
      }
    },
    [viewedShorts, recommendationData, dispatch],
  );

  // Scroll snap detection (NO intersection bug now)
  const handleScroll = () => {
    const container = containerRef.current;
    if (!container) return;

    const index = Math.round(container.scrollTop / container.clientHeight);

    if (index !== activeIndex) {
      setActiveIndex(index);
    }
  };

  // Auto play active video
  useEffect(() => {
    videoRefs.current.forEach((video, i) => {
      if (!video) return;

      if (i === activeIndex) {
        video.muted = muted;
        video
          .play()
          .then(() => setPausedIndex(null))
          .catch(() => {});
        handleAddView(shortsList[i]?._id);
      } else {
        video.pause();
        video.currentTime = 0;
      }
    });
  }, [activeIndex, muted, shortsList, handleAddView]);

  const togglePlayPause = (index) => {
    const video = videoRefs.current[index];
    if (!video) return;

    if (video.paused) {
      video
        .play()
        .then(() => setPausedIndex(null))
        .catch(() => {});
    } else {
      video.pause();
      setPausedIndex(index);
    }
  };

  const toggleMute = () => {
    const video = videoRefs.current[activeIndex];
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
  };

  const updateShortInState = (updatedShort) => {
    setShortsList((prev) =>
      prev.map((s) => (s._id === updatedShort._id ? updatedShort : s)),
    );
  };

  const handleAction = async (shortId, type) => {
    try {
      const res = await axios.put(
        `${serverUrl}/api/content/short/${shortId}/${type}`,
        {},
        { withCredentials: true },
      );
      updateShortInState(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubscribe = async (channelId) => {
    try {
      setLoadingChannelId(channelId);
      const res = await axios.post(
        `${serverUrl}/api/user/subscribe`,
        { channelId },
        { withCredentials: true },
      );

      const updatedChannel = res.data;
      // console.log(updatedChannel);
      // console.log("type of", typeof setSubscribeChannel);
      const newData = subscribeData.some(
        (item) => String(item._id) === String(channelId),
      )
        ? subscribeData.filter((item) => String(item._id) !== String(channelId))
        : [...subscribeData, updatedChannel];

      setSubscribeData(newData); // local update
      dispatch(setSubscribeChannel(newData)); // redux update

      // console.log("NEW DATA:", newData);
      // console.log("subscribe channel" , subscribeChannel);
      setShortsList((prev) =>
        prev.map((short) =>
          short.channel._id === channelId
            ? { ...short, channel: updatedChannel }
            : short,
        ),
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingChannelId(null);
    }
  };

  const handleAddComment = async (shortId) => {
    if (!newComment.trim()) return;

    try {
      const res = await axios.post(
        `${serverUrl}/api/content/short/${shortId}/comment`,
        { message: newComment },
        { withCredentials: true },
      );

      setComments((prev) => ({
        ...prev,
        [shortId]: res.data.comments,
      }));

      setNewComment("");
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddReply = async (shortId, commentId) => {
    if (!replyText[commentId]?.trim()) return;

    try {
      const res = await axios.post(
        `${serverUrl}/api/content/short/${shortId}/${commentId}/reply`,
        { message: replyText[commentId] },
        { withCredentials: true },
      );

      setComments((prev) => ({
        ...prev,
        [shortId]: res.data.comments,
      }));

      setReplyText((prev) => ({ ...prev, [commentId]: "" }));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed top-16 left-0 w-full md:w-[60vw] lg:w-full lg:left-0 md:left-[25vh] bottom-0 bg-black flex justify-center items-center overflow-hidden">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="w-full max-w-md h-full overflow-y-scroll snap-y snap-mandatory scroll-smooth"
      >
        {shortsList.map((short, index) => (
          <div
            key={short._id}
            className="relative snap-start h-full w-full flex items-center justify-center"
          >
            <video
              ref={(el) => (videoRefs.current[index] = el)}
              src={short.shortUrl}
              className="absolute inset-0 w-full h-full object-cover"
              loop
              playsInline
              onClick={() => togglePlayPause(index)}
            />

            {pausedIndex === index && (
              <div
                onClick={() => togglePlayPause(index)}
                className="absolute inset-0 flex items-center justify-center bg-black/40 z-20"
              >
                <FaPlay className="text-white text-6xl" />
              </div>
            )}

            {/* Right Controls */}
            {/* <div className="absolute right-4 bottom-28 flex flex-col gap-6 text-white z-30">
              <button
                onClick={toggleMute}
                className="bg-black/60 p-3 rounded-full backdrop-blur-md"
              >
                {muted ? <FaVolumeMute /> : <FaVolumeUp />}
              </button>

              <div className="absolute right-3 sm:right-5 bottom-24 sm:bottom-32 flex flex-col items-center gap-5 sm:gap-6">
                {[
                  {
                    icon: FaThumbsUp,
                    count: short.likes?.length,
                    active: short.likes?.includes(userData?._id),
                    action: () => handleAction(short._id, "toggle-like"),
                  },
                  {
                    icon: FaThumbsDown,
                    count: short.dislikes?.length,
                    active: short.dislikes?.includes(userData?._id),
                    action: () => handleAction(short._id, "toggle-dislike"),
                  },
                  {
                    icon: FaBookmark,
                    count: short.saveBy?.length,
                    active: short.saveBy?.includes(userData?._id),
                    action: () => handleAction(short._id, "toggle-save"),
                  },
                ].map((item, i) => (
                  <button
                    key={i}
                    onClick={(e) => {
                      e.stopPropagation();
                      item.action();
                    }}
                    className="flex flex-col items-center group transition-all duration-200"
                  >
                    <div
                      className={`
          flex items-center justify-center
          w-11 h-11 sm:w-12 sm:h-12 md:w-13 md:h-13
          rounded-full
          transition-all duration-200
          ${
            item.active
              ? "bg-white text-black scale-105"
              : "bg-black/60 backdrop-blur-md text-white hover:bg-black/80"
          }
        `}
                    >
                      <item.icon className="text-[18px] sm:text-[20px] md:text-[22px]" />
                    </div>

                    <span className="text-[11px] sm:text-xs mt-1 text-white">
                      {item.count || 0}
                    </span>
                  </button>
                ))}
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenCommentShortId(short._id);
                  setComments((prev) => ({
                    ...prev,
                    [short._id]: short.comments || [],
                  }));
                }}
                className="flex flex-col items-center"
              >
                <div className="p-3 rounded-full bg-black/60 backdrop-blur-md">
                  <FaComment />
                </div>
                <span className="text-xs mt-1">
                  {short.comments?.length || 0}
                </span>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const link = document.createElement("a");
                  link.href = short.shortUrl;
                  link.download = short.title || "short.mp4";
                  link.click();
                }}
                className="flex flex-col items-center"
              >
                <div className="p-3 rounded-full bg-black/60 backdrop-blur-md">
                  <FaDownload />
                </div>
              </button>
            </div> */}
            <div className="absolute right-3 sm:right-6 top-[40%] md:top-[36%] bottom-14 md:bottom-0 -translate-y-1/2 flex flex-col items-center gap-5 sm:gap-6 text-white z-30">
              {/* Mute */}
              <button
                onClick={toggleMute}
                className="flex flex-col items-center"
              >
                <div className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-full bg-black/60 backdrop-blur-md">
                  {muted ? (
                    <FaVolumeMute size={18} />
                  ) : (
                    <FaVolumeUp size={18} />
                  )}
                </div>
              </button>

              {/* Like / Dislike / Save */}
              {[
                {
                  icon: FaThumbsUp,
                  count: short.likes?.length,
                  active: short.likes?.includes(userData?._id),
                  action: () => handleAction(short._id, "toggle-like"),
                },
                {
                  icon: FaThumbsDown,
                  count: short.dislikes?.length,
                  active: short.dislikes?.includes(userData?._id),
                  action: () => handleAction(short._id, "toggle-dislike"),
                },
                {
                  icon: FaBookmark,
                  count: short.saveBy?.length,
                  active: short.saveBy?.includes(userData?._id),
                  action: () => handleAction(short._id, "toggle-save"),
                },
              ].map((item, i) => (
                <button
                  key={i}
                  onClick={(e) => {
                    e.stopPropagation();
                    item.action();
                  }}
                  className="flex flex-col items-center transition-all duration-200"
                >
                  <div
                    className={`
          w-10 h-10 sm:w-11 sm:h-11
          flex items-center justify-center
          rounded-full
          transition-all duration-200
          ${
            item.active
              ? "bg-white text-black scale-105"
              : "bg-black/60 backdrop-blur-md text-white hover:bg-black/80"
          }
        `}
                  >
                    <item.icon size={18} />
                  </div>

                  <span className="text-[11px] sm:text-xs mt-1">
                    {item.count || 0}
                  </span>
                </button>
              ))}

              {/* Comment */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenCommentShortId(short._id);
                  setComments((prev) => ({
                    ...prev,
                    [short._id]: short.comments || [],
                  }));
                }}
                className="flex flex-col items-center"
              >
                <div className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-full bg-black/60 backdrop-blur-md">
                  <FaComment size={18} />
                </div>
                <span className="text-[11px] sm:text-xs mt-1">
                  {short.comments?.length || 0}
                </span>
              </button>

              {/* Download */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const link = document.createElement("a");
                  link.href = short.shortUrl;
                  link.download = short.title || "short.mp4";
                  link.click();
                }}
                className="flex flex-col items-center"
              >
                <div className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-full bg-black/60 backdrop-blur-md">
                  <FaDownload size={18} />
                </div>
              </button>
            </div>

            {/* Bottom Info */}
            <div className="absolute bottom-14 md:bottom-0 left-0 right-0 p-4 pb-8 bg-gradient-to-t from-black via-black/70 to-transparent text-white z-20">
              <div className="flex items-center gap-3 mb-2">
                <img
                  src={short.channel?.avatar}
                  alt=""
                  className="w-10 h-10 rounded-full border cursor-pointer"
                  onClick={() => navigate(`/channelpage/${short.channel._id}`)}
                />
                <div>
                  <p className="font-semibold text-sm">
                    @{short.channel?.name}
                  </p>
                  <button
                    onClick={() => handleSubscribe(short.channel._id)}
                    className={`text-xs mt-1 px-3 py-1 rounded-full ${
                      short.channel?.subscribers?.includes(userData?._id)
                        ? "bg-gray-700"
                        : "bg-white text-black"
                    }`}
                  >
                    {loadingChannelId === short.channel._id ? (
                      <ClipLoader size={12} color="gray" />
                    ) : short.channel?.subscribers?.includes(userData?._id) ? (
                      "Subscribed"
                    ) : (
                      "Subscribe"
                    )}
                  </button>
                </div>
              </div>

              <h2 className="font-bold text-base line-clamp-2">
                {short.title}
              </h2>

              {short.description && (
                // <p className="text-sm text-gray-300 mt-1 line-clamp-2">
                //   {short.description}

                // </p>
                <Description text={short.description} width={50} />
              )}
            </div>

            {/* Comments Panel */}
            {openCommentShortId === short._id && (
              <div className="absolute bottom-0 left-0 right-0 h-[75%] bg-black/95 p-4 rounded-t-2xl overflow-y-auto text-white z-40">
                <div className="flex justify-between mb-3">
                  <h3 className="font-semibold text-lg">Comments</h3>
                  <FaArrowDown
                    className="cursor-pointer"
                    onClick={() => setOpenCommentShortId(null)}
                  />
                </div>

                <div className="flex gap-2 mb-4">
                  <input
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 bg-gray-800 p-2 rounded outline-none"
                  />
                  <button
                    onClick={() => handleAddComment(short._id)}
                    className="bg-white text-black px-4 rounded"
                  >
                    Post
                  </button>
                </div>

                {comments[short._id]?.map((c) => (
                  <div
                    key={c._id}
                    className="mb-4 border-b border-gray-800 pb-2"
                  >
                    <p className="text-sm font-semibold">
                      {c.author?.username}
                    </p>
                    <p className="text-sm text-gray-300">{c.message}</p>

                    {c.replies?.map((r) => (
                      <div key={r._id} className="ml-4 mt-2">
                        <p className="text-xs font-semibold">
                          {r.author?.username}
                        </p>
                        <p className="text-xs text-gray-400">{r.message}</p>
                      </div>
                    ))}

                    <input
                      value={replyText[c._id] || ""}
                      onChange={(e) =>
                        setReplyText((prev) => ({
                          ...prev,
                          [c._id]: e.target.value,
                        }))
                      }
                      placeholder="Reply..."
                      className="mt-2 w-full bg-gray-800 p-1 rounded text-xs outline-none"
                    />
                    <button
                      onClick={() => handleAddReply(short._id, c._id)}
                      className="text-xs mt-1 text-blue-400"
                    >
                      Reply
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default WatchShortPage;
