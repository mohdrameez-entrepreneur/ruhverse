import json
import urllib.request
import urllib.error
import urllib.parse
from datetime import datetime, timezone
from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_POST, require_http_methods


def get_authenticated_user(request):
    """
    Validate Bearer token with Supabase and return user object or None.
    """
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        return None, 'Missing or invalid Authorization header'

    token = auth_header.split('Bearer ', 1)[1].strip()
    supabase_url = getattr(settings, 'SUPABASE_URL', '')
    supabase_anon = getattr(settings, 'SUPABASE_ANON_KEY', '')

    if not supabase_url or not supabase_anon:
        return None, 'Supabase not configured'

    req = urllib.request.Request(
        f'{supabase_url}/auth/v1/user',
        headers={
            'Authorization': f'Bearer {token}',
            'apikey': supabase_anon,
            'Content-Type': 'application/json'
        },
        method='GET'
    )
    try:
        with urllib.request.urlopen(req, timeout=5) as res:
            return json.loads(res.read().decode('utf-8')), None
    except urllib.error.HTTPError as e:
        return None, f'Authentication failed: HTTP {e.code}'
    except Exception as e:
        return None, f'Auth service unreachable: {str(e)}'


def supabase_rest_call(endpoint, method='GET', body=None, token=None, headers_extra=None):
    """
    Execute a query against the web Supabase REST API.
    """
    supabase_url = getattr(settings, 'SUPABASE_URL', '')
    service_key = getattr(settings, 'SUPABASE_SERVICE_ROLE_KEY', '')
    anon_key = getattr(settings, 'SUPABASE_ANON_KEY', '')

    auth_token = token or service_key or anon_key
    url = f"{supabase_url}/rest/v1/{endpoint.lstrip('/')}"

    headers = {
        'apikey': service_key or anon_key,
        'Authorization': f'Bearer {auth_token}',
        'Content-Type': 'application/json',
    }
    if headers_extra:
        headers.update(headers_extra)

    data = json.dumps(body).encode('utf-8') if body is not None else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)

    with urllib.request.urlopen(req, timeout=6) as response:
        content = response.read().decode('utf-8')
        return json.loads(content) if content else None


def format_bookmark_row(row):
    """Compatible format for both Web (camelCase) and Mobile (snake_case)"""
    return {
        'id': str(row.get('id', '')),
        'userId': row.get('user_id'),
        'user_id': row.get('user_id'),
        'surahNumber': row.get('surah_number'),
        'surah_number': row.get('surah_number'),
        'ayahNumber': row.get('ayah_number'),
        'ayah_number': row.get('ayah_number'),
        'note': row.get('note', ''),
        'createdAt': row.get('created_at'),
        'created_at': row.get('created_at'),
    }


def format_progress_row(row):
    """Compatible format for both Web and Mobile"""
    if not row:
        return None
    return {
        'userId': row.get('user_id'),
        'user_id': row.get('user_id'),
        'lastSurah': row.get('last_surah'),
        'last_surah': row.get('last_surah'),
        'lastAyah': row.get('last_ayah'),
        'last_ayah': row.get('last_ayah'),
        'updatedAt': row.get('updated_at'),
        'updated_at': row.get('updated_at'),
    }


@require_GET
def auth_config(request):
    """
    Securely returns only public client configuration.
    """
    return JsonResponse({
        'success': True,
        'supabase_url': getattr(settings, 'SUPABASE_URL', ''),
        'supabase_anon_key': getattr(settings, 'SUPABASE_ANON_KEY', ''),
        'oauth_providers': ['google']
    })


