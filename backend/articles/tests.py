from django.test import TestCase, Client
from django.urls import reverse
from articles.models import Article

class ArticleApiTestCase(TestCase):
    def setUp(self):
        self.client = Client()
        self.article = Article.objects.create(
            id='test-1',
            slug='test-article',
            title='Test Article Title',
            category='Faith & Youth',
            excerpt='Test excerpt here...',
            content='<article class="article-body"><p>Test content paragraph</p></article>',
            word_count=120,
            reading_time='1 min read',
            is_published=True
        )

    def test_health_check(self):
        res = self.client.get(reverse('articles:health_check'))
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()['status'], 'ok')

    def test_list_articles(self):
        res = self.client.get(reverse('articles:list_articles'))
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data['success'])
        self.assertEqual(data['total'], 1)
        self.assertEqual(data['data'][0]['slug'], 'test-article')
        # Ensure content is excluded from list view for lightweight payload
        self.assertNotIn('content', data['data'][0])

    def test_get_article_detail(self):
        res = self.client.get(reverse('articles:get_article', kwargs={'slug': 'test-article'}))
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data['success'])
        self.assertIn('content', data['data'])
        self.assertEqual(data['data']['title'], 'Test Article Title')

    def test_deferred_feed(self):
        res = self.client.get(reverse('articles:deferred_feed'))
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data['success'])
        self.assertTrue(data['deferred_sync'])
        self.assertIn('articles', data['data'])
        self.assertIn('categories', data['data'])
