import asyncio
from playwright.async_api import async_playwright

async def verify_editorial_page():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        url = 'http://localhost:3000/editorial'
        print(f"Navigating to {url}")
        await page.goto(url)

        # Check for header
        print("Waiting for 'LUXDINING'...")
        await page.wait_for_selector("text=LUXDINING")

        # Check for Hero Title
        print("Waiting for 'Le Jardinier'...")
        await page.wait_for_selector("text=Jardinier")

        # Check for Horizontal Scroll section
        print("Waiting for 'Curated Selections'...")
        await page.wait_for_selector("text=Curated Selections")

        # Take a screenshot
        screenshot_path = 'editorial_page_screenshot.png'
        await page.screenshot(path=screenshot_path, full_page=True)
        print(f"Screenshot saved to {screenshot_path}")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(verify_editorial_page())
