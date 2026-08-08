import csv
from synapse_core.pipeline import evaluate_claim

"""
Run ESG claim evaluation for all company-category pairs in a CSV file.

CSV format:
company,category
Adidas AG,Air Emissions
Adidas AG,Biodiversity
...
"""

CSV_FILE = "query_set.csv"


def run():
    with open(CSV_FILE, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)

        for row in reader:
            company = row["company"].strip()
            category = row["category"].strip()

            if not company or not category:
                continue
            try:
                result = evaluate_claim(category, company)
            except Exception as e:
                print("Error:", str(e))


if __name__ == "__main__":
    run()