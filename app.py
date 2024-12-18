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

# memoization cache to store the results of the previous queries
# will improve on this later
cache = {}

async def scrape_carousell_products(keywords):
    if keywords in cache:
        print(f"Fetching cached results for: {keywords}")
        return cache[keywords]

    URL = f"https://www.carousell.com.my/search/{keywords}"
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

        await browser.close()

    # tryna cache to avoid scraping again
    cache[keywords] = all_products
    return all_products

async def scrape_lazada_products(keywords):
    URL = f"https://www.lazada.com.my/catalog/?q={keywords}"
    all_products = []
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
            extra_http_headers={
                "Accept-Language": "en-US,en;q=0.9",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8"
            }
        )
        page = agentql.wrap(await context.new_page())
        await page.goto(URL, wait_until="networkidle")

        # Query using AgentQL
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
        product_response = await page.query_data(PRODUCT_QUERY)
        all_products = product_response.get("products", [])

        await browser.close()

    return all_products

async def scrape_all_products(keywords):
    carousell_products = await scrape_carousell_products(keywords)
    # lazada_products = await scrape_lazada_products(keywords)
    all_products = carousell_products # + lazada_products isnt working yet

    # Save data to JSON
    OUTPUT_FILE = "all_products.json"
    with open(OUTPUT_FILE, "w") as f:
        json.dump({"product_list": all_products}, f, indent=4)

    return all_products

# Function to extract relevant keywords using LangChain
#If there are multiple keywords, connect them via a comma (e.g. 'zzz account').
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
                4. If there are multiple keywords, only get the first one spaced correctly
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
    products = asyncio.run(scrape_all_products(keywords))
    return render_template('products.html', products=products)

if __name__ == '__main__':
    app.run(debug=True)
