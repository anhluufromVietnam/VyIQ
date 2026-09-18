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
from openai import OpenAI
import json  # <--- ĐẢM BẢO CÓ DÒNG NÀY Ở ĐÂY

import uuid


#EMBEDDINg SH
# Login into Hugging Face Hub
#login()


app = FastAPI()



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
    provider = Column(String, default="nebius")
    openai_api_key = "v1.CmQKHHN0YXRpY2tleS1lMDBqaGNxbXo4czl5dnZjOWcSIXNlcnZpY2VhY2NvdW50LWUwMHBqano1cjVwd3IyeDVhNDIMCMrotdUGEOqql7QBOgwIyevNoAcQgLnvogJAAloDZTAw.AAAAAAAAAAFIGNfQ9C1lPDNn0jZSuZyir6VTEBALh5MtKDvhKBmFJpCN_pAfaUJzCopmJ7pfZKMNTyXx1on2Rw3dyXAKqDYA"
    model_name = Column(String, default="nvidia/Nemotron-3_5-Lightning")

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
# --- Nebius / OpenAI-compatible configuration ---

NEBIUS_API_KEY = "v1.CmQKHHN0YXRpY2tleS1lMDBqaGNxbXo4czl5dnZjOWcSIXNlcnZpY2VhY2NvdW50LWUwMHBqano1cjVwd3IyeDVhNDIMCMrotdUGEOqql7QBOgwIyevNoAcQgLnvogJAAloDZTAw.AAAAAAAAAAFIGNfQ9C1lPDNn0jZSuZyir6VTEBALh5MtKDvhKBmFJpCN_pAfaUJzCopmJ7pfZKMNTyXx1on2Rw3dyXAKqDYA"
NEBIUS_BASE_URL = "https://api.tokenfactory.us-north1.nebius.com/v1/"
NEBIUS_MODEL = "zai-org/GLM-5.3"

client = OpenAI(
    base_url=NEBIUS_BASE_URL,
    api_key=NEBIUS_API_KEY,
)


def extract_document_text(doc_path: str) -> str:
    """Read one supported document and return all text."""
    ext = os.path.splitext(doc_path)[-1].lower()

    if ext == ".docx":
        doc = DocxDocument(doc_path)
        parts = [para.text for para in doc.paragraphs]

        # Also include table contents because they are often important in project docs.
        for table in doc.tables:
            for row in table.rows:
                parts.append(" | ".join(cell.text for cell in row.cells))

        return "\n".join(parts)

    if ext in [".txt", ".md"]:
        with open(doc_path, "r", encoding="utf-8") as f:
            return f.read()

    if ext == ".pdf":
        with open(doc_path, "rb") as f:
            reader = PyPDF2.PdfReader(f)
            return "\n".join(page.extract_text() or "" for page in reader.pages)

    if ext == ".csv":
        df = pd.read_csv(doc_path)
        return df.to_string(index=False)

    raise ValueError(f"Unsupported document format: {ext}")


def get_all_docs_context(project_id: int) -> str:
    """
    Read EVERY supported file inside project_files/{project_id}/docs
    and put the complete contents into one context string.

    No chunking, embedding, cosine similarity, or RAG retrieval is used.
    """
    docs_dir = f"project_files/{project_id}/docs"

    if not os.path.isdir(docs_dir):
        return ""

    supported_extensions = {".docx", ".txt", ".md", ".pdf", ".csv"}
    documents = []

    for filename in sorted(os.listdir(docs_dir)):
        path = os.path.join(docs_dir, filename)

        if not os.path.isfile(path):
            continue

        ext = os.path.splitext(filename)[-1].lower()
        if ext not in supported_extensions:
            continue

        try:
            content = extract_document_text(path)
            documents.append(
                f"\n===== FILE: {filename} =====\n"
                f"{content}\n"
                f"===== END FILE: {filename} =====\n"
            )
        except Exception as e:
            print(f"Failed to read {path}: {e}")

    return "\n".join(documents)


