from django.contrib import admin
from django.urls import path, include
from authentication import views as auth_views

urlpatterns = [
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
