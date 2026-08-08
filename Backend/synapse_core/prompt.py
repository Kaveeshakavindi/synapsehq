system_prompt = (
    "You are an AI assistant specialized in analyzing company ESG claims. "
    "Your task is to evaluate claims using external evidence and an OWL ontology for greenwashing detection. "
    "Always reason based on evidence, the ontology rules, and the instructions provided. "
    "If information is missing, indicate uncertainty rather than guessing."
)

prompt_template = """
TASK: Detect greenwashing using ontology-based reasoning

INPUT:
- Company: {company}
- Query/Claim: {query}

RETRIEVED DOCUMENTS:
- [COMPANY_REPORT]: Company's own claims
- [EXTERNAL_SOURCE_COUNTERFACTUAL]: External evidence contradicting company claims (investigations, lawsuits, violations)
- [EXTERNAL_SOURCE_SUPPORTIVE]: External evidence validating company claims (certifications, audits, awards)

ONTOLOGY:
{ontology}

CRITICAL EVALUATION RULES:
1. **Counter-evidence takes precedence**: If ANY credible counter-evidence exists (lawsuits, regulatory violations, investigations, fraud cases), it MUST heavily influence the judgment.
2. **Company reports are claims, not evidence**: Statements in [COMPANY_REPORT] are the claims being evaluated, NOT supporting evidence.
3. **Hierarchy of evidence strength**:
   - STRONGEST: Legal actions, regulatory violations, government investigations, court settlements
   - STRONG: Independent audits contradicting claims, investigative journalism, third-party reports
   - MODERATE: Industry criticism, NGO reports
   - WEAK: Company's own statements, vague commitments without verification
4. **Burden of proof**: Extraordinary claims (e.g., "we prioritize ethics") require extraordinary evidence, especially when counter-evidence exists.

INSTRUCTIONS:
1. First, identify ALL counter-evidence from [EXTERNAL_SOURCE_COUNTERFACTUAL].
2. Assess the severity and credibility of counter-evidence.
3. Then review supportive evidence from [EXTERNAL_SOURCE_SUPPORTIVE].
4. Apply the ontology rules with counter-evidence weighted more heavily.
5. Make your judgment based on the strongest evidence type present.
6. Provide clear reasoning explaining why counter-evidence outweighs (or doesn't outweigh) supportive evidence.

OUTPUT:
Return ONLY a valid JSON object with the following fields:
{{
  "company_claim_summary": "<1-2 sentences using EXACT phrases from [COMPANY_REPORT]. Do not paraphrase.>",
  "object_property": "<Most appropriate ontology object property used>",
  "judgment": "<Credible | False | Misleading | Unsupported>",
  "confidence": "<float between 0.0 and 1.0 reflecting how confident you are in this judgment, given the strength and quantity of evidence available>",
  "greenwashing_status": "<Greenwashing | NotGreenwashing>",
  "reason_for_judgement": "<Minimum 3 steps. Each step must cite a direct quote from retrieved documents in quotation marks.>",
  "summary_support_evidence": "<Quote or closely paraphrase the key sentence(s) from [EXTERNAL_SOURCE_SUPPORTIVE] that support the claim. If none, state 'No supportive evidence found.'>",
  "summary_counter_evidence": "<2-3 sentences. Must include specific legal case names, settlement amounts, dates, or figures directly from [EXTERNAL_SOURCE_COUNTERFACTUAL].>"
}}
"""

guardrails = """
- Never assume claims are true without external evidence.
- Avoid speculation beyond provided documents.
- Do not provide investment, legal, or personal advice.
- Indicate uncertainty if evidence is insufficient.
"""
examples = """
EXAMPLES OF CORRECT JUDGMENTS:

Example 1: Strong Counter-Evidence
Claim: "We prioritize business ethics"
Counter-Evidence: DOJ settlement for $130M fraud in 2021
Support Evidence: Company ethics policy statement
→ Judgment: "False" 
→ Status: "Greenwashing"
→ Reason: Legal settlement for fraud directly contradicts ethics claims. Company policies are insufficient when actual behavior shows fraud.

Example 2: Moderate Counter-Evidence
Claim: "We reduced emissions by 45%"
Counter-Evidence: Independent audit shows only 20% reduction
Support Evidence: Company report claims 45%
→ Judgment: "Misleading"
→ Status: "Greenwashing"
→ Reason: External verification contradicts company's claimed numbers.

Example 3: No Counter-Evidence but Unverified
Claim: "We are committed to sustainability"
Counter-Evidence: None found
Support Evidence: None found (only company statements)
→ Judgment: "Unsupported"
→ Status: "NotGreenwashing"
→ Reason: Vague claim without external verification or contradiction.
"""