import React, { useState, useEffect } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from "chart.js";
import { useWorkEntries } from "../api/hooks/useWorkEntries";
import { WorkEntry } from "../types/workEntry";
import { formatDateTime } from "../utils/formatDateTime";

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale
);

const Statistics: React.FC = () => {
  const { workEntries } = useWorkEntries();
  const [hourlyRate, setHourlyRate] = useState<number>(0);
  const [selectedPeriod, setSelectedPeriod] = useState<string>("monthly");
  const [years, setYears] = useState<number[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toLocaleString("default", { month: "long" })
  );
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear()
  );
  const [totalTime, setTotalTime] = useState<number>(0);

  useEffect(() => {
    chrome.storage.local.get(["hourlyRate"], (result) => {
      if (result.hourlyRate) {
        setHourlyRate(result.hourlyRate || 1);
      }
    });
  }, []);

  useEffect(() => {
    const years = workEntries?.map((entry) =>
      new Date(entry.startTime).getFullYear()
    );
    const uniqueYears = Array.from(new Set(years));
    setYears(uniqueYears);
  }, [workEntries]);

  useEffect(() => {
    const calculateTotalTime = (filter: (entry: WorkEntry) => boolean) => {
      if (!workEntries) return 0;

      return workEntries.filter(filter).reduce((acc, entry) => {
        const start = new Date(entry.startTime).getTime();
        const end = new Date(entry.endTime).getTime();
        return acc + (end - start);
      }, 0);
    };

    const now = new Date();
    let filterFunction: (entry: WorkEntry) => boolean;

    if (selectedPeriod === "weekly") {
      const startOfWeek = new Date(now);
      startOfWeek.setHours(0, 0, 0, 0);
      startOfWeek.setDate(now.getDate() - now.getDay()); // Начало недели (воскресенье)

      filterFunction = (entry) => {
        const entryDate = new Date(entry.startTime);
        return entryDate >= startOfWeek && entryDate <= now;
      };
    } else if (selectedPeriod === "monthly") {
      const monthDate = new Date(`${selectedMonth} 1, ${selectedYear}`);
      const monthStart = new Date(selectedYear, monthDate.getMonth(), 1);
      const monthEnd = new Date(
        selectedYear,
        monthDate.getMonth() + 1,
        0,
        23,
        59,
        59,
        999
      );

      filterFunction = (entry) => {
        const entryDate = new Date(entry.startTime);
        return entryDate >= monthStart && entryDate <= monthEnd;
      };
    } else {
      // yearly
      const yearStart = new Date(selectedYear, 0, 1);
      const yearEnd = new Date(selectedYear, 11, 31, 23, 59, 59, 999);

      filterFunction = (entry) => {
        const entryDate = new Date(entry.startTime);
        return entryDate >= yearStart && entryDate <= yearEnd;
      };
    }

    const total = calculateTotalTime(filterFunction);
    setTotalTime(total);
  }, [workEntries, selectedPeriod, selectedMonth, selectedYear]);
  const handleHourlyRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rate = parseFloat(e.target.value);
    setHourlyRate(rate);
    chrome.storage.local.set({ hourlyRate: rate });
  };

  const calculateEarnings = (totalTime: number) => {
    return Math.round(totalTime / (1000 * 60 * 60)) * hourlyRate;
  };

  const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedPeriod(e.target.value);
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMonth(e.target.value);
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedYear(Number(e.target.value));
  };
  const calculateChartData = () => {
    const now = new Date();
    let labels: string[] = [];
    let data: number[] = [];

    if (!workEntries) return { labels: [], datasets: [] };

    if (selectedPeriod === "weekly") {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      labels = Array.from({ length: 7 }, (_, i) => {
        const day = new Date(startOfWeek);
        day.setDate(startOfWeek.getDate() + i);
        return day.toLocaleDateString();
      });

      data = labels.map((day) => {
        const dayStart = new Date(day);
        const dayEnd = new Date(day);
        dayEnd.setHours(23, 59, 59, 999);

        return workEntries
          .filter((entry) => {
            const entryDate = new Date(entry.startTime);
            return entryDate >= dayStart && entryDate <= dayEnd;
          })
          .reduce((acc, entry) => {
            const start = new Date(entry.startTime).getTime();
            const end = new Date(entry.endTime).getTime();
            return acc + (end - start);
          }, 0);
      });
    } else if (selectedPeriod === "monthly") {
      const monthDate = new Date(`${selectedMonth} 1, ${selectedYear}`);
      const daysInMonth = new Date(
        selectedYear,
        monthDate.getMonth() + 1,
        0
      ).getDate();

      labels = Array.from({ length: daysInMonth }, (_, i) => `Day ${i + 1}`);
      data = labels.map((_, i) => {
        const dayStart = new Date(selectedYear, monthDate.getMonth(), i + 1);
        const dayEnd = new Date(
          selectedYear,
          monthDate.getMonth(),
          i + 1,
          23,
          59,
          59,
          999
        );

        return workEntries
          .filter((entry) => {
            const entryDate = new Date(entry.startTime);
            return entryDate >= dayStart && entryDate <= dayEnd;
          })
          .reduce((acc, entry) => {
            const start = new Date(entry.startTime).getTime();
            const end = new Date(entry.endTime).getTime();
            return acc + (end - start);
          }, 0);
      });
    } else if (selectedPeriod === "yearly") {
      labels = Array.from({ length: 12 }, (_, i) =>
        new Date(0, i).toLocaleString("default", { month: "short" })
      );

      data = labels.map((_, i) => {
        const monthStart = new Date(selectedYear, i, 1);
        const monthEnd = new Date(selectedYear, i + 1, 0, 23, 59, 59, 999);

        return workEntries
          .filter((entry) => {
            const entryDate = new Date(entry.startTime);
            return entryDate >= monthStart && entryDate <= monthEnd;
          })
          .reduce((acc, entry) => {
            const start = new Date(entry.startTime).getTime();
            const end = new Date(entry.endTime).getTime();
            return acc + (end - start);
          }, 0);
      });
    }

    return {
      labels,
      datasets: [
        {
          label: "Earnings",
          data: data.map((d) => calculateEarnings(d)),
          backgroundColor: "rgba(255, 99, 132, 0.5)",
          borderColor: "rgba(255, 99, 132, 1)",
          borderWidth: 1,
          hidden: true,
        },
        {
          label: "Hours",
          data: data.map((d) => d / (1000 * 60 * 60)), // конвертируем миллисекунды в часы
          backgroundColor: "rgba(75, 192, 192, 0.5)",
          borderColor: "rgba(75, 192, 192, 1)",
          borderWidth: 1,
        },
      ],
    };
  };

  const [chartData, setChartData] = useState(calculateChartData());

  useEffect(() => {
    setChartData(calculateChartData());
  }, [workEntries, selectedPeriod, selectedMonth, selectedYear]);

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

  return (
    <div className="w-full bg-white overflow-y-auto">
      <div className="mb-2 flex flex-row justify-between items-center gap-4 px-4">
        <div className="flex flex-col w-1/3">
          <label className="block text-gray-700 font-medium mb-2">
            Hourly Rate ($):
          </label>
          <input
            type="number"
            value={hourlyRate}
            onChange={handleHourlyRateChange}
            className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="flex flex-col w-1/3">
          <label className="block text-gray-700 font-medium mb-2">
            Select Period:
          </label>
          <select
            value={selectedPeriod}
            onChange={handlePeriodChange}
            className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>

        {selectedPeriod === "monthly" && (
          <div className="flex flex-col w-1/3">
            <label className="block text-gray-700 font-medium mb-2">
              Select Month:
            </label>
            <select
              value={selectedMonth}
              onChange={handleMonthChange}
              className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {months.map((month) => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
            </select>
          </div>
        )}

        {selectedPeriod === "yearly" && (
          <div className="flex flex-col flex-1">
            <label className="block text-gray-700 font-medium mb-2">
              Select Year:
            </label>
            <select
              value={selectedYear}
              onChange={handleYearChange}
              className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {years && years.length > 0 ? (
                years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))
              ) : (
                <option value={new Date().getFullYear()}>
                  {new Date().getFullYear()}
                </option>
              )}
            </select>
          </div>
        )}
      </div>

      <div className="mb-6 p-4 transition-transform transform">
        <h2 className="text-2xl text-center font-semibold text-gray-800 mb-4 font-roboto">
          Summary
        </h2>
        <div className="flex flex-row justify-between">
          <p className="text-gray-700 text-lg mb-2 font-roboto">
            Total Time:{" "}
            <span className="font-bold text-teal-600 text-xl animate-pulse">
              {formatDateTime(totalTime, "report")}
            </span>
          </p>
          <p className="text-gray-700 text-lg font-roboto">
            Total Earnings:{" "}
            <span className="font-bold text-teal-600 text-xl animate-pulse">
              {hourlyRate < 60 && "$"}
              {calculateEarnings(totalTime).toFixed(2)}
              {hourlyRate >= 60 && " Zł"}
            </span>
          </p>
        </div>
      </div>

      <div className="mb-6">
        <Bar
          data={chartData}
          options={{
            maintainAspectRatio: false,
          }}
        />
      </div>
    </div>
  );
};

export default Statistics;
