import Capacitor
import StoreKit
import UIKit

// Requests the SKStoreReviewController in-app rating prompt on iOS.
// Apple silently rate-limits this (~3 shows per 365 days per user), so
// requestReview may complete without the sheet actually appearing —
// that's expected, and there is no callback either way. The JS side
// advances the flow regardless of whether the sheet showed.
//
// Notes:
//   * iOS 14+ takes a UIWindowScene, iOS 13 uses the static method.
//   * The old static requestReview() is deprecated on iOS 14+ but still
//     works as a fallback if we can't find a foreground scene.
//   * No StoreKit review call ever throws — worst case is a no-op.
@objc(CorpusReviewPlugin)
public class CorpusReviewPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "CorpusReviewPlugin"
    public let jsName = "CorpusReview"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "requestReview", returnType: CAPPluginReturnPromise)
    ]

    @objc func requestReview(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            if #available(iOS 14.0, *) {
                let scene = UIApplication.shared.connectedScenes.first(where: {
                    $0.activationState == .foregroundActive
                }) as? UIWindowScene
                if let scene = scene {
                    SKStoreReviewController.requestReview(in: scene)
                    call.resolve(["requested": true])
                    return
                }
            }
            SKStoreReviewController.requestReview()
            call.resolve(["requested": true])
        }
    }
}
