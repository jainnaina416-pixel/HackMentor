import asyncio
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_search():
    response = client.get('/api/resources/search', params={'q':'go','category':'All','page':1,'page_size':20})
    print('Status:', response.status_code)
    print('JSON:', response.json())

if __name__ == '__main__':
    test_search()
