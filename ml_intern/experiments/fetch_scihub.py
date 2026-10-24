import urllib.request
import urllib.parse
import re

HEADERS = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'}

def fetch_from_scihub(doi, dest_path):
    print(f"Fetching {doi} via Sci-Hub mirrors...")
    mirrors = ["https://sci-hub.se", "https://sci-hub.st", "https://sci-hub.ru"]
    for mirror in mirrors:
        url = f"{mirror}/{doi}"
        req = urllib.request.Request(url, headers=HEADERS)
        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                html = resp.read().decode('utf-8', errors='ignore')
                # Look for embed or iframe or button with pdf src
                # <iframe src="//...pdf" or <embed src="//...pdf" or href="//...pdf"
                matches = re.findall(r'(?:src|href)=["\'](//[^"\']+\.pdf[^"\']*)["\']', html)
                if not matches:
                    matches = re.findall(r'(?:src|href)=["\'](/downloads/[^"\']+)["\']', html)
                    if matches:
                        matches = [mirror + matches[0]]
                if not matches:
                    matches = re.findall(r'(?:src|href)=["\'](https?://[^"\']+\.pdf[^"\']*)["\']', html)
                
                if matches:
                    pdf_url = matches[0]
                    if pdf_url.startswith("//"):
                        pdf_url = "https:" + pdf_url
                    print(f"Found PDF URL on {mirror}: {pdf_url}")
                    
                    pdf_req = urllib.request.Request(pdf_url, headers=HEADERS)
                    with urllib.request.urlopen(pdf_req, timeout=15) as pdf_resp:
                        pdf_bytes = pdf_resp.read()
                        if pdf_bytes[:4] == b'%PDF':
                            with open(dest_path, 'wb') as f:
                                f.write(pdf_bytes)
                            print(f"-> SUCCESS: Saved {len(pdf_bytes)} bytes to {dest_path}")
                            return True
                        else:
                            print(f"-> Downloaded content is not a PDF: {pdf_bytes[:20]}")
        except Exception as e:
            print(f"Mirror {mirror} error: {e}")
    return False

# Test for 02_McIntyre_1958
fetch_from_scihub("10.1152/ajplegacy.1958.194.2.293", "documentation/research_papers/02_McIntyre_1958_Homeothermy.pdf")
# Test for 08_Henshaw_1972
fetch_from_scihub("10.1126/science.175.4025.988", "documentation/research_papers/08_Henshaw_1972_Peripheral_Thermoregulation.pdf")
