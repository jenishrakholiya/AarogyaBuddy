# First, install python-dotenv if not already installed:
# pip install python-dotenv

# Create a .env file in your project root with the following content:
# GEMINI_API_KEY=AIzaSyAWXaynlKcOI1TuB9RuKqARg9G2Kf8  # Replace with your actual full API key

# Now, here's the complete modified code with the API key loaded from the .env file.

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework import status
from PIL import Image
import pytesseract
import requests
import json
import PyPDF2
import fitz  # PyMuPDF
import io
import os  
from dotenv import load_dotenv  

load_dotenv()

# Add this line to explicitly point to your Tesseract installation.
pytesseract.pytesseract.tesseract_cmd = r'C:\Users\Excel\AppData\Local\Programs\Tesseract-OCR\tesseract.exe'

def extract_text_from_pdf(pdf_file):
    """Extract text from PDF file using multiple methods"""
    try:
        pdf_file.seek(0)  # Reset file pointer
        
        # Method 1: Try PyPDF2 for text-based PDFs
        print("[INFO] Attempting text extraction using PyPDF2...")
        try:
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            text = ""
            
            for page_num in range(len(pdf_reader.pages)):
                page = pdf_reader.pages[page_num]
                page_text = page.extract_text()
                text += page_text + "\n"
            
            # Check if we got meaningful text (not just whitespace/special chars)
            if text.strip() and len(text.strip()) > 10:
                print(f"[SUCCESS] PyPDF2 extracted {len(text)} characters")
                return text.strip()
            else:
                print("[INFO] PyPDF2 extracted minimal text, trying PyMuPDF...")
        except Exception as e:
            print(f"[WARNING] PyPDF2 failed: {e}")
        
        # Method 2: Try PyMuPDF for better text extraction
        pdf_file.seek(0)
        try:
            pdf_bytes = pdf_file.read()
            pdf_document = fitz.open(stream=pdf_bytes, filetype="pdf")
            text = ""
            
            for page_num in range(pdf_document.page_count):
                page = pdf_document[page_num]
                page_text = page.get_text()
                text += page_text + "\n"
            
            pdf_document.close()
            
            # Check if we got meaningful text
            if text.strip() and len(text.strip()) > 10:
                print(f"[SUCCESS] PyMuPDF extracted {len(text)} characters")
                return text.strip()
            else:
                print("[INFO] PyMuPDF extracted minimal text, trying OCR...")
        except Exception as e:
            print(f"[WARNING] PyMuPDF failed: {e}")
        
        # Method 3: OCR on PDF pages (for image-based PDFs)
        pdf_file.seek(0)
        try:
            pdf_bytes = pdf_file.read()
            pdf_document = fitz.open(stream=pdf_bytes, filetype="pdf")
            text = ""
            
            print(f"[INFO] PDF has {pdf_document.page_count} pages, performing OCR...")
            
            for page_num in range(min(pdf_document.page_count, 5)):  # Limit to first 5 pages
                print(f"[INFO] Processing page {page_num + 1} with OCR...")
                page = pdf_document[page_num]
                
                # Convert PDF page to image
                pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))  # 2x zoom for better OCR
                img_data = pix.tobytes("png")
                
                # Perform OCR on the image
                img = Image.open(io.BytesIO(img_data))
                page_text = pytesseract.image_to_string(img)
                text += page_text + "\n"
            
            pdf_document.close()
            
            if text.strip() and len(text.strip()) > 10:
                print(f"[SUCCESS] OCR extracted {len(text)} characters from PDF")
                return text.strip()
            else:
                print("[WARNING] OCR extracted minimal text from PDF")
                
        except Exception as e:
            print(f"[ERROR] PDF OCR failed: {e}")
        
        return None
        
    except Exception as e:
        print(f"❌ ERROR: Failed to extract text from PDF: {e}")
        return None

def extract_text_from_image(image_file):
    """Extract text from image using OCR"""
    try:
        print("[INFO] Performing OCR on image...")
        img = Image.open(image_file)
        
        # Enhance image for better OCR (optional)
        # img = img.convert('L')  # Convert to grayscale
        
        extracted_text = pytesseract.image_to_string(img)
        
        if extracted_text.strip():
            print(f"[SUCCESS] OCR extracted {len(extracted_text)} characters from image")
            return extracted_text.strip()
        else:
            print("[WARNING] OCR extracted no text from image")
            return None
            
    except Exception as e:
        print(f"❌ ERROR: Failed to extract text from image: {e}")
        return None

