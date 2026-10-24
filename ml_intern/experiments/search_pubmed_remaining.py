import urllib.request
import urllib.parse
import json
import xml.etree.ElementTree as ET

HEADERS = {'User-Agent': 'Mozilla/5.0'}

def search_pubmed(query):
    url = f"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term={urllib.parse.quote(query)}&retmode=json"
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode())
            id_list = data.get("esearchresult", {}).get("idlist", [])
            return id_list
    except Exception as e:
        return []

def fetch_pubmed_summary(pmid):
    url = f"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id={pmid}&retmode=json"
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode())
            return data.get("result", {}).get(str(pmid), {})
    except Exception as e:
        return {}

queries = [
    ("2. McIntyre 1958", "Metabolic factors in the development of homeothermy in dogs McIntyre"),
    ("3. Baker 2018", "Effect of conditioning on exercise-induced hyperthermia and post-exercise cooling in dogs"),
    ("4. Covino 1957", "Cardiovascular response to hypothermia effect of cold acclimatization Covino"),
    ("5. Schick 1987", "3610796"),
    ("10. Alaskan Husky", "Alaskan husky coat thickness lower critical temperature"),
    ("11. Arkin 1991", "Heat transfer properties of dry and wet furs of dairy cows"),
    ("12. Erdsack 2013", "Coping with heat function of the natal coat of Cape fur seal pups")
]

for label, q in queries:
    ids = search_pubmed(q)
    if ids:
        summ = fetch_pubmed_summary(ids[0])
        print(f"{label}: PMID {ids[0]} | Title: {summ.get('title')} | Source: {summ.get('source')} {summ.get('pubdate')}")
    else:
        print(f"{label}: No direct PubMed ID found for query '{q}'")
