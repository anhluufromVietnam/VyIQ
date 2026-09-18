# --- FastAPI app with SQLAlchemy and auto-thumbnail generation ---


from fastapi import FastAPI, UploadFile, File, Form, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import create_engine, Column, Integer, String, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from typing import Optional, List
from pydantic import BaseModel
import os
import shutil
import PyPDF2
import pandas as pd
from docx import Document as DocxDocument
from moviepy import VideoFileClip
from PIL import Image
from datetime import datetime
import ollama
from openai import OpenAI as OpenAIClient
import json  # <--- ĐẢM BẢO CÓ DÒNG NÀY Ở ĐÂY
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

import uuid


#EMBEDDINg SH
# Login into Hugging Face Hub
from huggingface_hub import login
#login()
from huggingface_hub import snapshot_download


# Tải mô hình từ Hugging Face về thư mục cục bộ
model_id = "google/embeddinggemma-300M"
local_dir = "./embeddinggemma-300M"

print(f"Đang tải mô hình {model_id}...")
snapshot_download(repo_id=model_id, local_dir=local_dir) #del sau lần đầu
print(f"Hoàn tất! Mô hình đã được lưu tại: {local_dir}")


import torch
from sentence_transformers import SentenceTransformer

# 1. CẤU HÌNH CHẾ ĐỘ OFFLINE (Ngăn không cho code gọi lên mạng)
os.environ['TRANSFORMERS_OFFLINE'] = "1"
os.environ['HF_HUB_OFFLINE'] = "1"


app = FastAPI()


# 2. KIỂM TRA THIẾT BỊ (Ưu tiên MPS cho Mac Mini)
if torch.cuda.is_available():
    device = "cuda"
elif torch.backends.mps.is_available():
    device = "mps"
else:
    device = "cpu"

# 3. LOAD MODEL TỪ THƯ MỤC CỤC BỘ
# Đường dẫn trỏ trực tiếp vào thư mục bạn đã tải về ở Bước 1
model_path = "./embeddinggemma-300M"

print(f"--- Đang khởi tạo Model từ: {model_path} ---")
try:
    # Load model và đẩy thẳng vào MPS/GPU
    model = SentenceTransformer(model_path).to(device)
    
    print(f"Thiết bị đang sử dụng: {model.device}")
    total_params = sum([p.numel() for p in model.parameters()])
    print(f"Tổng số tham số: {total_params:,}")
    print("--- Model đã sẵn sàng chạy Offline! ---")
except Exception as e:
    print(f"LỖI LOAD MODEL: Hãy chắc chắn bạn đã chạy script tải model về thư mục {model_path}")
    print(f"Chi tiết lỗi: {e}")
#-------------------------

from fastapi.staticfiles import StaticFiles

class NoCacheStaticFiles(StaticFiles):
    async def get_response(self, path, scope):
        response = await super().get_response(path, scope)
        if isinstance(response, FileResponse):
            response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
            response.headers["Pragma"] = "no-cache"
            response.headers["Expires"] = "0"
        return response

app.mount("/project_files", NoCacheStaticFiles(directory="project_files"), name="project_files")
# Serve everything under project_files as static
#app.mount("/project_files", StaticFiles(directory="project_files"), name="project_files")


origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Database setup ---
DATABASE_URL = "sqlite:///./projects.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- 3. Models (Kế thừa từ Base đã có) ---
class ChatHistory(Base):
    __tablename__ = "chat_history"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String) # <--- THÊM CỘT NÀY
    project_id = Column(Integer)
    timestamp = Column(String)
    question = Column(String)
    answer = Column(String)
    provider = Column(String)
    model_name = Column(String)

# --- Models ---
class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    tag = Column(String)
    description = Column(String)
    video_path = Column(String, nullable=True)
    document_path = Column(String, nullable=True)
    accuracy = Column(Float, default=0.0)
    status = Column(String, default="draft")
    thumbnail = Column(String, nullable=True)



class SystemConfig(Base):
    __tablename__ = "system_config"
    id = Column(Integer, primary_key=True, index=True)
    provider = Column(String, default="ollama")
    openai_api_key = Column(String, nullable=True)
    model_name = Column(String, default="qwen3:0.6b") # Khuyến nghị bản 7b để đọc bảng tốt hơn

Base.metadata.create_all(bind=engine)
# --- Schemas ---
class ProjectSchema(BaseModel):
    id: int
    name: str
    tag: str
    description: str
    video_path: Optional[str] = None
    document_path: Optional[str] = None
    accuracy: float
    status: str
    thumbnail: Optional[str] = None

    class Config:
        orm_mode = True
        

