# -----------------------------
# LLM Model Setup
# ----------------------------
from langchain_ollama import ChatOllama

chat_model = ChatOllama(
    model="mistral:7b",
    temperature=0)

# chat_model = ChatOllama(
#     model="llama2:7b",
#     temperature=0)

# chat_model = ChatOllama(
#     model="llama3:8b",
#     temperature=0)
