import React, { useEffect } from "react";
import { Route, Routes, Navigate, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import Shorts from "./pages/Shorts";
import YoutubeSignin from "./pages/YoutubeSignin";
import CustomAlert, { showCustomAlert } from "./component/CustomAlert";
import CreateAccount from "./pages/CreateAccount";
// import useGetCurrentUser from "./customHooks/useGetCurrentUser";
import { useDispatch, useSelector } from "react-redux";
import ForgetPassword from "./pages/ForgetPassword";
import CreateChannelFlow from "./pages/CreateChannelFlow";
import ViewChannel from "./pages/ViewChannel";
import UpdateChannel from "./pages/UpdateChannel";
import MobileProfile from "./pages/MobileProfile";
import CreatePage from "./pages/CreatePage";
import CreateVideo from "./pages/CreateVideo";
import CreatePost from "./pages/CreatePost";
import CreateShorts from "./pages/CreateShorts";
import CreatePlaylist from "./pages/CreatePlaylist";
import useGetChannelContent from "./customHooks/useGetChannelContent";
import useGetAllContentData from "./customHooks/useGetAllContentData";
import WatchVideoPage from "./pages/WatchVideoPage";
import WatchShortPage from "./pages/WatchShortPage";
import ChannelPage from "./pages/ChannelPage";
import SubscribePage from "./pages/SubscribePage";
import useGetSubscribedContent from "./customHooks/useGetSubscribedContent";
import SavedPlaylistPage from "./pages/SavedPlaylistPage";
import SavedContentPage from "./pages/SavedContentPage";
import LikedContentPage from "./pages/LikedContentPage";
import ScrollToTop from "./component/ScrollToTop";
import HistoryPage from "./pages/HistoryPage";
import useGetHistory from "./customHooks/useGetHistroy";
import PTStudio from "./pages/PTStudio";
import Dashboard from "./component/Dashboard";
import ContentPage from "./component/ContentPage";
import AnalyticsPage from "./component/AnalyticsPage";
import ManageVideo from "./pages/ManageVideo";
import ManageShort from "./pages/ManageShort";
import ManagePlaylist from "./pages/ManagePlaylist";
import useGetRecommendation from "./customHooks/useGetRecommendation";
import RevenuePage from "./component/RevenuePage";
import useGetChannel from "./customHooks/useGetChannel";
import useGetCurrentUser from "./customHooks/UsegetCurrentUser";

export const serverUrl =
  import.meta.env.VITE_BACKEND_URI || "http://localhost:8000";

const ProtectedRoute = ({ userData, children }) => {
  if (!userData) {
    showCustomAlert("Please sign up first to use this feature!");
    return <Navigate to="/" replace />;
  }
  return children;
};

function App() {
  const { userData } = useSelector((state) => state.user);

  useGetAllContentData();
  useGetCurrentUser();

  useGetChannel(userData);
  useGetChannelContent(userData);
  useGetSubscribedContent(userData);
  useGetHistory(userData);
  useGetRecommendation(userData);

  function ChannelPageWrapper() {
    const location = useLocation();
    return <ChannelPage key={location.pathname} />;
  }

  return (
    <>
      <CustomAlert />
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />}>
          <Route
            path="/shorts"
            element={
              <ProtectedRoute userData={userData}>
                <Shorts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/viewchannel"
            element={
              <ProtectedRoute userData={userData}>
                <ViewChannel />
              </ProtectedRoute>
            }
          />
          <Route
            path="/updatechannel"
            element={
              <ProtectedRoute userData={userData}>
                <UpdateChannel />
              </ProtectedRoute>
            }
          />
          <Route path="/mobileprofile" element={<MobileProfile />} />
          <Route
            path="/createpage"
            element={
              <ProtectedRoute userData={userData}>
                <CreatePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create-video"
            element={
              <ProtectedRoute userData={userData}>
                <CreateVideo />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create-post"
            element={
              <ProtectedRoute userData={userData}>
                <CreatePost />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create-short"
            element={
              <ProtectedRoute userData={userData}>
                <CreateShorts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create-playlist"
            element={
              <ProtectedRoute userData={userData}>
                <CreatePlaylist />
              </ProtectedRoute>
            }
          />
          <Route
            path="/watch-short/:shortId"
            element={
              <ProtectedRoute userData={userData}>
                <WatchShortPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/channelpage/:channelId"
            element={
              <ProtectedRoute userData={userData}>
                <ChannelPageWrapper />
              </ProtectedRoute>
            }
          />
          <Route
            path="/subscribepage"
            element={
              <ProtectedRoute userData={userData}>
                <SubscribePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/saveplaylist"
            element={
              <ProtectedRoute userData={userData}>
                <SavedPlaylistPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/savevideos"
            element={
              <ProtectedRoute userData={userData}>
                <SavedContentPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/likedvideos"
            element={
              <ProtectedRoute userData={userData}>
                <LikedContentPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute userData={userData}>
                <HistoryPage />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Routes outside Home */}
        <Route path="/signin" element={<YoutubeSignin />} />
        <Route path="/signup" element={<CreateAccount />} />
        <Route path="/forgetpassword" element={<ForgetPassword />} />
        <Route
          path="/createchannel"
          element={
            <ProtectedRoute userData={userData}>
              <CreateChannelFlow />
            </ProtectedRoute>
          }
        />
        <Route
          path="/watch-video/:videoId"
          element={
            <ProtectedRoute userData={userData}>
              <WatchVideoPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/ptstudio"
          element={
            <ProtectedRoute userData={userData}>
              <PTStudio />
            </ProtectedRoute>
          }
        >
          <Route
            path="/ptstudio/dashboard"
            element={
              <ProtectedRoute userData={userData}>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ptstudio/content"
            element={
              <ProtectedRoute userData={userData}>
                <ContentPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ptstudio/analytics"
            element={
              <ProtectedRoute userData={userData}>
                <AnalyticsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ptstudio/revenue"
            element={
              <ProtectedRoute userData={userData}>
                <RevenuePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ptstudio/managevideo/:videoId"
            element={
              <ProtectedRoute userData={userData}>
                <ManageVideo />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ptstudio/manageshort/:shortId"
            element={
              <ProtectedRoute userData={userData}>
                <ManageShort />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ptstudio/manageplaylist/:playlistId"
            element={
              <ProtectedRoute userData={userData}>
                <ManagePlaylist />
              </ProtectedRoute>
            }
          />
        </Route>
      </Routes>
    </>
  );
}

export default App;
