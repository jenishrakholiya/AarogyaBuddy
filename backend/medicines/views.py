# medicines/views.py

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Medicine
from .serializers import MedicineSerializer
import requests
import xml.etree.ElementTree as ET
import re
from bs4 import BeautifulSoup
import time
import urllib.parse

def query_medlineplus_api(medicine_name):
    """
    Queries the official MedlinePlus Web Service API for drug information.
    This is the most robust and reliable method.
    """
    print(f"\n--- QUERYING MedlinePlus API for '{medicine_name}' ---")
    try:
        # This is the correct, official API endpoint
        base_url = "https://wsearch.nlm.nih.gov/ws/query"
        
        params = {
            'db': 'healthTopics',
            'term': medicine_name,
            'rettype': 'all' # Get all available information
        }
        
        print(f"1. Fetching API data from: {base_url} with params: {params}")
        
        response = requests.get(base_url, params=params, timeout=15)
        response.raise_for_status()
        
        # The API returns XML, so we parse it
        root = ET.fromstring(response.content)
        
        # Find the first health topic in the results
        first_result = root.find('.//document')
        
        if first_result is None:
            print("   - INFO: No results found in the MedlinePlus API.")
            # FALLBACK TO OTHER SOURCES
            return fallback_drug_search(medicine_name)

        print("2. Found results. Parsing XML data...")
        
        # Your existing improved scraping section
        def get_text(element, path):
            found = element.find(path)
            if found is not None and found.text:
                return clean_extracted_text(found.text.strip())
            return None

        def clean_extracted_text(text):
            """Clean and format extracted text properly."""
            if not text:
                return None
            
            # Remove HTML tags if present
            text = re.sub(r'<[^>]+>', '', text)
            # Remove extra whitespaces and normalize
            text = re.sub(r'\s+', ' ', text)
            # Remove special characters that cause formatting issues
            text = re.sub(r'[^\w\s.,;:!?()-]', ' ', text)
            # Clean up multiple spaces
            text = re.sub(r'\s+', ' ', text)
            return text.strip()

        def extract_detailed_info(summary_text):
            """Extract structured information from summary text."""
            if not summary_text:
                return "Not specified.", "Not specified."
            
            uses = "Not specified."
            side_effects = "Not specified."
            
            # Extract uses/indications
            use_patterns = [
                r'(?:used to treat|treats|treatment (?:of|for)|indicated for|prescribed for)\s+([^.!?]+)',
                r'(?:helps (?:treat|with)|effective (?:for|against))\s+([^.!?]+)',
                r'(?:medication is used|drug is used|medicine is used)\s+(?:to|for)\s+([^.!?]+)'
            ]
            
            for pattern in use_patterns:
                match = re.search(pattern, summary_text, re.IGNORECASE)
                if match:
                    uses = clean_extracted_text(match.group(1))
                    break
            
            # If no specific pattern found, look for treatment-related sentences
            if uses == "Not specified.":
                sentences = summary_text.split('.')
                for sentence in sentences:
                    if any(keyword in sentence.lower() for keyword in ['treat', 'therapy', 'condition', 'disease', 'disorder']):
                        uses = clean_extracted_text(sentence)
                        break
            
            # Extract side effects
            side_effect_patterns = [
                r'(?:side effects?|adverse (?:effects?|reactions?)|may cause|can cause)\s*(?:include|are|:)?\s*([^.!?]+)',
                r'(?:common side effects?|possible (?:side effects?|reactions?))\s*(?:include|are|:)?\s*([^.!?]+)',
                r'(?:warning|caution|alert)[^.!?]*([^.!?]*(?:effects?|reactions?)[^.!?]*)'
            ]
            
            for pattern in side_effect_patterns:
                match = re.search(pattern, summary_text, re.IGNORECASE)
                if match:
                    side_effects = clean_extracted_text(match.group(1))
                    break
            
            # If no specific pattern found, look for warning-related sentences
            if side_effects == "Not specified.":
                sentences = summary_text.split('.')
                for sentence in sentences:
                    if any(keyword in sentence.lower() for keyword in ['side effect', 'warning', 'caution', 'adverse', 'reaction']):
                        side_effects = clean_extracted_text(sentence)
                        break
            
            return uses, side_effects

        def scrape_medlineplus_page_if_available(element):
            """Try to get better information by scraping the actual page."""
            try:
                # Look for URL in the XML
                url_element = element.find('.//content[@name="url"]')
                if url_element is not None and url_element.text:
                    page_url = url_element.text.strip()
                    print(f"   - Found page URL: {page_url}")
                    
                    # Scrape the actual page
                    headers = {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                    }
                    
                    page_response = requests.get(page_url, headers=headers, timeout=10)
                    if page_response.status_code == 200:
                        soup = BeautifulSoup(page_response.content, 'html.parser')
                        
                        # Extract main content from the page
                        main_content = ""
                        content_selectors = [
                            '#mplus-content',
                            '.section-body', 
                            '#topic-summary',
                            'main .content',
                            'article'
                        ]
                        
                        for selector in content_selectors:
                            content_elem = soup.select_one(selector)
                            if content_elem:
                                main_content = content_elem.get_text()
                                break
                        
                        if main_content:
                            print("   - Successfully scraped page content")
                            return clean_extracted_text(main_content)
                
            except Exception as e:
                print(f"   - Could not scrape page: {e}")
            
            return None

        page_title = get_text(first_result, ".//content[@name='title']") or medicine_name.title()
        
        # Check if this is generic information instead of specific medicine
        generic_terms = ['pain relievers', 'blood thinners', 'antibiotics', 'medicines', 'drugs']
        if any(term in page_title.lower() for term in generic_terms) and medicine_name.lower() not in page_title.lower():
            print(f"   - Got generic info '{page_title}', trying other sources")
            return fallback_drug_search(medicine_name)
        
        # Try to get better content by scraping the actual page first
        scraped_content = scrape_medlineplus_page_if_available(first_result)
        
        if scraped_content:
            full_summary = scraped_content
            print("   - Using scraped page content")
        else:
            # Fall back to XML content
            full_summary = get_text(first_result, ".//content[@name='FullSummary']")
            if not full_summary:
                # Try alternative XML paths
                alt_paths = [
                    ".//content[@name='summary']", 
                    ".//content[@name='organizationName']",
                    ".//content[@name='description']"
                ]
                for path in alt_paths:
                    full_summary = get_text(first_result, path)
                    if full_summary:
                        break
            print("   - Using XML summary content")
        
        # If still no useful content, try other sources
        if not full_summary or full_summary == "Not specified.":
            print("   - No useful content from MedlinePlus, trying other sources")
            return fallback_drug_search(medicine_name)
        
        uses, side_effects = extract_detailed_info(full_summary)
        
        print("3. Parsing complete.")
        return {
            'source': 'MedlinePlus API (Live)',
            'medicine_name': page_title,
            'treats_disease': uses,
            'side_effects': side_effects,
            'frequency': 'Consult your doctor or pharmacist',
            'meal_relation': 'Consult your doctor or pharmacist',
        }

    except requests.exceptions.RequestException as e:
        print(f"   - CRITICAL ERROR during API request: {e}")
        return fallback_drug_search(medicine_name)
    except ET.ParseError as e:
        print(f"   - CRITICAL ERROR parsing XML response: {e}")
        return fallback_drug_search(medicine_name)

