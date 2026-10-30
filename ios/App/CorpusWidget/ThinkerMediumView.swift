import SwiftUI
import UIKit
import WidgetKit

// Medium-size layout, English only. Proportional via GeometryReader
// so dimensions scale with widget size.
//
// Right-side card:
//   - floats with 10 pt margin top / bottom / trailing
//   - 56 % of widget width, 18 pt corner radius, white at 95 %
//   - 12 pt inner padding
//   - three rows vertically centred (no empty bottom gap):
//     row 1: single-line uppercase meta, English only
//       default: "PHILOSOPHY · 5 MIN"
//       done:    "DONE TODAY · PHILOSOPHY"
//     10.5 pt heavy, muted ink, .fixedSize so it never truncates
//     row 2: title (todayTitle), 15 pt black, up to 2 lines,
//       .minimumScaleFactor(0.85)
//     row 3: thinker's name (todayThinker), 12 pt extrabold, muted ink
//   - Week strip was removed in a later iteration (snapshot.week still
//     flows through the data path for the lock-screen states / small-
//     widget rendering — the data is kept, the row is gone).
//
// Left side:
//   - flame + number ONLY (no caption — the caption lives in the small
//     widget; adding one here with the big thinker invited the overlap
//     bug the user caught)
//   - 14 pt from top + leading, flame 22 pt, number 28 pt black
//   - thinker: 78 % of widget height, bottom-flush, trailing edge
//     tucks a few points behind the card's leading edge
//   - Zs / sparkles anchored to the thinker's head
struct ThinkerMediumView: View {
    let snapshot: WidgetSnapshot
    let state: WidgetState
    let date: Date
    let todayTitle: String?
    let todayThinker: String?

    var body: some View {
        // Round 10 — Hebrew flips the entire medium widget so the
        // thinker sits on the trailing (visual LEFT in RTL) side and
        // the card sits on the leading (visual RIGHT in RTL) side.
        // Text inside the card follows the same direction so title +
        // thinker name are start-aligned (right-aligned in HE).
        content
            .environment(\.layoutDirection, snapshot.lang == .he ? .rightToLeft : .leftToRight)
    }

    @ViewBuilder private var content: some View {
        GeometryReader { geo in
            let widgetW = geo.size.width
            let widgetH = geo.size.height
            let cardInset: CGFloat = 10
            let cardW = widgetW * 0.56
            let cardH = widgetH - cardInset * 2
            let leftW = widgetW - cardW - cardInset  // card's leading edge sits here
            let thinkerSide = widgetH * 0.78
            let edgePad: CGFloat = 14

            ZStack(alignment: .topLeading) {
                // Thinker — bottom-flush, trailing at the card's
                // leading edge (with -8 pt tuck behind the card).
                MediumThinkerLayer(
                    snapshot: snapshot,
                    state: state,
                    side: thinkerSide,
                    leftZoneWidth: leftW
                )

                // Flame + number only on the left side.
                MediumLeftContent(
                    snapshot: snapshot,
                    state: state,
                    edgePad: edgePad
                )

                // Right card.
                MediumRightCard(
                    snapshot: snapshot,
                    state: state,
                    todayTitle: todayTitle,
                    todayThinker: todayThinker,
                    cardW: cardW,
                    cardH: cardH,
                    cardInset: cardInset
                )

                // Head-anchored Zs / sparkles.
                if state == .lost {
                    MediumHeadDecoration(
                        kind: .sleepZs,
                        thinkerSide: thinkerSide,
                        leftZoneWidth: leftW,
                        widgetH: widgetH
                    )
                }
                if state == .badge {
                    MediumHeadDecoration(
                        kind: .sparkles,
                        thinkerSide: thinkerSide,
                        leftZoneWidth: leftW,
                        widgetH: widgetH
                    )
                }
            }
        }
        .widgetContainerBackground(
            gradient: WidgetTheme.gradient(state: state, subject: snapshot.subject)
        )
    }
}

// MARK: - Thinker on the left zone

private struct MediumThinkerLayer: View {
    let snapshot: WidgetSnapshot
    let state: WidgetState
    let side: CGFloat
    let leftZoneWidth: CGFloat

    var body: some View {
        VStack(spacing: 0) {
            Spacer()
            HStack(spacing: 0) {
                Spacer()
                thinker(mood: state.mood)
                    .frame(width: side, height: side)
                    // Negative trailing padding tucks the thinker a few
                    // points behind the card's leading edge.
                    .padding(.trailing, -8)
            }
        }
        .frame(width: leftZoneWidth, alignment: .leading)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .bottomLeading)
    }

    private func thinker(mood: ThinkerMood) -> some View {
        let name = "\(snapshot.subject.thinkerSlug)-\(mood.rawValue)"
        return bundleImage(name)
            .resizable()
            .aspectRatio(contentMode: .fit)
            .id(mood.rawValue)
            .transition(.scale(scale: 0.86).combined(with: .opacity))
    }
}

