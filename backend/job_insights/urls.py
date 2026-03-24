
from django.urls import path
from .views import JobInsightsView, MarketAnalysisView, MatchCVView

urlpatterns = [
    path('', JobInsightsView.as_view(), name='insights'),
    path('market/', MarketAnalysisView.as_view(), name='market-analysis'),
    path('match-cv/', MatchCVView.as_view(), name='match-cv'),
]
