from src.controller import RouteRecommenderController
from src.model import RouteRecommenderModel
from src.repository import RouteRecommenderRepository
from src.token_manager import TokenManager


class RouteRecommenderFactory:
    def __init__(self, config_file='../config/.env'):
        self.__config = config_file

    def makeController(self):
        repo = RouteRecommenderRepository(self.__config)
        token_manager = TokenManager(self.__config)
        model = RouteRecommenderModel(repo, token_manager)
        return RouteRecommenderController(model, self.__config)