import httpx, json

def query(q, category):
    params = {
        'q': q,
        'category': category,
        'page': 1,
        'page_size': 20,
    }
    try:
        r = httpx.get('http://127.0.0.1:8000/api/resources/search', params=params, timeout=10.0)
        r.raise_for_status()
        data = r.json()
        results = data.get('results', [])
        print(f'Query "{q}" cat "{category}" -> {len(results)} results')
        for item in results[:3]:
            print('  ', item.get('name'), item.get('url'))
    except Exception as e:
        print('Error for', q, category, e)

queries = [
    ('python', 'All'),
    ('python', 'Documentation'),
    ('react', 'Libraries'),
    ('tensorflow', 'Tools'),
]
for q, cat in queries:
    query(q, cat)
