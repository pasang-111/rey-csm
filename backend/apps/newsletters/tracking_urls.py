
from django.urls import path
from .tracking import track_open, track_unsubscribe, track_click

urlpatterns = [
    path("open/<uuid:token>.gif", track_open, name="track-open"),
    path("click/<uuid:token>/", track_click, name="track-click"),
    path("unsubscribe/<uuid:token>/", track_unsubscribe, name="track-unsubscribe"),
]
