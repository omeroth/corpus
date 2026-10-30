import AVFoundation
import AVKit
import Capacitor
import Foundation
import UIKit
import WidgetKit

// Writes a JSON blob (the "widget data") to a UserDefaults suite
// shared with the WidgetKit extension via App Group entitlements,
// then asks WidgetKit to reload every timeline. The widget reads
// the blob at timeline-rebuild time and derives everything it
// shows from there.
//
// Also serves three ancillary methods for the "add the widget"
// onboarding beat:
//   - isWidgetInstalled() — asks WidgetCenter whether a widget of
//     kind "CorpusTodayWidget" is currently placed by the user.
//   - startTutorial(path, x, y, width, height) — mounts a native
//     AVPlayer view over the WebView at the given CSS rect, plays
//     the muted tutorial MP4 on a loop, and enables automatic PiP
//     so a swipe-to-home demotes the video to the system PiP window.
//   - stopTutorial() — tears down the view + PiP controller.
//
// App Group: group.com.corpusapp.corpus.shared
//   The suite name is hardcoded (not read from Info.plist) because
//   WidgetKit extensions need the exact same string in their own
//   UserDefaults(suiteName:) call, and keeping it in two code
//   places (here + CorpusWidget) rather than one Info.plist + two
//   reads cuts a class of drift bugs. The entitlement is applied
//   to BOTH targets in App.entitlements and CorpusWidget.
//   entitlements — if either is missing the entitlement, the
//   UserDefaults call returns a non-shared instance and the widget
//   never sees the writes (silent failure).
@objc(CorpusWidgetBridgePlugin)
public class CorpusWidgetBridgePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "CorpusWidgetBridgePlugin"
    public let jsName = "CorpusWidgetBridge"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "setData",            returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "isWidgetInstalled",  returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "startTutorial",      returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stopTutorial",       returnType: CAPPluginReturnPromise),
    ]

    private static let appGroupSuite = "group.com.corpusapp.corpus.shared"
    private static let storageKey    = "corpus.widget"
    private static let widgetKind    = "CorpusTodayWidget"

    // Retained on the plugin instance so the view + PiP controller
    // survive across the start/stop call pair without ARC collecting
    // them mid-playback.
    private var tutorial: TutorialSession?

    // MARK: - setData

    @objc func setData(_ call: CAPPluginCall) {
        guard let jsonString = call.getString("json") else {
            call.reject("setData requires a `json` string argument")
            return
        }
        guard let defaults = UserDefaults(suiteName: Self.appGroupSuite) else {
            call.reject("App Group '\(Self.appGroupSuite)' is not accessible — verify the entitlement is applied to the main app target.")
            return
        }
        defaults.set(jsonString, forKey: Self.storageKey)
        DispatchQueue.main.async {
            if #available(iOS 14.0, *) {
                WidgetCenter.shared.reloadAllTimelines()
            }
            call.resolve([
                "ok": true,
                "bytes": jsonString.utf8.count,
            ])
        }
    }

    // MARK: - isWidgetInstalled
    //
    // Resolves { installed: Bool, supported: Bool }.
    //
    //   supported — true iff the device is running iOS 17 or newer.
    //     The CorpusWidgetExtension target's deployment is 17.0, so
    //     on iOS 15/16 the widget doesn't appear in the Add Widget
    //     gallery at all. Returning the capability from the native
    //     side lets the JS gate (_widgetPromptIsEligible) stop UA-
    //     sniffing — a UA sniff was both brittle (iOS 26 and iPadOS
    //     16 both tripped it) and wrong on simulators where the UA
    //     doesn't carry the OS version. #available is the authority.
    //   installed — true iff a widget of kind "CorpusTodayWidget" is
    //     currently placed. Only meaningful when supported is true;
    //     on unsupported devices this is always false.
    @objc func isWidgetInstalled(_ call: CAPPluginCall) {
        if #available(iOS 17.0, *) {
            WidgetCenter.shared.getCurrentConfigurations { result in
                switch result {
                case .success(let widgets):
                    let installed = widgets.contains(where: { $0.kind == Self.widgetKind })
                    call.resolve(["installed": installed, "supported": true])
                case .failure:
                    call.resolve(["installed": false, "supported": true])
                }
            }
        } else {
            // iOS 15/16: the widget extension's deployment target is
            // 17.0, so the widget is invisible in the gallery and
            // can never be installed. Treat as "supported:false" so
            // the JS gate skips the whole prompt flow.
            call.resolve(["installed": false, "supported": false])
        }
    }

    // MARK: - startTutorial / stopTutorial

    @objc func startTutorial(_ call: CAPPluginCall) {
        guard let path = call.getString("path") else {
            call.reject("startTutorial requires `path`")
            return
        }
        let x = CGFloat(call.getDouble("x") ?? 0)
        let y = CGFloat(call.getDouble("y") ?? 0)
        let w = CGFloat(call.getDouble("width") ?? 0)
        let h = CGFloat(call.getDouble("height") ?? 0)
        guard w > 0, h > 0 else {
            call.reject("startTutorial requires width + height > 0")
            return
        }

        DispatchQueue.main.async {
            // Tear down any prior session before starting a new one.
            self.tutorial?.teardown()
            self.tutorial = nil

            guard let container = self.webView?.superview ?? self.webView else {
                call.resolve(["started": false, "reason": "no host view"])
                return
            }
            // Resolve the asset path. The JS side passes "media/widget-
            // tutorial.mp4" (relative to the WebView root); the native
            // bundle lays web assets under public/, so prepend "public/"
            // if the caller didn't.
            let subdirAndName: (String, String) = {
                let p = path.hasPrefix("public/") ? path : "public/\(path)"
                let name = (p as NSString).lastPathComponent
                let dir  = (p as NSString).deletingLastPathComponent
                let base = (name as NSString).deletingPathExtension
                return (base, dir)
            }()
            let (resourceName, resourceDir) = subdirAndName
            guard let url = Bundle.main.url(
                forResource: resourceName,
                withExtension: "mp4",
                subdirectory: resourceDir
            ) else {
                call.resolve([
                    "started": false,
                    "reason": "video missing at public/\(path)",
                ])
                return
            }

            // Audio session: .playback keeps playback alive during PiP
            // and when the app goes background; .mixWithOthers means we
            // don't duck or stop the user's music (the video is muted
            // anyway, so the audio session is really just a PiP enabler).
            do {
                let session = AVAudioSession.sharedInstance()
                try session.setCategory(.playback, mode: .moviePlayback, options: [.mixWithOthers])
                try session.setActive(true)
            } catch {
                // Non-fatal — PiP may fail downstream but the inline
                // video still plays. Surfacing the error here would
                // just add noise; stopTutorial deactivates the session.
            }

            let session = TutorialSession(url: url, frame: CGRect(x: x, y: y, width: w, height: h))
            session.attach(to: container)
            session.play()
            self.tutorial = session

            call.resolve([
                "started": true,
                "pip": session.pipEnabled,
            ])
        }
    }

    @objc func stopTutorial(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            self.tutorial?.teardown()
            self.tutorial = nil
            do {
                try AVAudioSession.sharedInstance().setActive(false, options: [.notifyOthersOnDeactivation])
            } catch { /* fine */ }
            call.resolve(["stopped": true])
        }
    }
}

