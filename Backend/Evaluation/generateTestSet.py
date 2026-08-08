"""
Test Set Builder for Greenwashing Detection
Automatically extracts and saves evaluation data during inference.
"""

import csv
import json
import os
from datetime import datetime


# TEST_SET_PATH = "test_set.csv"
TEST_SET_BASELINE_PATH = "test_set_baseline.csv"
TEST_SET_PATH = "test_set_counterRag.csv"
TEST_SET_PATH_SYNAPSE = "test_set_Synapse.csv"
TEST_SET_VANILLA = "test_set_vanillaRag.csv"

# CSV columns
COLUMNS = [
    # Input
    "company",
    "query",
    # Retrieved context (raw)
    "company_report_text",
    "counterfactual_text",
    "supportive_text",
    # LLM Output fields
    "company_claim_summary",
    "object_property",
    "judgment",
    "greenwashing_status",
    "reason_for_judgement",
    "summary_support_evidence",
    "summary_counter_evidence",
    # ROUGE reference fields (what we expect the output to align with)
    "rouge_reference",   # concatenation of retrieved sentences used as ground truth
    # Metadata
    "timestamp",
    "raw_llm_output",
]
COLUMNS_COUNTER_RAG = [
    # Input
    "company",
    "query",
    # Retrieved context (raw)
    "company_report_text",
    "counterfactual_text",
    "supportive_text",
    # LLM Output fields
    "company_claim_summary",
    "judgment",
    "greenwashing_status",
    "reason_for_judgement",
    "summary_support_evidence",
    "summary_counter_evidence",
    # ROUGE reference fields (what we expect the output to align with)
    "rouge_reference",   # concatenation of retrieved sentences used as ground truth
    # Metadata
    "timestamp",
    "raw_llm_output",
]

COLUMNS_VANILLA_RAG = [
        "company",
        "query",
        "documents",
        "company_claim_summary",
        "object_property",
        "judgment",
        "greenwashing_status",
        "reason_for_judgement",
        "summary_evidence",
        "rouge_reference",
        "timestamp",
        "raw_llm_output",
]

def extract_text_by_tag(serialized_docs: str, tag: str) -> str:
    """Extract all Article text under a given document tag."""
    lines = serialized_docs.split("\n")
    collected = []
    in_block = False
    for line in lines:
        if line.strip().startswith(f"[{tag}]"):
            in_block = True
            continue
        # new block starts
        if line.strip().startswith("[") and line.strip().endswith("]") and in_block:
            in_block = False
        if in_block and line.strip().startswith("Article:"):
            article_text = line.replace("Article:", "").strip()
            collected.append(article_text)
    return " ".join(collected)


def build_rouge_reference(serialized_docs: str) -> str:
    """
    Build a reference string for ROUGE scoring by concatenating
    all Article sentences from retrieved documents in order:
    company report → counterfactual → supportive.
    """
    company = extract_text_by_tag(serialized_docs, "COMPANY_REPORT")
    counter = extract_text_by_tag(serialized_docs, "EXTERNAL_SOURCE_COUNTERFACTUAL")
    support = extract_text_by_tag(serialized_docs, "EXTERNAL_SOURCE_SUPPORTIVE")
    document = extract_text_by_tag(serialized_docs, "DOCUMENT")
    parts = [p for p in [company, counter, support, document] if p.strip()]
    return " ".join(parts)


def build_prediction_string(result: dict) -> str:
    """
    Concatenate LLM output fields into a single string for ROUGE prediction.
    Mirrors the structure used in your ROUGE experiments.
    """
    fields = [
        result.get("company_claim_summary", ""),
        result.get("summary_counter_evidence", ""),
        result.get("summary_support_evidence", ""),
        result.get("reason_for_judgement", ""),
    ]
    return " ".join([f for f in fields if f and f.strip()])


def init_test_set(path: str = TEST_SET_PATH_SYNAPSE):
    """Create CSV with headers if it doesn't exist."""
    if not os.path.exists(path):
        with open(path, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=COLUMNS)
            writer.writeheader()
        print(f"[TestSet] Created new test set at: {path}")
    else:
        print(f"[TestSet] Appending to existing test set at: {path}")


