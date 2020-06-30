from django.shortcuts import render
from django.utils import timezone
from .models import Post

def posts(request):
  posts = Post.objects.filter(published_date__lte=timezone.now()).order_by('published_date')
  css_path = "../../static/css/blog.css"
  js_path = "../../static/js/blog.js"
  title = "Blog"
  return render(request, 'blog/posts_base.html', { 'posts': posts, 'title': title, 'css_path': css_path, 'js_path': js_path })
