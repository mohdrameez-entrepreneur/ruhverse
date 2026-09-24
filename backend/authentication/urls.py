from django.urls import path
from . import views

app_name = 'authentication'

urlpatterns = [
    # Mobile auth endpoints
    path('config/', views.auth_config, name='auth_config'),
    path('google/url/', views.google_auth_url, name='google_auth_url'),
    path('verify-session/', views.verify_session, name='verify_session'),
    path('me/', views.auth_me, name='auth_me'),
    path('user/profile/', views.user_profile, name='user_profile'),
    path('user/bookmarks/', views.user_bookmarks, name='user_bookmarks'),
    path('user/progress/', views.user_progress, name='user_progress'),
]
