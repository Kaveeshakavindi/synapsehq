
import os

# Both faiss-cpu and torch (pulled in transitively by the HuggingFace embeddings
# below) bundle their own copy of the OpenMP runtime (libomp) on macOS. Loading
# both in the same process trips "OMP: Error #15: Initializing libomp.dylib,
# but found libomp.dylib already initialized", and once torch's model is loaded
# alongside the large (169k-doc) FAISS index + docstore, the duplicate runtime
# corrupts faiss's thread pool and segfaults the whole process on the first
# similarity_search() call — silently killing /analyze with no traceback. Must
# be set before faiss/torch are imported anywhere in the process.
os.environ.setdefault("KMP_DUPLICATE_LIB_OK", "TRUE")
os.environ.setdefault("OMP_NUM_THREADS", "1")

from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings

embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2",
    encode_kwargs={"normalize_embeddings": True} #cosine similarity
)

vector_store = FAISS.load_local("faiss_index", embeddings, allow_dangerous_deserialization=True)

# ------------------------------------
# Supportive documents retrieval
# ------------------------------------
def generate_supportive_query(query: str, company: str) -> str:
    return (
        f"{company} {query} : commitment excellence positive recognition "
        f"{company} {query} : sustainability award praised "
        f"industry accolade certification third-party validation "
        f"news article positive review highlights achievements "
        f"successful initiatives community impact "
        f"approval endorsements"
    )

# ------------------------------------
# Counterfactual documents retrieval
# ------------------------------------
def generate_counterfactual_query(query: str, company: str) -> str:
    return (
        f"{company} {query} : allegations fraud misleading contradicts "
        f"{company} {query} : negative report exposes "
        f"lawsuit investigation regulatory violation independent audit "
        f"third-party report news article dispute false claims"
    )

# ------------------------------------
# Main retrieval function
# ------------------------------------
def retrieve_context(query: str, company: str):
    print("p-1")
    # normalize company name
    company = company.lower().strip()
    print("p-2")
    # retrieve company reports that contain "sustainability report" or "annual report"
    company_docs_sustainability = vector_store.similarity_search(
        query=f"{company} sustainability report {query}",
        k=5,
        filter={"company": company}
    )
    print("p-3")
    company_docs_annual = vector_store.similarity_search(
        query=f"{company} annual report {query}",
        k=5,
        filter={"company": company}
    )
    print("p-4")
    if len(company_docs_sustainability) > 1:
        company_docs = company_docs_sustainability 
    else:
        company_docs = company_docs_annual
    print("p-5")
    # counterfactual docs - get more and filter out sustainability reports
    cf_query = generate_counterfactual_query(query, company)
    print("p-6")
    all_cf_docs = vector_store.similarity_search(cf_query, k=10)
    print("p-7")
    # filter out sustainability reports by title
    counterfactual_docs = [
        d for d in all_cf_docs 
        if "sustainability report" not in d.metadata.get('title', '').lower() and "annual report" not in d.metadata.get('title', '').lower()
    ][:2]
    print("p-8")
    # SUPPORTIVE docs - get more and filter out sustainability reports
    sp_query = generate_supportive_query(query, company)
    all_sp_docs = vector_store.similarity_search(sp_query, k=10)
    print("p-9")
     # filter out sustainability reports by title
    supportive_docs = [
        d for d in all_sp_docs
        if "sustainability report" not in d.metadata.get('title', '').lower() and "annual report" not in d.metadata.get('title', '').lower()
    ][:2]
    print("p-10")
    # serialize for LLM
    serialized = "\n\n".join(
        [
            f"[COMPANY_REPORT]\nTitle: {d.metadata.get('title', 'NP')}, Year: {d.metadata.get('year', 'NP')}\nCompany: {d.metadata.get('company', 'NP')}\nDate: {d.metadata.get('date', 'NP')}\n{d.page_content[:800]}"
            for d in company_docs
        ]
        +
        [
            f"[EXTERNAL_SOURCE_COUNTERFACTUAL]\nTitle: {d.metadata.get('title', 'NP')}, Year: {d.metadata.get('year', 'NP')}\nCompany: {d.metadata.get('company', 'NP')}\nDate: {d.metadata.get('date', 'NP')}\n{d.page_content[:800]}"
            for d in counterfactual_docs
        ]
        +
        [
            f"[EXTERNAL_SOURCE_SUPPORTIVE]\nTitle: {d.metadata.get('title', 'NP')}, Year: {d.metadata.get('year', 'NP')}\nCompany: {d.metadata.get('company', 'NP')}\nDate: {d.metadata.get('date', 'NP')}\n{d.page_content[:800]}"
            for d in supportive_docs
        ]
    )
    print("p-11")
    return serialized, company_docs, counterfactual_docs, supportive_docs
