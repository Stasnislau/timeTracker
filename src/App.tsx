import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import TimerEntries from "./tabs/TimeEntries";
import Statistics from "./tabs/Statistics";
import Projects from "./tabs/Projects";

const queryClient = new QueryClient();

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    "timer" | "projects" | "statistics"
  >("timer");

  return (
    <QueryClientProvider client={queryClient}>
      <div className="p-4 py-2 bg-white max-w-[550px] w-[550px] flex flex-col h-[300px] max-h-[300px]">
        <div className="mb-4 flex justify-around w-full border-b border-gray-200 relative">
          <button
            className={`w-1/3 py-2 text-center transition-colors duration-200 relative ${
              activeTab === "timer"
                ? "text-teal-600 font-semibold"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("timer")}
          >
            Timer
          </button>
          <button
            className={`w-1/3 py-2 text-center transition-colors duration-200 relative ${
              activeTab === "projects"
                ? "text-teal-600 font-semibold"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("projects")}
          >
            Projects
          </button>
          <button
            className={`w-1/3 py-2 text-center transition-colors duration-200 relative ${
              activeTab === "statistics"
                ? "text-teal-600 font-semibold"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("statistics")}
          >
            Statistics
          </button>
          <div
            className="absolute bottom-0 h-0.5 bg-teal-500 transition-all duration-300 ease-in-out w-1/3"
            style={{
              transform: `translateX(${
                activeTab === "timer"
                  ? "-100%"
                  : activeTab === "projects"
                  ? "0%"
                  : "100%"
              })`,
            }}
          />
        </div>
        {activeTab === "timer" && <TimerEntries />}
        {activeTab === "statistics" && <Statistics />}
        {activeTab === "projects" && <Projects />}
      </div>
    </QueryClientProvider>
  );
};

export default App;
