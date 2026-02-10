from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings import OllamaEmbeddings
from langchain_community.vectorstores import FAISS

# Load PDF
loader = PyPDFLoader("data/sample.pdf")
documents = loader.load()

# Split text
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200
)
chunks = text_splitter.split_documents(documents)

# Create embeddings
embeddings = OllamaEmbeddings(model="llama3")

# Store in FAISS
vectorstore = FAISS.from_documents(chunks, embeddings)

# Save locally
vectorstore.save_local("faiss_index")

print("Vector DB created and saved!")
