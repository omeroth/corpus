import SwiftUI
import UIKit
import WidgetKit
import os.log

// MARK: - Bundle-image lookup
//
// Loose bundle resources (thinker-silhouette.png lives in the
// widget extension's bundle, NOT in Assets.xcassets). SwiftUI's
// Image(_: String) only looks in the asset catalog, so a plain
// `Image("thinker-silhouette")` resolves to an empty image and
// the thinker never renders. Round-tripping through
// UIImage(named:) is the same workaround the home-screen widgets
// use for the thinker PNGs; see ThinkerSmallView.bundleImage.
// Logs when the lookup fails so a future bundling regression is
// visible in Console.app instead of silent.
private let lockWidgetLog = Logger(subsystem: "com.corpusapp.corpus.CorpusWidget",
                                   category: "LockScreenViews")
private func lockBundleImage(_ name: String) -> Image {
    if let ui = UIImage(named: name) {
        return Image(uiImage: ui)
    }
    lockWidgetLog.error("Missing bundle image '\(name, privacy: .public)' — widget extension failed to load the resource. Confirm it is in CorpusWidgetExtension.appex.")
    return Image(uiImage: UIImage())
}

// ═══════════════════════════════════════════════════════════════
// Fixed 64×64 design space for the accessory icon.
//
// GeometryReader is NOT used anywhere in the icon composition.
// Every element positions itself with explicit coordinates in a
// 64-unit space, matching the reference HTML's "M" config:
//
//   thinker image: top-leading at (2, 28), size (35·AR, 35)
//                  where AR = 297/390 ≈ 0.761
//   cloud centre:  (43, 17), radius 16
//   bubble 1:      centre (29, 33), radius 2.4
//   bubble 2:      centre (25.5, 37), radius 1.5
//   label base:    16 pt (scaled by digit-count table)
//
// The outer views then size via .frame(width: 64, height: 64)
// and .scaleEffect(_) to fit each lock-screen family's content
// area, with a surrounding .frame(maxWidth: .infinity, maxHeight:
// .infinity) so the icon is centred in whatever container it
// lands in.
//
// Key invariant: every ZStack that holds .position(x:y:) children
// contains a Color.clear.frame(width: 64, height: 64) sentinel as
// its first child. Without it the ZStack's intrinsic size is
// zero (positioned children contribute no layout size), and the
// children render around (0, 0) — the exact bug that was
// collapsing the circular family on-device.
// ═══════════════════════════════════════════════════════════════

private let kDesignSize: CGFloat = 64
private let kThinkerH:   CGFloat = 35
private let kThinkerAR:  CGFloat = 297.0 / 390.0
private let kThinkerW:   CGFloat = kThinkerH * kThinkerAR
private let kThinkerX:   CGFloat = 2                 // top-leading x
private let kThinkerY:   CGFloat = 28                // top-leading y
private let kCloudCX:    CGFloat = 43
private let kCloudCY:    CGFloat = 17
private let kCloudR:     CGFloat = 16
private let kBubble1:    (x: CGFloat, y: CGFloat, r: CGFloat) = (29, 33, 2.4)
private let kBubble2:    (x: CGFloat, y: CGFloat, r: CGFloat) = (25.5, 37, 1.5)
private let kLabelBase:  CGFloat = 16

// MARK: - Cloud + text-knockout
//
// Same seven circles + two bubbles, but with the destinationOut
// text cutout at the centre. .compositingGroup() scopes the
// knockout to this view so sibling shapes (the thinker
// silhouette) are never touched by the blend. Fixed 64-unit
// coordinates; no GeometryReader.
private struct CloudWithKnockout: View {
    let label: String                 // "" for the lost state

