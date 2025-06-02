import React, { useEffect, useState } from 'react';
import { getUserFrameworks } from '../../apiEndpoints';
import { useAuth } from '../../context/AuthContext';
import { useParams } from 'react-router-dom';

const COLORS = [
  'bg-indigo-500','bg-green-500','bg-yellow-400','bg-red-500',
  'bg-blue-500','bg-pink-500','bg-purple-500','bg-teal-500',
  'bg-pink-400','bg-amber-500','bg-sky-500','bg-violet-400'
];

const FrameworksStatsCard = () => {
  const { username } = useParams();
  const [frameworks, setFrameworks] = useState([]); 

  useEffect(() => {
    async function load() {
      if (!username) return;
      const data = await getUserFrameworks(username);
      // console.log(data);
      if(data?.error){
          // console.log(data.error);
          
      }else{
        if (data && typeof data === 'object') {
        const arr = Object.entries(data)
          .map(([name, val]) => ({ name, value: val }))
          .sort((a, b) => b.value - a.value); // ← sort descending
        setFrameworks(arr);
      }
      }
    }
    load();
  }, [username]);

  const total = frameworks.reduce((sum, f) => sum + f.value, 0) || 1;

    if (!frameworks.length) {
    return (
      <div className="bg-gray-900 rounded-2xl p-6 shadow-lg transition duration-300 backdrop-blur-md border border-gray-700 text-center">
        <h3 className="text-2xl font-bold text-blue-400 mb-4">
          Frameworks in Top Repos
        </h3>
        <p className="text-gray-400">
          No frameworks detected in your top repositories.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition duration-300 backdrop-blur-md border border-gray-700">
      <h3 className="text-2xl font-bold text-blue-400 mb-4">
        Frameworks in Top Repos
      </h3>

      {/* Stacked Bar */}
      <div className="flex h-2 w-full rounded-full overflow-hidden mb-6">
        {frameworks.map((fw, i) => (
          <div
            key={fw.name}
            className={COLORS[i % COLORS.length]}
            style={{ flex: fw.value }}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="space-y-2">
        { frameworks.length >0 && frameworks.map((fw, i) => {
          const pct = ((fw.value / total) * 100).toFixed(1);
          return (
            <div
              key={fw.name}
              className="flex items-center justify-between text-gray-300"
            >
              <div className="flex items-center space-x-2">
                <span
                  className={`inline-block w-3 h-3 rounded-full ${COLORS[i % COLORS.length]}`}
                />
                <span>{fw.name}</span>
              </div>
              <span className="font-medium text-white">{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FrameworksStatsCard;
