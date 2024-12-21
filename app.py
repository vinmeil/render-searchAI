import json
import subprocess
from flask import Flask, render_template, request
from dotenv import load_dotenv
from langchain_core.prompts import ChatPromptTemplate
from langchain_ollama import ChatOllama

load_dotenv()
cache = {}
# load_limit = 8 # scrape limit following products.html template

def run_puppeteer_script(script, keywords): # TODO: check encoding='utf-8'
    result = subprocess.run(['node', script, keywords], capture_output=True, text=True, encoding='utf-8')
    if result.returncode != 0:
        print(f"Error running {script}: {result.stderr}")
        return []
    try:
        # force json.loads to parse the output, 
        # and ignore any errors from websites that don't return valid JSON (return N/A)
        return json.loads(result.stdout)
    except json.JSONDecodeError as e:
        print(f"JSONDecodeError: {e}")
        print(f"Output was: {result.stdout}")
        return []

def scrape_carousell_products(keywords):
    print(f"Scraping Carousell...")
    return run_puppeteer_script('puppeteer_scripts/scrape_carousell.js', keywords)

def scrape_zalora_products(keywords):
    print(f"Scraping Zalora...")
    return run_puppeteer_script('puppeteer_scripts/scrape_zalora.js', keywords)

def scrape_pgmall_products(keywords):
    print(f"Scraping PGMall...")
    return run_puppeteer_script('puppeteer_scripts/scrape_pgmall.js', keywords)

def scrape_ohgatcha_products(keywords):
    print(f"Scraping Ohgatcha...")
    return run_puppeteer_script('puppeteer_scripts/scrape_ohgatcha.js', keywords)

def scrape_goodsmile_products(keywords):
    print(f"Scraping Goodsmile...")
    return run_puppeteer_script('puppeteer_scripts/scrape_goodsmile.js', keywords)

def scrape_hololive_products(keywords):
    print(f"Scraping Hololive...")
    return run_puppeteer_script('puppeteer_scripts/scrape_hololive.js', keywords)

def scrape_nijisanji_products(keywords):
    print(f"Scraping Nijisanji...")
    return run_puppeteer_script('puppeteer_scripts/scrape_nijisanji.js', keywords)

def scrape_mercari_products(keywords):
    print(f"Scraping Mercari...")
    return run_puppeteer_script('puppeteer_scripts/scrape_mercari.js', keywords)

def scrape_all_products(keywords):
    if keywords in cache:
        print(f"Fetching cached results for: {keywords}")
        return cache[keywords]
    
    carousell_products = scrape_carousell_products(keywords)
    print("Done!")
    zalora_products = scrape_zalora_products(keywords)
    print("Done!")
    pgmall_products = scrape_pgmall_products(keywords)
    print("Done!")
    ohgatcha_products = scrape_ohgatcha_products(keywords)
    print("Done!")
    goodsmile_products = scrape_goodsmile_products(keywords)
    print("Done!")
    hololive_products = scrape_hololive_products(keywords)
    print("Done!")
    nijisanji_products = scrape_nijisanji_products(keywords)
    print("Done!")
    mercari_products = scrape_mercari_products(keywords)
    print("Done!")

    all_products =  {
        "Carousell": carousell_products,
        "Zalora": zalora_products,
        "PGMall": pgmall_products,
        "Ohgatcha": ohgatcha_products,
        "GoodSmile": goodsmile_products,
        "Hololive": hololive_products,
        "Nijisanji": nijisanji_products,
        "Mercari": mercari_products
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
                5. If user query does not include any product reply with the query itself. For example is query is "miko" return "miko".
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
def search():
    query = request.form['query']
    print(f"Query request from html: {query}")
    keywords = keyword_extractor(query)
    print(f"Extracted keywords are: {keywords}")
    if keywords.lower() == "none":
        return
    products = scrape_all_products(keywords)
    return render_template('products.html', products=products)

if __name__ == '__main__':
    app.run(debug=True)