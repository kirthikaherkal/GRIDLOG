from fastapi import FastAPI, HTTPException, Depends, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, select
from pydantic import BaseModel
from dotenv import load_dotenv
from datetime import datetime
import os
import time
import uuid

# ---------------- ENV ----------------
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

# ---------------- DB ----------------
engine = create_async_engine(DATABASE_URL, echo=False)

AsyncSessionLocal = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

Base = declarative_base()

# ---------------- APP ----------------
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- RATE LIMIT ----------------
RATE_LIMIT = 25
RATE_WINDOW = 60

request_log = {}

def rate_limiter(request: Request):
    ip = request.client.host
    now = time.time()

    if ip not in request_log:
        request_log[ip] = []

    request_log[ip] = [
        t for t in request_log[ip]
        if now - t < RATE_WINDOW
    ]

    if len(request_log[ip]) >= RATE_LIMIT:
        raise HTTPException(429, "Too many requests")

    request_log[ip].append(now)

# ---------------- ADMIN SESSION STORE ----------------
admin_sessions = {}

def get_admin_session(request: Request):

    session_id = request.cookies.get("admin_session")

    if not session_id or session_id not in admin_sessions:
        raise HTTPException(401, "Admin authentication required")

    return admin_sessions[session_id]

# ---------------- MODELS ----------------
class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    lab_id = Column(String, unique=True, index=True)
    name = Column(String)
    usn = Column(String, unique=True)
    year = Column(String)
    department = Column(String)
    password = Column(String)


class Admin(Base):
    __tablename__ = "admins"

    id = Column(Integer, primary_key=True)
    username = Column(String, unique=True, index=True)
    password = Column(String)


class Session(Base):
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, index=True)
    student_lab_id = Column(String, ForeignKey("students.lab_id"))
    check_in_time = Column(DateTime, default=datetime.utcnow)
    check_out_time = Column(DateTime, nullable=True)
    description = Column(Text, nullable=True)

# ---------------- SCHEMAS ----------------
class CheckoutModel(BaseModel):
    description: str

# ---------------- DB DEP ----------------
async def get_db():
    async with AsyncSessionLocal() as session:
        yield session

# ---------------- INIT TABLES ----------------
@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

# ---------------- HEALTH CHECK ----------------
@app.get("/healthz")
async def health():
    return {"status": "ok"}

# ---------------- STUDENT LOGIN ----------------
@app.post("/login")
async def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
):

    rate_limiter(request)

    result = await db.execute(
        select(Student).where(Student.lab_id == form_data.username)
    )
    student = result.scalar_one_or_none()

    if not student:
        raise HTTPException(401, "Invalid credentials")

    if form_data.password != student.password:
        raise HTTPException(401, "Invalid credentials")

    return {
        "lab_id": student.lab_id,
        "name": student.name,
        "department": student.department
    }

# ---------------- ADMIN LOGIN ----------------
@app.post("/admin/login")
async def admin_login(
    request: Request,
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
):

    rate_limiter(request)

    result = await db.execute(
        select(Admin).where(Admin.username == form_data.username)
    )
    admin = result.scalar_one_or_none()

    if not admin:
        raise HTTPException(401, "Invalid credentials")

    if form_data.password != admin.password:
        raise HTTPException(401, "Invalid credentials")

    session_id = str(uuid.uuid4())
    admin_sessions[session_id] = admin.username

    response.set_cookie(
        key="admin_session",
        value=session_id,
        httponly=True,
        secure=True,
        samesite="lax"
    )

    return {"message": "Admin login successful"}

# ---------------- SESSION SYSTEM ----------------
@app.post("/checkin/{lab_id}")
async def checkin(
    request: Request,
    lab_id: str,
    db: AsyncSession = Depends(get_db)
):

    rate_limiter(request)

    result = await db.execute(
        select(Student).where(Student.lab_id == lab_id)
    )
    student = result.scalar_one_or_none()

    if not student:
        raise HTTPException(404, "Student not found")

    session = Session(student_lab_id=student.lab_id)

    db.add(session)
    await db.commit()
    await db.refresh(session)

    return session


@app.post("/checkout/{session_id}")
async def checkout(
    request: Request,
    session_id: int,
    body: CheckoutModel,
    db: AsyncSession = Depends(get_db)
):

    rate_limiter(request)

    result = await db.execute(
        select(Session).where(Session.id == session_id)
    )
    session = result.scalar_one_or_none()

    if not session:
        raise HTTPException(404, "Session not found")

    session.check_out_time = datetime.utcnow()
    session.description = body.description

    await db.commit()

    return {"message": "Checked out"}

# ---------------- STUDENT SESSION HISTORY ----------------
@app.get("/student/{lab_id}/sessions")
async def student_sessions(
    request: Request,
    lab_id: str,
    db: AsyncSession = Depends(get_db)
):

    rate_limiter(request)

    result = await db.execute(
        select(Session)
        .where(Session.student_lab_id == lab_id)
        .order_by(Session.check_in_time.desc())
    )

    return result.scalars().all()

# ---------------- ADMIN ENDPOINTS ----------------
@app.get("/admin/sessions")
async def admin_sessions(
    request: Request,
    admin = Depends(get_admin_session),
    db: AsyncSession = Depends(get_db)
):

    rate_limiter(request)

    result = await db.execute(
        select(Session, Student)
        .join(Student, Student.lab_id == Session.student_lab_id)
        .order_by(Session.check_in_time.desc())
    )

    rows = result.all()

    return [
        {
            "id": s.id,
            "student": {
                "lab_id": st.lab_id,
                "name": st.name,
                "usn": st.usn,
                "department": st.department,
                "year": st.year,
            },
            "check_in_time": s.check_in_time,
            "check_out_time": s.check_out_time,
            "description": s.description,
        }
        for s, st in rows
    ]


@app.get("/admin/active")
async def admin_active_sessions(
    request: Request,
    admin = Depends(get_admin_session),
    db: AsyncSession = Depends(get_db)
):

    rate_limiter(request)

    result = await db.execute(
        select(Session, Student)
        .join(Student, Student.lab_id == Session.student_lab_id)
        .where(Session.check_out_time == None)
    )

    rows = result.all()

    return [
        {
            "id": s.id,
            "student": {
                "lab_id": st.lab_id,
                "name": st.name,
                "usn": st.usn,
                "department": st.department,
                "year": st.year,
            },
            "check_in_time": s.check_in_time,
        }
        for s, st in rows
    ]