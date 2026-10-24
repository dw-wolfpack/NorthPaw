import urllib.request
import urllib.parse
import json
import os
import sys

HEADERS = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"}

def query_openalex(doi_or_title):
    query = urllib.parse.quote(doi_or_title)
    url = f"https://api.openalex.org/works?search={query}"
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode())
            if data.get("results"):
                top = data["results"][0]
                return {
                    "id": top.get("id"),
                    "title": top.get("title"),
                    "doi": top.get("doi"),
                    "oa_url": top.get("open_access", {}).get("oa_url"),
                    "pdf_url": (top.get("best_oa_location") or {}).get("pdf_url"),
                    "landing_page_url": (top.get("best_oa_location") or {}).get("landing_page_url"),
                    "abstract": top.get("abstract_inverted_index")
                }
    except Exception as e:
        print(f"OpenAlex error for {doi_or_title}: {e}")
    return None

def query_europepmc(query_str):
    q = urllib.parse.quote(query_str)
    url = f"https://www.ebi.ac.uk/europepmc/webservices/rest/search?query={q}&format=json&resultType=core"
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode())
            result_list = data.get("resultList", {}).get("result", [])
            if result_list:
                top = result_list[0]
                return {
                    "pmid": top.get("pmid"),
                    "pmcid": top.get("pmcid"),
                    "doi": top.get("doi"),
                    "title": top.get("title"),
                    "author": top.get("authorString"),
                    "journal": top.get("journalTitle"),
                    "year": top.get("pubYear"),
                    "isOpenAccess": top.get("isOpenAccess"),
                    "abstract": top.get("abstractText")
                }
    except Exception as e:
        print(f"EuropePMC error for {query_str}: {e}")
    return None

print("Checking queries...")
# Test 1
print("Sugano 1981:", query_europepmc("7328901"))
# Test 3
print("Baker 2018:", query_europepmc("Effect of conditioning on exercise-induced hyperthermia and post-exercise cooling in dogs"))
# Test 13
print("Impact of Dog Boots on Gait:", query_europepmc("10.3389/fvets.2022.906277"))
