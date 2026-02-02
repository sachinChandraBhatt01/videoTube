import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setVideoHistory, setShortHistory } from "../redux/userSlice"; 
import axios from "axios";
import { serverUrl } from "../App";

const useGetHistroy = (userData) => {
  const dispatch = useDispatch();

  const { historyRefresh } = useSelector((state) => state.user); // Ensure user state is available

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const result = await axios.get(serverUrl + "/api/user/gethistory", {
          withCredentials: true,
        });
        console.log("🔄 Fetching history from server..." , result);
        const history = result.data || [];

        // ✅ Split videos & shorts
        const videos = history.filter(item => item.contentType === "Video");
        const shorts = history.filter(item => item.contentType === "Short");

        // Redux dispatch
        dispatch(setVideoHistory(videos));
        dispatch(setShortHistory(shorts));

        console.log("📺 History fetched:", { videos, shorts });
      } catch (error) {
        console.error("❌ Error fetching history:", error);

        // Agar error ho to empty history
        dispatch(setVideoHistory([]));
        dispatch(setShortHistory([]));
      }
    };

    fetchHistory();
  }, [dispatch , historyRefresh, userData]); // Re-fetch when historyRefresh changes
};

export default useGetHistroy;  