# NEW FALLBACK SCRAPING FUNCTIONS
def fallback_drug_search(medicine_name):
    """Try multiple drug databases when MedlinePlus fails"""
    print(f"\n--- FALLBACK SEARCH for '{medicine_name}' ---")
    
    scrapers = [
        scrape_drugs_com,
        scrape_rxlist, 
        scrape_webmd,
        scrape_medscape
    ]
    
    for scraper in scrapers:
        try:
            print(f"Trying {scraper.__name__}...")
            result = scraper(medicine_name)
            
            if result and is_valid_result(result, medicine_name):
                print(f"✓ SUCCESS with {scraper.__name__}")
                return result
            
            time.sleep(1)  # Small delay between attempts
            
        except Exception as e:
            print(f"✗ {scraper.__name__} failed: {e}")
            continue
    
    print("✗ All fallback sources failed")
    return None

def is_valid_result(result, medicine_name):
    """Check if the result contains valid medicine information"""
    if not result:
        return False
    
    treats = result.get('treats_disease', '')
    side_effects = result.get('side_effects', '')
    
    # Check if we got meaningful content
    invalid_responses = [
        'not available', 'not specified', 'information not available',
        'no specific information', 'consult healthcare', 'access denied'
    ]
    
    treats_valid = treats and len(treats) > 30 and not any(phrase in treats.lower() for phrase in invalid_responses)
    effects_valid = side_effects and len(side_effects) > 20 and not any(phrase in side_effects.lower() for phrase in invalid_responses)
    
    return treats_valid or effects_valid

