from langchain_community.vectorstores import FAISS

from langchain_community.embeddings import HuggingFaceEmbeddings

embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2",
    encode_kwargs={"normalize_embeddings": True} #cosine similarity
)

vector_store = FAISS.load_local("faiss_index", embeddings, allow_dangerous_deserialization=True)

# ------------------------------------
# Main retrieval function
# ------------------------------------
def vanilla_retrieve_context(query: str, company: str):

    # normalize company name
    company = company.lower().strip()

    # retrieve company reports that contain "sustainability report" or "annual report"
    docs = vector_store.similarity_search(
        query=f"{query}",
        k=5,
        filter={"company": company}
    )
   

    # serialize for LLM
    serialized = "\n\n".join(
        [
            f"[DOCUMENT]\nTitle: {d.metadata.get('title', 'NP')}, Year: {d.metadata.get('year', 'NP')}\nCompany: {d.metadata.get('company', 'NP')}\nDate: {d.metadata.get('date', 'NP')}\n{d.page_content[:800]}"
            for d in docs
        ]
    )

    return serialized, docs