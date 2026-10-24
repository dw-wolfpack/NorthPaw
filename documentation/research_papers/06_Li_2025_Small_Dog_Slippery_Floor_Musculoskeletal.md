# Analysis of the Musculoskeletal Load Generated when a Small Dog Walks on a Slippery Floor

**Authors:** Shijian Li, Daisuke Chugo, Satoshi Muramatsu, Sho Yokota, Jin-Hua She, Hiroshi Hashimoto, Uemura Takashi, Hiroaki Kamishina, Yoshiharu Hata, Takayuki Yamada, and Takahiro Uchida  
**Year:** 2025  
**Journal / Source:** 2025 IEEE/SICE International Symposium on System Integration (SII), pp. 1–6  
**Identifier:** DOI: 10.1109/SII59315.2025.10870910 | PMID: N/A  
**Evidence Tier:** Tier 1 — Canine Biomechanics & Orthopedics  
**Primary Research Question:** Low-friction locomotion, limb slip mechanics, and musculoskeletal loading in small dogs.  

---

### Executive Summary & Core Findings
Li et al. utilized 3D motion capture and inverse dynamics musculoskeletal modeling to quantify the joint moments and ligament forces generated when toy and small breed dogs walk on low-friction substrates.

1. **Abnormal Joint Moments During Slip:**
   - Walking on low-friction surfaces ($\mu < 0.2$) produced substantial increases in **abduction and adduction moments** in the stifle (knee) and hip joints.
   - Dogs alter their gait by splaying limbs laterally to lower their center of mass, shifting loads away from sagittal flexion/extension into destabilizing coronal planes.

2. **Orthopedic Vulnerabilities:**
   - The increased lateral shear force directly stresses the cranial cruciate ligament (CCL) and dramatically increases patellar luxation risk—common clinical conditions in small breeds (Chihuahuas, Frenchies, Pomeranians).

### Implications for NorthPaw
- **Winter Slip Risk is Orthopedic, Not Hypothermic:** When roads or sidewalks present slick refreeze conditions, small dogs face joint and ligament trauma rather than pure cold stress.
- NorthPaw's decision engine must explicitly raise `slick_surface` as an independent musculoskeletal advisory for senior dogs and breeds predisposed to patellar luxation or hip dysplasia.

---
*Archived in NorthPaw Documentation Repository for Veterinary Verification and Algorithm Governance.*