def get_document_text(project_id: int):
    """Backward-compatible API: now returns ALL docs in the project."""
    content = get_all_docs_context(project_id)
    if not content:
        raise HTTPException(status_code=404, detail="No supported documents found")
    return {"content": content}


def rebuild(id_of):
    """
    Kept for compatibility with the existing upload endpoint.
    There is no embedding/RAG index to rebuild anymore because the
    complete docs folder is loaded directly into the LLM context per request.
    """
    return {"status": "success", "message": "Documents will be loaded directly into context."}


# Session memory
chat_sessions = {}


@app.post("/projects/{project_id}/ask")
async def ask_question(project_id: int, request: Request):
    db = SessionLocal()

    data = await request.json()
    question = data.get("question")

    if not question:
        raise HTTPException(status_code=400, detail="Question is required")

    # Session ID
    incoming_session_id = data.get("session_id")
    if not incoming_session_id or incoming_session_id == "default_session":
        session_id = f"session_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    else:
        session_id = incoming_session_id

    # ---------------------------------------------------------
    # 1. Load previous conversation history
    # ---------------------------------------------------------
    history_for_ai = []
    log_dir = f"chat_logs/project_{project_id}"
    file_path = os.path.join(log_dir, f"{session_id}.json")

    if os.path.exists(file_path):
        with open(file_path, "r", encoding="utf-8") as f:
            try:
                session_log = json.load(f)
                for turn in session_log.get("chat_history", []):
                    history_for_ai.append(
                        f"USER: {turn['question']}\n"
                        f"ASSISTANT: {turn['answer']}"
                    )
            except Exception:
                pass

    # ---------------------------------------------------------
    # 2. Load ALL files from docs into context
    # ---------------------------------------------------------
    full_docs_context = get_all_docs_context(project_id)

    print("\n========== DEBUG DOCS ==========")
    print("PROJECT ID:", project_id)
    print("DOCS DIR:", f"project_files/{project_id}/docs")
    print("DOCS EXISTS:", os.path.isdir(f"project_files/{project_id}/docs"))
    print("DOCS CONTEXT LENGTH:", len(full_docs_context))
    print("DOCS CONTEXT PREVIEW:")
    print(full_docs_context[:3000])
    print("========== END DEBUG ==========\n")

    if not full_docs_context:
        full_docs_context = "(No project documents are available.)"

    # ---------------------------------------------------------
    # 3. System prompt
    # ---------------------------------------------------------
    system_instruction = """
Bạn là robot trợ lý ảo của Trường Đại học Thủ đô Hà Nội.

Luôn trả lời bằng tiếng Việt.

Hãy nói chuyện tự nhiên, thân thiện và lịch sự như một trợ lý đang trò chuyện trực tiếp với sinh viên, học sinh và phụ huynh.

Ưu tiên câu trả lời ngắn gọn, dễ hiểu và đi thẳng vào vấn đề.

Thông thường chỉ trả lời từ một đến bốn câu. Chỉ trả lời dài hơn khi câu hỏi thực sự cần nhiều thông tin.

Ưu tiên văn nói tự nhiên, không viết theo phong cách văn bản hành chính.

Không nhắc lại câu hỏi của người dùng.

Không mở đầu bằng những câu dài hoặc sáo rỗng.

Không sử dụng danh sách, bảng hoặc các định dạng phức tạp nếu không thực sự cần thiết.

Không sử dụng ký tự đặc biệt để trang trí câu trả lời.

Không sử dụng Markdown.

Không sử dụng dấu sao, dấu gạch đầu dòng, dấu thăng hoặc các ký hiệu trang trí khác.

Nguồn thông tin chính của bạn là PROJECT DOCUMENTS. Đây là toàn bộ nội dung các tài liệu được cung cấp trong thư mục tài liệu của dự án.

Khi người dùng hỏi về nhà trường, tuyển sinh, ngành học, chương trình đào tạo, học phí, lịch học, quy định hoặc các thông tin chính thức khác của nhà trường, hãy ưu tiên thông tin trong PROJECT DOCUMENTS.

Không tự suy đoán hoặc bịa thêm thông tin không có trong tài liệu.

Nếu tài liệu không có đủ thông tin để trả lời, hãy nói ngắn gọn rằng bạn chưa tìm thấy thông tin này trong tài liệu hiện có.

Nếu câu hỏi không liên quan đến nhà trường, bạn có thể trả lời bằng kiến thức chung khi phù hợp.

Bạn là trợ lý ảo cung cấp thông tin và không được tự đưa ra quyết định hoặc cam kết thay mặt nhà trường.

Không đề cập đến RAG, embeddings, retrieval, chunking, model, prompt, context hoặc các công nghệ nội bộ khác.

Mục tiêu là trả lời giống một người trợ lý thật đang nói chuyện với người dùng.

Hãy luôn ưu tiên ngắn gọn, tự nhiên và dễ hiểu.
"""

    # ---------------------------------------------------------
    # 4. Build the complete input context
    # ---------------------------------------------------------
    conversation_history = "\n\n".join(history_for_ai[-20:])

    input_context = f"""
PROJECT DOCUMENTS
=================
{full_docs_context}
=================

CONVERSATION HISTORY
====================
{conversation_history if conversation_history else "(No previous conversation.)"}
====================

CURRENT USER QUESTION
=====================
{question}
=====================
"""

    try:
        # -----------------------------------------------------
        # 5. Call Nebius GLM through OpenAI-compatible API
        # -----------------------------------------------------
        response = client.responses.create(
            model=NEBIUS_MODEL,
            input=input_context,
            instructions=system_instruction,
        )

        answer = response.output_text

        # -----------------------------------------------------
        # 6. Save history to database
        # -----------------------------------------------------
        now = datetime.now()
        timestamp_str = now.strftime("%Y-%m-%d %H:%M:%S")

        history_entry = ChatHistory(
            project_id=project_id,
            session_id=session_id,
            timestamp=timestamp_str,
            question=question,
            answer=answer,
            provider="nebius",
            model_name=NEBIUS_MODEL,
        )

        db.add(history_entry)
        db.commit()

        # -----------------------------------------------------
        # 7. Save session JSON
        # -----------------------------------------------------
        os.makedirs(log_dir, exist_ok=True)

        new_turn = {
            "timestamp": now.isoformat(),
            "question": question,
            "answer": answer,
        }

        if os.path.exists(file_path):
            with open(file_path, "r", encoding="utf-8") as f:
                try:
                    session_data = json.load(f)
                except Exception:
                    session_data = {
                        "session_id": session_id,
                        "chat_history": [],
                    }
        else:
            session_data = {
                "session_id": session_id,
                "chat_history": [],
            }

        session_data["chat_history"].append(new_turn)

        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(session_data, f, ensure_ascii=False, indent=4)

    except Exception as e:
        db.rollback()
        answer = f"Lỗi hệ thống: {str(e)}"

    print(answer)

    return {
        "answer": answer,
        "session_id": session_id,
        "provider": "nebius",
        "model": NEBIUS_MODEL,
    }


# --- Các API bổ trợ (System Config, Upload, Delete...) ---
@app.get("/system/config")
def get_config():
    db = SessionLocal()
    return db.query(SystemConfig).first() or {"provider": "nebius", "model_name": "zai-org/GLM-5.3-Flash"}

@app.post("/system/config")
async def update_config(request: Request):
    data = await request.json()
    db = SessionLocal()
    config = db.query(SystemConfig).first() or SystemConfig(provider="nebius", model_name=NEBIUS_MODEL)
    config.provider = data.get("provider", config.provider)
    config.openai_api_key = data.get("openai_api_key", config.openai_api_key)
    config.model_name = data.get("model_name", config.model_name)
    db.add(config); db.commit()
    return {"status": "success"}

@app.post("/projects/{project_id}/upload_multi")
async def upload_multi(project_id: int, files: List[UploadFile] = File(...)):
    path = f"project_files/{project_id}/docs"
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
