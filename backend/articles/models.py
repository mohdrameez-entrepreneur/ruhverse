from django.db import models


class Article(models.Model):
    id = models.CharField(max_length=64, primary_key=True)
    slug = models.SlugField(max_length=255, unique=True, db_index=True)
    title = models.CharField(max_length=255)
    category = models.CharField(max_length=100, db_index=True)
    excerpt = models.TextField(blank=True)
    content = models.TextField()
    cover_image_url = models.URLField(max_length=500, blank=True)
    reading_time = models.CharField(max_length=50, blank=True)
    word_count = models.PositiveIntegerField(default=0)
    author = models.CharField(max_length=100, default='RuhVerse Editorial')
    is_published = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title

    def to_dict(self, include_content=False):
        data = {
            'id': self.id,
            'slug': self.slug,
            'title': self.title,
            'category': self.category,
            'excerpt': self.excerpt,
            'cover_image_url': self.cover_image_url,
            'reading_time': self.reading_time,
            'word_count': self.word_count,
            'author': self.author,
            'is_published': self.is_published,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
        if include_content:
            data['content'] = self.content
        return data
