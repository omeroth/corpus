import SwiftUI
import WidgetKit

// Widget bundle — the @main entry for the extension. One widget type,
// which internally branches on #available to pick between
// AppIntentConfiguration (iOS 17+) and StaticConfiguration (iOS 15/16).
// Branching lives in CorpusTodayWidget.body because
// WidgetConfigurationBuilder supports control flow; WidgetBundleBuilder
// doesn't (compiler error: "Closure containing control flow statement
// cannot be used with result builder").
@main
struct CorpusWidgetBundle: WidgetBundle {
    var body: some Widget {
        CorpusTodayWidget()
    }
}
