import json
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import NoSuchElementException, TimeoutException, StaleElementReferenceException
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from dotenv import load_dotenv
from flask import Flask, render_template, request

load_dotenv()
cache = {}

def scrape_carousell_products(keywords):
    if keywords in cache:
        print(f"Fetching cached results for: {keywords}")
        return cache[keywords]

    URL = f"https://www.carousell.com.my/search/{keywords}"
    all_products = []

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

    driver.get(URL)
    print("Navigating to the page...")

    try:
        WebDriverWait(driver, 20).until(
            EC.presence_of_element_located((By.CLASS_NAME, "D_la"))
        )
    except TimeoutException:
        print("Timeout while waiting for products to load.")
        print(driver.page_source)  # Print the page source for debugging
        driver.quit()
        return []

    while True:
        try:
            products = driver.find_elements(By.CLASS_NAME, "D_la.D_or")
            print(f"Found {len(products)} products on the page.")
            for index, product in enumerate(products):
                try:
                    name_xpath = ".//a[2]/p[1]"
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
                    print(f"Scraped product: {name}, {price}")
                except NoSuchElementException as e:
                    print(f"Error scraping product: {e}")
                except StaleElementReferenceException as e:
                    print(f"Stale element reference: {e}")
            try:
                next_button = driver.find_element(By.PARTIAL_LINK_TEXT, "Next")
                next_button.click()
            except NoSuchElementException:
                break
        except NoSuchElementException:
            break

    driver.quit() 

    cache[keywords] = all_products
    return all_products

def scrape_all_products(keywords):
    carousell_products = scrape_carousell_products(keywords)
    all_products = carousell_products

    OUTPUT_FILE = "all_products.json"
    with open(OUTPUT_FILE, "w") as f:
        json.dump({"product_list": all_products}, f, indent=4)

    return all_products

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/search', methods=['POST'])
def search():
    query = request.form['query']
    keywords = query  # Directly use the query as keywords
    print(f"Extracted Keywords: {keywords}")
    products = scrape_all_products(keywords)
    return render_template('products.html', products=products)

if __name__ == '__main__':
    app.run(debug=True)