def save_to_test_set(
    company: str,
    query: str,
    serialized_docs: str,
    result: dict,
    raw_llm_output: str = "",
    path: str = TEST_SET_PATH_SYNAPSE,
):
    """
    Extract all relevant fields and append one row to the test set CSV.

    Args:
        company: Company name
        query: ESG query/claim topic
        serialized_docs: Full serialized retrieval string passed to LLM
        result: Parsed JSON dict from LLM output
        raw_llm_output: Raw string response from LLM (before JSON parsing)
        path: Path to CSV file
    """
    init_test_set(path)

    company_report_text = extract_text_by_tag(serialized_docs, "COMPANY_REPORT")
    counterfactual_text = extract_text_by_tag(serialized_docs, "EXTERNAL_SOURCE_COUNTERFACTUAL")
    supportive_text = extract_text_by_tag(serialized_docs, "EXTERNAL_SOURCE_SUPPORTIVE")
    rouge_reference = build_rouge_reference(serialized_docs)

    row = {
        "company": company,
        "query": query,
        "company_report_text": company_report_text,
        "counterfactual_text": counterfactual_text,
        "supportive_text": supportive_text,
        "company_claim_summary": result.get("company_claim_summary", ""),
        "object_property": result.get("object_property", ""),
        "judgment": result.get("judgment", ""),
        "greenwashing_status": result.get("greenwashing_status", ""),
        "reason_for_judgement": result.get("reason_for_judgement", ""),
        "summary_support_evidence": result.get("summary_support_evidence", ""),
        "summary_counter_evidence": result.get("summary_counter_evidence", ""),
        "rouge_reference": rouge_reference,
        "timestamp": datetime.now().isoformat(),
        "raw_llm_output": raw_llm_output,
    }

    with open(path, "a", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=COLUMNS)
        writer.writerow(row)

    print(f"[TestSet] Saved row → company={company}, query={query}, judgment={result.get('judgment','?')}")
    return row

# baseline save 
def save_to_test_set_baseline(
    company: str,
    query: str,
    result: dict,
    raw_llm_output: str = "",
    path: str = TEST_SET_BASELINE_PATH,
):
    """
    Extract all relevant fields and append one row to the test set CSV.

    Args:
        company: Company name
        query: ESG query/claim topic
        serialized_docs: Full serialized retrieval string passed to LLM
        result: Parsed JSON dict from LLM output
        raw_llm_output: Raw string response from LLM (before JSON parsing)
        path: Path to CSV file
    """
    init_test_set(path)

    row = {
        "company": company,
        "query": query,
        "company_claim_summary": result.get("company_claim_summary", ""),
        "object_property": result.get("object_property", ""),
        "judgment": result.get("judgment", ""),
        "greenwashing_status": result.get("greenwashing_status", ""),
        "reason_for_judgement": result.get("reason_for_judgement", ""),
        "summary_support_evidence": result.get("summary_support_evidence", ""),
        "summary_counter_evidence": result.get("summary_counter_evidence", ""),
        "timestamp": datetime.now().isoformat(),
        "raw_llm_output": raw_llm_output,
    }

    with open(path, "a", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=COLUMNS)
        writer.writerow(row)

    print(f"[TestSet] Saved row → company={company}, query={query}, judgment={result.get('judgment','?')}")
    return row

