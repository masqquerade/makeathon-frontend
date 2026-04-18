import type { ScheduleEntry } from "../../types";

export type CalendarEventKind =
  | "course"
  | "tutor"
  | "personal"
  | "room_booked"
  | "event_registered";

export interface CalendarEvent {
  id: string;
  title: string;
  subtitle?: string;
  kind: CalendarEventKind;
  day: 0 | 1 | 2 | 3 | 4; // 0=Mon … 4=Fri
  startMinute: number;     // minutes since 08:00
  durationMinutes: number;
  moveable: boolean;
}

// Returns the Monday of the displayed week.
// If today is Sat/Sun, jump to next Monday.
export function getWeekDates(today: Date): Date[] {
  const d = new Date(today);
  const dow = d.getDay(); // 0=Sun, 6=Sat
  let daysToMon: number;
  if (dow === 0) daysToMon = 1;
  else if (dow === 6) daysToMon = 2;
  else daysToMon = -(dow - 1);
  d.setDate(d.getDate() + daysToMon);
  d.setHours(0, 0, 0, 0);
  return Array.from({ length: 5 }, (_, i) => {
    const day = new Date(d);
    day.setDate(d.getDate() + i);
    return day;
  });
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function formatTime(startMinute: number, durationMinutes: number): string {
  const toHHMM = (m: number) => {
    const h = Math.floor((m + 480) / 60);
    const min = (m + 480) % 60;
    return `${h}:${String(min).padStart(2, "0")}`;
  };
  return `${toHHMM(startMinute)}–${toHHMM(startMinute + durationMinutes)}`;
}

export const MOCK_EVENTS: CalendarEvent[] = [
  // Courses (fixed)
  {
    id: "c-dismath",
    title: "Discrete Mathematics",
    subtitle: "MI HS 1 · Prof. Schulz",
    kind: "course",
    day: 0,
    startMinute: 120, // 10:00
    durationMinutes: 90,
    moveable: false,
  },
  {
    id: "c-linalg",
    title: "Linear Algebra",
    subtitle: "MW 0001 · Prof. Bauer",
    kind: "course",
    day: 1,
    startMinute: 0, // 08:00
    durationMinutes: 90,
    moveable: false,
  },
  {
    id: "c-algods",
    title: "Algorithms & DS",
    subtitle: "MI 02.04.011 · Prof. Klein",
    kind: "course",
    day: 2,
    startMinute: 240, // 12:00
    durationMinutes: 90,
    moveable: false,
  },
  {
    id: "c-cslab",
    title: "Intro to CS Lab",
    subtitle: "MI 02.05.014",
    kind: "course",
    day: 3,
    startMinute: 360, // 14:00
    durationMinutes: 180,
    moveable: false,
  },
  {
    id: "c-seminar",
    title: "Research Seminar",
    subtitle: "MI 00.13.009A",
    kind: "course",
    day: 4,
    startMinute: 120, // 10:00
    durationMinutes: 90,
    moveable: false,
  },
  // Tutors (moveable)
  {
    id: "t-math",
    title: "Tutor: Math",
    subtitle: "with Leon Fischer",
    kind: "tutor",
    day: 0,
    startMinute: 360, // 14:00
    durationMinutes: 90,
    moveable: true,
  },
  {
    id: "t-algo",
    title: "Tutor: Algorithms",
    subtitle: "with Sarah Meier",
    kind: "tutor",
    day: 3,
    startMinute: 120, // 10:00
    durationMinutes: 90,
    moveable: true,
  },
  // Personal (moveable)
  {
    id: "p-gym",
    title: "Gym — ZHS Stachus",
    kind: "personal",
    day: 1,
    startMinute: 540, // 17:00
    durationMinutes: 90,
    moveable: true,
  },
  {
    id: "p-run",
    title: "Morning run",
    kind: "personal",
    day: 2,
    startMinute: 0, // 08:00
    durationMinutes: 60,
    moveable: true,
  },
  {
    id: "p-studygrp",
    title: "Study group",
    subtitle: "Library room B2",
    kind: "personal",
    day: 4,
    startMinute: 240, // 12:00
    durationMinutes: 60,
    moveable: true,
  },
];

// Day name → 0..4 map for parsing session entries
const DAY_INDEX: Record<string, 0 | 1 | 2 | 3 | 4> = {
  monday: 0, mon: 0,
  tuesday: 1, tue: 1,
  wednesday: 2, wed: 2,
  thursday: 3, thu: 3,
  friday: 4, fri: 4,
};

function parseTimeToMinutes(hhmm: string): number | null {
  const [h, m] = hhmm.split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return null;
  return (h * 60 + m) - 480; // offset from 08:00
}

// Convert a session ScheduleEntry into a CalendarEvent.
// The entry.time field may be "Today · 14:00–16:00", "Tuesday · 19:00 · Room MI HS 1", etc.
export function sessionEntryToEvent(
  entry: ScheduleEntry,
  weekDates: Date[]
): CalendarEvent | null {
  const kind: CalendarEventKind =
    entry.type === "room_booked" ? "room_booked" : "event_registered";

  // Try to extract a day name from the time string
  const lowerTime = entry.time.toLowerCase();
  let dayIndex: 0 | 1 | 2 | 3 | 4 | null = null;

  if (lowerTime.includes("today")) {
    const today = new Date();
    for (let i = 0; i < weekDates.length; i++) {
      if (isSameDay(weekDates[i], today)) {
        dayIndex = i as 0 | 1 | 2 | 3 | 4;
        break;
      }
    }
    if (dayIndex === null) dayIndex = 0; // fallback to Mon if today isn't in view
  } else {
    for (const [name, idx] of Object.entries(DAY_INDEX)) {
      if (lowerTime.includes(name)) {
        dayIndex = idx;
        break;
      }
    }
  }
  if (dayIndex === null) return null;

  // Extract start time from "HH:MM" or "HH:MM–HH:MM" patterns
  const timeMatch = entry.time.match(/(\d{1,2}:\d{2})(?:[–-](\d{1,2}:\d{2}))?/);
  if (!timeMatch) return null;

  const startMin = parseTimeToMinutes(timeMatch[1]);
  if (startMin === null || startMin < 0) return null;

  let duration = 60;
  if (timeMatch[2]) {
    const endMin = parseTimeToMinutes(timeMatch[2]);
    if (endMin !== null && endMin > startMin) duration = endMin - startMin;
  }

  return {
    id: `session-${entry.id}`,
    title: entry.title,
    kind,
    day: dayIndex,
    startMinute: startMin,
    durationMinutes: duration,
    moveable: false,
  };
}
