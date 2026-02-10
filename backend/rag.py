from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_ollama import OllamaEmbeddings, OllamaLLM
import tempfile
import os


def answer_question_from_pdf(pdf_file, question: str):
    # 1️⃣ Save uploaded PDF temporarily
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        content = pdf_file.file.read() if hasattr(pdf_file, 'file') else pdf_file.read()
        tmp.write(content)
        temp_path = tmp.name

    try:
        # 2️⃣ Load PDF
        loader = PyPDFLoader(temp_path)
        documents = loader.load()

        # 3️⃣ Split text - OPTIMIZED: smaller chunks, less overlap
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=300,  # Reduced from 500
            chunk_overlap=30  # Reduced from 50
        )
        chunks = splitter.split_documents(documents)

        # 4️⃣ Create embeddings - OPTIMIZED: use faster settings
        embeddings = OllamaEmbeddings(
            model="llama3"
        )

        # 5️⃣ Create FAISS (in-memory)
        vectorstore = FAISS.from_documents(chunks, embeddings)

        # 6️⃣ Retrieve relevant chunks - OPTIMIZED: only top 2 results
        retriever = vectorstore.as_retriever(
            search_kwargs={"k": 2}  # Only retrieve 2 most relevant chunks
        )
        docs = retriever.invoke(question)

        # 7️⃣ Ask LLM - OPTIMIZED: faster settings
        llm = OllamaLLM(
            model="llama3",
            temperature=0.3,  # Lower temperature for focused responses
            num_predict=100,  # Limit response length for speed (2-3 sentences)
        )

        context = "\n\n".join([doc.page_content for doc in docs])

        # Shorter, more direct prompt
        prompt = f"""Context: {context}

Question: {question}

Answer briefly:"""

        response = llm.invoke(prompt)
        return response

    finally:
        # 8️⃣ Cleanup temp file
        os.remove(temp_path)
