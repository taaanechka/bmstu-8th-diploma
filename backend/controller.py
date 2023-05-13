from flask import Flask, request, jsonify, render_template

import os
from dotenv import load_dotenv

from backend.model import RouteRecommenderModel


class RouteRecommenderController:
    def __init__(self, model: RouteRecommenderModel, config_file):
        self.app = Flask('rs-diploma', template_folder='./templates/')
        self.__model = model

        try:
            dotenv_path = os.path.join(os.path.dirname(__file__), config_file)
            if os.path.exists(dotenv_path):
                load_dotenv(dotenv_path)

            self.host = os.environ.get('server_host')
            self.port = os.environ.get('server_port')

        except Exception as e:
            print(e)

        self.app.json.ensure_ascii = False  # для нормального отображения utf-8

        self.__setup_routes()

    def run(self):
        self.app.run(host=self.host, port=self.port)

    def __setup_routes(self):
        # Frontend
        self.__login_page = self.app.route('/login', methods=['GET'])(self.__login_page)
        self.__register_page = self.app.route('/register', methods=['GET'])(self.__register_page)
        self.__route_builder_page = self.app.route('/route_builder', methods=['GET'])(self.__route_builder_page)
        self.__story_page = self.app.route('/story', methods=['GET'])(self.__story_page)
        # Backend
        self.__login = self.app.route('/api/v1/login', methods=['GET'])(self.__login)
        self.__register = self.app.route('/api/v1/register', methods=['POST'])(self.__register)
        self.__get_story = self.app.route('/api/v1/story', methods=['GET'])(self.__get_story)
        self.__get_categories = self.app.route('/api/v1/categories', methods=['GET'])(self.__get_categories)
        self.__get_stations = self.app.route('/api/v1/metro', methods=['GET'])(self.__get_stations)
        self.__get_recommended_route = self.app.route('/api/v1/user/<string:user_id>/route/recommend', methods=['GET'])(self.__get_recommended_route)
        self.__safe_feedback = self.app.route('/api/v1/user/<string:user_id>/route/feedback', methods=['POST'])(self.__safe_feedback)

    # Frontend
    def __login_page(self):
        return render_template('login.html')

    def __register_page(self):
        return render_template('register.html')

    def __route_builder_page(self):
        return render_template('route-builder.html')

    def __story_page(self):
        return render_template('story.html')

    # Backend
    def __login(self):
        login = request.args.get('login')
        password = request.args.get('password')
        token, user_id, error = self.__model.login(login, password)
        if error is not None:
            return jsonify({"error": error}), 400
        return jsonify({"token": token, "user_id": user_id}), 200

    def __register(self):
        login = request.args.get('login')
        password = request.args.get('password')
        token, user_id, error = self.__model.register(login, password)
        if error is not None:
            return jsonify({"error": error}), 400
        return jsonify({"token": token, "user_id": user_id}), 200

    def __get_story(self):
        user_id = request.args.get('id')
        return jsonify({"story": self.__model.get_story(user_id)}), 200

    def __get_stations(self):
        return jsonify({"metro_stations": self.__model.get_stations()}), 200

    def __get_categories(self):
        return jsonify({"categories": self.__model.get_categories()}), 200

    def __get_recommended_route(self, user_id):
        token = request.headers['Authorization'].split()[1]
        included_categories = request.args.get('included_categories').split(',')
        if included_categories == ['']:
            included_categories = []
        soft_excluded_categories = request.args.get('soft_excluded_categories').split(',')
        if soft_excluded_categories == ['']:
            soft_excluded_categories = []
        hard_excluded_categories = request.args.get('hard_excluded_categories').split(',')
        if hard_excluded_categories == ['']:
            hard_excluded_categories = []
        start_point = request.args.get('start_point')
        start_time = request.args.get('start_time')
        end_time = request.args.get('end_time')
        use_prev_history = bool(int(request.args.get('use_prev_history')))
        use_common_weights = bool(int(request.args.get('use_common_weights')))
        exclude_low_rang_routes = bool(int(request.args.get('exclude_low_rang_routes')))
        lvl_saturation_stay = float(request.args.get('lvl_saturation_stay'))
        lvl_activity = request.args.get('lvl_activity')
        data, rid, error = self.__model.get_recommended_route(
            token,
            user_id,
            included_categories,
            soft_excluded_categories,
            hard_excluded_categories,
            start_point,
            start_time,
            end_time,
            use_prev_history,
            use_common_weights,
            exclude_low_rang_routes,
            lvl_saturation_stay,
            lvl_activity
        )
        if error is not None:
            return jsonify({"error": error}), 400
        return jsonify(
            {
                'rid': str(rid),
                'routes': data
            }
        ), 200

    def __safe_feedback(self, user_id):
        rid = request.args.get('rid')
        feedback = request.json['feedback']
        self.__model.safe_feedback(rid, feedback)
        return jsonify({}), 200