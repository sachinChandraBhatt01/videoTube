import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import { serverUrl } from "../App";
import axios from "axios";
import { setRecommendationData } from "../redux/contentSlice";

const UseGetRecommendation = (userData) => {
   const dispatch = useDispatch();
 const { recommendationRefresh } = useSelector(
    (state) => state.content
  );
  useEffect(() => {
    const fetchRecommendation = async () => {
      try {
        const res = await axios.get(
          `${serverUrl}/api/user/getrecommendation`,
          { withCredentials: true }
        );
        dispatch(setRecommendationData(res.data))
        console.log("Recommendation data:");
      } catch (err) {
        console.error("Recommendation fetch error:", err);
      }
    };

    fetchRecommendation();
  }, [dispatch , recommendationRefresh , userData]);

  return null; // hook kuch render nahi karega
}

export default UseGetRecommendation