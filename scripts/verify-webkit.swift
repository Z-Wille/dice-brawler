// macOS: swift scripts/verify-webkit.swift /absolute/path/to/index.html
import Cocoa
import WebKit

let app = NSApplication.shared
let configuration = WKWebViewConfiguration()
configuration.websiteDataStore = .nonPersistent()
let view = WKWebView(frame: NSRect(x: 0, y: 0, width: 932, height: 932), configuration: configuration)
let window = NSWindow(contentRect: view.frame, styleMask: [.titled], backing: .buffered, defer: false)
window.contentView = view

class Runner: NSObject, WKNavigationDelegate {
    var sizes = [932, 672, 390]
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) { checkNext() }
    func checkNext() {
        guard !sizes.isEmpty else { print("PASS: WebKit layout, resizing, combat, history, debug and restart"); exit(0) }
        let size = sizes.removeFirst()
        window.setContentSize(NSSize(width: size, height: size == 390 ? 844 : size))
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
            view.callAsyncJavaScript("""
                const assert = (ok, message) => { if (!ok) throw Error(message); };
                const game = document.querySelector('#game');
                const expected = innerWidth >= 672 ? Math.min(900, innerWidth - 32, innerHeight - 32) : 640;
                assert(Math.abs(game.offsetWidth - expected) <= 1 && game.offsetWidth === game.offsetHeight, 'Square size');
                assert(document.querySelector('#view').clientHeight > 200, 'Arena height');
                const overflow = [...document.querySelectorAll('.stat,.player-zone,.title,.btns,#forecast')].filter(e => e.scrollHeight > e.clientHeight + 2 || e.scrollWidth > e.clientWidth + 2);
                assert(!overflow.length, 'Control overflow: ' + overflow.map(e => e.className || e.id));
                newRun();
                document.querySelector('#throw').click();
                assert(S.dice.length === 3, 'Throw');
                for (const k of ['str', 'agi', 'luk']) document.querySelector('[data-k="' + k + '"]').click();
                assert(!document.querySelector('#attack').disabled, 'Assignments');
                document.querySelector('#history summary').click();
                assert(document.querySelector('#history').open && document.querySelector('#log').textContent.length, 'History');
                document.querySelector('#history summary').click();
                document.querySelector('#attack').click();
                await sleep(1900);
                assert(!S.busy && S.turn === 2 && S.str > 0, 'Combat resolution');
                document.querySelector('#dbgBtn').click();
                assert(document.querySelector('#dbg').classList.contains('on'), 'Debug open');
                assert(document.activeElement.closest('#dbg'), 'Modal focus');
                document.querySelector('#reset').click();
                assert(S.turn === 1 && !S.dice.length && !document.querySelector('#dbg').classList.contains('on'), 'Restart');
                return JSON.stringify({viewport: innerWidth, square: [game.offsetWidth, game.offsetHeight]});
                """, arguments: [:], in: nil, in: .page) { result in
                    switch result {
                    case .success(let value): print(value); self.checkNext()
                    case .failure(let error): fputs("FAIL: \(error)\n", stderr); exit(1)
                    }
                }
        }
    }
}
let runner = Runner()
view.navigationDelegate = runner
let url = URL(fileURLWithPath: CommandLine.arguments.count > 1 ? CommandLine.arguments[1] : FileManager.default.currentDirectoryPath + "/index.html")
view.loadFileURL(url, allowingReadAccessTo: url.deletingLastPathComponent())
DispatchQueue.main.asyncAfter(deadline: .now() + 30) { fputs("FAIL: WebKit timeout\n", stderr); exit(1) }
app.run()
