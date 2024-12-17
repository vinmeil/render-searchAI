import os
import json
import agentql
import asyncio
from playwright.async_api import async_playwright
from dotenv import load_dotenv
from langchain_core.prompts import ChatPromptTemplate
from langchain_ollama import ChatOllama
from flask import Flask, render_template, request

# Load environment variables
load_dotenv()

async def scrape_carousell_products(keywords):
    URL = f"https://www.carousell.com.my/search/{keywords}"
    OUTPUT_FILE = "carousell_products.json"

    all_products = []
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=True)
        
        # Create a browser context with a custom User-Agent
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
            extra_http_headers={
                "Accept-Language": "en-US,en;q=0.9",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8"
            }
        )
        page = agentql.wrap(await context.new_page())

        # Go to the target URL
        print("Navigating to the page...")
        await page.goto(URL, wait_until="networkidle")

        # Check if the popup needs to be closed
        close_popup_selector = "button.D_qn.D_amc[aria-label='Close']"
        popup_button = page.locator(close_popup_selector)
        if await popup_button.is_visible():
            print("Closing popup...")
            await popup_button.click()
            await page.wait_for_timeout(1000)

        # # Wait for content to load
        # print("Waiting for products to load...")
        # await page.wait_for_selector(".product-card, .product-name", timeout=10000)

        # Query using AgentQL
        print("Executing AgentQL query...")
        PRODUCT_QUERY = """
        {
            products[] {
                name(name of product)
                price
                condition
                img_link(link to the image of the product)
                product_link(link to the product listing)
            }
        }
        """

        # Fetch product data
        product_response = await page.query_data(PRODUCT_QUERY)
        all_products = product_response.get("products", [])

        # Save data to JSON
        with open(OUTPUT_FILE, "w") as f:
            json.dump({"product_list": all_products}, f, indent=4)

        print(f"Total {len(all_products)} products scraped. Data saved to {OUTPUT_FILE}")
        await browser.close()
    return all_products

# Function to extract relevant keywords using LangChain
def keyword_extractor(query):
    llm = ChatOllama(
        model="llama3.1",
        temperature=0.0,
    )
    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                """
                You are a keyword extractor that, given a user sentence or question, will extract a searchable product on an ecommerce site.
                Make sure to follow the guidelines below:
                1. Do not ask questions.
                2. Do not output a list.
                3. Output only a few words (keywords).
                4. If there are multiple keywords, connect them via a comma (e.g. 'zzz account').
                5. If user query does not include any product reply with "I am sorry I couldn't find '[user's full query]'"
                """,
            ),
            ("human", "{query}"),
        ]
    )
    chain = prompt | llm
    result = chain.invoke({"query": query})
    return result.content

# Flask App
app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/search', methods=['POST'])
def search():
    query = request.form['query']
    keywords = keyword_extractor(query)
    print(f"Extracted Keywords: {keywords}")
    products = asyncio.run(scrape_carousell_products(keywords))
    print(f"Products: {products}")
    return render_template('products.html', products=products)

if __name__ == '__main__':
    app.run(debug=True)