from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from jose import jwt, JWTError
from dotenv import load_dotenv
from datetime import datetime, timedelta
from pymongo import ReturnDocument
import os

# ---------------- Load ENV ----------------
load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
SECRET_KEY = os.getenv("JWT_SECRET")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 60))

if not MONGO_URI or not SECRET_KEY:
    raise ValueError("Missing environment variables in .env file")

# ---------------- App ----------------
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # only for testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- MongoDB ----------------
client = AsyncIOMotorClient(MONGO_URI)
db = client["grid_db"]
students = db["students"]
counters = db["counters"]

# ---------------- Security ----------------
ALGORITHM = "HS256"
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# ---------------- Models ----------------
class RegisterModel(BaseModel):
    name: str
    usn: str
    year: str
    department: str
    password: str

# ---------------- Helpers ----------------
async def generate_lab_id():
    counter = await counters.find_one_and_update(
        {"_id": "lab_id"},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=ReturnDocument.AFTER
    )
    seq = counter["seq"]
    return f"LAB-{seq:02d}"

def create_access_token(data: dict):
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = data.copy()
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        lab_id: str = payload.get("sub")

        if lab_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")

        user = await students.find_one({"lab_id": lab_id})

        if user is None:
            raise HTTPException(status_code=401, detail="User not found")

        return user

    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ---------------- Routes ----------------
@app.post("/register")
async def register(student: RegisterModel):
    existing = await students.find_one({"usn": student.usn})
    if existing:
        raise HTTPException(status_code=400, detail="USN already registered")

    lab_id = await generate_lab_id()
    hashed_password = pwd_context.hash(student.password)

    await students.insert_one({
        "lab_id": lab_id,
        "name": student.name,
        "usn": student.usn,
        "year": student.year,
        "department": student.department,
        "password": hashed_password
    })

    return {"lab_id": lab_id}

@app.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    student = await students.find_one({"lab_id": form_data.username})

    if not student:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not pwd_context.verify(form_data.password, student["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = create_access_token({"sub": student["lab_id"]})

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }

@app.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "lab_id": current_user["lab_id"],
        "name": current_user["name"],
        "usn": current_user["usn"],
        "department": current_user["department"]
    }