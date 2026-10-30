import Foundation

// State selection and timeline keypoints. The widget derives its state
// purely from the stored snapshot + the current time, following
// WIDGET_HANDOFF.md §2's priority table verbatim. Keep the top-to-
// bottom order below identical to that table — reordering silently
// changes behaviour (e.g. badge must beat done, done must beat ready).
enum WidgetState: String {
    case ready
    case nudge
    case worried
    case last
    case done
    case badge
    case lost

    var mood: ThinkerMood {
        switch self {
        case .ready:   return .curious
        case .nudge:   return .wave
        case .worried: return .worried
        case .last:    return .worried
        case .done:    return .celebrate
        case .badge:   return .celebrate
        case .lost:    return .sleep
        }
    }

    // Streak number shown in each state. "lost" is the only state
    // that forces 0 regardless of the stored streak — matches the
    // visual reference's grey card showing 0 days.
    func streakDisplay(from snapshot: WidgetSnapshot) -> Int {
        self == .lost ? 0 : snapshot.streak
    }
}

enum ThinkerMood: String {
    // v7 onb-thinkers set only. No `neutral` (not in v7) or `plead` (unused
    // by any widget state — see WidgetState.mood). `happy` is kept because
    // it's a v7 asset even though no state currently maps to it.
    case curious, worried, happy, celebrate, sleep, wave
}

enum WidgetStateEngine {
    // "Today's key" is date(now - 3 hours), YYYY-MM-DD in local time.
    // Matches the app's 3AM grace: 00:00–02:59 still counts as the
    // previous day. Uses the device's current calendar + timezone;
    // widgets inherit those from the host system automatically.
    static func todayKey(_ now: Date = Date(), calendar: Calendar = .current) -> String {
        let adjusted = now.addingTimeInterval(-3 * 3600)
        let formatter = DateFormatter()
        formatter.calendar = calendar
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.timeZone = calendar.timeZone
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.string(from: adjusted)
    }

    static func yesterdayKey(_ today: String) -> String? {
        // Lightweight: parse the YYYY-MM-DD, subtract one day, format.
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.dateFormat = "yyyy-MM-dd"
        guard let date = formatter.date(from: today) else { return nil }
        guard let prev = Calendar.current.date(byAdding: .day, value: -1, to: date) else { return nil }
        return formatter.string(from: prev)
    }

    // Local hour used by the time-of-day rows of the table (3–13, 14–18,
    // 19–21, 22–2). Pulled from the device's wall clock, same timezone
    // the todayKey calculation uses.
    static func localHour(_ now: Date = Date(), calendar: Calendar = .current) -> Int {
        calendar.component(.hour, from: now)
    }

    static func current(for snapshot: WidgetSnapshot, now: Date = Date()) -> WidgetState {
        let today = todayKey(now)
        let yesterday = yesterdayKey(today) ?? ""
        let hour = localHour(now)

        // Priority 1: badge earned today
        if let badgeDay = snapshot.badgeDay, badgeDay == today, snapshot.badgeTier != nil {
            return .badge
        }
        // Priority 2: dialogue done today
        if let lastActive = snapshot.lastActiveDay, lastActive == today {
            return .done
        }
        // Priority 3: streak lost — lastActiveDay strictly before yesterday,
        // or no activity at all, or streak collapsed to 0
        if let lastActive = snapshot.lastActiveDay {
            if lastActive < yesterday || snapshot.streak == 0 {
                return .lost
            }
        } else {
            return .lost
        }

        // Priority 4–7: time of day. Local hours wrap through midnight,
        // so the 22:00–02:59 band spans two numeric ranges.
        switch hour {
        case 3...13:  return .ready
        case 14...18: return .nudge
        case 19...21: return .worried
        default:      return .last  // 22, 23, 0, 1, 2
        }
    }

    // Timeline keypoints: build an entry for `now` and for each of the
    // next 03:00, 14:00, 19:00, 22:00 (local). Timeline policy will be
    // .atEnd, so the widget never asks for a new timeline between
    // these moments and the state transitions happen on schedule
    // without the app being opened.
    static func timelineDates(after now: Date = Date(), calendar: Calendar = .current) -> [Date] {
        let hours = [3, 14, 19, 22]
        var dates: [Date] = [now]
        for hour in hours {
            if let next = nextOccurrence(of: hour, after: now, calendar: calendar) {
                dates.append(next)
            }
        }
        // Deduplicate and sort. "now" and the next scheduled hour can
        // coincide to the second on a fire boundary; a duplicate entry
        // would cause the widget to re-render redundantly.
        let unique = Array(Set(dates)).sorted()
        return unique
    }

    private static func nextOccurrence(of hour: Int, after now: Date, calendar: Calendar) -> Date? {
        var comps = calendar.dateComponents([.year, .month, .day, .hour, .minute, .second], from: now)
        comps.hour = hour
        comps.minute = 0
        comps.second = 0
        guard let candidate = calendar.date(from: comps) else { return nil }
        if candidate > now {
            return candidate
        }
        return calendar.date(byAdding: .day, value: 1, to: candidate)
    }
}
