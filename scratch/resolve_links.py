import urllib.request
import re

urls = [
    "https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQE3y9Bmaq4mf2ekcU8Tpq-95Jd6oQyRSoZ1fCvId8SA39-qzwwwqytcPVD97Q2HnwG7lJhIr9Vm40jB0Jwp3degi9KCkpDtykKhs0RIYoeEaoXUiqPnKQ_ArpwRX3PDvrQ8zMbjsmcC4Pi2ymkXAM1VE86ZU0ZWBTZE0XndJvE-por-ekEs2lhP4vKmKA==",
    "https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQGj_US-5Q_zMII_-xdGHVHhO2ijyofmFQfuaw0XRveFtRn2jI0NRtBn_GNMIS82sEh4WxYJVmglrpREBcnbgK_LXdAhymWsALqaw7Qv3FOggf_sZuj1_SSoHuvTpuL7GBV25HE5vbnkpEoKrvIXntuF3RAZ41HRd1kTEADW_5L-T0VZzqmdC10-jHkmYA==",
    "https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQEhxG1ILqG1isw-micNxxuhxAnfZqvZiIfSivAgEkHznVNXvTQgwPTLsxtAb9v3EJQYu55GyE6j3r5ae8zUnnOk9UIujwCVi2lKoMogXkF3qnQW1_fAFtRDs8AKSJVz8BVAqPhMnoASXI5d2ac_Nt6ilipiMUaJ2iNyT8IHN5seDoMLUhSjttcZE3NMa3TLL3_sbVuO",
    "https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQHwRgXmVZ246dPEBwnP1wHEgkYZcJEV3JZr_1oO2wZXbpXtrx1B40xfT5VyxckZ_t04HXIUN6Hf9arj8RGRXBW-HvsuRduSnDHiFLfLvA5iReXbsqil6tDfiRT-tI81L6USib77G2nYJzmYdpqvlWUhXb2YPCuI7K-jkIUYtzgnxqu3rr1ynDU=",
    "https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQFPC6nhFUQvr1KiSI_kwudUZOZxFRY98hLecGukFKSbdlySHYbFeCF1Shwy7XKFdP61AR2pDDnAQYnwNrc3rK8dmRQnzARS1oAaSwJh9x34PmY3Nf5ZPx-Vo2Ywau153GioGohYJGx8lotnN2S-Ykx9vwUMGNwdhmal0DnhgS0=",
    "https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQEvEL_pD_07SfuJNCEbHP_SNLMCX6cmamsi11Dk0WBeaJZMSiT_s7U-uliWO10zfNcqNhrGn646hgsxHJ3lMF57nnpkvfKAICjk6jxgW7DdanmpAZ39qkTRnmbhqGj6Q_UzPiirceDNBwlriBFgzPdXBUcbv7TIBz2jCbx-iCaImIu8Tmb_fabM6MLAD6_bvbhyzSchlg=="
]

headers = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'}

for idx, url in enumerate(urls):
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req) as response:
            html = response.read().decode('utf-8', errors='ignore')
            # Look for canonical URL or og:url in head
            match = re.search(r'<meta property="og:url" content="([^"]+)"', html)
            if not match:
                match = re.search(r'<link rel="canonical" href="([^"]+)"', html)
            
            title_match = re.search(r'<title>([^<]+)</title>', html)
            title = title_match.group(1) if title_match else "No Title"
            
            dest = match.group(1) if match else "Could not resolve"
            print(f"[{idx+1}] TITLE: {title}")
            print(f"    DEST: {dest}")
    except Exception as e:
        print(f"[{idx+1}] ERROR: {e}")
