from backend.controller import RouteRecommenderController
from backend.model import RouteRecommenderModel
from backend.repository import RouteRecommenderRepository
from backend.token_manager import TokenManager


class RouteRecommenderFactory:
    def __init__(self, config_file='./config/.env'):
        self.__config = config_file

    def createController(self):
        repo = RouteRecommenderRepository(self.__config)
        token_manager = TokenManager(self.__config)
        model = RouteRecommenderModel(repo, token_manager)
        return RouteRecommenderController(model, self.__config)