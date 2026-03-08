from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, select, func
from passlib.context import CryptContext
from jose import jwt, JWTError
from pydantic import BaseModel
from zoneinfo import ZoneInfo
from dotenv import load_dotenv
from datetime import datetime, timedelta
import os

# ---------------- ENV ----------------
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
SECRET_KEY = os.getenv("JWT_SECRET")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 60))

ADMIN_USERNAME = os.getenv("ADMIN_USERNAME")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD")

# ---------------- DB ----------------
engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
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

# ---------------- SECURITY ----------------
ALGORITHM = "HS256"

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__rounds=12
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="admin/login")

# ---------------- MODELS ----------------
class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    lab_id = Column(String, unique=True, index=True)
    name = Column(String)
    usn = Column(String, unique=True)
    year = Column(String)
    department = Column(String)
    startup = Column(String)
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
    check_in_time = Column(DateTime, default=lambda: datetime.now(ZoneInfo("Asia/Kolkata")))
    check_out_time = Column(DateTime, nullable=True)
    description = Column(Text, nullable=True)

# ---------------- SCHEMAS ----------------
class RegisterModel(BaseModel):
    name: str
    usn: str
    year: str
    department: str
    startup: str
    password: str


class CheckoutModel(BaseModel):
    description: str

# ---------------- DB DEP ----------------
async def get_db():
    async with AsyncSessionLocal() as session:
        yield session

# ---------------- ADMIN AUTH DEP ----------------
async def get_current_admin(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("role") != "admin":
            raise HTTPException(403, "Not authorized")
        return payload
    except JWTError:
        raise HTTPException(401, "Invalid token")

# ---------------- INIT TABLES ----------------
@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    if ADMIN_USERNAME and ADMIN_PASSWORD:
        async with AsyncSessionLocal() as db:
            result = await db.execute(select(Admin))
            existing_admin = result.scalar_one_or_none()

            if not existing_admin:
                hashed = pwd_context.hash(ADMIN_PASSWORD[:72])
                db.add(Admin(username=ADMIN_USERNAME, password=hashed))
                await db.commit()

# ---------------- HEALTH ----------------
@app.get("/healthz")
async def health():
    return {"status": "ok"}

# ---------------- TOKEN ----------------
def create_access_token(data: dict):
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = data.copy()
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# ---------------- STUDENT AUTH ----------------
@app.post("/register")
async def register(student: RegisterModel, db: AsyncSession = Depends(get_db)):

    result = await db.execute(select(Student).where(Student.usn == student.usn))
    if result.scalar_one_or_none():
        raise HTTPException(400, "USN already registered")

    hashed_password = pwd_context.hash(student.password[:72])

    new_student = Student(
        name=student.name,
        usn=student.usn,
        year=student.year,
        department=student.department,
        startup=student.startup,
        password=hashed_password
    )

    db.add(new_student)
    await db.commit()
    await db.refresh(new_student)

    new_student.lab_id = str(new_student.id)
    await db.commit()

    return {"lab_id": new_student.lab_id}


@app.post("/login")
async def student_login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
):

    result = await db.execute(
        select(Student).where(Student.lab_id == form_data.username)
    )
    student = result.scalar_one_or_none()

    if not student or not pwd_context.verify(form_data.password[:72], student.password):
        raise HTTPException(401, "Invalid credentials")

    token = create_access_token({
        "sub": student.lab_id,
        "role": "student"
    })

    return {"access_token": token, "token_type": "bearer"}

# ---------------- ADMIN LOGIN ----------------
@app.post("/admin/login")
async def admin_login(form_data: OAuth2PasswordRequestForm = Depends(),
                      db: AsyncSession = Depends(get_db)):

    result = await db.execute(
        select(Admin).where(Admin.username == form_data.username)
    )
    admin = result.scalar_one_or_none()

    if not admin or not pwd_context.verify(form_data.password[:72], admin.password):
        raise HTTPException(401, "Invalid credentials")

    token = create_access_token({
        "sub": admin.username,
        "role": "admin"
    })

    return {"access_token": token, "token_type": "bearer"}

# ---------------- ADMIN ENDPOINTS ----------------
@app.get("/admin/sessions")
async def admin_sessions(db: AsyncSession = Depends(get_db),
                         admin=Depends(get_current_admin)):

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
                "startup": st.startup,
            },
            "check_in_time": s.check_in_time,
            "check_out_time": s.check_out_time,
            "description": s.description,
        }
        for s, st in rows
    ]


@app.get("/admin/active")
async def admin_active_sessions(db: AsyncSession = Depends(get_db),
                                admin=Depends(get_current_admin)):

    result = await db.execute(
        select(Session, Student)
        .join(Student, Student.lab_id == Session.student_lab_id)
        .where(Session.check_out_time.is_(None))
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
                "startup": st.startup,
            },
            "check_in_time": s.check_in_time,
        }
        for s, st in rows
    ]

# ---------------- ANALYTICS ENDPOINTS ----------------
@app.get("/admin/analytics/students")
async def analytics_students(db: AsyncSession = Depends(get_db),
                             admin=Depends(get_current_admin)):

    result = await db.execute(
        select(
            Student.name,
            Student.department,
            Student.year,
            Student.startup,
            func.count(Session.id)
        )
        .outerjoin(Session, Student.lab_id == Session.student_lab_id)
        .group_by(Student.id)
    )

    return [
        {
            "name": r[0],
            "dept": r[1],
            "year": r[2],
            "startup": r[3],
            "sessions": r[4],
            "type": "Regular" if r[4] >= 5 else "Irregular"
        }
        for r in result.all()
    ]


@app.get("/admin/analytics/history")
async def analytics_history(db: AsyncSession = Depends(get_db),
                            admin=Depends(get_current_admin)):

    result = await db.execute(
        select(Student.name, Session.check_in_time,
               Session.check_out_time, Session.description)
        .join(Session, Student.lab_id == Session.student_lab_id)
        .order_by(Session.check_in_time.desc())
    )

    history = {}

    for name, check_in, check_out, desc in result.all():
        hours = 0
        if check_in and check_out:
            hours = round((check_out - check_in).total_seconds() / 3600, 2)

        history.setdefault(name, []).append({
            "date": check_in.date() if check_in else None,
            "hours": hours,
            "desc": desc
        })

    return history