def analyze_report_with_gemini(report_text: str) -> str:
    """Sends the report text to the Gemini API for a safe and structured analysis."""
    
    api_key = os.getenv('GEMINI_API_KEY')  
    if not api_key:
        print("❌ ERROR: GEMINI_API_KEY not found in environment variables.")
        return "Sorry, API key is missing. Please check your .env file."
    
    api_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"

    prompt = f"""
    You are a helpful and extremely cautious AI Medical Assistant. Your role is to help a patient understand their lab report in simple, clear language.
    Analyze the provided medical report text. Your analysis MUST follow these strict rules:
    1. NEVER provide a definitive diagnosis. Only discuss POSSIBLE conditions in general terms.
    2. Use cautious, educational language like "This might indicate..." or "In general, ...".
    3. NEVER recommend specific medications, cures, or dosages. Only provide general lifestyle precautions.
    4. Your primary and most important message must be to consult a human doctor for any interpretation, diagnosis, or treatment.
    5. If no abnormalities are present, state that clearly and still emphasize consulting a doctor.
    Structure your response in this exact clean format using markdown:
    ### 📝 Report Summary
    (Provide a brief overview of the key results from the report.)
    
    ### 🔍 Possible Conditions
    (List any potential health conditions that could be related to the results, based on general knowledge. Use bullet points. Remember: These are NOT diagnoses.)
    
    ### 🛡 General Precautions
    (Suggest broad, non-specific lifestyle tips that might help in related scenarios, like healthy eating or exercise. Use bullet points. Do NOT tie directly to cures.)
    
    ### ❗ Important Guidance & Disclaimer
    (Emphasize that this is not medical advice. Strongly recommend seeing a doctor for personalized cures or treatments. Remind that only a professional can provide accurate diagnosis and cures.)
    
    Here is the report to analyze:
    ---
    {report_text}
    ---
    """
    
    payload = { "contents": [{ "parts": [{ "text": prompt }] }] }
    headers = { 'Content-Type': 'application/json' }

    try:
        print("[INFO] Sending extracted text to Gemini for analysis...")
        response = requests.post(api_url, headers=headers, json=payload)
        response.raise_for_status()
        
        result = response.json()
        
        # Handle different possible response structures
        analysis_text = "Sorry, the analysis could not be generated."
        
        try:
            analysis_text = result['candidates'][0]['content']['parts'][0]['text']
            print("[SUCCESS] Analysis received.")
            return analysis_text
        except (KeyError, IndexError, TypeError) as parse_error:
            print(f"❌ ERROR: Could not parse Gemini response structure: {parse_error}")
            return "Sorry, the analysis response was in an unexpected format. Please try again."
        
    except requests.exceptions.RequestException as e:
        print(f"❌ ERROR: An error occurred during Gemini API call: {e}")
        return "Sorry, an error occurred while analyzing the report."
    except Exception as e:
        print(f"❌ ERROR: Unexpected error during analysis: {e}")
        return "Sorry, an unexpected error occurred during analysis."

class ReportAnalysisView(APIView):
    """
    API view to upload a medical report (image or PDF), perform text extraction,
    and get an AI-powered analysis.
    """
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request, *args, **kwargs):
        if 'report_file' not in request.FILES:
            return Response({"error": "No file provided."}, status=status.HTTP_400_BAD_REQUEST)

        uploaded_file = request.FILES['report_file']
        file_name = uploaded_file.name.lower()

        try:
            extracted_text = None
            
            # Determine file type and extract text accordingly
            if file_name.endswith('.pdf'):
                print(f"[INFO] Processing PDF file '{uploaded_file.name}'...")
                extracted_text = extract_text_from_pdf(uploaded_file)
                
            elif any(file_name.endswith(ext) for ext in ['.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.gif']):
                print(f"[INFO] Processing image file '{uploaded_file.name}'...")
                extracted_text = extract_text_from_image(uploaded_file)
                
            else:
                return Response({
                    "error": "Unsupported file format. Please upload an image (JPG, PNG, etc.) or PDF file."
                }, status=status.HTTP_400_BAD_REQUEST)

            # Check if text extraction was successful
            if not extracted_text or len(extracted_text.strip()) < 10:
                error_msg = "Could not extract readable text from the uploaded file. "
                if file_name.endswith('.pdf'):
                    error_msg += "This PDF might be password-protected, corrupted, or contain only images. Try converting it to an image first."
                else:
                    error_msg += "The image might be too blurry, low resolution, or contain unreadable text."
                    
                return Response({"error": error_msg}, status=status.HTTP_400_BAD_REQUEST)
            
            print("[SUCCESS] Text extracted from file.")
            print(f"[DEBUG] Extracted text preview: {extracted_text[:200]}...")
            
            # Get AI Analysis
            analysis = analyze_report_with_gemini(extracted_text)
            
            return Response({
                "analysis": analysis,
                "extracted_text_preview": extracted_text[:500] + "..." if len(extracted_text) > 500 else extracted_text
            }, status=status.HTTP_200_OK)

        except Exception as e:
            print(f"❌ ERROR: An unexpected error occurred: {e}")
            return Response({
                "error": "An internal error occurred during processing."
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
