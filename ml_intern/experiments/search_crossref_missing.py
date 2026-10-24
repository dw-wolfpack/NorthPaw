import urllib.request
import urllib.parse
import json

HEADERS = {'User-Agent': 'Mozilla/5.0'}

def search_crossref(query):
    url = f"https://api.crossref.org/works?query={urllib.parse.quote(query)}&rows=3"
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode())
            items = data.get("message", {}).get("items", [])
            for item in items:
                print(f"Title: {item.get('title', [''])[0]}")
                print(f"DOI: {item.get('DOI')}")
                print(f"Container: {item.get('container-title', [''])[0]}")
                print(f"Author: {item.get('author', [{}])[0].get('family') if item.get('author') else ''}")
                print(f"URL: {item.get('URL')}")
                print("-" * 50)
    except Exception as e:
        print(f"Error: {e}")

print("=== Baker 2018 ===")
search_crossref("Effect of conditioning on exercise-induced hyperthermia and post-exercise cooling in dogs Baker")

print("=== Arkin 1991 ===")
search_crossref("Heat transfer properties of dry and wet furs of dairy cows Arkin")

print("=== Alaskan Husky LCT ===")
search_crossref("Alaskan husky coat thickness lower critical temperature")
