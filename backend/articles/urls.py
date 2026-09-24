from django.urls import path
from . import views

app_name = 'articles'

urlpatterns = [
    path('health/', views.health_check, name='health_check'),
    path('articles/', views.list_articles, name='list_articles'),
    path('articles/<slug:slug>/', views.get_article, name='get_article'),
    path('deferred-feed/', views.deferred_feed, name='deferred_feed'),
]
