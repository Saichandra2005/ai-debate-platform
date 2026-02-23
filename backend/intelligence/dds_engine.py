

def update_difficulty (user_state ):
    """
    Updates the difficulty level based on the user's current state.
    Difficulty ranges from 1 (Easy) to 5 (Hard).
    """


    score =(
    user_state .logical_coherence *0.4 +
    user_state .vocabulary_level *0.3 +
    user_state .drift_score *10 *0.1 -
    user_state .fallacy_count *0.3 
    )


    if score <15 :
        difficulty =1 
    elif score <25 :
        difficulty =2 
    elif score <35 :
        difficulty =3 
    elif score <45 :
        difficulty =4 
    else :
        difficulty =5 

    user_state .difficulty_level =difficulty 
    return difficulty 
