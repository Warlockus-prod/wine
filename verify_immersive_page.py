import asyncio
from playwright.async_api import async_playwright

async def verify_immersive_page():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        url = 'http://localhost:3000/immersive'
        print(f"Navigating to {url}")
        await page.goto(url)

        # Check for first restaurant
        print("Waiting for 'Lumière & Oak'...")
        await page.wait_for_selector("text=Lumière & Oak")

        # Check for description
        print("Waiting for description...")
        await page.wait_for_selector("text=Where rustic Bordeaux blends meet")

        # Check for tags
        print("Waiting for 'Candlelit' tag...")
        await page.wait_for_selector("text=Candlelit")

        # Take a screenshot
        screenshot_path = 'immersive_page_screenshot.png'
        await page.screenshot(path=screenshot_path, full_page=True)
        print(f"Screenshot saved to {screenshot_path}")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(verify_immersive_page())
