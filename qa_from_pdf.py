from langchain_ollama import ChatOllama
from langchain_community.embeddings import OllamaEmbeddings
from langchain_community.vectorstores import FAISS

# Load vector DB
embeddings = OllamaEmbeddings(model="llama3")
vectorstore = FAISS.load_local("faiss_index", embeddings, allow_dangerous_deserialization=True)

# LLM
llm = ChatOllama(model="llama3", temperature=0)

# Ask question
query = "What is this document about?"
docs = vectorstore.similarity_search(query, k=3)

context = "\n\n".join([doc.page_content for doc in docs])

prompt = f"""
Answer the question using ONLY the context below.

Context:
{context}

Question:
{query}
"""

response = llm.invoke(prompt)
print(response.content)
