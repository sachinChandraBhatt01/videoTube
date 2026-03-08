import React from "react";
import ShortsCard from "./ShortsCard";
import { SiYoutubeshorts } from "react-icons/si";

const ShortsPage = ({ shortData }) => {
  const allShortData = shortData || {};
  const latestShorts = allShortData?.slice(0, 10) || [];

  return (
    <div className="px-6 py-4">
      {/* Heading */}
      <h2 className="text-xl font-bold mb-4 flex items-center gap-1">
        <SiYoutubeshorts className="w-6 h-6 text-red-600" />
        Shorts
      </h2>

      {/* Horizontal scroll with fixed width cards */}
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {latestShorts.map((short) => {
          // console.log("rendering short", short);
          return (
            <div key={short._id} className="flex-shrink-0">
              <ShortsCard
                shortUrl={short.shortUrl}
                title={short.title}
                channelName={short.channel?.name}
                views={short.views}
                id={short?._id}
                avatar={short.channel?.avatar}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ShortsPage;
