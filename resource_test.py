import sys, os, json
# Add backend to sys.path
backend_path = os.path.join(os.getcwd(), 'backend')
if backend_path not in sys.path:
    sys.path.append(backend_path)

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_query(q, category):
    params = {
        'q': q,
        'category': category,
        'page': 1,
        'page_size': 20
    }
    resp = client.get('/api/resources/search', params=params)
    if resp.status_code != 200:
        print(f'ERROR {resp.status_code} for {q}/{category}')
        return None
    data = resp.json()
    results = data.get('results', [])
    print(f'Query "{q}" category "{category}" returned {len(results)} items')
    # print first 2 sample URLs
    for item in results[:2]:
        print('  -', item.get('name'), item.get('url'))
    return results

queries = [
    ('python', 'All'),
    ('python', 'Documentation'),
    ('react', 'Libraries'),
    ('tensorflow', 'Tools')
]
for q, cat in queries:
    test_query(q, cat)
