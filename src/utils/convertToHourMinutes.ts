export const convertToHourMinutes = (totalHours: number) => {
  const totalMinutes = Math.floor(totalHours * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}:${minutes.toString().padStart(2, "0")}`;
};
