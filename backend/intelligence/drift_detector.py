def compute_cosine_similarity(vec1, vec2):
    """
    Computes cosine similarity between two embedding vectors.
    Pure Python - no dependencies!
    Returns a float between 0 and 1.
    """
    
    # Dot product
    dot_product = sum(a * b for a, b in zip(vec1, vec2))
    
    # Magnitudes
    magnitude1 = sum(a * a for a in vec1) ** 0.5
    magnitude2 = sum(b * b for b in vec2) ** 0.5
    
    # Avoid division by zero
    if magnitude1 == 0 or magnitude2 == 0:
        return 0.0
    
    # Cosine similarity
    similarity = dot_product / (magnitude1 * magnitude2)
    
    # Clamp to [0, 1] and return
    return max(0.0, min(1.0, float(similarity)))