# vanilla rag save 
def save_to_test_vanillaRag(
    company: str,
    query: str,
    serialized_docs: str,
    result: dict,
    raw_llm_output: str = "",
    path: str = TEST_SET_PATH,
):
    """
    Extract all relevant fields and append one row to the test set CSV.

    Args:
        company: Company name
        query: ESG query/claim topic
        serialized_docs: Full serialized retrieval string passed to LLM
        result: Parsed JSON dict from LLM output
        raw_llm_output: Raw string response from LLM (before JSON parsing)
        path: Path to CSV file
    """
    init_test_set(path)
    documents = extract_text_by_tag(serialized_docs, "DOCUMENT")
    rouge_reference = build_rouge_reference(serialized_docs)

    row = {
        "company": company,
        "query": query,
        "documents": documents,
        "company_claim_summary": result.get("company_claim_summary", ""),
        "object_property": result.get("object_property", ""),
        "judgment": result.get("judgment", ""),
        "greenwashing_status": result.get("greenwashing_status", ""),
        "reason_for_judgement": result.get("reason_for_judgement", ""),
        "summary_evidence": result.get("summary_evidence", ""),
        "rouge_reference": rouge_reference,
        "timestamp": datetime.now().isoformat(),
        "raw_llm_output": raw_llm_output,
    }

    with open(path, "a", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=COLUMNS_VANILLA_RAG)
        writer.writerow(row)

    print(f"[TestSet] Saved row → company={company}, query={query}, judgment={result.get('judgment','?')}")
    return row


# counterfactual rag
def save_to_test_counterfactualRAG(
    company: str,
    query: str,
    serialized_docs: str,
    result: dict,
    raw_llm_output: str = "",
    path: str = TEST_SET_PATH,
):
    """
    Extract all relevant fields and append one row to the test set CSV.

    Args:
        company: Company name
        query: ESG query/claim topic
        serialized_docs: Full serialized retrieval string passed to LLM
        result: Parsed JSON dict from LLM output
        raw_llm_output: Raw string response from LLM (before JSON parsing)
        path: Path to CSV file
    """
    init_test_set(path)

    company_report_text = extract_text_by_tag(serialized_docs, "COMPANY_REPORT")
    counterfactual_text = extract_text_by_tag(serialized_docs, "EXTERNAL_SOURCE_COUNTERFACTUAL")
    supportive_text = extract_text_by_tag(serialized_docs, "EXTERNAL_SOURCE_SUPPORTIVE")
    rouge_reference = build_rouge_reference(serialized_docs)

    row = {
        "company": company,
        "query": query,
        "company_report_text": company_report_text,
        "counterfactual_text": counterfactual_text,
        "supportive_text": supportive_text,
        "company_claim_summary": result.get("company_claim_summary", ""),
        "judgment": result.get("judgment", ""),
        "greenwashing_status": result.get("greenwashing_status", ""),
        "reason_for_judgement": result.get("reason_for_judgement", ""),
        "summary_support_evidence": result.get("summary_support_evidence", ""),
        "summary_counter_evidence": result.get("summary_counter_evidence", ""),
        "rouge_reference": rouge_reference,
        "timestamp": datetime.now().isoformat(),
        "raw_llm_output": raw_llm_output,
    }

    with open(path, "a", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=COLUMNS_COUNTER_RAG)
        writer.writerow(row)

    print(f"[TestSet] Saved row → company={company}, query={query}, judgment={result.get('judgment','?')}")
    return row

# ─────────────────────────────────────────────
# ROUGE scoring helper (batch over saved CSV)
# ─────────────────────────────────────────────

def compute_rouge_for_test_set(path: str = TEST_SET_PATH_SYNAPSE):
    """
    Load the saved test set CSV and compute ROUGE scores
    (prediction = concatenated LLM output fields, reference = rouge_reference).
    """
    from evaluate import load as load_metric
    rouge = load_metric("rouge")

    predictions = []
    references = []

    with open(path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            pred = " ".join([
                row.get("company_claim_summary", ""),
                row.get("summary_counter_evidence", ""),
                row.get("summary_support_evidence", ""),
                row.get("reason_for_judgement", ""),
            ])
            ref = row.get("rouge_reference", "")
            if pred.strip() and ref.strip():
                predictions.append(pred)
                references.append(ref)

    if not predictions:
        print("[ROUGE] No valid rows found in test set.")
        return {}

    results = rouge.compute(predictions=predictions, references=references)
    print(f"\n[ROUGE] Scores over {len(predictions)} samples:")
    for k, v in results.items():
        print(f"  {k}: {float(v):.4f}")
    return results