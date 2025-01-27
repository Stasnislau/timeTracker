export const calculateEarning = (totalHours: number, hourlyRate: number) => {
  return (Math.round(totalHours) * hourlyRate).toFixed(2);
};
