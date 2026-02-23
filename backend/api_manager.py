"""
API Key Manager - Dedicated Key Strategy
Compatible with google-generativeai 0.8+
"""

import os 
import time 
from typing import Optional ,Callable ,Any 


class APIKeyManager :
    """
    Manages 3 Gemini API keys with dedicated purposes:
    - Key 1 (DEBATE): Main debate counter-arguments (highest priority)
    - Key 2 (ANALYSIS): Embeddings, drift detection, argument analysis
    - Key 3 (JUDGE): Post-debate summaries and comprehensive feedback
    """

    def __init__ (self ):

        self .debate_key =os .getenv ("GEMINI_API_KEY_1")
        self .analysis_key =os .getenv ("GEMINI_API_KEY_2")
        self .judge_key =os .getenv ("GEMINI_API_KEY_3")


        if not self .debate_key :
            raise ValueError ("GEMINI_API_KEY_1 (DEBATE_KEY) is required!")
        if not self .analysis_key :
            raise ValueError ("GEMINI_API_KEY_2 (ANALYSIS_KEY) is required!")
        if not self .judge_key :
            raise ValueError ("GEMINI_API_KEY_3 (JUDGE_KEY) is required!")


        self .loaded_keys ={
        "debate":True ,
        "analysis":True ,
        "judge":True 
        }

        print ("="*60 )
        print ("🔑 API Key Manager - Dedicated Strategy")
        print ("="*60 )
        print (f"✅ DEBATE_KEY (Key 1): Loaded - Handles debate responses")
        print (f"✅ ANALYSIS_KEY (Key 2): Loaded - Handles drift/embeddings")
        print (f"✅ JUDGE_KEY (Key 3): Loaded - Handles AI judge summaries")
        print ("="*60 )

    def get_debate_key (self )->str :
        """Get API key for debate responses"""
        return self .debate_key 

    def get_analysis_key (self )->str :
        """Get API key for analysis operations"""
        return self .analysis_key 

    def get_judge_key (self )->str :
        """Get API key for AI judge operations"""
        return self .judge_key 

    def call_with_retry (
    self ,
    func :Callable ,
    key_type :str ="debate",
    max_retries :int =3 ,
    *args ,
    **kwargs 
    )->Any :
        """
        Call function with automatic retry and exponential backoff
        
        Args:
            func: Function to call (receives api_key as first argument)
            key_type: Which key to use ("debate", "analysis", "judge")
            max_retries: Maximum retry attempts
        """

        if key_type =="debate":
            api_key =self .debate_key 
            key_name ="DEBATE_KEY"
        elif key_type =="analysis":
            api_key =self .analysis_key 
            key_name ="ANALYSIS_KEY"
        elif key_type =="judge":
            api_key =self .judge_key 
            key_name ="JUDGE_KEY"
        else :
            raise ValueError (f"Invalid key_type: {key_type }")

        last_error =None 

        for attempt in range (max_retries ):
            try :
                result =func (api_key ,*args ,**kwargs )
                return result 

            except Exception as e :
                error_msg =str (e ).lower ()
                last_error =e 


                if any (x in error_msg for x in ["quota","rate limit","429","resource_exhausted"]):
                    wait_time =2 **attempt 
                    print (f"⚠️  Rate limit on {key_name } (attempt {attempt +1 }). Retrying in {wait_time }s...")
                    time .sleep (wait_time )
                    continue 
                else :

                    print (f"❌ Error on {key_name }: {e }")
                    raise e 


        print (f"❌ All {max_retries } retry attempts failed on {key_name }")
        raise last_error 

    def get_key_status (self )->dict :
        """Get status of all API keys"""
        return {
        "debate_key_loaded":self .loaded_keys ["debate"],
        "analysis_key_loaded":self .loaded_keys ["analysis"],
        "judge_key_loaded":self .loaded_keys ["judge"],
        "total_keys":sum (self .loaded_keys .values ())
        }



api_manager :Optional [APIKeyManager ]=None 


def get_api_manager ()->APIKeyManager :
    """Get or create singleton API manager"""
    global api_manager 
    if api_manager is None :
        api_manager =APIKeyManager ()
    return api_manager 
