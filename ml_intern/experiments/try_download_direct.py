import urllib.request
import urllib.parse
import json
import re

HEADERS = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'}

def try_download(url, dest_path):
    print(f"Trying download from {url}...")
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            content = resp.read()
            if content[:4] == b'%PDF':
                with open(dest_path, 'wb') as f:
                    f.write(content)
                print(f"-> SUCCESS: Saved {len(content)} bytes to {dest_path}")
                return True
            else:
                print(f"-> Not a PDF ({len(content)} bytes, header: {content[:15]})")
    except Exception as e:
        print(f"-> Failed: {e}")
    return False

# Let's test a few direct URLs
# McIntyre 1958: https://journals.physiology.org/doi/pdf/10.1152/ajplegacy.1958.194.2.293
# Covino 1957: https://journals.physiology.org/doi/pdf/10.1152/ajplegacy.1957.189.3.459
# Henshaw 1972: Science https://www.science.org/doi/pdf/10.1126/science.175.4025.988
# Sled dog 1996: https://onlinelibrary.wiley.com/doi/pdfdirect/10.1111/j.1365-3164.1996.tb00247.x

try_download("https://journals.physiology.org/doi/pdf/10.1152/ajplegacy.1958.194.2.293", "documentation/research_papers/02_McIntyre_1958_Homeothermy.pdf")
try_download("https://journals.physiology.org/doi/pdf/10.1152/ajplegacy.1957.189.3.459", "documentation/research_papers/04_Covino_1957_Cardiovascular_Hypothermia.pdf")
try_download("https://www.science.org/doi/pdf/10.1126/science.175.4025.988", "documentation/research_papers/08_Henshaw_1972_Peripheral_Thermoregulation.pdf")
