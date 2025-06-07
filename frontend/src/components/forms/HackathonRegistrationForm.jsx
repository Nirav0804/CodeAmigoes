import React, { useState, useEffect, use } from "react";
import { Calendar, Upload, Globe, Plus, Trash2 } from "lucide-react";
import Navigation from "../navigation/Navigation";
import GradientBackground from "../background/GradientBackground";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
const API_BASE = import.meta.env.VITE_API_BASE_URL;
const Input = ({ label, error, ...props }) => (
  <div className="w-full">
    {label && (
      <label className="block text-sm font-medium text-gray-200 mb-1">
        {label}
      </label>
    )}
    <input
      className={`w-full px-3 py-2 bg-gray-900/50 border ${error ? "border-red-500" : "border-gray-700"
        } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400`}
      {...props}
    />
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

const Select = ({ label, error, options, ...props }) => (
  <div className="w-full">
    {label && (
      <label className="block text-sm font-medium text-gray-200 mb-1">
        {label}
      </label>
    )}
    <select
      className={`w-full px-3 py-2 bg-gray-900/50 border ${error ? "border-red-500" : "border-gray-700"
        } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white`}
      {...props}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
    {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
  </div>
);

const RadioGroup = ({ label, options, value, onChange, error, ...props }) => (
  <div className="w-full">
    {label && (
      <label className="block text-sm font-medium text-gray-200 mb-2">
        {label}
      </label>
    )}
    <div className="flex space-x-4">
      {options.map((option) => (
        <label
          key={option.value}
          className="flex items-center space-x-2 cursor-pointer"
        >
          <input
            type="radio"
            value={option.value}
            checked={value === option.value}
            onChange={onChange}
            className="w-4 h-4 text-blue-500 border-gray-700 focus:ring-blue-500"
            {...props}
          />
          <span className="text-gray-200">{option.label}</span>
        </label>
      ))}
    </div>
    {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
  </div>
);

const StepIndicator = ({ currentStep, totalSteps }) => (
  <div className="flex items-center space-x-4 mb-4">
    {[...Array(totalSteps)].map((_, index) => (
      <React.Fragment key={index}>
        <span
          className={`h-8 w-8 rounded-full flex items-center justify-center ${index + 1 <= currentStep
            ? "bg-blue-500 text-white"
            : "bg-gray-700 text-gray-300"
            }`}
        >
          {index + 1}
        </span>
        {index < totalSteps - 1 && <div className="h-0.5 w-8 bg-gray-600" />}
      </React.Fragment>
    ))}
  </div>
);

const HackathonRegistrationForm = () => {
  const { userId, username } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [formData, setFormData] = useState({
    logo: null,
    title: "",
    organization: "",
    theme: "",
    location: "",
    mode: "online",
    about: "",
    teamSize: { min: 1, max: 4 },
    registrationDates: {
      start: "",
      end: "",
    },
    hackathonDates: {
      start: "",
      end: "",
    },
    techStacks: [],
    createdBy: username,
    createdById: userId,
  });

  const [formErrors, setFormErrors] = useState({});

  const allTechStackOptions = [
    { value: "", label: "Select Technology" },
    { value: "Spring Boot", label: "Spring Boot" },
    { value: "React", label: "React" },
    { value: "Express", label: "Express" },
    { value: "NextJs", label: "Next.js" },
    { value: "VueJs", label: "Vue.js" },
    { value: "NuxtJs", label: "Nuxt.js" },
    { value: "NestJS", label: "NestJS" },
    { value: "Angular", label: "Angular" },
    { value: "Svelte", label: "Svelte" },
    { value: "Remix", label: "Remix" },
    { value: "Flask", label: "Flask" },
    { value: "Django", label: "Django" },
    { value: "FastAPI", label: "FastAPI" },
    { value: "Laravel", label: "Laravel" },
    { value: "Ruby on Rails", label: "Ruby on Rails" },
    { value: "Gin", label: "Gin" },
    { value: "Actix Web", label: "Actix Web" },
    { value: "Rocket", label: "Rocket" },
    { value: "Vapor", label: "Vapor" },
    { value: "Flutter", label: "Flutter" },
    { value: "ASP Dot NET Core", label: "ASP.NET Core" },
  ];

  const getAvailableOptions = (currentIndex) => {
    const selectedTechs = formData.techStacks.filter(
      (_, index) => index !== currentIndex && _ !== ""
    );
    return allTechStackOptions.filter(
      (option) =>
        option.value === "" || !selectedTechs.includes(option.value)
    );
  };

  const validateStep1 = () => {
    const errors = {};
    if (!formData.title.trim()) errors.title = "Title is required";
    if (!formData.organization.trim())
      errors.organization = "Organization is required";
    if (!formData.about.trim()) errors.about = "Description is required";
    if (formData.techStacks.length === 0)
      errors.techStacks = "At least one tech stack is required";
    formData.techStacks.forEach((tech, index) => {
      if (!tech) errors[`techStack${index}`] = "Technology is required";
    });
    return errors;
  };

  const validateStep2 = () => {
    const errors = {};
    if (!formData.registrationDates.start)
      errors.RegStartDate = "Start date is required";
    if (!formData.registrationDates.end)
      errors.RegEndDate = "End date is required";
    if (!formData.hackathonDates.start)
      errors.HackStartDate = "Start date is required";
    if (!formData.hackathonDates.end)
      errors.HackEndDate = "End date is required";
    if (new Date(formData.registrationDates.start) <= new Date()) {
      errors.RegStartDate = "Start date must be in the future";
    }
    if (new Date(formData.registrationDates.end) <= new Date()) {
      errors.RegEndDate = "End date must be in the future";
    }
    if (
      new Date(formData.registrationDates.end) <=
      new Date(formData.registrationDates.start)
    ) {
      errors.RegEndDate = "End date must be greater than start date";
    }
    if (new Date(formData.hackathonDates.start) <= new Date()) {
      errors.HackStartDate = "Start date must be in the future";
    }
    if (new Date(formData.hackathonDates.end) <= new Date()) {
      errors.HackEndDate = "End date must be in the future";
    }
    if (
      new Date(formData.hackathonDates.end) <=
      new Date(formData.hackathonDates.start)
    ) {
      errors.HackEndDate = "End date must be greater than start date";
    }
    if (
      new Date(formData.hackathonDates.start) <=
      new Date(formData.registrationDates.end)
    ) {
      errors.HackStartDate =
        "Hackathon start date must be after registration end date";
    }
    return errors;
  };

  const handleInputChange = (field, value, index) => {
    if (field === "techStack") {
      const newTechStacks = [...formData.techStacks];
      newTechStacks[index] = value;
      setFormData((prev) => ({
        ...prev,
        techStacks: newTechStacks,
      }));
      setFormErrors((prev) => ({
        ...prev,
        [`techStack${index}`]: undefined,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
      setFormErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const addTechStack = () => {
    const availableOptions = allTechStackOptions.filter(
      (option) =>
        option.value === "" || !formData.techStacks.includes(option.value)
    );
    if (availableOptions.length <= 1) {
      setFormErrors((prev) => ({
        ...prev,
        techStacks: "No more technologies available to add",
      }));
      return;
    }
    setFormData((prev) => ({
      ...prev,
      techStacks: [...prev.techStacks, ""],
    }));
    setFormErrors((prev) => ({
      ...prev,
      techStacks: undefined,
    }));
  };

  const removeTechStack = (index) => {
    setFormData((prev) => ({
      ...prev,
      techStacks: prev.techStacks.filter((_, i) => i !== index),
    }));
    setFormErrors((prev) => ({
      ...prev,
      [`techStack${index}`]: undefined,
      techStacks: undefined,
    }));
  };

  const handleNext = () => {
    const errors = validateStep1();
    if (Object.keys(errors).length === 0) {
      setStep(2);
      setFormErrors({});
    } else {
      setFormErrors(errors);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateStep2();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const submitFormData = new FormData();
      if (formData.logo) {
        submitFormData.append("logo", formData.logo);
      }
      const dataWithoutLogo = {
        ...formData,
        logo: null,
        registrationDates: {
          start: formData.registrationDates.start.replace("T", " ") + ":00",
          end: formData.registrationDates.end.replace("T", " ") + ":00",
        },
        hackathonDates: {
          start: formData.hackathonDates.start.replace("T", " ") + ":00",
          end: formData.hackathonDates.end.replace("T", " ") + ":00",
        },
      };
      submitFormData.append("data", JSON.stringify(dataWithoutLogo));

      const response = await axios.post(
        `${API_BASE}/api/hackathons`,
        submitFormData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          withCredentials: true, // <-- This line enables cookies!
        }
      );

      setSuccess(true);
      navigate("/dashboard/hackathons");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create hackathon");
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 1048576) {
        setFormErrors((prev) => ({
          ...prev,
          logo: "File size must be less than 1MB",
        }));
        return;
      }
      if (!file.type.match("image.*")) {
        setFormErrors((prev) => ({
          ...prev,
          logo: "Please upload an image file",
        }));
        return;
      }
      const preview = URL.createObjectURL(file);
      setPreviewUrl(preview);
      setFormData((prev) => ({
        ...prev,
        logo: file,
      }));
      setFormErrors((prev) => ({
        ...prev,
        logo: undefined,
      }));
    }
  };

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <GradientBackground className="min-h-screen">
      <Navigation />
      <div className="max-w-3xl mx-auto pt-32">
        <div className="max-w-3xl mx-auto">
          <div className="bg-black/50 backdrop-blur-sm border border-gray-800 rounded-lg shadow-xl">
            <div className="p-6 border-b border-gray-800">
              <StepIndicator currentStep={step} totalSteps={2} />
              <h2 className="text-2xl font-bold text-white">
                {step === 1 ? "Basic Details" : "Registration Details"}
              </h2>
              <p className="mt-1 text-gray-400">
                {step === 1
                  ? "Fill in the basic information about your hackathon"
                  : "Configure registration settings and requirements"}
              </p>
            </div>
            <div className="p-6">
              {error && (
                <div className="mb-4 p-4 bg-red-500/10 border border-red-500 rounded-lg">
                  <p className="text-red-500">{error}</p>
                </div>
              )}
              {success && (
                <div className="mb-4 p-4 bg-green-500/10 border border-green-500 rounded-lg">
                  <p className="text-green-500">
                    Hackathon created successfully!
                  </p>
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-6">
                {step === 1 ? (
                  <>
                    <div className="w-full">
                      <label className="block text-sm font-medium text-gray-200 mb-1">
                        Hackathon Logo
                      </label>
                      <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-700 border-dashed rounded-lg">
                        <div className="space-y-1 text-center">
                          {previewUrl ? (
                            <div className="flex flex-col items-center">
                              <img
                                src={previewUrl}
                                alt="Preview"
                                className="h-64 w-96 object-cover rounded-lg mb-2"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  URL.revokeObjectURL(previewUrl);
                                  setPreviewUrl(null);
                                  setFormData((prev) => ({
                                    ...prev,
                                    logo: null,
                                  }));
                                }}
                                className="text-sm text-red-500 hover:text-red-400"
                              >
                                Remove
                              </button>
                            </div>
                          ) : (
                            <>
                              <Upload className="mx-auto h-12 w-12 text-gray-400" />
                              <div className="flex text-sm text-gray-400">
                                <label className="relative cursor-pointer rounded-md font-medium text-blue-500 hover:text-blue-400">
                                  <span>Upload a file</span>
                                  <input
                                    type="file"
                                    className="sr-only"
                                    onChange={handleLogoUpload}
                                    accept="image/*"
                                  />
                                </label>
                                <p className="pl-1">or drag and drop</p>
                              </div>
                              <p className="text-xs text-gray-400">
                                PNG, JPG, GIF up to 1MB
                              </p>
                            </>
                          )}
                          {formErrors.logo && (
                            <p className="mt-1 text-sm text-red-500">
                              {formErrors.logo}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <Input
                      label="Hackathon Title"
                      placeholder="Enter hackathon title"
                      value={formData.title}
                      onChange={(e) =>
                        handleInputChange("title", e.target.value)
                      }
                      error={formErrors.title}
                    />
                    <Input
                      label="Organization"
                      placeholder="Enter organization name"
                      value={formData.organization}
                      onChange={(e) =>
                        handleInputChange("organization", e.target.value)
                      }
                      error={formErrors.organization}
                    />
                    <Input
                      label="Theme"
                      placeholder="Enter hackathon theme"
                      value={formData.theme}
                      onChange={(e) =>
                        handleInputChange("theme", e.target.value)
                      }
                    />
                    <Input
                      label="Location"
                      placeholder="Enter hackathon Location"
                      value={formData.location}
                      onChange={(e) =>
                        handleInputChange("location", e.target.value)
                      }
                    />
                    <RadioGroup
                      label="Mode of Event"
                      options={[
                        { value: "online", label: "Online" },
                        { value: "offline", label: "Offline" },
                      ]}
                      value={formData.mode}
                      onChange={(e) =>
                        handleInputChange("mode", e.target.value)
                      }
                    />
                    <Textarea
                      label="About Hackathon"
                      placeholder="Describe your hackathon, including rules, eligibility, and format"
                      value={formData.about}
                      onChange={(e) =>
                        handleInputChange("about", e.target.value)
                      }
                      rows={6}
                      error={formErrors.about}
                    />
                    <div className="space-y-4">
                      <label className="block text-sm font-medium text-gray-200">
                        Tech Stacks
                      </label>
                      {formErrors.techStacks && (
                        <p className="text-sm text-red-500">
                          {formErrors.techStacks}
                        </p>
                      )}
                      {formData.techStacks.map((tech, index) => (
                        <div key={index} className="flex items-center space-x-4">
                          <div className="flex-1">
                            <Select
                              label={`Tech Stack ${index + 1}`}
                              options={getAvailableOptions(index)}
                              value={tech}
                              onChange={(e) =>
                                handleInputChange("techStack", e.target.value, index)
                              }
                              error={formErrors[`techStack${index}`]}
                            />
                          </div>
                          {formData.techStacks.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeTechStack(index)}
                              className="p-2 text-red-500 hover:text-red-400"
                              title="Remove Tech Stack"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={addTechStack}
                        className="flex items-center px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                      >
                        <Plus className="h-5 w-5 mr-2" />
                        Add Tech Stack
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={handleNext}
                      className="w-full py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50"
                      disabled={loading}
                    >
                      Next
                    </button>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-200">
                        Team Size(min)
                      </label>
                      <div className="space-x-4">
                        <Input
                          type="number"
                          placeholder="Min Team Size"
                          value={formData.teamSize.min}
                          onChange={(e) =>
                            handleInputChange("teamSize", {
                              ...formData.teamSize,
                              min: parseInt(e.target.value),
                            })
                          }
                          className="w-24 bg-white"
                          min="1"
                          error={formErrors.teamSizeMin}
                        />
                        <label className="text-sm font-medium text-gray-200">
                          Team size(max)
                        </label>
                        <Input
                          type="number"
                          placeholder="Max Team Size"
                          value={formData.teamSize.max}
                          onChange={(e) =>
                            handleInputChange("teamSize", {
                              ...formData.teamSize,
                              max: parseInt(e.target.value),
                            })
                          }
                          className="w-24 bg-white"
                          min={formData.teamSize.min}
                          error={formErrors.teamSizeMax}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <Input
                        label="Registration Start Date"
                        type="datetime-local"
                        value={formData.registrationDates.start}
                        onChange={(e) =>
                          handleInputChange("registrationDates", {
                            ...formData.registrationDates,
                            start: e.target.value,
                          })
                        }
                        error={formErrors.RegStartDate}
                         className="bg-white text-black border border-gray-300 rounded px-3 py-2"

                      />
                      <Input
                        label="Registration End Date"
                        type="datetime-local"
                        value={formData.registrationDates.end}
                        onChange={(e) =>
                          handleInputChange("registrationDates", {
                            ...formData.registrationDates,
                            end: e.target.value,
                          })
                        }
                        error={formErrors.RegEndDate}
                         className="bg-white text-black border border-gray-300 rounded px-3 py-2"

                      />
                    </div>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <Input
                        label="Hackathon Start Date"
                        type="datetime-local"
                        value={formData.hackathonDates.start}
                        onChange={(e) =>
                          handleInputChange("hackathonDates", {
                            ...formData.hackathonDates,
                            start: e.target.value,
                          })
                        }
                        error={formErrors.HackStartDate}
                         className="bg-white text-black border border-gray-300 rounded px-3 py-2"

                      />
                      <Input
                        label="Hackathon End Date"
                        type="datetime-local"
                        value={formData.hackathonDates.end}
                        onChange={(e) =>
                          handleInputChange("hackathonDates", {
                            ...formData.hackathonDates,
                            end: e.target.value,
                          })
                        }
                        error={formErrors.HackEndDate}
                         className="bg-white text-black border border-gray-300 rounded px-3 py-2"

                      />
                    </div>
                    <div className="flex space-x-4">
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="w-full py-2 px-4 bg-transparent hover:bg-gray-800 text-white border border-gray-600 rounded-lg transition-colors disabled:opacity-50"
                        disabled={loading}
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        className="w-full py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50"
                        disabled={loading}
                      >
                        {loading ? "Creating..." : "Create Hackathon"}
                      </button>
                    </div>
                  </>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </GradientBackground>
  );
};

export default HackathonRegistrationForm;