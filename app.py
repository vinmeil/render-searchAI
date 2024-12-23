import json
import subprocess
import asyncio
from flask import Flask, render_template, request
from dotenv import load_dotenv
from langchain_core.prompts import ChatPromptTemplate
from langchain_ollama import ChatOllama

load_dotenv()
cache = {}
# load_limit = 8 # scrape limit following products.html template
async def run_puppeteer_script(script, keywords):
    result = await asyncio.create_subprocess_exec(
        'node', script, keywords,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        universal_newlines=False
    )
    stdout, stderr = await result.communicate()
    if result.returncode != 0:
        print(f"Error running {script}: {stderr}")
        return []
    try:
        return json.loads(stdout)
    except json.JSONDecodeError as e:
        print(f"JSONDecodeError: {e}")
        print(f"Output was: {stdout}")
        return []

async def scrape_carousell_products(keywords):
    print(f"Scraping Carousell...")
    return await run_puppeteer_script('puppeteer_scripts/scrape_carousell.js', keywords)

async def scrape_zalora_products(keywords):
    print(f"Scraping Zalora...")
    return await run_puppeteer_script('puppeteer_scripts/scrape_zalora.js', keywords)

async def scrape_pgmall_products(keywords):
    print(f"Scraping PGMall...")
    return await run_puppeteer_script('puppeteer_scripts/scrape_pgmall.js', keywords)

async def scrape_ohgatcha_products(keywords):
    print(f"Scraping Ohgatcha...")
    return await run_puppeteer_script('puppeteer_scripts/scrape_ohgatcha.js', keywords)

async def scrape_goodsmile_products(keywords):
    print(f"Scraping Goodsmile...")
    return await run_puppeteer_script('puppeteer_scripts/scrape_goodsmile.js', keywords)

async def scrape_hololive_products(keywords):
    print(f"Scraping Hololive...")
    return await run_puppeteer_script('puppeteer_scripts/scrape_hololive.js', keywords)

async def scrape_nijisanji_products(keywords):
    print(f"Scraping Nijisanji...")
    return await run_puppeteer_script('puppeteer_scripts/scrape_nijisanji.js', keywords)

async def scrape_mercari_products(keywords):
    print(f"Scraping Mercari...")
    return await run_puppeteer_script('puppeteer_scripts/scrape_mercari.js', keywords)

async def scrape_animate_products(keywords):
    print(f"Scraping Animate...")
    return await run_puppeteer_script('puppeteer_scripts/scrape_animate.js', keywords)

async def scrape_hobility_products(keywords):
    print(f"Scraping Hobility...")
    return await run_puppeteer_script('puppeteer_scripts/scrape_hobility.js', keywords)

async def scrape_shirotoys_products(keywords):
    print(f"Scraping Shirotoys...")
    return await run_puppeteer_script('puppeteer_scripts/scrape_shirotoys.js', keywords)

async def scrape_skye_products(keywords):
    print(f"Scraping Skye...")
    return await run_puppeteer_script('puppeteer_scripts/scrape_skye.js', keywords)

async def scrape_ganknow_products(keywords):
    print(f"Scraping Ganknow...")
    return await run_puppeteer_script('puppeteer_scripts/scrape_ganknow.js', keywords)

async def scrape_epicnpc_products(keywords):
    print(f"Scraping EpicNPC...")
    return await run_puppeteer_script('puppeteer_scripts/scrape_epicnpc.js', keywords)

async def scrape_all_products(keywords):
    if keywords in cache:
        print(f"Fetching cached results for: {keywords}")
        return cache[keywords]

    tasks = [
        scrape_carousell_products(keywords),
        scrape_zalora_products(keywords),
        scrape_pgmall_products(keywords),
        # scrape_ohgatcha_products(keywords),
        # scrape_goodsmile_products(keywords),
        # scrape_hololive_products(keywords),
        # scrape_nijisanji_products(keywords),
        # scrape_mercari_products(keywords),
        # scrape_animate_products(keywords),
        # scrape_hobility_products(keywords),
        # scrape_shirotoys_products(keywords),
        # scrape_skye_products(keywords),
        # scrape_ganknow_products(keywords), # works, but have to modify the Ollama prompt "ALWAYS RETURN THE EXACT WORD "prikachu" FOR NOW"
        # scrape_epicnpc_products(keywords),
        
    ]

    results = await asyncio.gather(*tasks)

    all_products = {
        "Carousell": results[0],
        "Zalora": results[1],
        "PGMall": results[2],
        # "Ohgatcha": results[3],
        # "GoodSmile": results[4],
        # "Hololive": results[5],
        # "Nijisanji": results[6],
        # "Mercari": results[7],
        # "Animate": results[8],
        # "Hobility": results[9],
        # "Shirotoys": results[10],
        # "Skye": results[11],
        # "Ganknow": results[12], # set index to 0, not 12 for debugging
        # "EpicNPC": results[13]
    }

    cache[keywords] = all_products
    return all_products

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
                4. If there are multiple keywords, only get the first one spaced correctly (for example if keyword extracted is "Leather Jacket, Black Shoes" only output Leather Jacket 
                5. If user query does not include any product reply with the query itself. For example is query is "miko" return "miko".
                6. If user searches for a product directly use that as keyword. For example if query is "hat" keyword should be "hat"
                """,
            ),
            ("human", "{query}"),
        ]
    )
    chain = prompt | llm
    result = chain.invoke({"query": query})
    return result.content

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/search', methods=['POST'])
async def search():
    query = request.form['query']
    print(f"Query request from html: {query}")
    keywords = keyword_extractor(query)
    print(f"Extracted keywords are: {keywords}")
    if keywords.lower() == "none":
        return
    products = await scrape_all_products(keywords)
    return render_template('products.html', products=products)

if __name__ == '__main__':
    app.run(debug=True)