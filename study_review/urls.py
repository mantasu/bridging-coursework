from django.contrib import admin
from django.urls import path, include
from home import index

urlpatterns = [
    path('', index.index, name='home'),
    path('admin/', admin.site.urls),
    path('blog/', include('blog.urls')),
]