    // Font-scale table from the reference HTML: Nunito Black at 1x
    // for 1–2 chars, scales down for 3/4/5+ to keep multi-digit
    // streaks readable inside the cloud.
    private func scaledLabelSize() -> CGFloat {
        let len = label.count
        let table: [CGFloat] = [1.0, 1.0, 0.9, 0.74, 0.6]
        let factor = table[min(max(len, 0), table.count - 1)]
        return kLabelBase * factor
    }

    var body: some View {
        let circles: [(dx: CGFloat, dy: CGFloat, s: CGFloat)] = [
            ( 0.00,  0.00, 1.00),
            (-0.62,  0.12, 0.66),
            ( 0.62,  0.12, 0.66),
            (-0.34, -0.42, 0.66),
            ( 0.34, -0.42, 0.66),
            (-0.30,  0.42, 0.62),
            ( 0.30,  0.42, 0.62),
        ]
        ZStack {
            Color.clear.frame(width: kDesignSize, height: kDesignSize)
            ForEach(0..<circles.count, id: \.self) { i in
                let c = circles[i]
                let diameter = kCloudR * c.s * 0.72 * 2
                Circle()
                    .fill(Color.white)
                    .frame(width: diameter, height: diameter)
                    .position(x: kCloudCX + c.dx * kCloudR,
                              y: kCloudCY + c.dy * kCloudR)
            }
            Circle()
                .fill(Color.white)
                .frame(width: kBubble1.r * 2, height: kBubble1.r * 2)
                .position(x: kBubble1.x, y: kBubble1.y)
            Circle()
                .fill(Color.white)
                .frame(width: kBubble2.r * 2, height: kBubble2.r * 2)
                .position(x: kBubble2.x, y: kBubble2.y)
            if !label.isEmpty {
                Text(label)
                    .font(Font.custom("Nunito-Black", size: scaledLabelSize()))
                    .foregroundStyle(.black)
                    .blendMode(.destinationOut)
                    .position(x: kCloudCX, y: kCloudCY + 0.8)
            }
        }
        .compositingGroup()
    }
}

// MARK: - Full accessory icon
//
// Two independent layers at fixed 64-unit coordinates:
//   1. Thinker silhouette, template-rendered + white, placed by
//      .position so .widgetAccentable() on the parent can re-tint
//      the whole icon with the user's lock-screen accent colour.
//   2. CloudWithKnockout, which carries its own compositingGroup
//      to scope the destinationOut text knockout to only the
//      cloud shape — the silhouette is a sibling and is never
//      touched by the blend.
private struct AccessoryIcon: View {
    let state: WidgetState
    let streak: Int

    private var cloudLabel: String {
        switch state {
        case .done, .badge:   return "\(streak)"
        case .ready, .nudge:  return "?"
        case .worried, .last: return "!"
        // Lost: knockout "?" like ready/nudge, so the cloud never
        // appears empty (which read as a bug — missing content).
        // The whole icon is still toned down to 35% opacity below,
        // which carries the "lost" signal.
        case .lost:           return "?"
        }
    }

    var body: some View {
        ZStack {
            // Sentinel sized to the full design space so the ZStack
            // has definite intrinsic bounds.
            Color.clear.frame(width: kDesignSize, height: kDesignSize)

            // Thinker silhouette, placed by .position (center).
            lockBundleImage("thinker-silhouette")
                .renderingMode(.template)
                .resizable()
                .aspectRatio(contentMode: .fit)
                .frame(width: kThinkerW, height: kThinkerH)
                .foregroundStyle(.white)
                .position(x: kThinkerX + kThinkerW / 2,
                          y: kThinkerY + kThinkerH / 2)

            // Cloud + bubbles + knockout, overlaid in the same
            // 64×64 coord space.
            CloudWithKnockout(label: cloudLabel)
        }
        .opacity(state == .lost ? 0.35 : 1.0)
    }
}

// MARK: - accessoryCircular
//
// The accessory icon is a fixed 64×64 drawing, scaled to 0.95 for
// the round family and centred in a maxWidth/maxHeight wrapper so
// it fills the circular content area regardless of what size iOS
// proposes.

