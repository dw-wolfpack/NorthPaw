import urllib.request
import urllib.parse
import json

HEADERS = {'User-Agent': 'Mozilla/5.0'}

def check_semantic_scholar(doi):
    url = f"https://api.semanticscholar.org/graph/v1/paper/DOI:{urllib.parse.quote(doi)}?fields=title,authors,year,abstract,isOpenAccess,openAccessPdf,tldr,url"
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode())
            return data
    except Exception as e:
        return {"error": str(e)}

dois_to_check = [
    ("2. McIntyre 1958", "10.1152/ajplegacy.1958.194.2.293"),
    ("3. Baker 2018", "10.3920/cep170039"),
    ("4. Covino 1957", "10.1152/ajplegacy.1957.189.3.459"),
    ("6. Li 2025", "10.1109/SII59315.2025.10870910"),
    ("7. Sled dog 1996", "10.1111/j.1365-3164.1996.tb00247.x"),
    ("8. Henshaw 1972", "10.1126/science.175.4025.988"),
    ("9. Frostbite 1954", "10.1177/000331975400500605"),
    ("11. Arkin 1991", "10.13031/2013.31905")
]

for label, doi in dois_to_check:
    data = check_semantic_scholar(doi)
    if "error" not in data:
        print(f"=== {label} ===")
        print(f"Title: {data.get('title')}")
        print(f"Year: {data.get('year')}")
        print(f"OA PDF: {data.get('openAccessPdf')}")
        print(f"TLDR: {data.get('tldr')}")
        print(f"Abstract snippet: {(data.get('abstract') or '')[:300]}")
    else:
        print(f"{label}: {data['error']}")
