import SwiftUI
import UIKit
import WidgetKit

// Small-size layout. Follows the app language (round 10): HE text +
// RTL layout flips the thinker to the trailing (visual-left) side and
// the number + caption to the leading (visual-right) side. All
// measurements come from GeometryReader so the design scales with the
// widget surface.
//
//   14 pt from the leading + top edges for the content block
//     (contentMarginsDisabled is on; every inside pad is ours).
//   Flame 22 pt, number 28 pt black.
//   Caption directly under the number, 13 pt heavy, single line,
//     .minimumScaleFactor(0.8), capped at ~70 % of widget width so
//     it has room without pushing into the thinker.
//   Thinker: side = 55 % of widget height, 1:1 aspect, bottom-
//     trailing, bottom flush with widget bottom, 4 pt trailing inset.
//     Top of head (approximately the top ~15 % of the PNG frame)
//     sits below the caption bottom — the vertical budget works out
//     at common widget sizes without additional constraints.
//   Zs (sleep) + sparkles (badge) anchor to the thinker's top-
//     trailing head region, computed from the thinker frame rect.
struct SmallContent: View {
    let snapshot: WidgetSnapshot
    let state: WidgetState

    var body: some View {
        let palette = WidgetTheme.palette(state: state, subject: snapshot.subject)
        let streakDisplay = state.streakDisplay(from: snapshot)

        GeometryReader { geo in
            let widgetW = geo.size.width
            let widgetH = geo.size.height
            let thinkerSide = widgetH * 0.55
            let captionMax  = widgetW * 0.70
            let edgePad: CGFloat = 14

            ZStack(alignment: .topLeading) {
                // Thinker — bottom-trailing, bottom flush with widget
                // bottom, 4 pt trailing inset so the widget's rounded
                // corner doesn't clip the robe.
                VStack(spacing: 0) {
                    Spacer()
                    HStack(spacing: 0) {
                        Spacer()
                        thinker(mood: state.mood)
                            .frame(width: thinkerSide, height: thinkerSide)
                            .padding(.trailing, 4)
                    }
                }

                // Flame + number + caption, top-leading, 14 pt from the
                // edges. Caption is immediately under the number so
                // nothing else can slide between them.
                // Round 11 — streak number stays large (28pt); caption
                // bumped from 13 → 15pt so it reads at arm's length.
                VStack(alignment: .leading, spacing: 4) {
                    HStack(spacing: 3) {
                        bundleImage("flame")
                            .resizable()
                            .aspectRatio(contentMode: .fit)
                            .frame(width: 22, height: 22)
                        Text("\(streakDisplay)")
                            .font(Font.custom("Nunito-Black", size: 28))
                            .foregroundColor(palette.textColor)
                            .contentTransition(.numericText())
                    }
                    Text(WidgetCopy.line(for: state, lang: snapshot.lang))
                        .font(Font.custom("Nunito-Black", size: 15))
                        .foregroundColor(palette.textColor)
                        .lineLimit(1)
                        .minimumScaleFactor(0.8)
                        .multilineTextAlignment(.leading)
                        .frame(maxWidth: captionMax, alignment: .leading)
                }
                .padding(.top, edgePad)
                .padding(.leading, edgePad)

                // Badge crest at top-trailing of the widget panel in
                // Badge state.
                if state == .badge, let tier = snapshot.badgeTier {
                    VStack {
                        HStack {
                            Spacer()
                            bundleImage("badge-\(tier)")
                                .resizable()
                                .aspectRatio(contentMode: .fit)
                                .frame(width: 42, height: 44)
                                .padding(.top, 4)
                                .padding(.trailing, 4)
                        }
                        Spacer()
                    }
                }

                // Head-anchored Zs / sparkles.
                if state == .lost {
                    headDecoration(.sleepZs, side: thinkerSide, widgetW: widgetW, widgetH: widgetH)
                }
                if state == .badge {
                    headDecoration(.sparkles, side: thinkerSide, widgetW: widgetW, widgetH: widgetH)
                }
            }
        }
    }

    // MARK: - Thinker

    private func thinker(mood: ThinkerMood) -> some View {
        let name = "\(snapshot.subject.thinkerSlug)-\(mood.rawValue)"
        return bundleImage(name)
            .resizable()
            .aspectRatio(contentMode: .fit)
            .id(mood.rawValue)
            .transition(.scale(scale: 0.86).combined(with: .opacity))
    }

    // MARK: - Head-anchored decorations
    //
    // The thinker bounding box sits bottom-trailing with a 4 pt
    // trailing inset. Head top-trailing is near the frame's right-
    // edge at ~12 % down from the top.
    private enum HeadDecorationKind { case sleepZs, sparkles }

    @ViewBuilder
    private func headDecoration(_ kind: HeadDecorationKind,
                                side: CGFloat,
                                widgetW: CGFloat,
                                widgetH: CGFloat) -> some View {
        let anchorX = widgetW - 4 - side * 0.22
        let anchorY = widgetH - side + side * 0.12

        switch kind {
        case .sleepZs:
            ZStack {
                z(size: 10).position(x: anchorX,       y: anchorY)
                z(size: 13).position(x: anchorX - 10,  y: anchorY - 14)
                z(size: 16).position(x: anchorX - 22,  y: anchorY - 30)
            }
        case .sparkles:
            ZStack {
                sparkle(size: 10).position(x: anchorX,       y: anchorY)
                sparkle(size: 8 ).position(x: anchorX - 14,  y: anchorY - 8)
                sparkle(size: 9 ).position(x: anchorX + 4,   y: anchorY + 18)
                sparkle(size: 7 ).position(x: anchorX - 22,  y: anchorY + 8)
            }
        }
    }

    // MARK: - Primitives

    private func z(size: CGFloat) -> some View {
        Text("Z")
            .font(.system(size: size, weight: .black))
            .foregroundColor(.white)
            .shadow(
                color: Color(.sRGB, red: 0x2a/255.0, green: 0x12/255.0, blue: 0x66/255.0, opacity: 0.85),
                radius: 0, x: 1, y: 1
            )
    }

    private func sparkle(size: CGFloat) -> some View {
        Image(systemName: "sparkle")
            .font(.system(size: size, weight: .bold))
            .foregroundColor(.white)
    }

    private func bundleImage(_ name: String) -> Image {
        if let ui = UIImage(named: name) {
            return Image(uiImage: ui)
        }
        return Image(uiImage: UIImage())
    }
}

// Public wrapper used by the small-family widget. Applies the
// state-dependent gradient as the widget container background.
struct ThinkerSmallView: View {
    let snapshot: WidgetSnapshot
    let state: WidgetState
    let date: Date

    var body: some View {
        SmallContent(snapshot: snapshot, state: state)
            .environment(\.layoutDirection, snapshot.lang == .he ? .rightToLeft : .leftToRight)
            .widgetContainerBackground(
                gradient: WidgetTheme.gradient(state: state, subject: snapshot.subject)
            )
    }
}

// MARK: - containerBackground helper
//
// Paints the gradient on the full widget surface (through the rounded
// corners) rather than inside the content area. Combined with
// .contentMarginsDisabled() on the configuration, this lets the
// thinker's bottom sit flush with the widget's bottom edge.
extension View {
    func widgetContainerBackground<B: View>(gradient: B) -> some View {
        self.containerBackground(for: .widget) {
            gradient
        }
    }
}