struct LockThinkerCircularView: View {
    let snapshot: WidgetSnapshot
    let state: WidgetState

    var body: some View {
        AccessoryIcon(state: state,
                      streak: state.streakDisplay(from: snapshot))
            .frame(width: kDesignSize, height: kDesignSize)
            .scaleEffect(0.95)
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .widgetAccentable()
            .containerBackground(for: .widget) {
                Color.clear
            }
    }
}

// MARK: - accessoryRectangular
//
// Uses the identical AccessoryIcon drawing as the circular family —
// same 64×64 design space, scaled via .scaleEffect(52/64) so the
// icon reads at ~52 pt alongside the two text lines. Scaling (not
// re-sizing) keeps the drawing pixel-identical between the two
// surfaces.

struct LockThinkerRectangularView: View {
    let snapshot: WidgetSnapshot
    let state: WidgetState

    private var line1: String {
        let n = state.streakDisplay(from: snapshot)
        switch state {
        case .done, .badge:  return "\(n)-day streak"
        case .lost:          return "No streak"
        default:             return "Day \(snapshot.streak + 1)?"
        }
    }
    private var line2: String { WidgetCopy.line(for: state) }

    var body: some View {
        HStack(spacing: 10) {
            AccessoryIcon(state: state,
                          streak: state.streakDisplay(from: snapshot))
                .frame(width: kDesignSize, height: kDesignSize)
                .scaleEffect(52.0 / kDesignSize)
            textStack
            Spacer(minLength: 0)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
        .widgetAccentable()
        .containerBackground(for: .widget) {
            Color.clear
        }
    }

    private var textStack: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(line1)
                .font(Font.custom("Nunito-Black", size: 16))
                .foregroundStyle(.white)
                .lineLimit(1)
                .minimumScaleFactor(0.7)
            Text(line2)
                .font(Font.custom("Nunito-ExtraBold", size: 13))
                .foregroundStyle(.white.opacity(0.75))
                .lineLimit(1)
                .minimumScaleFactor(0.8)
        }
    }
}

// MARK: - Previews

private func previewEntry(state: WidgetState,
                          streak: Int = 12) -> CorpusEntry {
    let snapshot = WidgetSnapshot(
        subject: .philo,
        lang: .en,
        streak: streak,
        lastActiveDay: nil,
        badgeTier: nil,
        badgeDay: nil,
        week: [true, true, true, true, true, false, false]
    )
    return CorpusEntry(
        date: Date(),
        snapshot: snapshot,
        state: state,
        todayTitle: nil,
        todayThinker: nil
    )
}

#Preview("Circular · done", as: .accessoryCircular) {
    CorpusTodayWidget()
} timeline: {
    previewEntry(state: .done)
}

#Preview("Circular · ready", as: .accessoryCircular) {
    CorpusTodayWidget()
} timeline: {
    previewEntry(state: .ready)
}

#Preview("Circular · last", as: .accessoryCircular) {
    CorpusTodayWidget()
} timeline: {
    previewEntry(state: .last)
}

#Preview("Circular · lost", as: .accessoryCircular) {
    CorpusTodayWidget()
} timeline: {
    previewEntry(state: .lost, streak: 0)
}

#Preview("Rectangular · done", as: .accessoryRectangular) {
    CorpusTodayWidget()
} timeline: {
    previewEntry(state: .done)
}

#Preview("Rectangular · ready", as: .accessoryRectangular) {
    CorpusTodayWidget()
} timeline: {
    previewEntry(state: .ready)
}

#Preview("Rectangular · last", as: .accessoryRectangular) {
    CorpusTodayWidget()
} timeline: {
    previewEntry(state: .last)
}

#Preview("Rectangular · lost", as: .accessoryRectangular) {
    CorpusTodayWidget()
} timeline: {
    previewEntry(state: .lost, streak: 0)
}
