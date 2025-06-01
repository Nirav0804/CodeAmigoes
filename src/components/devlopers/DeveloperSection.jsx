import React from "react";
import { FaGithub, FaLinkedin } from "react-icons/fa";
import khushi from '../../assets/khushi.jpg'; // adjust the path relative to your component file
import suhani from '../../assets/suhani.jpg';
import nirav from '../../assets/nirav.jpeg' // adjust the path relative to your component file
import nayan from '../../assets/nayan.jpg'
const developers = [
  {
    name: "Khushi Zalavadiya",
    github: "https://github.com/khushi703",
    linkedin: "https://www.linkedin.com/in/khushi-zalavadiya-39894626a/",
    image: khushi,
  },
  {
    name: "Suhani Parmar",
    github: "https://github.com/Suhaniparmar",
    linkedin: "https://www.linkedin.com/in/suhani-parmar-315a93252/",
    image: suhani,
  },
  {
    name: "Nayan Thacker",
    github: "https://github.com/nayan1729",
    linkedin: "https://linkedin.com/in/nayan-thacker-86457a244",
    image: nayan,
  },
  {
    name: "Nirav Patel",
    github: "https://github.com/Nirav0804",
    linkedin: "https://www.linkedin.com/in/nirav-patel-292206207/",
    image: nirav,
  },
];


const DeveloperSection = () => {
  return (
    <div className="text-white text-center py-16 px-4">
     <div className="flex items-center justify-center gap-4 mb-6">
  <span className="text-3xl">👩‍💻</span>
  <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
    Meet Our Developers
  </h2>
  <span className="text-3xl">👨‍💻</span>
</div>
      
      <div className="flex justify-center gap-8 flex-wrap">
        {developers.map((dev, index) => (
          <div
            key={index}
            className="bg-gray-800 p-6 rounded-xl shadow-lg w-72 hover:scale-105 transition-transform duration-300"
          >
            <img
              src={dev.image}
              alt={dev.name}
              className="w-24 h-24 rounded-full mx-auto mb-4 ring-4 ring-indigo-500 ring-offset-2"
            />
            <h3 className="text-xl font-semibold mb-2">{dev.name}</h3>
            <div className="flex justify-center gap-6 text-xl">
              <a href={dev.github} target="_blank" rel="noopener noreferrer">
                <FaGithub className="hover:text-gray-400" />
              </a>
              <a href={dev.linkedin} target="_blank" rel="noopener noreferrer">
                <FaLinkedin className="hover:text-blue-400" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DeveloperSection;
