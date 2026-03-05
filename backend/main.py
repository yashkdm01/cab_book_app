import os
import stripe
import jwt
import socketio
import json
from fastapi import FastAPI, Depends, HTTPException, Request, Header
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from sqlmodel import Session, select
from dotenv import load_dotenv
from redis import Redis
from celery import Celery
from typing import Optional

from models import User, Ride, Payment, Review
from database import get_session

load_dotenv()

app = FastAPI(title="RK Cab Platform")

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

live_frontend = os.getenv("FRONTEND_URL")
if live_frontend:
    origins.append(live_frontend)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

security = HTTPBearer()

redis = None
try:
    redis_url = os.getenv("REDIS_URL")
    if redis_url:
        if "upstash.io" in redis_url and not redis_url.startswith("rediss://"):
            redis_url = redis_url.replace("redis://", "rediss://")
            if "?" not in redis_url:
                redis_url += "?ssl_cert_reqs=none"
        
        redis = Redis.from_url(redis_url, decode_responses=True, socket_timeout=5, retry_on_timeout=True)
        redis.ping()
except Exception:
    redis = None

celery = None
try:
    celery_broker = os.getenv("CELERY_BROKER_URL")
    celery_backend = os.getenv("CELERY_RESULT_BACKEND")
    
    if celery_broker and celery_backend:
        broker_use_ssl = None
        if "upstash.io" in celery_broker:
            broker_use_ssl = {'ssl_cert_reqs': 'none'}

        celery = Celery(app.title, broker=celery_broker, backend=celery_backend)
        celery.conf.update(broker_use_ssl=broker_use_ssl, redis_backend_use_ssl=broker_use_ssl)
except Exception:
    celery = None

sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins=["http://localhost:3000", "http://127.0.0.1:3000"])
app.mount("/ws", socketio.ASGIApp(sio, socketio_path="socket.io"))

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), session: Session = Depends(get_session)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, os.getenv("CLERK_SECRET_KEY"), options={"verify_signature": False})
        clerk_id = payload["sub"]
        
        statement = select(User).where(User.clerk_id == clerk_id)
        user = session.exec(statement).first()
        
        if not user:
            user = User(clerk_id=clerk_id, name="New Rider", email="rider@rkcab.com")
            session.add(user)
            session.commit()
            session.refresh(user)
            
        return user.id
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

class RideRequest(BaseModel):
    pickup: str
    drop: str

class ReviewCreate(BaseModel):
    ride_id: int
    rating: float
    comment: Optional[str] = None

@app.post("/api/rides/request")
def request_ride(ride_request: RideRequest, user_id: int = Depends(get_current_user), session: Session = Depends(get_session)):
    try:
        distance = 5000 
        duration = 600
        fare = 100 + (distance / 1000) * 10
        
        ride = Ride(
            rider_id=user_id,
            pickup=ride_request.pickup,
            drop=ride_request.drop,
            fare_estimate=fare,
            distance=distance,
            duration=duration,
            status="completed"  
        )
        session.add(ride)
        session.commit()
        session.refresh(ride)
        
        if redis:
            try:
                redis.publish("rides", json.dumps({"ride_id": ride.id, "status": "completed"}))
            except Exception:
                pass
        
        if celery:
            send_receipt.delay(ride.id)
            
        return {"ride_id": ride.id, "fare": fare}
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/rides")
def get_ride_history(user_id: int = Depends(get_current_user), session: Session = Depends(get_session)):
    statement = select(Ride).where(Ride.rider_id == user_id).order_by(Ride.created_at.desc())
    rides = session.exec(statement).all()
    return rides

@app.post("/api/reviews")
def create_review(review: ReviewCreate, user_id: int = Depends(get_current_user), session: Session = Depends(get_session)):
    ride = session.get(Ride, review.ride_id)
    if not ride or ride.rider_id != user_id:
        raise HTTPException(status_code=404, detail="Ride not found")
    
    new_review = Review(
        ride_id=review.ride_id, 
        rater_id=user_id, 
        rated_id=ride.driver_id or 0, 
        rating=review.rating, 
        comment=review.comment
    )
    session.add(new_review)
    session.commit()
    return {"status": "success"}

