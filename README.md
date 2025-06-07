<p align="center">
  <img src="./logoN.png" alt="CodeAmigos Logo" width="140" />
</p>

<h1 align="center">CodeAmigos</h1>
<p align="center"><strong>Building perfect hackathon teams, by developers for developers.</strong><br>
<em>Because hackathons teach you more than textbooks ever will.</em></p>

---
## 🚀 What Inspired Us to Build CodeAmigos

During countless hackathons, we faced a recurring challenge: **finding the right teammate**.

One of us was a competitive programmer, another a backend expert—yet we always scrambled to find a front-end developer or ML engineer just days before the hackathon. The hunt across social media and friend circles was frustrating.

That’s when the idea struck: **what if there was a platform built by developers, for developers, to match teammates based on real tech skills and interests?** That’s how CodeAmigos was born.

---

## 🎯 What Is CodeAmigos?

**CodeAmigos** is a full-stack platform that helps developers:

- ✅ Build rich profiles connected to GitHub, LeetCode, CodeChef, and showcase frameworks used ( calculated from your Github )
- ✅ Register for hackathons and send/receive join requests based on tech stack and vicinity
- ✅ Form perfect teams based on roles and stacks
- ✅ Chat securely via **end-to-end encrypted messaging**
- ✅ Get hackathon recommendations using framework detection, geolocation-based filtering (premium feature)
- ✅ ML model for finding upcoming and ongoing events

Our goal: **Make hackathon team building seamless and rewarding.**

---

## 🌟 Key Features

### 🧑‍💻 Developer Profiles

- Link **GitHub**, **LeetCode**, and **CodeChef**
- Showcase tech stacks (React, Spring Boot, Django, etc.)
- Add **Instagram**, **LinkedIn**, **X (Twitter)**, **portfolio**, **cover image**, and **bio** to enhance your profile

### 📋 Hackathon Registration

- Browse upcoming hackathons and register
- Filter hackathons based on **tech stack** and **vicinity** (location)
- Create or respond to **hackathon requests** based on tech needs

### 🤝 Team Formation

- View roles, tech stack, and project ideas for each team
- Send/receive join requests and manage your team roster
- Receive **email notifications** for request updates

### 🔒 Secure Chat (E2EE)

- Powered by **Web Crypto API + AES + RSA**
- End-to-end encrypted conversations, safe from prying eyes

### 🤖 ML-Powered Hackathon Classification

- **ML Model with Token Optimization**\
  Trained to detect and fetch **upcoming** and **ongoing hackathons** from multiple sources

---

## 💎 Premium Features

### 🌍 Location-Based Filtering

- Powered by the **OpenCage API**\
  Filters hackathons based on the developer’s location for hyper-local discovery.

### 🧠 Framework-Based Recommendations

- Analyzes developer repositories using **GitHub GraphQL & REST APIs**
- Detects frameworks used across repos
- Utilizes **Java's Executor Framework** for concurrent processing and analysis
- Suggests hackathons aligned with the developer's tech stack

> Premium features provide tailored recommendations and filters to enhance discovery based on **who you are** and **where you are**.

---

### ⚡ Performance

- **Redis Caching**\
  Optimized hackathon fetching 80% faster, ensuring hackathon data loads almost instantly.
- **Executor Framework (Java)**\
  Speeds up framework-detection calculations by 70%, providing near real-time framework detection.

---

### 🌐 Scalability

- **RabbitMQ**\
  Manages asynchronous framework-detection workflows.
- **Dead Letter Queue**\
  Automatically sends email alerts to supervisors if a user’s framework detection fails, ensuring no task goes unnoticed.

---

### 💳 Payment Gateway

- **RazorPay-WebHook** integrated for secure subscriptions
- Free plan for core features, Premium for pro insights

### 🎨 Modern UI

- Built with **React + Vite**
- Styled using **Tailwind CSS**
- State managed with **Context API**
- **Protected Routes**

### 🔐 Authentication & Security

- GitHub OAuth2-based login
- JWT for API security and session control
- Role-based access (**Free, Premium**)

### ☁️ Database

- Powered by **MongoDB Atlas**
- Stores **profile**, **team details**, **hackathon details**, and the cherry on top: **encrypted messages**

---

## 🛠️ Tech Stack

| **Component** | **Technologies Used** |
| --- | --- |
| **Frontend** | React ⚛️ + Vite ⚡ |
| **Backend** | Spring Boot ☕ + Spring Security 🔐 |
| **Database** | MongoDB 🍃 |
| **State Management** | Context API 🧠 |
| **Styling & Responsiveness** | Tailwind CSS 🎨 |
| **API Handling** | Axios 🔗 |
| **End-to-End Encryption** | Web Crypto API 🕵️ + AES + RSA 🔒 |
| **Payments** | RazorPay 💳 + Web Hook 🔁 |
| **Real-time Chat** | WebSocket 🌐 + SockJS 🔌 + STOMP 🗨️ |
| **Caching** | Redis 🧊 |
| **Message Queue** | RabbitMQ 🐇 (with Dead Letter Queue ☠️📩) |
| **Multithreading** | Executor Framework 🧵 (Java) |
| **ML Model** | Flask 🧪 + Groq 🤖 |
| **Deployment** | Render, GitHub Pages, Amazon MQ, Docker, DNS Management 🌍 |

---

## 🌐 Live Demo

👉 https://codeamigos.tech \
🚀 **Dive into the CodeAmigos experience now!** \
📚 API Documentation - https://api.codeamigos.tech/swagger-ui/index.html#

---

## 🤝 Contributing to CodeAmigos

We welcome developers of all backgrounds. Whether you love frontend, backend, DevOps, or ML—there’s a place for you in CodeAmigos!

### Get Started:

1. **Fork this repo**
2. **Create a new branch**
3. **Make your changes**
4. **Open a pull request**

---

## 🧑‍💻 Made With ❤️ By **Team CodeAmigos**

Because every developer deserves a dream team.
