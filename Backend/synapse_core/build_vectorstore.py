# -----------------------------
# Instructions:
# run onece:
# python build_vectorstore.py
# -----------------------------

import os
import pandas as pd
from dotenv import load_dotenv

from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.document_loaders import DataFrameLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS

load_dotenv()

#  prevent accidental overwrite
if os.path.exists("faiss_index"):
    print("FAISS index already exists. Delete folder to rebuild.")
    exit()

# -----------------------------
# Embeddings
# -----------------------------
embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2",
    encode_kwargs={"normalize_embeddings": True}
)

# -----------------------------
# Load Dataset
# -----------------------------
csv_path = "../DataPreprocessing/Dataset/processed/semantic_extraction/esg_final_enriched.csv"

df = pd.read_csv(csv_path)

# Build text field
df["text"] = (
    "Company: " + df["company"].astype(str) + "\n"
    + "Date: " + df["date"].astype(str) + "\n"
    + "Title: " + df["title"].astype(str) + "\n"
    + "URL: " + df["url"].astype(str) + "\n"
    + "Article: " + df["sentence"].astype(str) + "\n"
    + "ESG Topic: " + df["esg_topic"].astype(str) + "\n"
    + "Pillar: " + df["pillar"].astype(str) + "\n"
    + "Category: " + df["category"].astype(str)
)

loader = DataFrameLoader(df, page_content_column="text")
docs = loader.load()

# Attach metadata
for i, doc in enumerate(docs):
    doc.metadata = {
        "company": df.iloc[i]["company"].lower().strip(),
        "title": df.iloc[i]["title"],
        "date": df.iloc[i]["date"],
        "year": str(df.iloc[i]["date"])[:4],
        "article": df.iloc[i]["sentence"],
        "url": df.iloc[i]["url"],
    }

# -----------------------------
# Split Documents
# -----------------------------
splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200
)

all_splits = splitter.split_documents(docs)

# -----------------------------
# Build FAISS Index
# -----------------------------
vector_store = FAISS.from_documents(all_splits, embeddings)

vector_store.save_local("faiss_index")

print("Vector store built successfully")
