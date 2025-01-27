import React, { useState, useEffect, useMemo } from "react";
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
import { useStatistics } from "../api/hooks/useStatistics";
import { formatDateTime } from "../utils/formatDateTime";
import { StatisticsRequest } from "../types/requests/statisticsRequest";
import { useAvailableYears } from "../api/hooks/useAvailableYears";
import { calculateEarning } from "../utils/calculateEarning";
import { convertToHourMinutes } from "../utils/convertToHourMinutes";

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale
);

const Statistics: React.FC = () => {
  const [hourlyRate, setHourlyRate] = useState<number>(0);
  const { availableYears } = useAvailableYears();
  const [selectedPeriod, setSelectedPeriod] = useState<
    "monthly" | "yearly" | "total"
  >("monthly");
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toLocaleString("default", { month: "long" })
  );
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear()
  );
  const [week, setWeek] = useState<number>(1);

  useEffect(() => {
    chrome.storage.local.get(["hourlyRate"], (result) => {
      setHourlyRate(result.hourlyRate || 0);
    });
  }, []);

  const statisticsRequest: StatisticsRequest = useMemo(() => {
    return {
      type: selectedPeriod,
      month: new Date(selectedMonth + " 1, " + selectedYear).getMonth() + 1,
      year: selectedYear,
    };
  }, [selectedPeriod, selectedMonth, selectedYear]);

  const { statisticsItems, isLoading, error } =
    useStatistics(statisticsRequest);

  const totalHours = useMemo(
    () => statisticsItems?.reduce((acc, item) => acc + item.totalHours, 0) ?? 0,
    [statisticsItems]
  );

  const chartData = {
    labels:
      statisticsItems?.map((item) =>
        formatDateTime(
          new Date(item.date).getTime(),
          selectedPeriod === "yearly"
            ? "month"
            : selectedPeriod === "total"
            ? "year"
            : "dd.mm"
        )
      ) ?? [],
    datasets: [
      {
        label: "Hours Worked",
        data:
          statisticsItems?.map((item) => Number(item.totalHours.toFixed(2))) ??
          [],
        backgroundColor: "rgba(54, 162, 235, 0.6)",
        borderColor: "rgba(54, 162, 235, 1)",
        borderWidth: 1,
        stack: "Hours",
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Hours",
        },
        stacked: true,
      },
      x: {
        stacked: true,
        title: {
          display: true,
          text:
            selectedPeriod === "yearly"
              ? "Months"
              : selectedPeriod === "total"
              ? "Years"
              : "Days",
        },
      },
    },
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: `Work Hours for ${selectedPeriod} period`,
      },
      tooltip: {
        callbacks: {
          label: (context: any) =>
            `Hours: ${context.raw.toFixed(2)} Earnings: ${
              hourlyRate < 60
                ? `$${calculateEarning(context.raw, hourlyRate)}`
                : `${calculateEarning(context.raw, hourlyRate)} PLN`
            }`,
        },
      },
    },
  };

  return (
    <div className="w-full bg-white overflow-y-auto">
      <div className="mb-2 flex flex-row justify-between items-center gap-4 px-4">
        <div className="flex flex-col w-1/3">
          <label className="block text-gray-700 font-medium mb-2">
            Hourly Rate:
          </label>
          <input
            type="number"
            value={hourlyRate}
            onChange={(e) => {
              const rate = parseFloat(e.target.value);
              setHourlyRate(rate);
              chrome.storage.local.set({ hourlyRate: rate });
            }}
            className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        {/* Period Selector */}
        <div className="flex flex-col w-1/3">
          <label className="block text-gray-700 font-medium mb-2">
            Select Period:
          </label>
          <select
            value={selectedPeriod}
            onChange={(e) =>
              setSelectedPeriod(
                e.target.value as "monthly" | "yearly" | "total"
              )
            }
            className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
            <option value="total">Total</option>
          </select>
        </div>

        {/* Period-specific selectors */}
        {selectedPeriod === "monthly" && (
          <div className="flex flex-col w-1/3">
            <label className="block text-gray-700 font-medium mb-2">
              Select Month:
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {[
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
              ].map((month) => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex flex-col w-1/3">
          <label className="block text-gray-700 font-medium mb-2">
            Select Year:
          </label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            {availableYears?.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary */}
      <div className="mb-6 p-4">
        <h2 className="text-2xl text-center font-semibold text-gray-800 mb-4">
          Summary
        </h2>
        <div className="flex flex-row justify-between">
          <p className="text-gray-700 text-lg mb-2">
            Total Hours:{" "}
            <span className="font-bold text-teal-600 text-xl">
              {convertToHourMinutes(totalHours)}
            </span>
          </p>
          <p className="text-gray-700 text-lg">
            Total Earnings:{" "}
            <span className="font-bold text-teal-600 text-xl">
              {hourlyRate < 60
                ? `$${calculateEarning(totalHours, hourlyRate)}`
                : `${calculateEarning(totalHours, hourlyRate)} PLN`}
            </span>
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="p-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500" />
          </div>
        ) : error ? (
          <div className="text-red-500 text-center p-4">
            Error loading statistics: {error.message}
          </div>
        ) : statisticsItems?.length === 0 ? (
          <div className="text-gray-500 text-center p-4">
            No data available for the selected period
          </div>
        ) : (
          <Bar data={chartData} options={chartOptions} />
        )}
      </div>
    </div>
  );
};

export default Statistics;
