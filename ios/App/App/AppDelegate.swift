import UIKit
import Capacitor
import WebKit

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Re-inject safe-area insets when the device rotates so the layout
        // adapts (e.g. notch shifts to the side in landscape).
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleOrientationChange),
            name: UIDevice.orientationDidChangeNotification,
            object: nil
        )
        return true
    }

    func applicationWillResignActive(_ application: UIApplication) {
        // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
        // Use this method to pause ongoing tasks, disable timers, and invalidate graphics rendering callbacks. Games should use this method to pause the game.
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
        // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // Called as part of the transition from the background to the active state; here you can undo many of the changes made on entering the background.
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        // Inject the iOS view.safeAreaInsets into CSS variables that index.html's
        // --safe-top max() chain reads. Needed because env(safe-area-inset-top)
        // returns 0 on some iOS 15-16 Capacitor WKWebView builds, putting the
        // XP/streak/topbar/reader/header content under the Dynamic Island.
        // Multi-fire because the first call may run before the WebView's
        // document is parsed; later calls overwrite with the same correct value
        // once it is.
        injectSafeAreaInsets()
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.4) { self.injectSafeAreaInsets() }
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) { self.injectSafeAreaInsets() }
    }

    @objc func handleOrientationChange() {
        // Defer so view.safeAreaInsets reflects the post-rotation layout.
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) { self.injectSafeAreaInsets() }
    }

    private func injectSafeAreaInsets() {
        guard let bridgeVC = window?.rootViewController as? CAPBridgeViewController,
              let webView = bridgeVC.webView else { return }
        let insets = bridgeVC.view.safeAreaInsets
        let js = "(function(){try{var r=document.documentElement;if(!r)return;" +
                 "r.style.setProperty('--ios-safe-top','\(insets.top)px');" +
                 "r.style.setProperty('--ios-safe-bottom','\(insets.bottom)px');" +
                 "r.style.setProperty('--ios-safe-left','\(insets.left)px');" +
                 "r.style.setProperty('--ios-safe-right','\(insets.right)px');" +
                 "}catch(e){}})();"
        webView.evaluateJavaScript(js, completionHandler: nil)
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        // Called when the app was launched with a url. Feel free to add additional processing here,
        // but if you want the App API to support tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        // Called when the app was launched with an activity, including Universal Links.
        // Feel free to add additional processing here, but if you want the App API to support
        // tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }

}

// Round 40 A1 — bridge subclass wired via Main.storyboard (customClass =
// CorpusBridgeViewController, customModule = App). Under the Debug build
// configuration we add a WKUserScript at atDocumentStart that sets
// window.__CORPUS_DEBUG_BUILD = true before any index.html script executes.
// Release builds (TestFlight, App Store) compile the class but omit the
// script, so Release WKWebView starts with the flag undefined. Combined
// with the index.html helper-redaction block near the end of the main
// <script>, every window.__corpus* / window._replay* helper is deleted and
// _isDevPremium() returns false regardless of localStorage. WKWebView's
// isInspectable (Capacitor's CAPInstanceDescriptor.isWebDebuggable) is
// also false by default in Release, so a Safari Web Inspector cannot
// attach to a shipped build to set those flags in the first place — the
// native flag is the belt, the inspector lock is the braces.
class CorpusBridgeViewController: CAPBridgeViewController {
    override func webView(with frame: CGRect, configuration: WKWebViewConfiguration) -> WKWebView {
        #if DEBUG
        let src = "window.__CORPUS_DEBUG_BUILD = true;"
        let script = WKUserScript(source: src, injectionTime: .atDocumentStart, forMainFrameOnly: true)
        configuration.userContentController.addUserScript(script)
        #endif
        return WKWebView(frame: frame, configuration: configuration)
    }
}
