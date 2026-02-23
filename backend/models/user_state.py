

class UserState :
    """
    Represents the current debate state of a user.
    This object is updated after every debate turn.
    """

    def __init__ (self ):
        self .logical_coherence =0.0 
        self .vocabulary_level =0.0 
        self .aggression_level =0.0 
        self .fallacy_count =0 
        self .drift_score =1.0 

        self .difficulty_level =3 
        self .turn_count =0 

    def update_from_metrics (self ,metrics ,drift_score ):
        """
        Update user state using latest analysis results.
        """

        self .logical_coherence =metrics .get ("logical_coherence",5 )
        self .vocabulary_level =metrics .get ("vocabulary_level",5 )
        self .aggression_level =metrics .get ("aggression_level",5 )
        self .fallacy_count +=metrics .get ("fallacy_count",0 )
        self .drift_score =drift_score 

        self .turn_count +=1 

    def to_dict (self ):
        """
        Convert state to dictionary for storage/logging.
        """
        return {
        "logical_coherence":self .logical_coherence ,
        "vocabulary_level":self .vocabulary_level ,
        "aggression_level":self .aggression_level ,
        "fallacy_count":self .fallacy_count ,
        "drift_score":self .drift_score ,
        "difficulty_level":self .difficulty_level ,
        "turn_count":self .turn_count 
        }