@app.post("/api/payments/create-intent")
def create_payment_intent(ride_id: int, user_id: int = Depends(get_current_user), session: Session = Depends(get_session)):
    ride = session.get(Ride, ride_id)
    if not ride or ride.rider_id != user_id:
        raise HTTPException(status_code=404, detail="Ride not found")

    try:
        intent = stripe.PaymentIntent.create(
            amount=int(ride.fare_estimate * 100),
            currency="usd",
            metadata={"ride_id": ride.id}
        )
        payment = Payment(
            ride_id=ride.id, 
            stripe_payment_intent_id=intent.id, 
            amount=ride.fare_estimate,
            status="pending"
        )
        session.add(payment)
        session.commit()
        return {"clientSecret": intent.client_secret}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/webhooks/stripe")
async def stripe_webhook(request: Request, stripe_signature: str = Header(None), session: Session = Depends(get_session)):
    payload = await request.body()
    webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET")
    try:
        event = stripe.Webhook.construct_event(payload, stripe_signature, webhook_secret)
    except Exception:
        raise HTTPException(status_code=400, detail="Webhook signature failed")

    if event["type"] == "payment_intent.succeeded":
        intent = event["data"]["object"]
        
        ride_id_str = intent.get("metadata", {}).get("ride_id")
        if ride_id_str:
            ride_id = int(ride_id_str)
            
            statement = select(Payment).where(Payment.ride_id == ride_id)
            payment = session.exec(statement).first()
            if payment:
                payment.status = "completed"
                session.add(payment)
                
            ride = session.get(Ride, ride_id)
            if ride:
                ride.status = "completed"
                session.add(ride)
                
            session.commit()
            
            if celery:
                send_receipt.delay(ride_id)
                
    return {"status": "success"}

@app.get("/api/rides/{ride_id}/receipt")
def get_receipt(ride_id: int):
    file_path = f"receipt_{ride_id}.pdf"
    
    if not os.path.exists(file_path):
        try:
            from fpdf import FPDF
            
            pdf = FPDF()
            pdf.add_page()
            
            pdf.set_text_color(147, 51, 234)
            pdf.cell(200, 15, txt="RK Cab Platform", ln=True, align='C')
            
            pdf.set_font("Arial", 'B', 16)
            pdf.set_text_color(0, 0, 0)
            pdf.cell(200, 10, txt=f"Official Receipt - Ride #{ride_id}", ln=True, align='C')
            
            pdf.line(20, 40, 190, 40)
            pdf.ln(10)
            
            pdf.set_font("Arial", '', 14)
            pdf.cell(200, 10, txt="Status: COMPLETED & PAID", ln=True)
            pdf.cell(200, 10, txt="Total Fare: $150.00", ln=True)
            pdf.ln(20)
            
            pdf.set_font("Arial", 'I', 12)
            pdf.set_text_color(100, 100, 100)
            pdf.cell(200, 10, txt="Thank you for riding with us!", ln=True, align='C')
            
            pdf.output(file_path)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"PDF Generator Error: {str(e)}")

    if os.path.exists(file_path):
        return FileResponse(file_path, media_type="application/pdf", filename=f"RK_Cab_Receipt_{ride_id}.pdf")
        
    raise HTTPException(status_code=404, detail="Receipt could not be generated.")

@sio.event
async def connect(sid, environ):
    pass

@sio.on("location_update")
async def location_update(sid, data):
    await sio.emit("update", data)  

def send_receipt(ride_id):
    try:
        from weasyprint import HTML
        HTML(f'<h1>Receipt for Ride {ride_id}</h1><p>Status: Paid</p>').write_pdf(f'receipt_{ride_id}.pdf')
    except Exception:
        pass

if celery:
    send_receipt = celery.task(send_receipt)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)