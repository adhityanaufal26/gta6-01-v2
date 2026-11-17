#!/usr/bin/env python3
"""Play-test Palmera Bay in headless Chromium and capture the 4 screenshots.
Serves game/ on localhost, loads each ?shot= state, waits for the ready flag,
checks console errors, and writes 1280x720 JPEGs <= 256 KiB to screenshots/.
Usage: python3 tools/shots.py [port]
"""
import http.server, functools, io, json, os, socketserver, sys, threading

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GAME = os.path.join(REPO, 'game')
SHOTS = os.path.join(REPO, 'screenshots')
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8137

SHOTS_LIST = [
    ('1-chase.jpg', '?shot=chase&seed=7'),
    ('2-title.jpg', '?shot=title&seed=7'),
    ('3-mission.jpg', '?shot=mission&seed=7'),
    ('4-results.jpg', '?shot=results&seed=7'),
]

def serve():
    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=GAME)
    httpd = socketserver.TCPServer(('127.0.0.1', PORT), handler)
    t = threading.Thread(target=httpd.serve_forever, daemon=True)
    t.start()
    return httpd

def main():
    from playwright.sync_api import sync_playwright
    from PIL import Image
    os.makedirs(SHOTS, exist_ok=True)
    httpd = serve()
    errors = []
    try:
        with sync_playwright() as pw:
            browser = pw.chromium.launch(args=['--no-sandbox'])
            page = browser.new_page(viewport={'width': 1280, 'height': 720})
            page.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
            page.on('pageerror', lambda e: errors.append(str(e)))
            # Interactive smoke test first: title -> play -> move -> steal flow.
            page.goto(f'http://127.0.0.1:{PORT}/index.html?seed=7')
            page.wait_for_timeout(800)
            page.keyboard.press('Enter')
            page.wait_for_timeout(400)
            page.keyboard.down('w')
            page.wait_for_timeout(600)
            page.keyboard.up('w')
            page.keyboard.press('m')
            page.wait_for_timeout(400)
            ready = page.evaluate('window.__palmeraReady')
            print('interactive smoke: title->play ok, __palmeraReady =', ready)
            for name, query in SHOTS_LIST:
                page.goto(f'http://127.0.0.1:{PORT}/index.html{query}')
                page.wait_for_function('window.__palmeraReady === true', timeout=10000)
                page.wait_for_timeout(300)
                raw = page.screenshot()
                img = Image.open(io.BytesIO(raw)).convert('RGB')
                assert img.size == (1280, 720), img.size
                out = os.path.join(SHOTS, name)
                q = 88
                while q > 40:
                    buf = io.BytesIO()
                    img.save(buf, 'JPEG', quality=q, optimize=True)
                    if len(buf.getvalue()) <= 256 * 1024:
                        break
                    q -= 6
                with open(out, 'wb') as f:
                    f.write(buf.getvalue())
                print(f'{name}: {len(buf.getvalue())} bytes, quality {q}')
            browser.close()
    finally:
        httpd.shutdown()
    print('console errors:', len(errors))
    for e in errors:
        print('  ERROR:', e[:300])
    if errors:
        sys.exit(1)
    print('SHOTS OK')

if __name__ == '__main__':
    main()
