"""labelimage URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/2.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.urls import path
from django.conf.urls import url
from django.conf.urls.static import static
from django.conf import settings
from labelimage import views


urlpatterns = [
    url(r'^$', views.mainpage),
    url(r'^video$', views.videopage),
    url(r'^select_sample$', views.select_sample),
    url(r'^deselect_sample$', views.deselect_sample),
    url(r'^load_work$', views.load_work),
    url(r'^save_work$', views.save_work),
    url(r'^get_batch_images$', views.get_batch_images),
    url(r'^save_all_work$', views.save_all_work),
    url(r'^shortvideostat$', views.shortvideostat),
    url(r'^load_json$', views.load_json),
    url(r'^segannot$', views.segannotpage),
    url(r'^update_tags$', views.update_tags),
    url(r'^get_tags$', views.get_tags),
] + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
