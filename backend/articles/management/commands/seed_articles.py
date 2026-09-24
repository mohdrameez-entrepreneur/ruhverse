import json
import os
from pathlib import Path
from django.core.management.base import BaseCommand
from django.utils.dateparse import parse_datetime
from articles.models import Article

class Command(BaseCommand):
    help = 'Seed the database with RuhVerse articles from originalArticles.json'

    def handle(self, *args, **options):
        # Look for originalArticles.json in ruhverse-mobile or data directory
        base_dir = Path(__file__).resolve().parent.parent.parent.parent
        possible_paths = [
            base_dir / 'ruhverse-mobile' / 'src' / 'data' / 'originalArticles.json',
            base_dir.parent / 'ruhverse-mobile' / 'src' / 'data' / 'originalArticles.json',
            base_dir / 'data' / 'originalArticles.json',
        ]

        json_path = None
        for p in possible_paths:
            if p.exists():
                json_path = p
                break

        if not json_path:
            self.stderr.write(self.style.ERROR('Could not find originalArticles.json'))
            return

        self.stdout.write(f'Loading articles from {json_path}...')
        with open(json_path, 'r', encoding='utf-8') as f:
            articles = json.load(f)

        count = 0
        for item in articles:
            created_at = None
            if item.get('created_at'):
                created_at = parse_datetime(item['created_at'])

            obj, created = Article.objects.update_or_create(
                id=item['id'],
                defaults={
                    'slug': item['slug'],
                    'title': item['title'],
                    'category': item.get('category', 'General'),
                    'excerpt': item.get('excerpt', ''),
                    'content': item.get('content', ''),
                    'cover_image_url': item.get('cover_image_url', ''),
                    'reading_time': item.get('reading_time', ''),
                    'word_count': item.get('word_count', 0),
                    'author': item.get('author', 'RuhVerse Editorial'),
                    'is_published': True,
                    'created_at': created_at,
                }
            )
            count += 1
            action = 'Created' if created else 'Updated'
            self.stdout.write(f'  {action}: [{obj.id}] {obj.title[:45]} ({obj.word_count} words)')

        self.stdout.write(self.style.SUCCESS(f'Successfully seeded {count} articles into database!'))
