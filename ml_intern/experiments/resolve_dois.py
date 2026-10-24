import urllib.request
import urllib.parse
import json

HEADERS = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'}

def resolve_doi(doi):
    url = f"https://api.crossref.org/works/{urllib.parse.quote(doi)}"
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode())
            msg = data.get("message", {})
            return {
                "title": msg.get("title", [""])[0],
                "author": msg.get("author", []),
                "publisher": msg.get("publisher"),
                "created": msg.get("created"),
                "link": msg.get("link", []),
                "resource": msg.get("resource", {})
            }
    except Exception as e:
        return {"error": str(e)}

dois = [
    ("1. Sugano 1981", "10.2170/jjphysiol.31.465"),
    ("6. Li 2025", "10.1109/SII59315.2025.10870910"),
    ("7. Sled dog 1996", "10.1111/j.1365-3164.1996.tb00247.x"),
    ("8. Henshaw 1972", "10.1126/science.175.4025.988"),
    ("9. Frostbite 1954", "10.1177/000331975400500605"),
    ("13. Dog Boots 2022", "10.3389/fvets.2022.906277")
]

for label, doi in dois:
    res = resolve_doi(doi)
    print(f"{label}: {res.get('title')} | Publisher: {res.get('publisher')}")
