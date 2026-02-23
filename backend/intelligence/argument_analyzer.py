"""
Argument Analyzer - Compatible with google-genai (latest SDK)
"""

import json 
import google .genai as genai 
from google .genai import types 


def analyze_argument (api_key :str ,argument_text :str )->dict :
    """
    Analyze debate argument and return structured metrics
    
    Args:
        api_key: Gemini API key
        argument_text: User's argument
    
    Returns:
        Dict with metrics (logical_coherence, vocabulary_level, etc.)
    """
    prompt =f"""Analyze this debate argument and return ONLY a JSON object:

{{
  "logical_coherence": <number 1-10>,
  "vocabulary_level": <number 1-10>,
  "aggression_level": <number 1-10>,
  "fallacy_count": <integer>
}}

No explanations. No markdown. Only JSON.

Argument:
"{argument_text }"

JSON Response:"""

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
        metrics =json .loads (response_text )


        required_keys =["logical_coherence","vocabulary_level","aggression_level","fallacy_count"]
        for key in required_keys :
            if key not in metrics :
                raise ValueError (f"Missing key: {key }")


        for key in ["logical_coherence","vocabulary_level","aggression_level"]:
            metrics [key ]=max (1 ,min (10 ,int (metrics [key ])))

        metrics ["fallacy_count"]=max (0 ,int (metrics ["fallacy_count"]))

        return metrics 

    except Exception as e :
        print (f"⚠️  Argument analysis failed: {e }")

        return {
        "logical_coherence":5 ,
        "vocabulary_level":5 ,
        "aggression_level":5 ,
        "fallacy_count":0 
        }


def analyze_with_response (api_key :str ,topic :str ,argument :str ,difficulty :int )->dict :
    """
    OPTIMIZED: Combines argument analysis with AI response in single call
    
    Args:
        api_key: Gemini API key
        topic: Debate topic
        argument: User's argument
        difficulty: Current difficulty level (1-5)
    
    Returns:
        Dict with ai_response and metrics
    """
    from intelligence .prompt_controller import get_debate_prompt 

    system_instruction =get_debate_prompt (difficulty )

    prompt =f"""{system_instruction }

Debate Topic: "{topic }"
User Argument: "{argument }"

Provide:
1. Your counter-argument (clear, focused, natural)
2. Analysis of user's argument

Format EXACTLY as:
COUNTER_ARGUMENT:
[Your counter-argument]

ANALYSIS:
{{
  "logical_coherence": <1-10>,
  "vocabulary_level": <1-10>,
  "aggression_level": <1-10>,
  "fallacy_count": <integer>
}}

Remember:
- Counter-argument should be conversational
- Analysis must be valid JSON
- No extra text outside sections"""

    try :

        client =genai .Client (api_key =api_key )


        response =client .models .generate_content (
        model ='gemini-2.5-flash-lite',
        contents =prompt 
        )
        response_text =response .text .strip ()


        parts =response_text .split ("ANALYSIS:")

        if len (parts )==2 :
            counter_arg =parts [0 ].replace ("COUNTER_ARGUMENT:","").strip ()
            analysis_text =parts [1 ].strip ()


            if "```"in analysis_text :
                analysis_text =analysis_text .split ("```")[1 ]
                if analysis_text .startswith ("json"):
                    analysis_text =analysis_text [4 :]
            analysis_text =analysis_text .strip ()

            metrics =json .loads (analysis_text )

            return {
            "ai_response":counter_arg ,
            "metrics":metrics 
            }
        else :
            raise ValueError ("Response format incorrect")

    except Exception as e :
        print (f"⚠️  Combined analysis failed, using fallback: {e }")


        debate_prompt =f"""{get_debate_prompt (difficulty )}

Debate Topic: "{topic }"
User Argument: "{argument }"

Respond with ONLY your counter-argument. Be clear and conversational."""

        client =genai .Client (api_key =api_key )
        ai_response_result =client .models .generate_content (
        model ='gemini-2.5-flash-lite',
        contents =debate_prompt 
        )
        ai_response =ai_response_result .text .strip ()

        metrics =analyze_argument (api_key ,argument )

        return {
        "ai_response":ai_response ,
        "metrics":metrics 
        }
