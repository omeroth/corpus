import SwiftUI

// Gradients + text colour per (state, subject) tuple. Values are from
// WIDGET_HANDOFF.md §4 — the design is the source of truth, so if
// something feels off, open widget-handoff/corpus-widgets.html before
// touching these constants.
//
// All gradients are top-left → bottom-right.
enum WidgetTheme {
    struct Palette {
        let gradientStart: Color
        let gradientEnd: Color
        let textColor: Color
    }

    static func palette(state: WidgetState, subject: WidgetSnapshot.Subject) -> Palette {
        // Subject-agnostic rows first — these override the subject
        // tint entirely.
        switch state {
        case .last:
            return Palette(gradientStart: hex("#F0525A"),
                           gradientEnd:   hex("#A3182E"),
                           textColor:     .white)
        case .lost:
            return Palette(gradientStart: hex("#9A94AE"),
                           gradientEnd:   hex("#625C78"),
                           textColor:     .white)
        case .badge:
            return Palette(gradientStart: hex("#FFE09A"),
                           gradientEnd:   hex("#F5A623"),
                           textColor:     hex("#2A1266"))
        default:
            break
        }

        // Remaining states (ready / nudge / done / worried) use
        // per-subject colours. Worried is the darker intense ramp;
        // the others share the softer ramp.
        switch (state, subject) {
        case (.worried, .philo):
            return Palette(gradientStart: hex("#7B4FD4"),
                           gradientEnd:   hex("#4A2A8F"),
                           textColor:     .white)
        case (.worried, .econ):
            return Palette(gradientStart: hex("#3D7BE0"),
                           gradientEnd:   hex("#22509E"),
                           textColor:     .white)
        case (.worried, .psych):
            return Palette(gradientStart: hex("#F28A2E"),
                           gradientEnd:   hex("#B4560F"),
                           textColor:     .white)

        // ready / nudge / done share the pastel ramp per subject
        case (_, .philo):
            return Palette(gradientStart: hex("#D8D7F6"),
                           gradientEnd:   hex("#C4C0F0"),
                           textColor:     hex("#2A1266"))
        case (_, .econ):
            return Palette(gradientStart: hex("#C8E9FC"),
                           gradientEnd:   hex("#A9D9F7"),
                           textColor:     hex("#2A1266"))
        case (_, .psych):
            return Palette(gradientStart: hex("#FCD7AB"),
                           gradientEnd:   hex("#F8C189"),
                           textColor:     hex("#2A1266"))
        }
    }

    static func gradient(state: WidgetState, subject: WidgetSnapshot.Subject) -> LinearGradient {
        let p = palette(state: state, subject: subject)
        return LinearGradient(
            colors: [p.gradientStart, p.gradientEnd],
            startPoint: .topLeading,
            endPoint:   .bottomTrailing
        )
    }

    // MARK: - Hex helper
    //
    // Accepts the "#RRGGBB" strings copied verbatim from the handoff
    // so there's no manual channel-splitting at the use site. Any
    // malformed value falls back to black (visible defect, not a
    // silent wrong colour).
    private static func hex(_ s: String) -> Color {
        var str = s.trimmingCharacters(in: .whitespacesAndNewlines)
        if str.hasPrefix("#") { str.removeFirst() }
        guard str.count == 6, let v = UInt32(str, radix: 16) else { return .black }
        let r = Double((v >> 16) & 0xff) / 255.0
        let g = Double((v >> 8)  & 0xff) / 255.0
        let b = Double( v        & 0xff) / 255.0
        return Color(.sRGB, red: r, green: g, blue: b, opacity: 1.0)
    }
}
