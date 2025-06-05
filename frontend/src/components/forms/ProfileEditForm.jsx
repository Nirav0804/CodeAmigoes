import React, { useState, useEffect } from "react";
import {
  User,
  Lock,
  Mail,
  Building,
  Github,
  Code,
  FileCode,
  BookOpen,
  Linkedin,
  Twitter,
  Instagram,
  Film,
  Image,
  Sticker,
} from "lucide-react";
import Navigation from "../navigation/Navigation";
import GradientBackground from "../background/GradientBackground";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
const API_BASE = import.meta.env.VITE_API_BASE_URL;

// Reuse the Input component with icon support
const Input = ({ label, error, icon: Icon, ...props }) => (
  <div className="w-full">
    {label && (
      <label className="block text-sm font-medium text-gray-200 mb-1">
        {label}
      </label>
    )}
    <div className="relative">
      {Icon && (
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Icon className="h-5 w-5 text-gray-400" />
        </div>
      )}
      <input
        className={`w-full ${Icon ? "pl-10" : "pl-3"
          } py-2 bg-gray-900/50 border ${error ? "border-red-500" : "border-gray-700"
          } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400`}
        {...props}
      />
    </div>
    {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
  </div>
);

const Textarea = ({ label, error, ...props }) => (
  <div className="w-full">
    {label && (
      <label className="block text-sm font-medium text-gray-200 mb-1">
        {label}
      </label>
    )}
    <textarea
      className={`w-full px-3 py-2 bg-gray-900/50 border ${error ? "border-red-500" : "border-gray-700"
        } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400`}
      {...props}
    />
    {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
  </div>
);

const ProfileEditForm = () => {
  const { username } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    username: null,
    password: null,
    displayName: null,
    email: null,
    collegeName: null,
    githubUsername: null,
    leetcodeUsername: null,
    codechefUsername: null,
    bio: null,
    linkedinurl: null,
    twitterusername: null,
    instagramusername: null,
    portfolioUrl: null,
    resumeUrl: null,
    coverPhotoUrl: null,
    emoji: null,
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get(
          `${API_BASE}/api/users/${username}`, {
          withCredentials: true, // <-- This sends cookies!
        });
        // console.log(response.data);

        const profile = response.data;
        setFormData({
          email: profile.email,
          leetcodeUsername: profile.leetcodeUsername,
          codechefUsername: profile.codechefUsername,
          bio: profile.bio,
          linkedinurl: profile.linkedinurl,
          twitterusername: profile.twitterusername,
          instagramusername: profile.instagramusername,
          resumeUrl: profile.resumeUrl,
          portfolioUrl: profile.portfolioUrl,
          coverPhotoUrl: profile.coverPhotoUrl,
          emoji: profile.emoji,
        });
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch profile");
      }
    };
    fetchProfile();
  }, []);

  const [formErrors, setFormErrors] = useState({});

  const validateForm = () => {
    const errors = {};

    // URL validations
    const urlRegex = /^https?:\/\/.+/;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (formData.email && !emailRegex.test(formData.email))
      errors.email = "Please enter a valid email";

    if (formData.linkedinurl && !urlRegex.test(formData.linkedinurl))
      errors.linkedinurl = "Please enter a valid URL";

    return errors;
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setFormErrors((prev) => ({
      ...prev,
      [field]: undefined,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.put(
        `${API_BASE}/api/users/${username}`,
        formData, // body
        {
          withCredentials: true, // correctly placed
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      setSuccess(true);
      navigate(`/dashboard/profile/${username}`)
      // Optionally redirect or show success message
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <GradientBackground className="min-h-screen">
      <Navigation />
      <div className="max-w-3xl mx-auto pt-32">
        <div className="bg-black/50 backdrop-blur-sm border border-gray-800 rounded-lg shadow-xl">
          {/* Form Header */}
          <div className="p-6 border-b border-gray-800">
            <h2 className="text-2xl font-bold text-white">Edit Profile</h2>
              <p className="mt-1 text-gray-400">
                Update your profile information and social links
              </p>
          </div>

          {/* Form Content */}
          <div className="p-6">
            {error && (
              <div className="mb-4 p-4 bg-red-500/10 border border-red-500 rounded-lg">
                <p className="text-red-500">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-4 p-4 bg-green-500/10 border border-green-500 rounded-lg">
                <p className="text-green-500">Profile updated successfully!</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <Input
                  label="Email"
                  icon={Mail}
                  type="email"
                  placeholder="Enter email (optional)"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  error={formErrors.email}
                />
                <Input
                  label="LeetCode Username"
                  icon={Code}
                  placeholder="Enter LeetCode username (optional)"
                  value={formData.leetcodeUsername}
                  onChange={(e) =>
                    handleInputChange("leetcodeUsername", e.target.value)
                  }
                />

                <Input
                  label="CodeChef Username"
                  icon={FileCode}
                  placeholder="Enter CodeChef username (optional)"
                  value={formData.codechefUsername}
                  onChange={(e) =>
                    handleInputChange("codechefUsername", e.target.value)
                  }
                />

                <Input
                  label="LinkedIn URL"
                  icon={Linkedin}
                  placeholder="Enter LinkedIn profile URL (optional)"
                  value={formData.linkedinurl}
                  onChange={(e) =>
                    handleInputChange("linkedinurl", e.target.value)
                  }
                  error={formErrors.linkedinurl}
                />

                <Input
                  label="X (Twitter) Username"
                  icon={Twitter}
                  placeholder="Enter X username (optional)"
                  value={formData.twitterusername}
                  onChange={(e) =>
                    handleInputChange("twitterusername", e.target.value)
                  }
                />

                <Input
                  label="Instagram Username"
                  icon={Instagram}
                  placeholder="Enter Instagram username (optional)"
                  value={formData.instagramusername}
                  onChange={(e) =>
                    handleInputChange("instagramusername", e.target.value)
                  }
                />

                <Input
                  label="Resume URL"
                  icon={FileCode}
                  placeholder="Enter resume URL (optional)"
                  value={formData.resumeUrl}
                  onChange={(e) =>
                    handleInputChange("resumeUrl", e.target.value)
                  }
                  error={formErrors.resumeUrl}
                />

                <Input
                  label="Portfolio URL"
                  icon={Code}
                  placeholder="Enter portfolio URL (optional)"
                  value={formData.portfolioUrl}
                  onChange={(e) =>
                    handleInputChange("portfolioUrl", e.target.value)
                  }
                  error={formErrors.portfolioUrl}
                />
                <Input
                  label="Cover Picture URL"
                  icon={Image}
                  placeholder="Enter Cover Picture URL (optional)"
                  value={formData.coverPhotoUrl}
                  onChange={(e) =>
                    handleInputChange("coverPhotoUrl", e.target.value)
                  }
                  error={formErrors.coverPhotoUrl}
                />

                <Input
                  label="Emoji"
                  icon={Sticker}
                  placeholder="Enter Emoji (optional)"
                  value={formData.emoji}
                  onChange={(e) => handleInputChange("emoji", e.target.value)}
                  error={formErrors.emoji}
                />
              </div>

              <Textarea
                label="Bio"
                placeholder="Tell us about yourself (optional)"
                value={formData.bio}
                onChange={(e) => handleInputChange("bio", e.target.value)}
                rows={4}
              />

              <button
                type="submit"
                className="w-full py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50"
                disabled={loading}
              >
                {loading ? "Updating..." : "Update Profile"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </GradientBackground>
  );
};

export default ProfileEditForm;
