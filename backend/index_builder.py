import uuid
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_ollama import OllamaEmbeddings
import tempfile
import os


def build_index(pdf_file):
    index_id = str(uuid.uuid4())

    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        tmp.write(pdf_file.file.read())
        pdf_path = tmp.name

    loader = PyPDFLoader(pdf_path)
    docs = loader.load()

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=800,
        chunk_overlap=100
    )
    chunks = splitter.split_documents(docs)

    embeddings = OllamaEmbeddings(model="llama3")

    vectorstore = FAISS.from_documents(chunks, embeddings)

    os.makedirs("faiss_indexes", exist_ok=True)
    vectorstore.save_local(f"faiss_indexes/{index_id}")

    os.remove(pdf_path)

    return index_id
