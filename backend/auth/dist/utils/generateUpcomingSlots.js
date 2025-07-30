"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const date_fns_1 = require("date-fns");
const dayToIdx = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
};
function generateUpcomingSlots(weekly = [], daysAhead = 7) {
    const today = new Date();
    const out = [];
    for (let i = 0; i < daysAhead; i++) {
        const date = (0, date_fns_1.addDays)(today, i);
        const weekdayIdx = date.getDay();
        weekly.forEach((w) => {
            if (dayToIdx[w.day] === weekdayIdx) {
                out.push({
                    day: w.day,
                    date: (0, date_fns_1.format)(date, 'yyyy-MM-dd'),
                    startTime: w.startTime,
                    endTime: w.endTime,
                });
            }
        });
    }
    return out;
}
exports.default = generateUpcomingSlots;
