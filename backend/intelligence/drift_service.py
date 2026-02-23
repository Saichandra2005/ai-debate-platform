"""
Drift Service - Optimized with Caching
"""

from intelligence .embedding_engine import generate_embedding 
from intelligence .drift_detector import compute_cosine_similarity 


def calculate_drift_score (api_key :str ,topic_text :str ,argument_text :str )->float :
    """
    Calculate semantic drift between topic and argument
    Uses caching for topic embeddings
    
    Args:
        api_key: Gemini API key
        topic_text: Debate topic
        argument_text: User's argument
    
    Returns:
        Float 0-1 (1=perfect alignment, 0=off-topic)
    """

    topic_embedding =generate_embedding (api_key ,topic_text )
    argument_embedding =generate_embedding (api_key ,argument_text )


    drift_score =compute_cosine_similarity (
    topic_embedding ,
    argument_embedding 
    )

    return drift_score 
