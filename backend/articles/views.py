from django.http import JsonResponse
from django.views.decorators.http import require_GET
from django.db.models import Q
from django.utils import timezone
from .models import Article


@require_GET
def health_check(request):
    return JsonResponse({
        'status': 'ok',
        'service': 'ruhverse-django-backend',
        'timestamp': timezone.now().isoformat()
    })


@require_GET
def list_articles(request):
    """
    List articles with optional search & category filter.
    Returns metadata and excerpt (content excluded for fast payload).
    """
    queryset = Article.objects.filter(is_published=True)

    category = request.GET.get('category', '').strip()
    if category and category.lower() != 'all':
        queryset = queryset.filter(category__iexact=category)

    search = request.GET.get('search', '').strip()
    if search:
        queryset = queryset.filter(
            Q(title__icontains=search) |
            Q(excerpt__icontains=search) |
            Q(category__icontains=search)
        )

    try:
        limit = min(max(1, int(request.GET.get('limit', 20))), 100)
    except ValueError:
        limit = 20

    try:
        offset = max(0, int(request.GET.get('offset', 0)))
    except ValueError:
        offset = 0

    total = queryset.count()
    articles = [a.to_dict(include_content=False) for a in queryset[offset:offset + limit]]

    return JsonResponse({
        'success': True,
        'total': total,
        'limit': limit,
        'offset': offset,
        'data': articles
    })


@require_GET
def get_article(request, slug):
    """
    Retrieve full article by slug (including full HTML content).
    """
    try:
        article = Article.objects.get(slug=slug, is_published=True)
    except Article.DoesNotExist:
        return JsonResponse({
            'success': False,
            'error': f'Article with slug "{slug}" not found'
        }, status=404)

    # Fetch 2 related articles in same category
    related = [
        a.to_dict(include_content=False)
        for a in Article.objects.filter(
            category=article.category,
            is_published=True
        ).exclude(id=article.id)[:2]
    ]

    return JsonResponse({
        'success': True,
        'data': article.to_dict(include_content=True),
        'related': related
    })


@require_GET
def deferred_feed(request):
    """
    Deferred/Lazy loading endpoint for mobile app background fetch.
    Returns non-instant data: latest articles, distinct categories,
    and background sync metadata.
    """
    articles = [
        a.to_dict(include_content=False)
        for a in Article.objects.filter(is_published=True)[:10]
    ]

    categories = list(
        Article.objects.filter(is_published=True)
        .values_list('category', flat=True)
        .distinct()
    )

    return JsonResponse({
        'success': True,
        'server_time': timezone.now().isoformat(),
        'deferred_sync': True,
        'data': {
            'articles': articles,
            'categories': ['All'] + sorted(categories),
            'featured_article': articles[0] if articles else None,
        }
    })
