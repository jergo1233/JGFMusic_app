export const formatTime = (seconds) => {
  if (isNaN(seconds) || seconds === null || seconds === undefined) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
};
