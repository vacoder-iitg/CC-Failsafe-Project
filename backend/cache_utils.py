import json
from sqlalchemy.orm import Session
import models

# In-memory cache for ultra-fast tab switching during a single session
INSIGHTS_CACHE = {}
DECISION_PLOT_CACHE = {}

def get_db_cache(db: Session, teacher_id: str, cache_key: str):
    cached = db.query(models.MLCache).filter(
        models.MLCache.teacher_id == teacher_id,
        models.MLCache.cache_key == cache_key
    ).first()
    if cached:
        return json.loads(cached.data_json)
    return None

def set_db_cache(db: Session, teacher_id: str, cache_key: str, data: dict):
    # Upsert logic: Update if exists, otherwise create
    cached = db.query(models.MLCache).filter(
        models.MLCache.teacher_id == teacher_id,
        models.MLCache.cache_key == cache_key
    ).first()
    if cached:
        cached.data_json = json.dumps(data)
    else:
        new_cache = models.MLCache(
            teacher_id=teacher_id,
            cache_key=cache_key,
            data_json=json.dumps(data)
        )
        db.add(new_cache)
    db.commit()

def clear_teacher_cache(db: Session, teacher_id: str):
    # 1. Clear In-Memory Cache
    if teacher_id in INSIGHTS_CACHE:
        del INSIGHTS_CACHE[teacher_id]
    keys_to_delete = [k for k in list(DECISION_PLOT_CACHE.keys()) if k.startswith(f"{teacher_id}_")]
    for k in keys_to_delete:
        del DECISION_PLOT_CACHE[k]
    
    # 2. Clear Persistent PostgreSQL Cache
    db.query(models.MLCache).filter(models.MLCache.teacher_id == teacher_id).delete()
    db.commit()
