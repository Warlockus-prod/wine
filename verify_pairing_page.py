import asyncio
from playwright.async_api import async_playwright

async def verify_pairing_page():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # Navigate to the pairing page
        url = 'http://localhost:3000/pairing'
        print(f"Navigating to {url}")
        await page.goto(url)

        # Wait for the main elements
        print("Waiting for 'L'ATELIER' header...")
        await page.wait_for_selector("text=L'ATELIER")

        print("Waiting for 'The Kitchen' section...")
        await page.wait_for_selector("text=The Kitchen")

        print("Waiting for 'The Cellar' section...")
        await page.wait_for_selector("text=The Cellar")

        # Check for the active dish
        print("Checking for active dish 'Duck Confit'...")
        # The active dish should have the 'Selected' badge
        await page.wait_for_selector("text=Selected")

        # Check for the AI Match
        print("Checking for AI Match...")
        await page.wait_for_selector("text=AI Match • 98% Compatibility")

        # Take a screenshot
        screenshot_path = 'pairing_page_screenshot.png'
        await page.screenshot(path=screenshot_path, full_page=True)
        print(f"Screenshot saved to {screenshot_path}")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(verify_pairing_page())
