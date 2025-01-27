import React, { useState } from "react";
import { useProjects } from "../api/hooks/useProjects";
import { useProjectStore } from "../store/projectStore";
import { useDeleteProject } from "../api/hooks/useDeleteProject";
import { useCreateProject } from "../api/hooks/useCreateProject";
import { motion, AnimatePresence } from "framer-motion";
import ErrorToast from "../components/ErrorToast";
import { Project } from "../types/project";
import { useGenerateReport } from "../api/hooks/useGenerateReport";
import { GenerateReportInput } from "../types/generateReportInpu";
import { useToastsStore } from "../store/useToastsStore";

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (shouldDeleteWorkEntries: boolean) => void;
  projectName: string;
}

const DeleteModal: React.FC<DeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  projectName,
}) => {
  const [shouldDeleteWorkEntries, setShouldDeleteWorkEntries] = useState(false);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-semibold mb-4 text-gray-800">
              Delete Project
            </h3>
            <p className="mb-6 text-gray-600">
              Are you sure you want to delete "
              <span className="font-medium text-gray-800">{projectName}</span>"?
            </p>

            <label className="flex items-center mb-6 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
              <input
                type="checkbox"
                checked={shouldDeleteWorkEntries}
                onChange={(e) => setShouldDeleteWorkEntries(e.target.checked)}
                className="w-4 h-4 text-teal-500 rounded border-gray-300 focus:ring-teal-500"
              />
              <span className="ml-3 text-gray-700">
                Also delete all linked work entries
              </span>
            </label>

            <div className="flex justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onConfirm(shouldDeleteWorkEntries);
                  setShouldDeleteWorkEntries(false);
                }}
                className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                Delete Project
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const CreateProjectModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (name: string) => void;
}> = ({ isOpen, onClose, onConfirm }) => {
  const [newProjectName, setNewProjectName] = useState("");

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-semibold mb-4 text-gray-800">
              Create New Project
            </h3>
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="Enter project name"
              className="w-full p-3 border border-gray-200 rounded-lg mb-6 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              autoFocus
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onConfirm(newProjectName);
                  setNewProjectName("");
                }}
                disabled={!newProjectName.trim()}
                className="px-4 py-2 rounded-lg bg-teal-500 text-white hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Project
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const GenerateReportModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (params: GenerateReportInput) => void;
  projects: Project[];
}> = ({ isOpen, onClose, onGenerate, projects }) => {
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("monthly");
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toLocaleString("default", { month: "long" })
  );
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear()
  );
  const [fileType, setFileType] = useState<"csv" | "xlsx">("xlsx");
  const { isLoading: isGenerating } = useGenerateReport();

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const handleGenerate = () => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    if (selectedPeriod === "monthly") {
      const monthIndex = months.indexOf(selectedMonth);
      startDate = new Date(selectedYear, monthIndex, 1);
      endDate = new Date(selectedYear, monthIndex + 1, 0, 23, 59, 59);
    } else {
      startDate = new Date(selectedYear, 0, 1);
      endDate = new Date(selectedYear, 11, 31, 23, 59, 59);
    }

    onGenerate({
      projectId: selectedProject === "all" ? undefined : selectedProject,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      type: fileType,
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-lg p-3 max-w-[240px] w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-semibold mb-2 text-gray-800">
              Generate Report
            </h3>

            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-700 font-medium mb-1">
                    Project:
                  </label>
                  <select
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    className="w-full p-1 text-xs border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="all">All Projects</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-gray-700 font-medium mb-1">
                    Period:
                  </label>
                  <select
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                    className="w-full p-1 text-xs border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {selectedPeriod === "monthly" && (
                  <div>
                    <label className="block text-xs text-gray-700 font-medium mb-1">
                      Month:
                    </label>
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="w-full p-1 text-xs border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
                    >
                      {months.map((month) => (
                        <option key={month} value={month}>
                          {month}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs text-gray-700 font-medium mb-1">
                    Year:
                  </label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="w-full p-1 text-xs border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    {Array.from(
                      { length: 5 },
                      (_, i) => new Date().getFullYear() - i
                    ).map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-700 font-medium mb-1">
                  File Type:
                </label>
                <div className="flex gap-3">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="xlsx"
                      checked={fileType === "xlsx"}
                      onChange={(e) => setFileType(e.target.value as "xlsx")}
                      className="mr-1.5 h-3 w-3"
                    />
                    <span className="text-xs">Excel (.xlsx)</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="csv"
                      checked={fileType === "csv"}
                      onChange={(e) => setFileType(e.target.value as "csv")}
                      className="mr-1.5 h-3 w-3"
                    />
                    <span className="text-xs">CSV (.csv)</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-3">
              <button
                onClick={onClose}
                className="px-2.5 py-1 text-xs rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                disabled={isGenerating}
              >
                Cancel
              </button>
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="px-2.5 py-1 text-xs rounded-md bg-teal-500 text-white hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                {isGenerating && (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-3 h-3 border-2 border-white border-t-transparent rounded-full"
                  />
                )}
                {isGenerating ? "Generating..." : "Generate Report"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const Projects: React.FC = () => {
  const { projects, isLoading } = useProjects();
  const { currentProject, setCurrentProject } = useProjectStore();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { addToast } = useToastsStore();
  const [deleteModalData, setDeleteModalData] = useState<{
    isOpen: boolean;
    projectId: string;
    projectName: string;
  }>({
    isOpen: false,
    projectId: "",
    projectName: "",
  });
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const { generateReport } = useGenerateReport();
  const { createProject } = useCreateProject();
  const { deleteProject } = useDeleteProject();

  const handleCreateProject = async (name: string) => {
    try {
      createProject(
        { name },
        {
          onSuccess: () => {
            setIsCreateModalOpen(false);
          },
        }
      );
    } catch (error) {
      addToast({
        message:
          error instanceof Error ? error.message : "Failed to create project",
        onClose: () => {},
      });
    }
  };

  const handleDeleteProject = async (shouldDeleteWorkEntries: boolean) => {
    deleteProject(
      {
        id: deleteModalData.projectId,
        shouldDeleteWorkEntries,
      },
      {
        onSuccess: () => {
          if (deleteModalData.projectId === currentProject?.id) {
            const defaultProject = projects?.find((p) => p.name === "@Default");
            if (defaultProject) {
              setCurrentProject(defaultProject);
            }
          }
          setDeleteModalData({
            isOpen: false,
            projectId: "",
            projectName: "",
          });
        },
      }
    );
  };

  const handleGenerateReport = async (params: GenerateReportInput) => {
    try {
      generateReport(params, {
        onSuccess: () => {
          setIsReportModalOpen(false);
        },
      });
    } catch (error) {
      addToast({
        message:
          error instanceof Error ? error.message : "Failed to generate report",
        onClose: () => {},
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full p-8">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  const sortedProjects = [...(projects || [])].sort((a, b) => {
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="flex flex-col flex-grow overflow-hidden">
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="text-xl font-semibold text-gray-800">Projects</h2>
        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsReportModalOpen(true)}
            className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <img
              src="icons/download.svg"
              alt="Generate Report"
              className="w-4 h-4 mr-1"
            />
            Generate Report
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
          >
            <img
              src="icons/plus.svg"
              alt="New Project"
              className="w-4 h-4 mr-1"
            />
            New Project
          </motion.button>
        </div>
      </div>

      <motion.div
        className="overflow-y-auto flex-grow p-4 space-y-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {sortedProjects.map((project) => {
          const isSelected = currentProject?.id === project.id;
          return (
            <motion.div
              key={project.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`rounded-xl border transition-all duration-200 ${
                isSelected
                  ? "border-teal-500 bg-teal-50 shadow-md"
                  : "border-gray-200 bg-white hover:border-teal-200 hover:shadow-sm"
              }`}
            >
              <div className="flex items-center justify-between">
                <div
                  className="flex items-center space-x-3 p-4 flex-grow cursor-pointer"
                  onClick={() => setCurrentProject(project)}
                >
                  <motion.div
                    className={`w-2 h-2 rounded-full ${
                      isSelected ? "bg-teal-500" : "bg-gray-300"
                    }`}
                    animate={{
                      scale: isSelected ? [1, 1.2, 1] : 1,
                    }}
                    transition={{ duration: 0.2 }}
                  />
                  <span
                    className={`font-medium ${
                      isSelected ? "text-teal-900" : "text-gray-700"
                    }`}
                  >
                    {project.name}
                  </span>
                </div>
                <div className="pr-4">
                  {project.name !== "@Default" && (
                    <motion.button
                      whileHover={{ scale: 1.05, color: "#EF4444" }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() =>
                        setDeleteModalData({
                          isOpen: true,
                          projectId: project.id,
                          projectName: project.name,
                        })
                      }
                      className="p-2 text-gray-400 hover:text-red-500 rounded-lg"
                    >
                      <img
                        src="icons/delete.svg"
                        alt="Delete Project"
                        className="w-4 h-4"
                      />
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onConfirm={handleCreateProject}
      />

      <DeleteModal
        isOpen={deleteModalData.isOpen}
        onClose={() =>
          setDeleteModalData({ isOpen: false, projectId: "", projectName: "" })
        }
        onConfirm={handleDeleteProject}
        projectName={deleteModalData.projectName}
      />

      <GenerateReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onGenerate={handleGenerateReport}
        projects={sortedProjects}
      />
    </div>
  );
};

export default Projects;
