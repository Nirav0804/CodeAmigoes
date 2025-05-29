
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Typewriter } from "react-simple-typewriter";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useSearchParams } from 'react-router-dom';
import { useAuth } from "../../context/AuthContext";
import { exportKeyAsPem } from "../../config/pemUtils";
import { log } from "sockjs-client/dist/sockjs";
import { privateKeyFileName,passwordFileName } from "../../config/fileFunctions";
import { encryptWithAesKey, exportKeyToBase64, generateAesKey } from "../../config/passwordEncrypt";
import { setDirectoryInIdb } from "../../config/IndexDb";
const API_BASE = import.meta.env.VITE_API_BASE_URL;


const RegistrationForm = () => {
  const { username, userId } = useAuth();
  const features = [
    "Real-time Group Chats",
    "Hackathon Team Formation",
    "Event Announcements",
    "Resource Sharing",
    "Personalized Learning Communities",
  ];

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [user, setUser] = useState({
    username: '',
    id: ''
  });

  useEffect(() => {
    const username = searchParams.get("username");
    const id = searchParams.get("id");

    setUser({ username });

    setFormData((prev) => ({
      ...prev,
      githubUsername: username || "",
      username: username || "",
      displayName: username || "",
      id: id || ""
    }));
  }, [searchParams]);

  // Form state
  const [formData, setFormData] = useState({
    id: user.id,
    username: user.username,
    displayName: user.username,
    password: "",
    email: "",
    collegeName: "",
    githubUsername: user.username,
    leetcodeUsername: "",
    codechefUsername: "",
    hackerrankUsername: "",
    codeforcesUsername: "",
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError(null);
  };

 const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError(null);

  try {
    // 1. Generate RSA keypair
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: 'RSA-OAEP',
        modulusLength: 2048,
        publicExponent: new Uint8Array([1,0,1]),
        hash: 'SHA-256'
      },
      true,
      ['encrypt','decrypt']
    );

    // 2. Export PEMs
    const publicPem = await exportKeyAsPem(keyPair.publicKey, 'PUBLIC');
    const privatePem = await exportKeyAsPem(keyPair.privateKey, 'PRIVATE');

    // 3. Store private PEM in localStorage for quick access
    localStorage.setItem('rsaPublicKey',publicPem);
    localStorage.setItem('rsaPrivateKey', privatePem);

    // 4. Build registration payload
    const registrationData = { ...formData, publicKey: publicPem };

    // 5. Call backend
    const response = await fetch(`${API_BASE}/api/users/register`, {
      method: 'POST',
      credentials: 'include',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(registrationData)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(typeof data==='string'?data:JSON.stringify(data));
    }

    // 6. Mark success
    setSuccess(true);

    // 7. Prompt for a directory and save encrypted private key + password
    try {
  // a) Pick base folder
  const baseHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
  // Set the directory in indexDb
  await setDirectoryInIdb(baseHandle);

  const dataDir = await baseHandle.getDirectoryHandle('data.codeamigoes', { create: true });
  const privDir = await dataDir.getDirectoryHandle('privateData', { create: true });

  // b) Encrypt the private key with a generated AES key
  const secretPassword = await generateAesKey();
  const exportedPassword = await exportKeyToBase64(secretPassword); // export for writing
  console.log("secretPassword (Base64):", exportedPassword);

  const encryptedPrivateKey = await encryptWithAesKey(privatePem, secretPassword);

  // d) Write encrypted private key to JSON file
  const privFH = await privDir.getFileHandle(privateKeyFileName, { create: true });
  const privW = await privFH.createWritable();
  await privW.write(JSON.stringify(encryptedPrivateKey, null, 2)); // pretty-print JSON
  await privW.close();

  // e) Write AES password (Base64) to .key file
  const pwFH = await privDir.getFileHandle(passwordFileName, { create: true });
  const pwW = await pwFH.createWritable();
  await pwW.write(exportedPassword);
  await pwW.close();

  console.log('Saved encrypted private key and AES password locally');
} catch (fsErr) {
  console.error('File-system save failed:', fsErr);
}


    // 8. Navigate on success
    navigate('/dashboard');

  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 via-black to-gray-800 overflow-y-auto relative">
      {/* Close button */}
      <Link to="/">
        <button className="fixed top-4 right-4 z-50 bg-gray-800 text-white rounded-full w-12 h-12 flex items-center justify-center hover:bg-gray-700 transition-colors text-xl">
          ✕
        </button>
      </Link>

      {/* Main content */}
      <div className="container mx-auto px-10 py-20">
        <motion.div
          className="relative z-10 bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-xl shadow-2xl p-10 w-full max-w-3xl mx-auto backdrop-filter backdrop-blur-lg bg-opacity-50 border border-gray-700"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        >
          <h1 className="text-5xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-500 mb-8">
            <Typewriter
              words={["Welcome to CodeAmigos"]}
              loop={1}
              cursor
              cursorStyle="|"
              typeSpeed={100}
              deleteSpeed={50}
              delaySpeed={500}
            />
          </h1>

          {success && (
            <div className="mb-6 p-4 bg-green-500 bg-opacity-20 border border-green-500 rounded-lg text-green-400 text-center">
              Registration successful! Welcome to CodeAmigos!
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-500 bg-opacity-20 border border-red-500 rounded-lg text-red-400 text-center">
              {error}
            </div>
          )}

          <p className="text-center text-gray-400 mb-8">
            Let's set up your account and start your journey!
          </p>

          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 sm:grid-cols-2 gap-8"
          >
            {[
              {
                label: "Password",
                name: "password",
                type: "password",
                placeholder: "Enter a strong password",
                required: true,
              },
              {
                label: "GitHub Username",
                name: "githubUsername",
                type: "text",
                placeholder: "e.g., ompatel22",
                readOnly: true,
              },
              {
                label: "LeetCode Username",
                name: "leetcodeUsername",
                type: "text",
                placeholder: "e.g., khushi703",
                required: true,
              },
              {
                label: "CodeChef Username",
                name: "codechefUsername",
                type: "text",
                placeholder: "e.g., nirav0804",
                required: true,
              },
              {
                label: "GitHub email",
                name: "email",
                type: "email",
                placeholder: "e.g., nayanthacker28@gmail.com",
              },
            ].map((field) => (
              <div
                key={field.name}
                className={`${field.label === "GitHub email" ? "sm:col-span-2" : "col-span-1"
                  } hover:scale-105 transition-transform transform`}
              >
                <label className="block text-lg font-medium text-gray-300 mb-2">
                  {field.label}
                </label>
                <input
                  type={field.type}
                  name={field.name}
                  value={formData[field.name]}
                  onChange={handleInputChange}
                  placeholder={field.placeholder}
                  readOnly={field.readOnly || false}
                  className={`w-full px-4 py-3 rounded-lg bg-gray-700 text-gray-200 placeholder-gray-400 border border-gray-600 focus:ring-4 focus:ring-blue-500 focus:outline-none transition-all ${field.readOnly ? "cursor-not-allowed bg-gray-600" : ""
                    }`}
                />
              </div>
            ))}
            <div className="col-span-1 sm:col-span-2">
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg font-semibold rounded-lg shadow-md hover:from-blue-700 hover:to-purple-700 hover:scale-105 transition-transform transform ${loading ? "opacity-50 cursor-not-allowed" : ""
                  }`}
              >
                {loading ? "Registering..." : "Register"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>

      {/* Animated Background Elements
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-blue-500 rounded-full opacity-30 blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-purple-500 rounded-full opacity-30 blur-3xl animate-pulse"></div>
        <div className="absolute top-10 right-10 w-48 h-48 bg-pink-500 rounded-full opacity-20 blur-3xl animate-pulse"></div>
      </div> */}

      {/* Scrolling Text */}
      <div className="fixed w-full bottom-10 overflow-hidden pointer-events-none">
        <motion.div
          className="whitespace-nowrap text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400"
          animate={{ x: ["100%", "-100%"] }}
          transition={{ repeat: Infinity, duration: 12, ease: "linear" }}
        >
          {features.map((feature, index) => (
            <span
              key={index}
              className="mx-12 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400"
            >
              {feature}
            </span>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default RegistrationForm;
