from backend.factory import RouteRecommenderFactory

if __name__ == '__main__':
    factory = RouteRecommenderFactory()
    controller = factory.makeController()
    controller.run()
