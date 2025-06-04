import React from "react";
import FrameworksStatsCard from "./FrameworksStatsCard";

const ProfileSection = ({
  imageUrl,
  name,
  username,
  bio,
  countryFlagUrl,
  coverImageUrl,
  emoji,
  githubUsername,
}) => {
  return (
    <div className="relative">
      {/* Cover Image */}
      <div
        className="w-full h-32 md:h-48 border-blue-500 border-4 rounded-lg bg-cover bg-center mb-[-4rem] md:mb-[-6rem]"
        style={{ backgroundImage: `url(${coverImageUrl})` }}
      />

      {/* Profile Content */}
     <div className="flex flex-col items-center relative z-10">
        <div className="relative">
          <img
            src={imageUrl}
            alt={name}
            className="w-48 h-48 rounded-full border-4 border-blue-500 shadow-lg"
          />
          <div className="absolute bottom-2 right-2 bg-blue-500 rounded-full p-1 border-2 border-white w-15 h-15">
            <span className="text-white text-4xl">{emoji ? emoji : "👨🏻‍💻"}</span>
          </div>
        </div>
        <div className="flex items-center space-x-2 pt-2">
          <h1 className="text-3xl font-bold text-white">{name}</h1>
          {countryFlagUrl && (
            <img src={countryFlagUrl} alt="Country Flag" className="w-8 h-8" />
          )}
        </div>
        <div className="flex items-center space-x-2">
          Profile Views:{" "}
          <img
            src={`https://profile-counter.glitch.me/${githubUsername}/count.svg`}
          />
        </div>
        <h2 className="text-xl text-gray-400">@{username}</h2>
        <p className="text-gray-300 max-w-xs">{bio}</p>
      </div>
      <FrameworksStatsCard />
    </div>
  );
};

export default ProfileSection;