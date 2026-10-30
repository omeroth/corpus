import AppIntents
import SwiftUI
import WidgetKit

// Widget entry — one data point for one moment in time. Carries the
// resolved WidgetSnapshot + the pre-computed WidgetState so the view
// doesn't need to run the state engine itself (the Provider does it
// once per entry). todayTitle + todayThinker ride alongside the
// snapshot because the medium widget needs them and keeping them in
// a separate pair here (rather than inside WidgetSnapshot) keeps the
// Snapshot type unchanged for the small widget.
struct CorpusEntry: TimelineEntry {
    let date: Date
    let snapshot: WidgetSnapshot
    let state: WidgetState
    let todayTitle: String?
    let todayThinker: String?
}

// MARK: - Gallery / placeholder snapshot
//
// Shown in Xcode previews, the add-widget gallery, and the brief
// moment WidgetKit renders the placeholder() before snapshot()
// completes. Always "ready" state + 12-day streak + the user's
// active subject when known. The spec: "the gallery preview should
// show the ready state with a streak of 12, not lost". A lost
// preview reads as broken.
func corpusGalleryPreviewEntry(subjectOverride: WidgetSnapshot.Subject? = nil) -> CorpusEntry {
    let base = WidgetSnapshot.from(WidgetModel.load())
    let subject = subjectOverride ?? base.subject
    let snapshot = WidgetSnapshot(
        subject: subject,
        lang: base.lang,
        streak: 12,
        lastActiveDay: nil,
        badgeTier: nil,
        badgeDay: nil,
        // Plausible week — 5 lit, 2 unlit — reads better in the
        // gallery than a fresh install's all-off week.
        week: [true, true, true, true, true, false, false]
    )
    return CorpusEntry(
        date: Date(),
        snapshot: snapshot,
        state: .ready,
        todayTitle: nil,
        todayThinker: nil
    )
}

// MARK: - Live entry builder
//
// subjectOverride lets the provider pin the thinker from the
// ThinkerChoiceIntent configuration. nil = follow the stored subject.
func corpusLiveEntry(now: Date, subjectOverride: WidgetSnapshot.Subject?) -> CorpusEntry {
    let model = WidgetModel.load()
    var snapshot = WidgetSnapshot.from(model)
    if let override = subjectOverride {
        snapshot = WidgetSnapshot(
            subject: override,
            lang: snapshot.lang,
            streak: snapshot.streak,
            lastActiveDay: snapshot.lastActiveDay,
            badgeTier: snapshot.badgeTier,
            badgeDay: snapshot.badgeDay,
            week: snapshot.week
        )
    }
    let state = WidgetStateEngine.current(for: snapshot, now: now)
    return CorpusEntry(
        date: now,
        snapshot: snapshot,
        state: state,
        todayTitle: model?.todayTitle,
        todayThinker: model?.todayThinker
    )
}

// MARK: - Provider

struct CorpusAppIntentProvider: AppIntentTimelineProvider {
    func placeholder(in context: Context) -> CorpusEntry {
        corpusGalleryPreviewEntry()
    }
    func snapshot(for configuration: ThinkerChoiceIntent, in context: Context) async -> CorpusEntry {
        // Reflect the user's picker choice in the configuration-sheet
        // preview so dragging the picker to "Freud" shows Freud in the
        // live preview area. Non-automatic → override; .automatic
        // falls through to the stored subject.
        corpusGalleryPreviewEntry(subjectOverride: configuration.thinker.subjectOverride)
    }
    func timeline(for configuration: ThinkerChoiceIntent, in context: Context) async -> Timeline<CorpusEntry> {
        let dates = WidgetStateEngine.timelineDates()
        let override = configuration.thinker.subjectOverride
        let entries = dates.map { corpusLiveEntry(now: $0, subjectOverride: override) }
        return Timeline(entries: entries, policy: .atEnd)
    }
}

// MARK: - Entry-point view that picks the small or medium layout

struct WidgetBody: View {
    let entry: CorpusEntry
    @Environment(\.widgetFamily) private var family

    var body: some View {
        switch family {
        case .systemSmall:
            ThinkerSmallView(snapshot: entry.snapshot, state: entry.state, date: entry.date)
        case .systemMedium:
            ThinkerMediumView(
                snapshot:     entry.snapshot,
                state:        entry.state,
                date:         entry.date,
                todayTitle:   entry.todayTitle,
                todayThinker: entry.todayThinker
            )
        case .accessoryCircular:
            LockThinkerCircularView(snapshot: entry.snapshot, state: entry.state)
        case .accessoryRectangular:
            LockThinkerRectangularView(snapshot: entry.snapshot, state: entry.state)
        default:
            ThinkerSmallView(snapshot: entry.snapshot, state: entry.state, date: entry.date)
        }
    }
}

// MARK: - Widget
//
// Single configuration — AppIntentConfiguration — gated at the Xcode
// target level by setting the extension's IPHONEOS_DEPLOYMENT_TARGET
// to 17.0 (the main app stays at 15.0). Users on iOS 15/16 simply
// won't see the widget in their gallery, but the app continues to
// work; the alternative (dual-configuration branching) hit a
// WidgetConfigurationBuilder limitation where
// `.contentMarginsDisabled()` is one of the modifiers that doesn't
// compose through #available branches.
struct CorpusTodayWidget: Widget {
    let kind: String = "CorpusTodayWidget"

    var body: some WidgetConfiguration {
        AppIntentConfiguration(
            kind: kind,
            intent: ThinkerChoiceIntent.self,
            provider: CorpusAppIntentProvider()
        ) { entry in
            WidgetBody(entry: entry)
                .widgetURL(URL(string: "corpus://today"))
        }
        .configurationDisplayName("Corpus")
        .description("Today's dialogue, your streak, your thinker.")
        .supportedFamilies([
            .systemSmall, .systemMedium,
            // Lock-screen surfaces (iOS 16+; extension deployment is
            // 17.0 so no availability branching needed). Both share
            // the live snapshot + state engine with the home-screen
            // widget — one timeline, four presentations.
            .accessoryCircular, .accessoryRectangular,
        ])
        .contentMarginsDisabled()
    }
}
