import numpy as np 
from sklearn .metrics .pairwise import cosine_similarity 


def compute_cosine_similarity (vec1 ,vec2 ):
    """
    Computes cosine similarity between two embedding vectors.
    Returns a float between 0 and 1.
    """
    similarity =cosine_similarity (
    [vec1 ],
    [vec2 ]
    )[0 ][0 ]

    return float (similarity )