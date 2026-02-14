import time
from playwright.sync_api import sync_playwright

def capture_full_page():
    with sync_playwright() as p:
        # Launch browser
        browser = p.chromium.launch(headless=True)
        # Set viewport to capture full width
        page = browser.new_page(viewport={'width': 1280, 'height': 800})

        try:
            print("Navigating to homepage...")
            # Go to localhost
            page.goto("http://localhost:3000")

            # Wait for content to load (give it some time)
            page.wait_for_timeout(5000)

            # Scroll to the bottom to trigger any lazy loading or ensure full render
            page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            page.wait_for_timeout(2000) # Wait after scroll

            # Scroll back to top if needed, but full_page screenshot usually handles this.
            # However, sometimes sticky headers interfere.
            # Let's take a full page screenshot.
            print("Taking screenshot...")
            page.screenshot(path="full_page_screenshot.png", full_page=True)
            print("Screenshot saved to full_page_screenshot.png")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    capture_full_page()
