import Capacitor
import UIKit

// One-tap share to Instagram Stories, iOS-only. Uses the documented
// Instagram Stories asset-share URL scheme:
//   https://developers.facebook.com/docs/instagram-platform/sharing-to-stories/
//
// Flow:
//   1. Write the image bytes to UIPasteboard under Instagram's private
//      sticker pasteboard key (com.instagram.sharedSticker.backgroundImage)
//      with a short expiration (5 min).
//   2. Open `instagram-stories://share?source_application=<bundle-id>`.
//   3. Instagram launches directly into the Story composer with the
//      image loaded as the background.
//
// If Instagram isn't installed, `canOpenURL` returns false — the JS
// side (see isInstalled) hides the button rather than attempting.
//
// `Info.plist` must declare `instagram-stories` under
// `LSApplicationQueriesSchemes` for `canOpenURL` to work on iOS 9+.
@objc(CorpusInstagramSharePlugin)
public class CorpusInstagramSharePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "CorpusInstagramSharePlugin"
    public let jsName = "CorpusInstagramShare"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "isInstalled",  returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "shareToStory", returnType: CAPPluginReturnPromise)
    ]

    private static let storyUrlString = "instagram-stories://share"
    private static let stickerPasteboardKey = "com.instagram.sharedSticker.backgroundImage"

    @objc func isInstalled(_ call: CAPPluginCall) {
        guard let url = URL(string: Self.storyUrlString) else {
            call.resolve(["installed": false])
            return
        }
        DispatchQueue.main.async {
            let installed = UIApplication.shared.canOpenURL(url)
            call.resolve(["installed": installed])
        }
    }

    @objc func shareToStory(_ call: CAPPluginCall) {
        guard let base64 = call.getString("imageBase64"), !base64.isEmpty else {
            call.reject("imageBase64 is required")
            return
        }
        guard let imageData = Data(base64Encoded: base64) else {
            call.reject("imageBase64 is not valid base64")
            return
        }
        let bundleId = Bundle.main.bundleIdentifier ?? "unknown"
        guard let url = URL(string: "\(Self.storyUrlString)?source_application=\(bundleId)") else {
            call.reject("could not build instagram-stories URL")
            return
        }

        DispatchQueue.main.async {
            guard UIApplication.shared.canOpenURL(url) else {
                call.reject("Instagram not installed")
                return
            }

            let pasteboardItems: [String: Any] = [
                Self.stickerPasteboardKey: imageData
            ]
            let expiration = Date().addingTimeInterval(60 * 5)
            UIPasteboard.general.setItems([pasteboardItems], options: [
                UIPasteboard.OptionsKey.expirationDate: expiration
            ])

            UIApplication.shared.open(url, options: [:]) { success in
                if success {
                    call.resolve()
                } else {
                    call.reject("failed to open Instagram")
                }
            }
        }
    }
}
