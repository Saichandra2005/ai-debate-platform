"""
AI Judge System - Compatible with google-genai (latest SDK)
"""

import json 
import google .genai as genai 
from google .genai import types 
from typing import List ,Dict 


def generate_debate_summary (api_key :str ,debate_data :Dict )->Dict :
    """
    Generate comprehensive AI judge summary after debate
    
    Args:
        api_key: Gemini API key
        debate_data: Dict with topic, arguments, responses, metrics, etc.
    
    Returns:
        Dict with overall_score, breakdown, feedback, etc.
    """

    transcript =[]
    for i ,(user_arg ,ai_resp )in enumerate (zip (
    debate_data .get ("user_arguments",[]),
    debate_data .get ("ai_responses",[])
    )):
        transcript .append (f"Turn {i +1 }:")
        transcript .append (f"User: {user_arg }")
        transcript .append (f"AI: {ai_resp }")
        transcript .append ("")

    full_transcript ="\n".join (transcript )


    metrics_list =debate_data .get ("metrics",[])
    avg_coherence =sum (m .get ("logical_coherence",0 )for m in metrics_list )/len (metrics_list )if metrics_list else 0 
    avg_vocab =sum (m .get ("vocabulary_level",0 )for m in metrics_list )/len (metrics_list )if metrics_list else 0 
    avg_aggression =sum (m .get ("aggression_level",0 )for m in metrics_list )/len (metrics_list )if metrics_list else 0 
    total_fallacies =sum (m .get ("fallacy_count",0 )for m in metrics_list )

    drift_scores =debate_data .get ("drift_scores",[])
    avg_drift =sum (drift_scores )/len (drift_scores )if drift_scores else 0 

    prompt =f"""You are an expert debate judge. Analyze this performance.

DEBATE TOPIC: {debate_data .get ('topic','N/A')}
DIFFICULTY LEVEL: {debate_data .get ('difficulty_level',3 )}/5

TRANSCRIPT:
{full_transcript }

METRICS:
- Avg Logical Coherence: {avg_coherence :.1f}/10
- Avg Vocabulary: {avg_vocab :.1f}/10
- Avg Aggression: {avg_aggression :.1f}/10
- Total Fallacies: {total_fallacies }
- Avg Topic Relevance: {avg_drift :.2f} (0=off-topic, 1=perfect)

Provide evaluation in this EXACT JSON format:

{{
  "overall_score": <0-100>,
  "breakdown": {{
    "logical_reasoning": <0-100>,
    "vocabulary_usage": <0-100>,
    "argument_strength": <0-100>,
    "topic_relevance": <0-100>,
    "composure": <0-100>
  }},
  "strengths": [
    "Specific strength with example",
    "Another strength"
  ],
  "weaknesses": [
    "Specific weakness with example",
    "Another weakness"
  ],
  "mistakes": [
    "Critical mistake to rectify",
    "Another mistake"
  ],
  "recommendations": [
    "Actionable recommendation",
    "Another recommendation"
  ],
  "improvement_areas": [
    "Key area to focus",
    "Another area"
  ],
  "judge_comment": "2-3 sentence overall assessment"
}}

Make feedback specific with examples. Respond with ONLY JSON, no markdown."""

    try :

        client =genai .Client (api_key =api_key )


        response =client .models .generate_content (
        model ='gemini-2.5-flash-lite',
        contents =prompt 
        )
        response_text =response .text .strip ()


        if response_text .startswith ("```"):
            response_text =response_text .split ("```")[1 ]
            if response_text .startswith ("json"):
                response_text =response_text [4 :]

        response_text =response_text .strip ()
        summary =json .loads (response_text )


        required_keys =["overall_score","breakdown","strengths","weaknesses","mistakes","recommendations"]
        for key in required_keys :
            if key not in summary :
                raise ValueError (f"Missing key: {key }")

        return summary 

    except Exception as e :
        print (f"⚠️  AI Judge summary failed: {e }")


        return {
        "overall_score":int ((avg_coherence +avg_vocab +avg_drift *10 )*10 /3 ),
        "breakdown":{
        "logical_reasoning":int (avg_coherence *10 ),
        "vocabulary_usage":int (avg_vocab *10 ),
        "argument_strength":int (avg_coherence *8 ),
        "topic_relevance":int (avg_drift *100 ),
        "composure":max (0 ,100 -int (avg_aggression *10 ))
        },
        "strengths":["Completed the debate"],
        "weaknesses":["Analysis unavailable"],
        "mistakes":["Unable to generate detailed feedback"],
        "recommendations":["Try again with complete debate"],
        "improvement_areas":["All areas need review"],
        "judge_comment":"Summary generation error. Please review manually."
        }


def calculate_quick_score (metrics :Dict ,drift_score :float )->int :
    """
    Calculate quick performance score (0-100) for a single turn
    
    Args:
        metrics: Argument analysis metrics
        drift_score: Semantic drift score (0-1)
    
    Returns:
        Score from 0-100
    """
    coherence_score =metrics .get ("logical_coherence",5 )*10 
    vocab_score =metrics .get ("vocabulary_level",5 )*10 
    drift_percentage =drift_score *100 
    fallacy_penalty =metrics .get ("fallacy_count",0 )*5 

    score =(
    coherence_score *0.35 +
    vocab_score *0.25 +
    drift_percentage *0.30 +
    (100 -fallacy_penalty )*0.10 
    )

    return max (0 ,min (100 ,int (score )))
