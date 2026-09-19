import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from .. import database, models, schemas, security
from ..limiter import limiter

router = APIRouter()

@router.post("/login", response_model=schemas.Token)
@limiter.limit("10/minute")
async def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(database.get_db)
):
    ip_addr = request.client.host if request.client else "unknown"
    user_email = form_data.username
    
    user = db.query(models.User).filter(models.User.email == user_email).first()
    
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        # Log failed login attempt
        failed_audit = models.AuditLog(
            user_id=user_email,
            action="User Login Attempt",
            status="Failed",
            ip_address=ip_addr
        )
        db.add(failed_audit)
        db.commit()
        
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Log successful login
    success_audit = models.AuditLog(
        user_id=user.email,
        action="User Login Successful",
        status="Success",
        ip_address=ip_addr
    )
    db.add(success_audit)
    db.commit()
    
    access_token = security.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=schemas.UserResponse)
async def read_users_me(
    current_user: models.User = Depends(security.get_current_user)
):
    return current_user