// MARK: - Left-panel content (flame + number only — no caption)

private struct MediumLeftContent: View {
    let snapshot: WidgetSnapshot
    let state: WidgetState
    let edgePad: CGFloat

    var body: some View {
        let palette = WidgetTheme.palette(state: state, subject: snapshot.subject)
        let streakDisplay = state.streakDisplay(from: snapshot)

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
        .padding(.top, edgePad)
        .padding(.leading, edgePad)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    }
}

// MARK: - Right card

private struct MediumRightCard: View {
    let snapshot: WidgetSnapshot
    let state: WidgetState
    let todayTitle: String?
    let todayThinker: String?
    let cardW: CGFloat
    let cardH: CGFloat
    let cardInset: CGFloat

    var body: some View {
        // Round 11 — bumped the type stack so it uses the available
        // room on the medium card. meta 13pt, title 19pt (2 lines),
        // thinker 14pt. Still minimumScaleFactor-ed so a long HE title
        // scales down one step instead of truncating.
        VStack(alignment: .leading, spacing: 5) {
            // Row 1: single-line uppercase meta.
            Text(metaRow)
                .font(Font.custom("Nunito-Black", size: 13))
                .tracking(0.5)
                .foregroundColor(mutedInk)
                .lineLimit(1)
                .minimumScaleFactor(0.85)
                .multilineTextAlignment(.leading)
                .frame(maxWidth: .infinity, alignment: .leading)

            // Row 2: title.
            Text(titleRow)
                .font(Font.custom("Nunito-Black", size: 19))
                .foregroundColor(ink)
                .lineLimit(2)
                .minimumScaleFactor(0.80)
                .fixedSize(horizontal: false, vertical: true)
                .multilineTextAlignment(.leading)
                .frame(maxWidth: .infinity, alignment: .leading)

            // Row 3: thinker name.
            if !thinkerRow.isEmpty {
                Text(thinkerRow)
                    .font(Font.custom("Nunito-ExtraBold", size: 14))
                    .foregroundColor(mutedInk)
                    .lineLimit(1)
                    .minimumScaleFactor(0.85)
                    .multilineTextAlignment(.leading)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
        }
        .padding(12)
        .frame(width: cardW, height: cardH, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .fill(Color.white.opacity(0.95))
        )
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topTrailing)
        .padding(.top, cardInset)
        .padding(.bottom, cardInset)
        .padding(.trailing, cardInset)
    }

    // MARK: - Content strings

    private var metaRow: String {
        let subject = subjectName
        let isHe = snapshot.lang == .he
        if state == .done {
            return isHe ? "בוצע היום · \(subject)" : "DONE TODAY · \(subject.uppercased())"
        }
        return isHe ? "\(subject) · 5 דק׳" : "\(subject.uppercased()) · 5 MIN"
    }

    private var titleRow: String {
        if let t = todayTitle, !t.isEmpty { return t }
        return snapshot.lang == .he ? "דיאלוג חדש מחכה" : "A new dialogue is ready"
    }

    private var thinkerRow: String {
        todayThinker ?? ""
    }

    private var subjectName: String {
        let isHe = snapshot.lang == .he
        switch snapshot.subject {
        case .philo: return isHe ? "פילוסופיה" : "Philosophy"
        case .econ:  return isHe ? "כלכלה" : "Economics"
        case .psych: return isHe ? "פסיכולוגיה" : "Psychology"
        }
    }

    // MARK: - Colours

    private var ink:      Color { Color(.sRGB, red: 0x2a/255.0, green: 0x12/255.0, blue: 0x66/255.0, opacity: 1.0) }
    private var mutedInk: Color { Color(.sRGB, red: 0x2a/255.0, green: 0x12/255.0, blue: 0x66/255.0, opacity: 0.60) }
}

// MARK: - Head-anchored decorations

private struct MediumHeadDecoration: View {
    enum Kind { case sleepZs, sparkles }

    let kind: Kind
    let thinkerSide: CGFloat
    let leftZoneWidth: CGFloat
    let widgetH: CGFloat

    var body: some View {
        // Thinker trailing-x in widget coordinates: anchored at the
        // left zone's trailing edge, plus +8 pt because the thinker
        // tucks -8 pt behind the card.
        let thinkerTrailX = leftZoneWidth + 8
        let thinkerTopY   = widgetH - thinkerSide
        let anchorX       = thinkerTrailX - thinkerSide * 0.22
        let anchorY       = thinkerTopY + thinkerSide * 0.12

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
}

// MARK: - Shared primitive

private func bundleImage(_ name: String) -> Image {
    if let ui = UIImage(named: name) {
        return Image(uiImage: ui)
    }
    return Image(uiImage: UIImage())
}
