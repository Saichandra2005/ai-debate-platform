from datetime import datetime ,timezone 

def log_debate_turn (db ,data ):
    """
    Stores a COPY of the debate turn for analytics / auditing.
    """
    log_data =data .copy ()


    log_data .pop ("_id",None )

    log_data ["logged_at"]=datetime .now (timezone .utc )

    db .debate_logs .insert_one (log_data )
