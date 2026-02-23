"""
Embedding Engine with Caching
Compatible with google-genai (latest SDK)
"""

import google .genai as genai 
from google .genai import types 
from typing import List 


_embedding_cache ={}


def generate_embedding (api_key :str ,text :str )->List [float ]:
    """
    Generate semantic embedding with caching
    
    Args:
        api_key: Gemini API key
        text: Text to embed
    
    Returns:
        List of floats representing the embedding
    """

    cache_key =text .strip ().lower ()


    if cache_key in _embedding_cache :
        print (f"✅ Cache HIT for embedding: {text [:50 ]}...")
        return _embedding_cache [cache_key ]


    print (f"🔄 Cache MISS - Generating embedding: {text [:50 ]}...")


    client =genai .Client (api_key =api_key )


    result =client .models .embed_content (
    model ="gemini-embedding-001",
    contents =text 
    )


    embedding =result .embeddings [0 ].values 


    _embedding_cache [cache_key ]=embedding 

    return embedding 


def clear_embedding_cache ():
    """Clear the embedding cache"""
    global _embedding_cache 
    _embedding_cache ={}
    print ("🗑️  Embedding cache cleared")


def get_cache_stats ():
    """Get statistics about the cache"""
    return {
    "cached_items":len (_embedding_cache ),
    "cache_keys":list (_embedding_cache .keys ())[:10 ]
    }
