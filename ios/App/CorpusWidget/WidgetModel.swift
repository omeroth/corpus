import Foundation

// Codable mirror of the JSON blob the plugin writes. Fields match the
// handoff doc (§1) exactly; renaming or reordering here would silently
// desync from the JS writer and the Android stub, so the compiler
// cannot catch that drift — add a smoke test if we ever reshape.
//
// All fields optional/defaulted because the blob format is versioned
// (v: 1) and the widget needs to tolerate missing keys from older
// writes gracefully — a corrupt or stale blob should render the lost
// state, not crash the extension.
struct WidgetModel: Codable {
    let v: Int?
    let subject: String?          // "philo" | "econ" | "psych"
    let lang: String?             // "en" | "he"
    let streak: Int?
    let lastActiveDay: String?    // "YYYY-MM-DD"
    let badgeTier: Int?           // 0..4 or nil
    let badgeDay: String?         // "YYYY-MM-DD" or nil
    let todayTitle: String?       // medium widget only (phase 2)
    let todayThinker: String?     // medium widget only (phase 2)
    let week: [Bool]?             // 7 bools, order matches _streakWeekKeys
    let updatedAt: Int?           // epoch seconds

    static func load() -> WidgetModel? {
        // Suite name + storage key MUST match the plugin's constants
        // (CorpusWidgetBridgePlugin.swift). If either side drifts the
        // widget sees stale/empty data and silently shows the lost
        // state. There's no safe way to share the strings between the
        // plugin and the extension at the file level (different Swift
        // package / target boundaries), so they live twice. Keep them
        // in lockstep.
        guard let defaults = UserDefaults(suiteName: "group.com.corpusapp.corpus.shared"),
              let raw = defaults.string(forKey: "corpus.widget"),
              let data = raw.data(using: .utf8) else {
            return nil
        }
        do {
            return try JSONDecoder().decode(WidgetModel.self, from: data)
        } catch {
            return nil
        }
    }
}

// Normalised view, with every field resolved to a non-optional default
// matching the handoff's spec for a "no data yet" (first-install) case:
// the lost state with a sleeping thinker. Keeps the state-
// selection code free of ?? everywhere.
struct WidgetSnapshot {
    let subject: Subject
    let lang: Lang
    let streak: Int
    let lastActiveDay: String?
    let badgeTier: Int?
    let badgeDay: String?
    let week: [Bool]

    enum Subject: String {
        case philo = "philo"
        case econ = "econ"
        case psych = "psych"

        var thinkerSlug: String {
            switch self {
            case .philo: return "socrates"
            case .econ:  return "smith"
            case .psych: return "freud"
            }
        }

        var thinkerNameEN: String {
            switch self {
            case .philo: return "Socrates"
            case .econ:  return "Adam Smith"
            case .psych: return "Freud"
            }
        }

    }

    // Lang stays in the data model because the plugin writes `lang`
    // on every state save and we don't want decode failures when the
    // widget is English-only. View code ignores the value — a Hebrew
    // widget is a future addition we're not shipping now.
    enum Lang: String {
        case en = "en"
        case he = "he"
    }

    static func from(_ model: WidgetModel?) -> WidgetSnapshot {
        let subject = Subject(rawValue: model?.subject ?? "philo") ?? .philo
        let lang = Lang(rawValue: model?.lang ?? "en") ?? .en
        let week = (model?.week ?? Array(repeating: false, count: 7)).prefix(7).map { $0 }
        let padded: [Bool] = week.count < 7
            ? week + Array(repeating: false, count: 7 - week.count)
            : Array(week)
        return WidgetSnapshot(
            subject: subject,
            lang: lang,
            streak: max(0, model?.streak ?? 0),
            lastActiveDay: model?.lastActiveDay,
            badgeTier: model?.badgeTier,
            badgeDay: model?.badgeDay,
            week: padded
        )
    }
}
