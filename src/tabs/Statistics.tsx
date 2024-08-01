import React, { useState, useEffect } from 'react';
import { getStoredWorkTimes, WorkTimeEntry } from '../db/db';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from 'chart.js';

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale
);

const Statistics: React.FC = () => {
  const [workTimes, setWorkTimes] = useState<WorkTimeEntry[]>([]);
  const [hourlyRate, setHourlyRate] = useState<number>(0);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('monthly');
  const [years, setYears] = useState<number[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toLocaleString('default', { month: 'long' })
  );
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear()
  );
  const [totalTime, setTotalTime] = useState<number>(0);

  useEffect(() => {
    getStoredWorkTimes().then((times) => {
      setWorkTimes(times);
    });
    chrome.storage.local.get(['hourlyRate'], (result) => {
      if (result.hourlyRate) {
        setHourlyRate(result.hourlyRate);
      }
    });
  }, []);

  useEffect(() => {
    const years = workTimes.map((entry) =>
      new Date(entry.startTime).getFullYear()
    );
    const uniqueYears = Array.from(new Set(years));
    setYears(uniqueYears);
  }, [workTimes]);

  useEffect(() => {
    const calculateTotalTime = (filter: (entry: WorkTimeEntry) => boolean) => {
      return workTimes
        .filter(filter)
        .reduce((acc, entry) => acc + entry.duration, 0);
    };

    const now = new Date();
    let filterFunction: (entry: WorkTimeEntry) => boolean;

    if (selectedPeriod === 'weekly') {
      filterFunction = (entry) =>
        new Date(entry.startTime) >=
          new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate() - now.getDay()
          ) && new Date(entry.startTime) <= now;
    } else if (selectedPeriod === 'monthly') {
      const monthIndex = new Date(
        Date.parse(selectedMonth + ' 1, ' + selectedYear)
      ).getMonth();
      filterFunction = (entry) =>
        new Date(entry.startTime).getMonth() === monthIndex &&
        new Date(entry.startTime).getFullYear() === selectedYear;
    } else {
      filterFunction = (entry) =>
        new Date(entry.startTime).getFullYear() === selectedYear;
    }

    setTotalTime(calculateTotalTime(filterFunction));
  }, [workTimes, selectedPeriod, selectedMonth, selectedYear]);

  const formatDateTime = (timestamp: number, format: string) => {
    if (format === 'duration') {
      const hours = Math.floor(timestamp / 3600);
      const minutes = Math.floor((timestamp % 3600) / 60);
      const seconds = timestamp % 60;
      return `${hours.toString().padStart(2, '0')}:${minutes
        .toString()
        .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else if (format === 'report') {
      const hours = Math.floor(timestamp / 3600);
      const minutes = Math.floor((timestamp % 3600) / 60);
      return `${hours.toString()}:${minutes.toString().padStart(2, '0')}`;
    }
    return '';
  };

  const handleHourlyRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rate = parseFloat(e.target.value);
    setHourlyRate(rate);
    chrome.storage.local.set({ hourlyRate: rate });
  };

  const calculateEarnings = (totalTime: number) => {
    return Math.round(totalTime / 3600) * hourlyRate;
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

    if (selectedPeriod === 'weekly') {
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
      labels = Array.from({ length: 7 }, (_, i) => {
        const day = new Date(startOfWeek);
        day.setDate(startOfWeek.getDate() + i);
        return day.toLocaleDateString();
      });
      data = labels.map((day) => {
        const dayDate = new Date(day);
        return workTimes
          .filter(
            (entry) =>
              new Date(entry.startTime).toDateString() ===
              dayDate.toDateString()
          )
          .reduce((acc, entry) => acc + entry.duration, 0);
      });
    } else if (selectedPeriod === 'monthly') {
      const daysInMonth = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0
      ).getDate();
      labels = Array.from({ length: daysInMonth }, (_, i) => `Day ${i + 1}`);
      data = labels.map((_, i) => {
        const day = new Date(
          now.getFullYear(),
          now.getMonth(),
          i + 1
        ).toDateString();
        return workTimes
          .filter((entry) => new Date(entry.startTime).toDateString() === day)
          .reduce((acc, entry) => acc + entry.duration, 0);
      });
    } else if (selectedPeriod === 'yearly') {
      labels = Array.from({ length: 12 }, (_, i) =>
        new Date(0, i).toLocaleString('default', { month: 'short' })
      );
      data = labels.map((_, i) => {
        return workTimes
          .filter(
            (entry) =>
              new Date(entry.startTime).getMonth() === i &&
              new Date(entry.startTime).getFullYear() === selectedYear
          )
          .reduce((acc, entry) => acc + entry.duration, 0);
      });
    }

    return {
      labels,
      datasets: [
        {
          label: 'Hours',
          data: data.map((d) => d / 3600),
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
        },
      ],
    };
  };

  const chartData = calculateChartData();

  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
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

        {selectedPeriod === 'monthly' && (
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

        {selectedPeriod === 'yearly' && (
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
            Total Time:{' '}
            <span className="font-bold text-teal-600 text-xl animate-pulse">
              {formatDateTime(totalTime, 'report')}
            </span>
          </p>
          <p className="text-gray-700 text-lg font-roboto">
            Total Earnings:{' '}
            <span className="font-bold text-teal-600 text-xl animate-pulse">
              { hourlyRate < 60 &&  '$' }
              {calculateEarnings(totalTime).toFixed(2)}
              { hourlyRate >= 60 &&  ' Zł' }

            </span>
          </p>
        </div>
      </div>

      <div className="mb-6">
        <Bar data={chartData} options={{ maintainAspectRatio: false }} />
      </div>
    </div>
  );
};

export default Statistics;
