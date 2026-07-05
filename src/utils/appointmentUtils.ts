/**
 * Appointment related utility functions
 */

export const formatDate = (dateStr: string) => {
  if (!dateStr || typeof dateStr !== 'string' || !dateStr.includes('-')) return dateStr;
  const parts = dateStr.split('-');
  if (parts.length === 3 && parts[0].length === 4) {
    const [year, month, day] = parts;
    return `${day}-${month}-${year}`;
  }
  return dateStr;
};

export const capitalize = (str: string) => {
  if (!str || typeof str !== 'string') return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const formatDoctorName = (name: string) => {
  if (!name || typeof name !== 'string') return name;
  const trimmed = name.trim();
  if (trimmed.toLowerCase().startsWith('dr.') || trimmed.toLowerCase().startsWith('dr ')) {
    return trimmed;
  }
  return `Dr. ${trimmed}`;
};

export const getApptDateTime = (dateStr: string, timeStr: string) => {
  if (!dateStr || !timeStr || typeof dateStr !== 'string' || typeof timeStr !== 'string') return new Date(0);
  
  let year, month, day;
  if (dateStr.includes('-')) {
    [year, month, day] = dateStr.split('-').map(Number);
  } else if (dateStr.length === 8) {
    year = Number(dateStr.slice(0, 4));
    month = Number(dateStr.slice(4, 6));
    day = Number(dateStr.slice(6, 8));
  } else {
    return new Date(0);
  }

  const timeParts = timeStr.trim().split(' ');
  if (timeParts.length < 2) return new Date(year, month - 1, day);
  let [time, modifier] = timeParts;
  let [hours, minutes] = time.split(':').map(Number);
  if (modifier === 'PM' && hours < 12) hours += 12;
  if (modifier === 'AM' && hours === 12) hours = 0;
  return new Date(year, month - 1, day, hours, minutes);
};

export const isAppointmentPast = (dateStr: string, timeStr: string) => {
  return new Date() > getApptDateTime(dateStr, timeStr);
};

export const isWithinUpcomingWindow = (dateStr: string, timeStr: string, windowMins: number = 15) => {
  const apptDate = getApptDateTime(dateStr, timeStr);
  const now = new Date();
  const start = new Date(apptDate.getTime() - windowMins * 60 * 1000);
  const end = new Date(apptDate.getTime() + windowMins * 60 * 1000);
  return now >= start && now <= end;
};

export const canRescheduleAppointment = (dateStr: string, timeStr: string) => {
  const apptDate = getApptDateTime(dateStr, timeStr);
  const now = new Date();
  const diffInMs = apptDate.getTime() - now.getTime();
  return diffInMs > 60 * 60 * 1000; // 1 hour
};

export const canFollowUpAppointment = (dateStr: string) => {
  if (!dateStr || typeof dateStr !== 'string') return false;
  const [year, month, day] = dateStr.split('-').map(Number);
  const apptDate = new Date(year, month - 1, day);
  const now = new Date();
  const diffInMs = now.getTime() - apptDate.getTime();
  return diffInMs >= 0 && diffInMs <= 14 * 24 * 60 * 60 * 1000; // 14 days
};