# --- Helper ---
def generate_thumbnail(video_path: str, thumb_path: str):
    try:
        clip = VideoFileClip(video_path)
        frame = clip.get_frame(1.0)
        image = Image.fromarray(frame)
        image.save(thumb_path)
        return thumb_path
    except Exception as e:
        print(f"Thumbnail generation failed: {e}")
        return None

# --- Routes ---
@app.get("/projects", response_model=List[ProjectSchema])
def get_projects():
    db = SessionLocal()
    projects = db.query(Project).all()
    return projects
    
from fastapi import HTTPException

@app.post("/projects/{project_id}/upload_video")
def upload_video(project_id: int, file: UploadFile = File(...)):
    db = SessionLocal()
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    project_dir = f"project_files/{project.id}/video"
    os.makedirs(project_dir, exist_ok=True)
    video_path = f"{project_dir}/{file.filename}"

    with open(video_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    project.video_path = video_path

    # thumbnail auto tạo
    try:
        from moviepy import VideoFileClip
        thumbnail_path = f"project_files/{project.id}/thumb.jpg"
        clip = VideoFileClip(video_path)
        clip.save_frame(thumbnail_path, t=1.0)
        project.thumbnail = thumbnail_path
    except Exception as e:
        print("Thumbnail generation failed:", e)

    db.commit()
    return {"message": "Video uploaded", "path": video_path}
    
@app.post("/projects/{project_id}/upload_doc")
def upload_doc(project_id: int, file: UploadFile = File(...)):
    db = SessionLocal()
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    docs_dir = f"project_files/{project.id}/docs"
    os.makedirs(docs_dir, exist_ok=True)
    doc_path = f"{docs_dir}/{file.filename}"

    with open(doc_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    project.document_path = doc_path
    db.commit()
    rebuild(project_id)
    return {"message": "Document uploaded", "path": doc_path}


@app.post("/projects")
def create_project(
    name: str = Form(...),
    tag: str = Form(...),
    description: str = Form(...),
    status: str = Form("draft"),
    accuracy: float = Form(0.0),
    video: Optional[UploadFile] = File(None),
    document: Optional[UploadFile] = File(None),
):
    db = SessionLocal()
    new_project = Project(name=name, tag=tag, description=description, status=status, accuracy=accuracy)
    db.add(new_project)
    db.commit()
    db.refresh(new_project)

    project_dir = f"project_files/{new_project.id}"
    os.makedirs(f"{project_dir}/video", exist_ok=True)
    os.makedirs(f"{project_dir}/docs", exist_ok=True)
    os.makedirs(f"{project_dir}/log", exist_ok=True)

    if video:
        video_path = f"{project_dir}/video/{video.filename}"
        with open(video_path, "wb") as f:
            shutil.copyfileobj(video.file, f)
        new_project.video_path = video_path

        # Generate thumbnail
        thumb_path = f"{project_dir}/video/thumbnail.jpg"
        thumb = generate_thumbnail(video_path, thumb_path)
        if thumb:
            new_project.thumbnail = thumb

    if document:
        doc_path = f"{project_dir}/docs/{document.filename}"
        with open(doc_path, "wb") as f:
            shutil.copyfileobj(document.file, f)
        new_project.document_path = doc_path

    db.commit()
    db.refresh(new_project)
    return JSONResponse(content={"message": "Project created", "id": new_project.id})

@app.get("/projects/{project_id}/thumbnail")
def get_thumbnail(project_id: int):
    db = SessionLocal()
    project = db.query(Project).filter(Project.id == project_id).first()
    if project and project.thumbnail and os.path.exists(project.thumbnail):
        return FileResponse(project.thumbnail, media_type="image/jpeg")
    return JSONResponse(content={"error": "Thumbnail not found"}, status_code=404)

@app.get("/projects/{project_id}", response_model=ProjectSchema)
def get_project(project_id: int):
    db = SessionLocal()
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

from docx import Document as DocxDocument

@app.get("/projects/{project_id}/doc_text")
def get_document_text(project_id: int):
    db = SessionLocal()
    project = db.query(Project).filter(Project.id == project_id).first()

    if not project or not project.document_path:
        raise HTTPException(status_code=404, detail="Document not found")

    doc_path = project.document_path
    ext = os.path.splitext(doc_path)[-1].lower()

    try:
        if ext == ".docx":
            doc = DocxDocument(doc_path)
            text = "\n".join([para.text for para in doc.paragraphs])

        elif ext == ".txt" or ext == ".md":
            with open(doc_path, "r", encoding="utf-8") as f:
                text = f.read()

        elif ext == ".pdf":
            with open(doc_path, "rb") as f:
                reader = PyPDF2.PdfReader(f)
                text = "\n".join(page.extract_text() or "" for page in reader.pages)

        elif ext == ".csv":
            df = pd.read_csv(doc_path)
            text = df.to_string(index=False)

        else:
            raise HTTPException(status_code=415, detail=f"Unsupported document format: {ext}")

        return {"content": text}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read document: {e}")
        
        
@app.delete("/projects/{project_id}")
def delete_project(project_id: int):
    db = SessionLocal()
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Delete files on disk
    project_dir = f"project_files/{project.id}"
    if os.path.exists(project_dir):
        shutil.rmtree(project_dir)

    # Delete from database
    db.delete(project)
    db.commit()

    return {"message": f"Project {project_id} deleted successfully"}


@app.post("/projects/{project_id}/save_doc")
async def save_document(project_id: int, request: Request):
    data = await request.json()
    content = data.get("content")

    db = SessionLocal()
    project = db.query(Project).filter(Project.id == project_id).first()

    if not project or not project.document_path:
        raise HTTPException(status_code=404, detail="Document not found")

    doc_path = project.document_path
    ext = os.path.splitext(doc_path)[-1].lower()

    try:
        if ext == ".docx":
            doc = DocxDocument()
            for line in content.splitlines():
                doc.add_paragraph(line)
            doc.save(doc_path)

        elif ext in [".txt", ".md"]:
            with open(doc_path, "w", encoding="utf-8") as f:
                f.write(content)

        elif ext == ".csv":
            # Save each line as a new row in a one-column CSV
            lines = content.strip().splitlines()
            df = pd.DataFrame({"content": lines})
            df.to_csv(doc_path, index=False)

        else:
            raise HTTPException(status_code=415, detail=f"Unsupported document format: {ext}")

        return {"message": f"Document saved successfully as {ext}"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save document: {e}")

# LLM WORK
# --- LLM and Embedding Configuration ---

# 1. Hàm chia nhỏ văn bản (Nhận vào một String thay vì filepath)
def chunk_text(text_content, chunk_size=600, overlap=100):
    """
    Chia nhỏ văn bản thông minh: Ưu tiên ngắt tại dòng mới hoặc dấu câu 
    để không làm vỡ cấu trúc bảng biểu hoặc câu văn.
    """
    if not text_content:
        return []

    chunks = []
    start = 0
    text_len = len(text_content)

    while start < text_len:
        # Xác định điểm kết thúc dự kiến
        end = min(start + chunk_size, text_len)
        
        # Nếu chưa đến cuối văn bản, tìm điểm ngắt đẹp (dấu xuống dòng hoặc dấu chấm)
        if end < text_len:
            # Ưu tiên ngắt tại dòng mới (\n) để giữ nguyên hàng của bảng
            last_newline = text_content.rfind('\n', start, end)
            if last_newline != -1 and last_newline > start + (chunk_size // 2):
                end = last_newline
            else:
                # Nếu không có dòng mới, tìm dấu chấm để tránh cắt ngang câu
                last_period = text_content.rfind('. ', start, end)
                if last_period != -1 and last_period > start + (chunk_size // 2):
                    end = last_period + 1

        chunk = text_content[start:end].strip()
        if chunk:
            chunks.append(chunk)
            
        # Dịch chuyển start cho đoạn kế tiếp (có tính overlap)
        # Nếu đã ở cuối văn bản, thoát vòng lặp
        if end >= text_len:
            break
            
        start = end - overlap
        
        # Đảm bảo start luôn tăng lên để tránh vòng lặp vô hạn
        if start >= end:
            start = end + 1
            
    return chunks

# 2. Hàm truy xuất (Retrieval)
def retrieve_documents(query, document_chunks, document_embeddings, top_k=3):
    # Embed câu hỏi của user bằng 'Retrieval-query'
    query_embedding = model.encode(query, prompt_name="Retrieval-query", convert_to_tensor=True, device=device)

    # Tính toán Cosine Similarity
    # Đưa về numpy để dùng sklearn
    similarities = cosine_similarity(
        query_embedding.cpu().numpy().reshape(1, -1),
        document_embeddings.cpu().numpy()
    )

    # Lấy top_k kết quả cao nhất
    top_k_indices = np.argsort(similarities[0])[::-1][:top_k]
    retrieved_chunks = [document_chunks[i] for i in top_k_indices]
    return retrieved_chunks

def rebuild(id_of):
    doc_res = get_document_text(id_of)
    print(doc_res)
    # 2. String chứa nội dung tài liệu của bạn (Thay thế nội dung file DOCX bằng biến này)
    full_text_string = doc_res.get("content", "")

    # 3. Thực hiện chia nhỏ văn bản
    print("Đang chia nhỏ văn bản từ chuỗi ký tự...")
    document_chunks = chunk_text(full_text_string, chunk_size=500, overlap=50)
    print(f"Đã tạo {len(document_chunks)} đoạn văn bản.")

    # 4. Tạo embedding cho các đoạn văn bản (Dùng model và device bạn đã config ở trên)
    print("Đang tạo embedding cho các đoạn văn bản...")
    # Sử dụng prompt_name="Retrieval-document" theo khuyến nghị của Gemma
    document_embeddings = model.encode(
        document_chunks,
        prompt_name="Retrieval-document",
        convert_to_tensor=True,
        device=device
    )
    print(f"Kích thước embedding tài liệu: {document_embeddings.shape}")

# Session memory
chat_sessions = {}
# --- Cập nhật Endpoint /ask ---
@app.post("/projects/{project_id}/ask")
async def ask_question(project_id: int, request: Request):
    db = SessionLocal()
    sys_config = db.query(SystemConfig).first()
    if not sys_config:
        sys_config = SystemConfig(provider="ollama", model_name="qwen3:0.6b")
    
    data = await request.json()
    
    # 1. Lấy dữ liệu từ Frontend
    question = data.get("question")
    
    # LOGIC MỚI: Nếu không có session_id gửi lên, tạo một session hoàn toàn mới dựa trên timestamp
    # Điều này giúp tách biệt các cuộc hội thoại thay vì dùng chung "default_session"
    incoming_session_id = data.get("session_id")
    if not incoming_session_id or incoming_session_id == "default_session":
        session_id = f"session_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    else:
        session_id = incoming_session_id

    provider = data.get("provider") or sys_config.provider
    model_name = data.get("model") or sys_config.model_name

    # 2. KHÔI PHỤC LỊCH SỬ TỪ LOG FILE (Để AI nhớ được ngữ cảnh trong CÙNG 1 session)
    history_for_ai = []
    log_dir = f"chat_logs/project_{project_id}"
    file_path = os.path.join(log_dir, f"{session_id}.json")

    if os.path.exists(file_path):
        with open(file_path, "r", encoding="utf-8") as f:
            try:
                session_log = json.load(f)
                for turn in session_log.get("chat_history", []):
                    history_for_ai.append({"role": "user", "content": turn["question"]})
                    history_for_ai.append({"role": "assistant", "content": turn["answer"]})
            except:
                pass

    # 3. Chuẩn bị ngữ cảnh RAG
    #doc_res = get_document_text(project_id)
    #local_context = doc_res.get("content", "")
    
    
    # 6. Sử dụng thực tế
    #user_question = input("Vui lòng nhập câu hỏi của bạn: ")
    #print(f"\nCâu hỏi của bạn: {user_question}")
    doc_res = get_document_text(project_id)
    print(doc_res)
    # 2. String chứa nội dung tài liệu của bạn (Thay thế nội dung file DOCX bằng biến này)
    full_text_string = doc_res.get("content", "")
    
    
    document_chunks = chunk_text(full_text_string, chunk_size=500, overlap=50)
    
        # Sử dụng prompt_name="Retrieval-document" theo khuyến nghị của Gemma
    document_embeddings = model.encode(
        document_chunks,
        prompt_name="Retrieval-document",
        convert_to_tensor=True,
        device=device
    )
    retrieved_info = retrieve_documents(question, document_chunks, document_embeddings, top_k=2)
    print("DEBUG RAG: ")
    print(retrieved_info)
    current_year = datetime.now().year



    # 4. Xây dựng Payload messages
    system_instruction ={
        "role": "system",
        "content": f"""
            /no_think You are an AI assistant developed by the Swinburne Vietnam Innovation Lab. Always provide accurate, polite, clear, and concise answers in English. If relevant information is available in the provided documents, ensure your responses are based strictly on that information {retrieved_info}f  .\n /no_think
            
    """
    }
    
    
    #system_instruction["content"] = "/no_think " + system_instruction["content"] + " /no_think "

    payload_messages = [system_instruction] + history_for_ai + [{"role": "user", "content": question}]

    try:
        # 5. Gọi AI
        if provider == "openai":
            client = OpenAIClient(api_key=sys_config.openai_api_key)
            response = client.chat.completions.create(model=model_name, messages=payload_messages)
            answer = response.choices[0].message.content
        else:
            response = ollama.chat(
                model=model_name,
                messages=payload_messages,
                options={
                "temperature": 0.1,       # (Quan trọng) Đưa về 0 để câu trả lời mang tính xác định, ít suy luận vòng vo
                "top_k": 20,              # Chỉ lấy các lựa chọn từ ngữ hàng đầu
                "top_p": 0.2             # Giảm sự đa dạng của từ ngữ để đi thẳng vào vấn đề
                }
            )
            answer = response['message']['content']
            

        # 6. LOGIC LƯU TRỮ (DATABASE & JSON)
        now = datetime.now()
        timestamp_str = now.strftime("%Y-%m-%d %H:%M:%S")
        
        # A. Ghi log vào DB kèm Session_ID
        history_entry = ChatHistory(
            project_id=project_id,
            session_id=session_id, # <--- Lưu ID session vào DB
            timestamp=timestamp_str,
            question=question,
            answer=answer,
            provider=provider,
            model_name=model_name
        )
        db.add(history_entry)
        db.commit()

        # B. Cập nhật file JSON hội thoại (Append vào history của session đó)
        os.makedirs(log_dir, exist_ok=True)
        new_turn = {
            "timestamp": now.isoformat(),
            "question": question,
            "answer": answer
        }

        if os.path.exists(file_path):
            with open(file_path, "r", encoding="utf-8") as f:
                try:
                    session_data = json.load(f)
                except:
                    session_data = {"session_id": session_id, "chat_history": []}
        else:
            session_data = {"session_id": session_id, "chat_history": []}

        session_data["chat_history"].append(new_turn)

        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(session_data, f, ensure_ascii=False, indent=4)

    except Exception as e:
        answer = f"Lỗi hệ thống: {str(e)}"
    
    print(answer)

    # Trả về kèm session_id để Frontend lưu lại cho lần chat tiếp theo của cùng cuộc hội thoại
    return {
        "answer": answer,
        "session_id": session_id,
        "provider": provider,
        "model": model_name
    }
    
    
# --- Các API bổ trợ (System Config, Upload, Delete...) ---
@app.get("/system/config")
def get_config():
    db = SessionLocal()
    return db.query(SystemConfig).first() or {"provider": "ollama", "model_name": "qwen3:0.6b"}

@app.post("/system/config")
async def update_config(request: Request):
    data = await request.json()
    db = SessionLocal()
    config = db.query(SystemConfig).first() or SystemConfig()
    config.provider = data.get("provider", config.provider)
    config.openai_api_key = data.get("openai_api_key", config.openai_api_key)
    config.model_name = data.get("model_name", config.model_name)
    db.add(config); db.commit()
    return {"status": "success"}

@app.post("/projects/{project_id}/upload_multi")
async def upload_multi(files: List[UploadFile] = File(...)):
    path = "project_files/{project_id}/docs"
    os.makedirs(path, exist_ok=True)
    for file in files:
        with open(f"{path}/{file.filename}", "wb") as f:
            shutil.copyfileobj(file.file, f)
    return {"message": "Success"}

@app.get("/projects/{project_id}/doc_text")
def get_doc_text_api(project_id: int):
    return get_document_text(project_id)

# Liệt kê danh sách các file log đã lưu
@app.get("/projects/{project_id}/chat_logs")
def get_chat_log_list(project_id: int):
    log_dir = f"chat_logs/project_{project_id}"
    if not os.path.exists(log_dir):
        return []
    
    logs = []
    for filename in sorted(os.listdir(log_dir), reverse=True):
        if filename.endswith(".json"):
            logs.append(filename)
    return logs

# Tải nội dung file log cụ thể
@app.get("/projects/{project_id}/chat_logs/{filename}")
def get_log_content(project_id: int, filename: str):
    file_path = f"chat_logs/project_{project_id}/{filename}"
    if os.path.exists(file_path):
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    raise HTTPException(status_code=404, detail="Log file not found")
