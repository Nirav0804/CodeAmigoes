# 🚀 CodeAmigos Frontend

**CodeAmigos** is a web application designed to connect developers for hackathons. Developers can create profiles linked to their Competitive Programming (CP) accounts and GitHub, register hackathon participation requests, form or join teams, and communicate securely via encrypted chat.

The platform features a recommendation system to suggest relevant hackathons, available exclusively to paid subscribers through a payment-gateway-integrated model.

Built with **Spring Boot**, **Spring Security**, **React**, and **MongoDB**, CodeAmigos provides a secure and efficient environment for developers to collaborate and succeed in hackathons.

---

## 🎯 Features

- 🧑‍💻 **Developer Profiles**  
  Create detailed profiles by linking Competitive Programming accounts and GitHub to showcase skills and experience.

- 📋 **Hackathon Requests**  
  Register participation requests for hackathons and browse available opportunities.

- 🤝 **Team Formation**  
  Send and receive join requests to form or join hackathon teams.

- 🔒 **Encrypted Chat**  
  Secure, private communication between applicants and hackathon request creators.

- 📊 **Skill-Match-Scoring**  
  A recommendation algorithm that ranks applicants based on their projects (exclusive to paid subscribers).

- 💳 **Payment Gateway**  
  Subscription-based access to premium features like Skill-Match-Scoring via RazorPay.

- 🎨 **Modern UI**  
  Clean, responsive, and user-friendly interface built with React.

- 🔐 **Authorization**  
  Secure OAuth2 authentication and authorization for user accounts.

- ☁️ **MongoDB Integration**  
  Efficient storage and retrieval of user data, requests, and messages.

---

## 🛠️ Tech Stack

| Layer            | Tech Used                            |
|------------------|--------------------------------------|
| Frontend         | React ⚛️ + Vite ⚡                     |
| Backend          | Spring Boot ☕ + Spring Security 🔐   |
| Database         | MongoDB 🍃                            |
| State Management | Context API                          |
| Styling          | Tailwind CSS 🎨                       |
| API Handling     | Axios 🔗                              |
| Encryption       | Web Crypto API + AES Algorithm 🔒     |
| Payments         | RazorPay Integration 💳              |
| Real-time Chat   | WebSocket + SockJS/STOMP 🗨️          |

---

## 📂 Project Structure

```plaintext
📦 src
 ┣ 📂 apiEndPoints        # API request functions
 ┣ 📂 components          # Reusable UI components (e.g., Chat, ProfileCard)
 ┣ 📂 pages               # Page-level components (e.g., HackathonList, ChatDropDown)
 ┣ 📂 routes              # App routing configuration
 ┣ 📂 utils               # Utility functions (e.g., encryption, time formatting)
 ┣ 📜 App.jsx             # Main React component
 ┣ 📜 index.css           # Global styles
 ┣ 📜 main.jsx            # Entry point
 ┣ 📜 tailwind.config.js  # Tailwind CSS configuration
 ┣ 📜 vite.config.js      # Vite configuration
 ┗ ...other config files



Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change. Ensure your code follows the project’s coding standards and includes tests where applicable.

📩 Contact

For inquiries, reach out at codeamigos7@gmail.com.
