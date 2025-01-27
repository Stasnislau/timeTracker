import React, { useState, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WithToasts } from "./components/WithToast";

// Lazy load our tab components
const TimerEntries = React.lazy(() => import("./tabs/TimeEntries"));
const Statistics = React.lazy(() => import("./tabs/Statistics"));
const Projects = React.lazy(() => import("./tabs/Projects"));

const queryClient = new QueryClient();

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    "timer" | "projects" | "statistics"
  >("timer");

  const LoadingFallback = () => (
    <div className="flex justify-center items-center h-full p-8">
      <div className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <QueryClientProvider client={queryClient}>
      <WithToasts>
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
          <Suspense fallback={<LoadingFallback />}>
            {activeTab === "timer" && <TimerEntries />}
            {activeTab === "statistics" && <Statistics />}
            {activeTab === "projects" && <Projects />}
          </Suspense>
        </div>
      </WithToasts>
    </QueryClientProvider>
  );
};

export default App;