def scrape_drugs_com(medicine_name):
    """Scrape Drugs.com"""
    try:
        clean_name = medicine_name.lower().replace(' ', '-').replace('(', '').replace(')', '')
        url = f"https://www.drugs.com/{clean_name}.html"
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        }
        
        response = requests.get(url, headers=headers, timeout=15)
        
        if response.status_code != 200:
            # Try search
            search_url = f"https://www.drugs.com/search.php?searchterm={urllib.parse.quote(medicine_name)}"
            response = requests.get(search_url, headers=headers, timeout=15)
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Find exact medicine link
            for link in soup.find_all('a', href=re.compile(r'^/.*\.html$')):
                if medicine_name.lower() in link.get_text().lower():
                    url = "https://www.drugs.com" + link['href']
                    response = requests.get(url, headers=headers, timeout=15)
                    break
            else:
                return None
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Get medicine name
        title = soup.find('h1')
        medicine_title = title.get_text().strip() if title else medicine_name.title()
        
        # Extract uses
        uses = extract_drug_uses(soup)
        side_effects = extract_drug_side_effects(soup)
        
        return {
            'source': 'Drugs.com',
            'medicine_name': medicine_title,
            'treats_disease': uses,
            'side_effects': side_effects,
            'frequency': 'Follow prescription instructions',
            'meal_relation': 'Check with pharmacist',
        }
        
    except Exception as e:
        return None

def scrape_rxlist(medicine_name):
    """Scrape RxList.com"""
    try:
        search_url = f"https://www.rxlist.com/script/main/srchcont_rxlist.asp?src={urllib.parse.quote(medicine_name)}"
        
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
        
        response = requests.get(search_url, headers=headers, timeout=15)
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Find first drug result
        drug_link = soup.find('a', href=re.compile(r'.*drug.*\.htm'))
        if not drug_link:
            return None
        
        drug_url = drug_link['href']
        if not drug_url.startswith('http'):
            drug_url = "https://www.rxlist.com" + drug_url
        
        response = requests.get(drug_url, headers=headers, timeout=15)
        soup = BeautifulSoup(response.content, 'html.parser')
        
        title = soup.find('h1')
        medicine_title = title.get_text().strip() if title else medicine_name.title()
        
        uses = extract_drug_uses(soup)
        side_effects = extract_drug_side_effects(soup)
        
        return {
            'source': 'RxList',
            'medicine_name': medicine_title,
            'treats_disease': uses,
            'side_effects': side_effects,
            'frequency': 'As prescribed',
            'meal_relation': 'Check drug label',
        }
        
    except Exception as e:
        return None

