import json
import time
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import NoSuchElementException, TimeoutException
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from dotenv import load_dotenv
from flask import Flask, render_template, request

load_dotenv()
cache = {} # cache for storing past search results to avoid scraping again

# some spoofing to avoid bot detection. DO NOT REMOVE/CHANGE
def get_driver():
    chrome_options = Options()
    chrome_options.add_argument("--headless")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--window-size=1920,1080")
    chrome_options.add_argument("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36")
    chrome_options.add_argument("--accept-language=en-US,en;q=0.9")
    browser_driver = Service('chromedriver.exe')
    driver = webdriver.Chrome(service=browser_driver, options=chrome_options)
    return driver

def scrape_carousell_products(driver, keywords):
    URL = f"https://www.carousell.com.my/search/{keywords}"
    all_products = []

    driver.get(URL)
    print("Navigating to Carousell page...")

    try:
        WebDriverWait(driver, 20).until(
            EC.presence_of_element_located((By.CLASS_NAME, "D_la"))
        )
    except TimeoutException:
        print("Timeout while waiting for Carousell products to load.")
        return []

    while True:
        try:
            products = driver.find_elements(By.CLASS_NAME, "D_la.D_or")
            print(f"Found {len(products)} products on Carousell.")
            for index, product in enumerate(products):
                try:
                    name_xpath = ".//a[2]/p[1]" # TODO: this xpath might break if Carousell changes their HTML structure
                    price_xpath = ".//a[2]/div[2]/p"
                    name_element = product.find_element(By.XPATH, name_xpath)
                    price_element = product.find_element(By.XPATH, price_xpath)
                    img_element = product.find_element(By.CSS_SELECTOR, "img.D_mg.D_UM")
                    link_element = product.find_element(By.CSS_SELECTOR, "a.D_jw[href*='/p/']")

                    name = name_element.text if name_element else "N/A"
                    price = price_element.text if price_element else "N/A"
                    img_link = img_element.get_attribute("src") if img_element else "N/A"
                    product_link = link_element.get_attribute("href") if link_element else "N/A"

                    all_products.append({
                        "name": name,
                        "price": price,
                        "img_link": img_link,
                        "product_link": product_link
                    })
                    print(f"Scraped Carousell product: {name}, {price}")
                except NoSuchElementException as e:
                    print(f"Error scraping Carousell product: {e}")
            try:
                next_button = driver.find_element(By.PARTIAL_LINK_TEXT, "Next")
                next_button.click()
                time.sleep(5)
            except NoSuchElementException:
                break
        except NoSuchElementException:
            break

    return all_products

def scrape_zalora_products(driver, keywords):
    URL = f"https://www.zalora.com.my/search?q={keywords}"
    all_products = []

    driver.get(URL)
    print("Navigating to Zalora page...")

    try:
        WebDriverWait(driver, 20).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "a[data-test-id='productLink']"))
        )
    except TimeoutException:
        print("Timeout while waiting for Zalora products to load.")
        return []

    products = driver.find_elements(By.CSS_SELECTOR, "a[data-test-id='productLink']")
    print(f"Found {len(products)} products on Zalora.")
    for product in products:
        try:
            name_element = product.find_element(By.CSS_SELECTOR, "div[data-test-id='productTitle']")
            price_element = product.find_element(By.CSS_SELECTOR, "div[data-test-id='originalPrice']")
            img_element = product.find_element(By.CSS_SELECTOR, "img")
            link_element = product

            name = name_element.text if name_element else "N/A"
            price = price_element.text if price_element else "N/A"
            # TODO: yet to include the brand name/product line
            img_link = img_element.get_attribute("src") if img_element else "N/A"
            product_link = link_element.get_attribute("href") if link_element else "N/A"

            all_products.append({
                "name": name,
                "price": price,
                "img_link": img_link,
                "product_link": product_link
            })
            print(f"Scraped Zalora product: {name}, {price}")
        except NoSuchElementException as e:
            print(f"Error scraping Zalora product: {e}")

    return all_products

def scrape_all_products(keywords):
    if keywords in cache:
        print(f"Fetching cached results for: {keywords}")
        return cache[keywords]

    driver = get_driver()
    carousell_products = scrape_carousell_products(driver, keywords)
    zalora_products = scrape_zalora_products(driver, keywords)
    driver.quit()

    all_products =  carousell_products + zalora_products

    OUTPUT_FILE = "all_products.json"
    with open(OUTPUT_FILE, "w") as f:
        json.dump({"product_list": all_products}, f, indent=4)

    cache[keywords] = all_products
    return all_products

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/search', methods=['POST'])
def search():
    query = request.form['query']
    keywords = query  # TODO: implement keyword extraction using Ollama API
    print(f"Extracted Keywords: {keywords}")
    products = scrape_all_products(keywords)
    return render_template('products.html', products=products)

if __name__ == '__main__':
    app.run(debug=True)