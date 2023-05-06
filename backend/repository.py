from pymongo import MongoClient
from bson.objectid import ObjectId

import os
from dotenv import load_dotenv


class RouteRecommenderRepository:

    def __init__(self, config_file):
        try:
            dotenv_path = os.path.join(os.path.dirname(__file__), config_file)
            if os.path.exists(dotenv_path):
                load_dotenv(dotenv_path)

            self.__user = os.environ.get('db_user')
            self.__password = os.environ.get('db_password')
            self.__host = os.environ.get('db_host')
            self.__port = os.environ.get('db_port')

            self.__client = MongoClient('mongodb://' + 
                                        self.__user + ':' + self.__password + 
                                        '@' + self.__host + ':' + self.__port + '/')

        except Exception as e:
            print(e)

    def login(self, login, password):
        db = self.__client['rs-route']
        user = db.users.find_one({
            'login': login,
            'password': password
        })
        if user is None:
            return None
        else:
            return str(user['_id'])

    def register(self, login, password):
        db = self.__client['rs-route']
        if db.users.find_one({'login': login}) is not None:
            return None

        new_user = {
            'login': login,
            'password': password
        }
        user_id = db.users.insert_one(new_user).inserted_id
        return str(user_id)

    def get_all_places(self):
        db = self.__client['rs-route']
        places = db.places.find()

        res = [place for place in places if len(place['categories']) != 0]

        return res
    
    def get_places_by_lvl_activity(self, lvl_activity):
        db = self.__client['rs-route']
        categories = db.categories.find({"lvl_activity": lvl_activity})
        names = [category['name'] for category in categories]
        places = self.get_all_places()

        res_places = [place for place in places if set(place['categories']).intersection(set(names))]
        print("len filtered_places: ", len(res_places))

        return res_places

    def get_places(self, places_data):
        db = self.__client['rs-route']
        places = []
        for place_data in places_data:
            place = db.places.find_one({'_id': place_data['place_id']})
            place['rang'] = place_data['rang']
            places.append(place)
        return places

    def get_user(self, user_id):
        db = self.__client['rs-route']
        user = db.users.find_one({
            '_id': ObjectId(user_id)
        })
        return user

    def get_story(self, user_id):
        db = self.__client['rs-route']
        requests = db.requests.find({'user_id': user_id})
        story = []
        for request in requests:
            story.append({
                'included_categories': request['included_categories'],
                'soft_excluded_categories': request['soft_excluded_categories'],
                'hard_excluded_categories': request['hard_excluded_categories'],
                'start_point': request['start_point'],
                'use_prev_history': request['use_prev_history'],
                'use_common_weights': request['use_common_weights'],
                'exclude_low_rang_routes': request['exclude_low_rang_routes'],
                'lvl_saturation_stay': request['lvl_saturation_stay'],
                'lvl_activity': request['lvl_activity']
            })
        return story
    
    def get_last_request(self, user_id):
        db = self.__client['rs-route']
        cursor = db.requests.find({'user_id': user_id}).sort('_id', -1)

        u_reqs = [el for el in cursor]
        if len(u_reqs) == 0:
            return None, "Отсутствует история запросов пользователя"
        
        req = u_reqs[0]
        res = {
            'included_categories': req['included_categories'],
            'soft_excluded_categories': req['soft_excluded_categories'],
            'hard_excluded_categories': req['hard_excluded_categories']
        }
        return res, None

    def update_user_vector(self, user_id, new_vector):
        db = self.__client['rs-route']
        user = db.users.update_one(
            {'_id': ObjectId(user_id)},
            {'$set': {'categories': new_vector}}
        )

    def get_categories_weight_vector(self, use_common_weights):
        db = self.__client['rs-route']
        weights = []
        if use_common_weights:
            weights = db.common_weights.find()
        else:
            weights = db.uncommon_weights.find()

        weights_dict = dict()
        for weight in weights:
            weights_dict[weight['category']] = weight['weight']
        return weights_dict

    def get_stations(self):
        db = self.__client['rs-route']
        return db.stations.find()

    def get_categories(self):
        db = self.__client['rs-route']
        categories = db.categories.find()
        res = [category for category in categories]
        return res

    def get_station(self, name):
        db = self.__client['rs-route']
        return db.stations.find_one({'name': name})

    def safe_request(self, data):
        db = self.__client['rs-route']
        rid = db.requests.insert_one(data).inserted_id
        return rid

    def get_request(self, rid):
        db = self.__client['rs-route']
        return db.requests.find_one({'_id': ObjectId(rid)})

    def safe_feedback(self, rid, feedback):
        db = self.__client['rs-route']
        db.feedbacks.insert_one(feedback)