def scrape_webmd(medicine_name):
    """Scrape WebMD"""
    try:
        search_url = f"https://www.webmd.com/drugs/2/search?type=drugs&query={urllib.parse.quote(medicine_name)}"
        
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
        
        response = requests.get(search_url, headers=headers, timeout=15)
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Find drug link
        drug_link = soup.find('a', href=re.compile(r'/drugs/2/drug'))
        if not drug_link:
            return None
        
        drug_url = "https://www.webmd.com" + drug_link['href']
        response = requests.get(drug_url, headers=headers, timeout=15)
        soup = BeautifulSoup(response.content, 'html.parser')
        
        title = soup.find('h1')
        medicine_title = title.get_text().strip() if title else medicine_name.title()
        
        uses = extract_drug_uses(soup)
        side_effects = extract_drug_side_effects(soup)
        
        return {
            'source': 'WebMD',
            'medicine_name': medicine_title,
            'treats_disease': uses,
            'side_effects': side_effects,
            'frequency': 'As directed by doctor',
            'meal_relation': 'Follow instructions',
        }
        
    except Exception as e:
        return None

def scrape_medscape(medicine_name):
    """Scrape Medscape"""
    try:
        clean_name = medicine_name.lower().replace(' ', '-')
        url = f"https://reference.medscape.com/drug/{clean_name}"
        
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
        
        response = requests.get(url, headers=headers, timeout=15)
        soup = BeautifulSoup(response.content, 'html.parser')
        
        title = soup.find('h1')
        medicine_title = title.get_text().strip() if title else medicine_name.title()
        
        uses = extract_drug_uses(soup)
        side_effects = extract_drug_side_effects(soup)
        
        return {
            'source': 'Medscape',
            'medicine_name': medicine_title,
            'treats_disease': uses,
            'side_effects': side_effects,
            'frequency': 'Follow medical prescription',
            'meal_relation': 'Check with doctor',
        }
        
    except Exception as e:
        return None

def extract_drug_uses(soup):
    """Extract drug uses from any webpage"""
    # Look for uses in headers
    use_headers = soup.find_all(['h2', 'h3', 'h4'], string=re.compile(r'use|indication|what.*for', re.I))
    
    for header in use_headers:
        next_content = header.find_next(['p', 'div', 'ul'])
        if next_content and len(next_content.get_text()) > 20:
            return clean_scraped_text(next_content.get_text())
    
    # Look in paragraphs
    for p in soup.find_all('p'):
        text = p.get_text()
        if re.search(r'used to treat|prescribed for|indicated for', text, re.I):
            return clean_scraped_text(text)
    
    return "Consult healthcare provider for usage information"

def extract_drug_side_effects(soup):
    """Extract side effects from any webpage"""
    # Look for side effects in headers
    se_headers = soup.find_all(['h2', 'h3', 'h4'], string=re.compile(r'side effect|adverse|warning', re.I))
    
    for header in se_headers:
        next_content = header.find_next(['p', 'div', 'ul'])
        if next_content and len(next_content.get_text()) > 20:
            return clean_scraped_text(next_content.get_text())
    
    # Look in paragraphs
    for p in soup.find_all('p'):
        text = p.get_text()
        if re.search(r'side effects|may cause|adverse reactions', text, re.I):
            return clean_scraped_text(text)
    
    return "Consult healthcare provider for side effect information"

def clean_scraped_text(text):
    """Clean scraped text"""
    if not text:
        return "Information not available"
    
    text = re.sub(r'\s+', ' ', text).strip()
    text = re.sub(r'[^\w\s.,;:!?()\-/]', '', text)
    
    if len(text) > 300:
        sentences = text[:300].rsplit('.', 1)
        if len(sentences) > 1 and len(sentences[0]) > 50:
            text = sentences + '.'
        else:
            text = text[:300] + "..."
    
    return text

class MedicineSearchView(APIView):
    """
    Hybrid search view. First checks local DB, then falls back to the MedlinePlus API.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        search_term = request.query_params.get('search', None)
        if not search_term or len(search_term) < 2:
            return Response({"error": "A search term of at least 2 characters is required."}, status=status.HTTP_400_BAD_REQUEST)

        db_results = Medicine.objects.filter(medicine_name__icontains=search_term)
        if db_results.exists():
            serializer = MedicineSerializer(db_results, many=True)
            return Response(serializer.data)

        # Updated to call the new MedlinePlus API function
        api_data = query_medlineplus_api(search_term)
        if api_data:
            return Response([api_data])

        return Response([])
