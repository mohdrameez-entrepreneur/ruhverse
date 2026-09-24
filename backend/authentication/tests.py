from django.test import TestCase, Client
from django.urls import reverse

class AuthenticationApiTestCase(TestCase):
    def setUp(self):
        self.client = Client()

    def test_auth_config(self):
        res = self.client.get(reverse('authentication:auth_config'))
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data['success'])
        self.assertIn('supabase_url', data)
        self.assertIn('supabase_anon_key', data)

    def test_google_auth_url(self):
        res = self.client.get(reverse('authentication:google_auth_url') + '?redirect_to=ruhverse://auth/callback')
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data['success'])
        self.assertIn('provider=google', data['auth_url'])

    def test_protected_endpoints_require_token(self):
        for ep in ['user_profile', 'user_bookmarks', 'user_progress']:
            res = self.client.get(reverse(f'authentication:{ep}'))
            self.assertEqual(res.status_code, 401)

    def test_web_compatibility_routes_exist(self):
        # Without token, web routes return 401
        res1 = self.client.get('/api/bookmarks')
        self.assertEqual(res1.status_code, 401)
        res2 = self.client.get('/api/progress')
        self.assertEqual(res2.status_code, 401)
        res3 = self.client.get('/api/auth/me')
        self.assertEqual(res3.status_code, 401)
