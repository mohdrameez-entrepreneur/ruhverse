from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from authentication import views as auth_views

def root_index(request):
    return JsonResponse({
        'service': 'RuhVerse Backend API',
        'status': 'online',
        'version': '1.0.0',
        'endpoints': {
            'health': '/api/health/',
            'articles': '/api/articles/',
            'deferred_feed': '/api/deferred-feed/',
            'auth': '/api/auth/'
        }
    })

urlpatterns = [
    path('', root_index, name='root_index'),
    path('admin/', admin.site.urls),
    # Articles endpoints
    path('api/', include('articles.urls')),
    # Auth namespace
    path('api/auth/', include('authentication.urls')),
    # Direct web compatibility endpoints
    path('api/auth/me', auth_views.auth_me, name='web_auth_me'),
    path('api/bookmarks', auth_views.user_bookmarks, name='web_bookmarks'),
    path('api/bookmarks/<int:surah_number>/<int:ayah_number>', auth_views.delete_single_bookmark, name='web_delete_single_bookmark'),
    path('api/progress', auth_views.user_progress, name='web_progress'),
]