// MARK: - TutorialSession
//
// Private helper that owns the AVPlayer + AVPlayerLooper + the
// AVPlayerLayer the WebView superview hosts + the PiP controller.
// Kept simple on purpose: one video, one loop, inline-plus-PiP, no
// controls. The PiP transition is driven entirely by
// canStartPictureInPictureAutomaticallyFromInline, so a swipe-to-
// home on iOS 14+ demotes the inline view to the system PiP window.
private final class TutorialSession: NSObject {
    private let player: AVQueuePlayer
    private let looper: AVPlayerLooper
    private let playerLayer: AVPlayerLayer
    private let hostView: UIView
    private var pipController: AVPictureInPictureController?

    let pipEnabled: Bool

    init(url: URL, frame: CGRect) {
        let item = AVPlayerItem(url: url)
        let queue = AVQueuePlayer()
        self.player = queue
        self.looper = AVPlayerLooper(player: queue, templateItem: item)
        self.player.isMuted = true
        self.player.allowsExternalPlayback = false

        let layer = AVPlayerLayer(player: queue)
        layer.videoGravity = .resizeAspectFill
        layer.frame = frame
        // Rounded corners to match the video card the JS side draws.
        // 18 pt mirrors the medium-widget card radius for visual
        // consistency across the two surfaces.
        layer.cornerRadius = 18
        layer.masksToBounds = true
        self.playerLayer = layer

        // Host — a transparent passthrough view at the given rect that
        // holds the player layer. We attach it to the WebView's
        // superview rather than inject into the DOM so JS doesn't need
        // a video element at all.
        let host = UIView(frame: frame)
        host.backgroundColor = .clear
        host.layer.addSublayer(layer)
        layer.frame = host.bounds
        self.hostView = host

        // PiP. isPictureInPictureSupported is a device + OS gate; on
        // supported devices we also arm automatic-from-inline so the
        // system takes over when the app goes background.
        if AVPictureInPictureController.isPictureInPictureSupported() {
            let controller = AVPictureInPictureController(playerLayer: layer)
            controller?.canStartPictureInPictureAutomaticallyFromInline = true
            self.pipController = controller
            self.pipEnabled = (controller != nil)
        } else {
            self.pipController = nil
            self.pipEnabled = false
        }

        super.init()
    }

    func attach(to container: UIView) {
        container.addSubview(hostView)
        // Keep the player layer tracking the host's bounds in case the
        // host gets autosized by its parent after mount.
        CATransaction.begin()
        CATransaction.setDisableActions(true)
        playerLayer.frame = hostView.bounds
        CATransaction.commit()
    }

    func play() {
        player.play()
    }

    func teardown() {
        player.pause()
        pipController?.stopPictureInPicture()
        pipController = nil
        hostView.removeFromSuperview()
    }
}
