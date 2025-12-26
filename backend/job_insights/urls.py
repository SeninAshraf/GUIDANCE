
from django.urls import path
from .views import JobInsightsView, MarketAnalysisView

urlpatterns = [
    path('', JobInsightsView.as_view(), name='insights'),
    path('market/', MarketAnalysisView.as_view(), name='market-analysis'),
]
