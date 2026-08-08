import json
from synapse_core.ontologyInfo import get_ontology_info
from synapse_core.retrieval import retrieve_context
from owlready2 import *
from synapse_core.prompt import system_prompt, guardrails, prompt_template, examples
from Evaluation.eval_prompts import guardrails
from synapse_core.llm import chat_model
import math
from app.models.analysis import AnalyzeResponse, RetrievedDocuments

def citations(docs):
    output = []

    for d in docs:
        url = d.metadata.get("url")

        # convert NaN → None
        if isinstance(url, float) and math.isnan(url):
            url = None

        # Matches app/models/analysis.py's Citation schema (source/content/score/
        # metadata) — the frontend renders exactly those keys and silently drops
        # any citation missing both source and content.
        output.append({
            "source": url or d.metadata.get("title"),
            "content": d.page_content[:500] if d.page_content else None,
            "score": None,
            "metadata": {
                "title": d.metadata.get("title"),
                "company": d.metadata.get("company"),
                "date": d.metadata.get("date"),
                "year": d.metadata.get("year"),
                "article": d.metadata.get("article"),
                "url": url,
            },
        })

    return output

def evaluate_claim(query: str, company: str):
    """Evaluate a company ESG claim and auto-save to test_set.csv."""
    print("hit -1")
    # ── 1. Retrieve context ──────────────────────────────────────────────────
    serialized_docs, company_docs, counterfactual_docs, supportive_docs = retrieve_context(query, company)
    # serialized_docs, docs = vanilla_retrieve_context(query, company)
    print("hit -1.1")
    # Aggregate serialized docs into a single string
    if isinstance(serialized_docs, list):
        serialized_docs = "\n\n".join(serialized_docs)

    # ── 2. Load ontology ─────────────────────────────────────────────────────
    print("hit -1.2")
    ontology_path = "ontology.owl"
    print("hit -1.3")
    onto = get_ontology(ontology_path).load()
    print("hit -1.4")
    ontology_info = get_ontology_info(onto)
    print("hit -2")
    # ── 3. Build prompt  without RAG and ontology──────────────────────────────────────────────────────
    # final_prompt = f"""
    # System: {baseline_system_prompt}

    # Instructions:
    # {baseline_prompt_template.format(company=company, query=query)}

    #     Guardrails:
    # {guardrails}
    #     """

#     # ── 3. Build prompt ──────────────────────────────────────────────────────
    final_prompt = f"""
        System: {system_prompt}

        Documents:
    {serialized_docs}

        Examples:
    {examples}

        Instructions:
    {prompt_template.format(company=company, query=query, ontology=ontology_info)}

        Guardrails:
    {guardrails}
    """
    print(final_prompt)

    # ── 4. Call LLM ──────────────────────────────────────────────────────────
    response = chat_model.invoke(final_prompt)
    raw_output = response.content if hasattr(response, "content") else str(response)

    # ── 5. Parse JSON ────────────────────────────────────────────────────────
    result: dict = {}
    try:
        result = json.loads(raw_output)
    except json.JSONDecodeError:
        for fence in ["```json", "```"]:
            if fence in raw_output:
                start = raw_output.find(fence) + len(fence)
                end = raw_output.find("```", start)
                try:
                    result = json.loads(raw_output[start:end].strip())
                    break
                except json.JSONDecodeError:
                    pass
        if not result:
            # Return early with an error-shaped AnalyzeResponse instead of falling through
            return AnalyzeResponse(error="Failed to parse JSON", raw_content=raw_output)

    # Unwrap "result" key if LLM wraps output like {"result": {...}}
    if "result" in result and isinstance(result["result"], dict):
        result = result["result"]

    # ── 6. Always attach retrieved documents as citations (Synapse) ──────────
    retrieved_documents = RetrievedDocuments(
        company_reports=citations(company_docs),
        counterfactual_sources=citations(counterfactual_docs),
        supportive_sources=citations(supportive_docs),
    )

    # ── 7. Auto-save to test set CSV (unchanged, commented out) ──────────────
    # save_to_test_set(...)

    print(result)

    # ── 8. Build validated response ───────────────────────────────────────────
    return AnalyzeResponse(
        **result,
        retrieved_documents=retrieved_documents,
    )
# ─────────────────────────────────────────────────────────────────────────────
# Run ROUGE over the full saved test set at any time:
#   from evaluate_claim import compute_rouge_for_test_set
#   compute_rouge_for_test_set()
# ─────────────────────────────────────────────────────────────────────────────
