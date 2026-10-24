#!/usr/bin/env python3
"""
Uploads technical architecture, algorithm specs, biophysical models, and academic papers
to the dedicated technical Google NotebookLM notebook.
"""

import os
import subprocess
import sys

NOTEBOOK_ID = "be5cba6c-4d7e-40b2-b0e6-114a7af59367"
NLM = "/Users/fiegellansknowledge/.local/bin/nlm"

technical_files = [
    "documentation/cold/04_UNIFIED_YEAR_ROUND_DECISION_ENGINE_SPEC.md",
    "documentation/cold/01_CANINE_COLD_BIOPHYSICS_AND_HEAT_BALANCE.md",
    "documentation/cold/02_MATHEMATICAL_MODEL_SPEC_CCSI.md",
    "documentation/cold/03_WINTER_SURFACE_THERMODYNAMICS_AND_CHEMICAL_SALT.md",
    "documentation/cold/05_TDD_TEST_SCENARIOS_AND_BENCHMARKS.md",
    "documentation/summer/01_CANINE_SUMMER_BIOPHYSICS_AND_HEAT_BALANCE.md",
    "documentation/summer/02_SUMMER_ALGORITHM_AUDIT_AND_COMPARISON_SPEC.md",
    "documentation/notebooklm/04_CORE_CODE_AND_ALGORITHMS_REFERENCE.md",
    "documentation/research_papers/00_RESEARCH_PAPERS_ANALYSIS_AND_SYNTHESIS.md",
    "documentation/cold/Winter Outdoor Risk for Dogs_ Evidence, Public Data, and a Deterministic Local-First Model.pdf"
]

def main():
    env = dict(os.environ)
    env["PATH"] = f"/Users/fiegellansknowledge/.local/bin:{env.get('PATH', '')}"

    print(f"Target Notebook: https://notebook.google.com/notebook/{NOTEBOOK_ID}")
    print(f"Queue: {len(technical_files)} technical documents (Tech stack, biophysical models, algorithms).")
    print("=" * 65)

    success = 0
    failed = 0

    for idx, fpath in enumerate(technical_files, 1):
        fname = os.path.basename(fpath)
        if not os.path.exists(fpath):
            print(f"[{idx}/{len(technical_files)}] ✗ File not found: {fpath}")
            failed += 1
            continue

        print(f"[{idx}/{len(technical_files)}] Uploading: {fname}...")
        cmd = [NLM, "source", "add", NOTEBOOK_ID, "--file", fpath, "--wait"]
        res = subprocess.run(cmd, capture_output=True, text=True, env=env)

        if res.returncode == 0:
            print(f"  ✓ Added & Processed: {fname}")
            success += 1
        else:
            err = res.stderr.strip() or res.stdout.strip()
            print(f"  ✗ Failed: {fname} -> {err}")
            failed += 1

    print("=" * 65)
    print(f"Upload complete! Successfully processed {success} new sources ({failed} failed).")

if __name__ == "__main__":
    main()
