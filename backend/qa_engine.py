from langchain_community.vectorstores import FAISS
from langchain_ollama import OllamaEmbeddings, OllamaLLM


def ask_question(index_id, question):
    embeddings = OllamaEmbeddings(model="llama3")
    vectorstore = FAISS.load_local(
        f"faiss_indexes/{index_id}",
        embeddings,
        allow_dangerous_deserialization=True
    )

    retriever = vectorstore.as_retriever(search_kwargs={"k": 3})
    docs = retriever.invoke(question)

    context = "\n\n".join(d.page_content for d in docs)

    llm = OllamaLLM(
        model="llama3",
        temperature=0
    )

    prompt = f"""
Answer briefly and accurately using the context below.

Context:
{context}

Question:
{question}
"""

    return llm.invoke(prompt)
