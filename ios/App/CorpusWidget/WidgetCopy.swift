import Foundation

// Short one-line captions for the small widget. Round 10: Hebrew is
// added so the small widget follows the app language (medium widget
// was localised in the first round-10 pass; small was explicitly
// English-only). Each caption is a single line and short enough to
// fit on one line at 13 pt heavy inside the small widget's caption
// column. The small widget applies .lineLimit(1) + .minimumScaleFactor(0.8)
// as a safety net; the strings here are already short enough to avoid
// scaling in the common case.
enum WidgetCopy {
    static func line(for state: WidgetState, lang: WidgetSnapshot.Lang = .en) -> String {
        switch lang {
        case .en:
            switch state {
            case .ready:   return "Let's talk"
            case .nudge:   return "5 minutes?"
            case .worried: return "Still time"
            case .last:    return "Last chance!"
            case .done:    return "Done today"
            case .badge:   return "New badge!"
            case .lost:    return "Start again"
            }
        case .he:
            switch state {
            case .ready:   return "בואו נדבר"
            case .nudge:   return "5 דקות?"
            case .worried: return "יש עוד זמן"
            case .last:    return "ההזדמנות האחרונה!"
            case .done:    return "סיימתם היום"
            case .badge:   return "תג חדש!"
            case .lost:    return "להתחיל מחדש"
            }
        }
    }
}