@require_GET
def google_auth_url(request):
    """
    Generate the Supabase Google OAuth authorization URL.
    """
    supabase_url = getattr(settings, 'SUPABASE_URL', '')
    if not supabase_url:
        return JsonResponse({'success': False, 'error': 'Supabase is not configured.'}, status=503)

    redirect_to = request.GET.get('redirect_to', 'ruhverse://auth/callback')
    scopes = request.GET.get('scopes', 'email profile')

    query_params = urllib.parse.urlencode({
        'provider': 'google',
        'redirect_to': redirect_to,
        'scopes': scopes,
    })
    auth_url = f"{supabase_url}/auth/v1/authorize?{query_params}"

    return JsonResponse({
        'success': True,
        'auth_url': auth_url,
        'redirect_to': redirect_to
    })


@csrf_exempt
@require_POST
def verify_session(request):
    """
    Verify a Supabase JWT token server-side and return user profile.
    """
    user, err = get_authenticated_user(request)
    if not user:
        return JsonResponse({'success': False, 'error': err or 'Unauthorized'}, status=401)

    return JsonResponse({
        'success': True,
        'user': {
            'id': user.get('id'),
            'email': user.get('email'),
            'full_name': user.get('user_metadata', {}).get('full_name') or user.get('user_metadata', {}).get('name', ''),
            'avatar_url': user.get('user_metadata', {}).get('avatar_url', ''),
            'provider': user.get('app_metadata', {}).get('provider', 'email')
        }
    })


@csrf_exempt
@require_GET
def auth_me(request):
    """
    Unified /api/auth/me endpoint for both web and mobile clients.
    """
    user, err = get_authenticated_user(request)
    if not user:
        return JsonResponse({'success': False, 'error': err or 'Unauthorized'}, status=401)

    user_id = user['id']
    profile = None
    try:
        rows = supabase_rest_call(f"profiles?select=*&id=eq.{user_id}&limit=1")
        if rows:
            profile = rows[0]
    except Exception:
        profile = None

    return JsonResponse({
        'success': True,
        'user': {
            'id': user_id,
            'email': user.get('email'),
            'full_name': user.get('user_metadata', {}).get('full_name') or user.get('user_metadata', {}).get('name', ''),
        },
        'profile': profile
    })


@csrf_exempt
@require_http_methods(['GET', 'PUT'])
def user_profile(request):
    """
    Sync user profile with the web database 'profiles' table.
    """
    user, err = get_authenticated_user(request)
    if not user:
        return JsonResponse({'success': False, 'error': err or 'Unauthorized'}, status=401)

    user_id = user['id']

    if request.method == 'GET':
        try:
            rows = supabase_rest_call(f"profiles?select=*&id=eq.{user_id}&limit=1")
            profile = rows[0] if rows else {
                'id': user_id,
                'email': user.get('email'),
                'full_name': user.get('user_metadata', {}).get('full_name', ''),
                'username': user.get('user_metadata', {}).get('username', ''),
            }
            return JsonResponse({'success': True, 'profile': profile})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)}, status=502)

    elif request.method == 'PUT':
        try:
            body = json.loads(request.body.decode('utf-8'))
            updates = {
                'full_name': body.get('full_name') or body.get('fullName'),
                'username': body.get('username'),
            }
            updates = {k: v for k, v in updates.items() if v is not None}
            res = supabase_rest_call(
                f"profiles?id=eq.{user_id}",
                method='PATCH',
                body=updates,
                headers_extra={'Prefer': 'return=representation'}
            )
            return JsonResponse({'success': True, 'profile': res[0] if res else updates})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)}, status=502)


