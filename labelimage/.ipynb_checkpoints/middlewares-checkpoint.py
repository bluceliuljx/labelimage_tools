"""
simple middlware to block IP addresses via settings variable BLOCKED_IPS
"""
from django.conf import settings
from django import http

class BlockedIpMiddleware(object):
    def __init__(self, get_response):
            self.get_response = get_response

    def __call__(self, request):
        if request.META['REMOTE_ADDR'] in settings.BLOCKED_IPS:
            return http.HttpResponseForbidden('<h1>Forbidden</h1>')
        return self.get_response(request)
