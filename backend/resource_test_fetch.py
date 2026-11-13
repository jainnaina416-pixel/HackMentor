import httpx, json, sys
url = 'http://127.0.0.1:8000/api/resources/search'
params = {'q': 'python', 'category': 'All', 'page': 1, 'page_size': 20}
try:
    resp = httpx.get(url, params=params, timeout=10.0)
    print('Status:', resp.status_code)
    print('Body:', resp.text)
except Exception as e:
    print('Error:', e)