@csrf_exempt
@require_http_methods(['GET', 'POST', 'DELETE'])
def user_bookmarks(request):
    """
    Unified bookmarks endpoint supporting both web and mobile payloads.
    """
    user, err = get_authenticated_user(request)
    if not user:
        return JsonResponse({'success': False, 'error': err or 'Unauthorized'}, status=401)

    user_id = user['id']

    if request.method == 'GET':
        try:
            rows = supabase_rest_call(
                f"bookmarks?select=*&user_id=eq.{user_id}&order=created_at.desc"
            ) or []
            formatted = [format_bookmark_row(r) for r in rows]
            return JsonResponse({'success': True, 'bookmarks': formatted})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)}, status=502)

    elif request.method == 'POST':
        try:
            body = json.loads(request.body.decode('utf-8'))
            surah_num = int(body.get('surah_number') or body.get('surahNumber'))
            ayah_num = int(body.get('ayah_number') or body.get('ayahNumber'))
            note = body.get('note', '')

            new_bookmark = [{
                'user_id': user_id,
                'surah_number': surah_num,
                'ayah_number': ayah_num,
                'note': note,
                'created_at': datetime.now(timezone.utc).isoformat()
            }]
            res = supabase_rest_call(
                'bookmarks?on_conflict=user_id,surah_number,ayah_number',
                method='POST',
                body=new_bookmark,
                headers_extra={'Prefer': 'resolution=merge-duplicates,return=representation'}
            )
            formatted = format_bookmark_row(res[0] if res else new_bookmark[0])
            return JsonResponse({'success': True, 'bookmark': formatted}, status=201)
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)}, status=400)

    elif request.method == 'DELETE':
        try:
            data = json.loads(request.body.decode('utf-8')) if request.body else {}
            surah_num = request.GET.get('surah_number') or request.GET.get('surahNumber') or data.get('surah_number') or data.get('surahNumber')
            ayah_num = request.GET.get('ayah_number') or request.GET.get('ayahNumber') or data.get('ayah_number') or data.get('ayahNumber')

            query = f"bookmarks?user_id=eq.{user_id}&surah_number=eq.{int(surah_num)}&ayah_number=eq.{int(ayah_num)}"
            supabase_rest_call(query, method='DELETE')
            return JsonResponse({'success': True, 'deleted': True})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)}, status=400)


@csrf_exempt
@require_http_methods(['DELETE'])
def delete_single_bookmark(request, surah_number, ayah_number):
    """
    Web compatible DELETE /api/bookmarks/<surah>/<ayah> endpoint.
    """
    user, err = get_authenticated_user(request)
    if not user:
        return JsonResponse({'success': False, 'error': err or 'Unauthorized'}, status=401)

    try:
        query = f"bookmarks?user_id=eq.{user['id']}&surah_number=eq.{int(surah_number)}&ayah_number=eq.{int(ayah_number)}"
        supabase_rest_call(query, method='DELETE')
        return JsonResponse({'success': True, 'deleted': True})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=400)


@csrf_exempt
@require_http_methods(['GET', 'POST'])
def user_progress(request):
    """
    Unified reading progress endpoint supporting both web and mobile payloads.
    """
    user, err = get_authenticated_user(request)
    if not user:
        return JsonResponse({'success': False, 'error': err or 'Unauthorized'}, status=401)

    user_id = user['id']

    if request.method == 'GET':
        try:
            rows = supabase_rest_call(f"user_progress?select=*&user_id=eq.{user_id}&limit=1")
            progress = format_progress_row(rows[0]) if rows else None
            return JsonResponse({'success': True, 'progress': progress})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)}, status=502)

    elif request.method == 'POST':
        try:
            body = json.loads(request.body.decode('utf-8'))
            surah_num = int(body.get('last_surah') or body.get('lastSurah') or body.get('surahNumber'))
            ayah_num = int(body.get('last_ayah') or body.get('lastAyah') or body.get('ayahNumber'))

            payload = [{
                'user_id': user_id,
                'last_surah': surah_num,
                'last_ayah': ayah_num,
                'updated_at': datetime.now(timezone.utc).isoformat()
            }]
            res = supabase_rest_call(
                'user_progress?on_conflict=user_id',
                method='POST',
                body=payload,
                headers_extra={'Prefer': 'resolution=merge-duplicates,return=representation'}
            )
            formatted = format_progress_row(res[0] if res else payload[0])
            return JsonResponse({'success': True, 'progress': formatted})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)}, status=400)
