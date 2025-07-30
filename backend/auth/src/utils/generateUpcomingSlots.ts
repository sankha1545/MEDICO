import { addDays, format } from 'date-fns';

const dayToIdx: Record<string, number> = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

interface WeeklySlot {
  day: string;
  startTime: string;
  endTime: string;
  quantity?: number;
}

export default function generateUpcomingSlots(
  weekly: WeeklySlot[] = [],
  daysAhead = 7
) {
  const today = new Date();
  const out: {
    day: string;
    date: string;
    startTime: string;
    endTime: string;
  }[] = [];

  for (let i = 0; i < daysAhead; i++) {
    const date = addDays(today, i);
    const weekdayIdx = date.getDay();

    weekly.forEach((w) => {
      if (dayToIdx[w.day] === weekdayIdx) {
        out.push({
          day: w.day,
          date: format(date, 'yyyy-MM-dd'),
          startTime: w.startTime,
          endTime: w.endTime,
        });
      }
    });
  }

  return out;
}
