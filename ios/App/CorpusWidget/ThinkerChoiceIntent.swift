import AppIntents
import Foundation
import WidgetKit

// User-facing widget configuration intent — "which thinker should the
// widget show?". Automatic (default) means follow the subject the user
// has active in the app, which is what the widget always does when no
// explicit pick has been made. The three explicit options pin the
// widget to one thinker + subject regardless of the stored subject,
// so a user who runs philosophy day-to-day but likes seeing Freud on
// their home screen can set that once and leave it.
//
// Extension deployment target is iOS 17.0 — this file does not need
// availability gates. AppIntents is iOS 16+ and WidgetConfigurationIntent
// is iOS 17+; both are below the extension's minimum.
enum ThinkerChoice: String, AppEnum {
    case automatic
    case socrates
    case smith
    case freud

    static var typeDisplayRepresentation: TypeDisplayRepresentation = "Thinker"

    static var caseDisplayRepresentations: [ThinkerChoice: DisplayRepresentation] = [
        .automatic: DisplayRepresentation(title: "Automatic"),
        .socrates:  DisplayRepresentation(title: "Socrates"),
        .smith:     DisplayRepresentation(title: "Adam Smith"),
        .freud:     DisplayRepresentation(title: "Freud"),
    ]

    // Maps the picker choice to a subject override. .automatic
    // returns nil, meaning "use whatever subject the data blob
    // says" — the Provider leaves the snapshot alone.
    var subjectOverride: WidgetSnapshot.Subject? {
        switch self {
        case .automatic: return nil
        case .socrates:  return .philo
        case .smith:     return .econ
        case .freud:     return .psych
        }
    }
}

struct ThinkerChoiceIntent: WidgetConfigurationIntent {
    static var title: LocalizedStringResource = "Thinker"
    static var description = IntentDescription(
        "Pick which thinker the widget shows. Automatic follows the subject you're using in the app."
    )

    @Parameter(title: "Thinker", default: ThinkerChoice.automatic)
    var thinker: ThinkerChoice

    init() {}
    init(thinker: ThinkerChoice) {
        self.thinker = thinker
    }
}
