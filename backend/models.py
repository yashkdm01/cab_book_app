from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    clerk_id: str = Field(index=True, unique=True)
    name: str
    email: str
    phone: Optional[str]
    role: str = "rider"
    profile_pic: Optional[str]
    rating_avg: float = 5.0

class Driver(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    vehicle_info: str
    verified: bool = False
    current_location: Optional[str] = None  
    status: str = "offline"

class Ride(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    rider_id: int = Field(foreign_key="user.id")
    driver_id: Optional[int] = Field(foreign_key="driver.id")
    pickup: str
    drop: str
    status: str = "requested"
    fare_estimate: float
    fare_actual: Optional[float]
    distance: Optional[int]
    duration: Optional[int]
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Payment(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    ride_id: int = Field(foreign_key="ride.id")
    stripe_payment_intent_id: Optional[str]
    amount: float
    status: str = "pending"

class Review(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    ride_id: int = Field(foreign_key="ride.id")
    rater_id: int = Field(foreign_key="user.id")
    rated_id: int = Field(foreign_key="user.id")
    rating: float
    comment: Optional[str]