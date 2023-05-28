from backend.repository import RouteRecommenderRepository
from backend.token_manager import TokenManager

from collections import deque
import numpy as np
from scipy.spatial import distance
from datetime import datetime

from python_tsp.exact import solve_tsp_dynamic_programming

class RouteRecommenderModel:
    def __init__(self, repository: RouteRecommenderRepository, token_manager: TokenManager):
        self.__repo = repository
        self.__token_manager = token_manager

    def login(self, login, password):
        user_id = self.__repo.login(login, password)
        if user_id is not None:
            token = self.__token_manager.create_token(user_id)
            return token, user_id, None
        return None, None, "Wrong login or password"

    def register(self, login, password):
        user_id = self.__repo.register(login, password)
        if user_id is not None:
            token = self.__token_manager.create_token(user_id)
            return token, user_id, None
        return None, None, "User with this login already exists"

    def get_story(self, user_id):
        return self.__repo.get_story(user_id)

    def get_stations(self):
        stations = self.__repo.get_stations()
        station_names = [station['name'] for station in stations]
        return station_names

    def get_categories(self):
        categories = self.__repo.get_categories()
        categories_names = [category['name'] for category in categories]
        return categories_names

    def safe_feedback(self, rid, feedback):
        self.__repo.safe_feedback(rid, feedback)


    def get_recommended_route(
            self,
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
    ):
        error = self.__token_manager.verify_token(token, user_id)
        if error is not None:
            return None, None, error
        
        max_seconds = self.__get_max_seconds(start_time, end_time)
        if max_seconds <= 1800:
            return None, None, "По заданному промежутку времени невозможно сформировать маршрут"
        
        recommended_places, error = self.__get_recommended_places(
            user_id,
            included_categories,
            soft_excluded_categories,
            hard_excluded_categories,
            use_prev_history,
            use_common_weights,
            lvl_activity,
            exclude_low_rang_routes
        )
        if error is not None:
            return None, None, error
        

        filtered_places, max_seconds, error = self.__filter_places(recommended_places, start_point, max_seconds, lvl_saturation_stay)
        if error is not None:
            return None, None, error
        if not filtered_places:
            return None, None, "По заданному промежутку времени и категориям невозможно сформировать маршрут"
        routes = self.__build_route(filtered_places, start_point, start_time, max_seconds, exclude_low_rang_routes)

        # print("len routes: ", len(routes))
        if len(routes) == 0:
            return None, None, "По заданному промежутку времени и выбранным опциям невозможно сформировать маршрут"

        rid = self.__safe_request(
            user_id,
            included_categories,
            soft_excluded_categories,
            hard_excluded_categories,
            start_point,
            start_time,
            max_seconds,
            filtered_places,
            use_prev_history,
            use_common_weights,
            exclude_low_rang_routes,
            lvl_saturation_stay,
            lvl_activity
        )
        return routes, rid, None

    def __safe_request(
            self,
            user_id,
            included_categories,
            soft_excluded_categories,
            hard_excluded_categories,
            start_point,
            start_time,
            max_seconds,
            filtered_places,
            use_prev_history,
            use_common_weights,
            exclude_low_rang_routes,
            lvl_saturation_stay,
            lvl_activity
    ):
        filtered_places_data = []
        for place in filtered_places:
            filtered_places_data.append({
                'place_id': place['_id'],
                'rang': place['rang']
            })
        return self.__repo.safe_request(
            {
                'user_id': user_id,
                'included_categories': included_categories,
                'soft_excluded_categories': soft_excluded_categories,
                'hard_excluded_categories': hard_excluded_categories,
                'start_time': start_time,
                'start_point': start_point,
                'max_seconds': max_seconds,
                'filtered_places_data': filtered_places_data,
                'use_prev_history': use_prev_history,
                'use_common_weights': use_common_weights,
                'exclude_low_rang_routes': exclude_low_rang_routes,
                'lvl_saturation_stay': lvl_saturation_stay,
                'lvl_activity': lvl_activity
            }
        )


    def __get_recommended_places(
            self,
            user_id,
            included_categories,
            soft_excluded_categories,
            hard_excluded_categories,
            use_prev_history,
            use_common_weights,
            lvl_activity,
            exclude_low_rang_routes
    ):
        if len(included_categories) == 0 and not use_prev_history:
            included_categories = self.get_categories()

        hard_c = set(hard_excluded_categories)
        inc_c = set(included_categories)

        winter_months = [12, 1, 2]
        summer_months = [5, 6, 7, 8]

        winter_c = set(["Зимние развлечения", "Активный зимний отдых", "Открытые катки", "Катки",
                        "Горные лыжи", "Катание на лыжах", "Катание на ватрушках", "Сноуборд"])
        summer_c = set(["Летние развлечения", "Пляжи", "Кинотеатры под открытым небом", 
                        "Прокат лодок и катеров"])
        
        cur_month = datetime.now().month
        if cur_month not in winter_months:
            hard_c = hard_c.union(winter_c - inc_c)
        if cur_month not in summer_months:
            hard_c = hard_c.union(summer_c - inc_c)

        # print(hard_c)

        u_inc_c, error = self.__update_vector(user_id, inc_c, hard_c, use_prev_history)
        if error:
            return None, error

        new_inc_c = u_inc_c if use_prev_history else inc_c
        user_vector = new_inc_c - hard_c

        if lvl_activity != "Не имеет значения":
            places = self.__repo.get_places_by_lvl_activity(lvl_activity)
        else:
            places = self.__repo.get_all_places()

        places_with_rang = []
        weights = self.__repo.get_categories_weight_vector(use_common_weights)

        copied_weights = weights.copy()
        for category in soft_excluded_categories:
            copied_weights[category] = copied_weights[category] - 0.8 if copied_weights[category] > 0.8 else 0

        # i = 0

        for place in places:
            place_vector = set(place['categories'])
            if place_vector.intersection(hard_c):
                continue

            p_with_rang = place.copy()

            gen_categories = user_vector.union(place_vector)
            u_vec = [1 if c in user_vector else 0 
                     for c in gen_categories]
            p_vec = [1 if c in place_vector else 0 
                     for c in gen_categories]
            w_vec = [copied_weights[c] for c in gen_categories 
                     if c in copied_weights]

            try:
                p_with_rang['rang'] = 1 - distance.cosine(
                                            u_vec, p_vec, w_vec)
                if p_with_rang['title'] == "Московский зоопарк":
                    print(p_with_rang['rang'])
            except:
                print("user_vector count: " + str(len(u_vec)))
                print("place vector count: " + str(len(p_vec)))
                print("copied_weights count: " + str(len(w_vec)))
                p_with_rang['rang'] = 0

            # if i < 2:
            #     print("p_rang: " + str(p_with_rang['rang']))
            #     print("u_vec: " + str(u_vec))
            #     print("p_vec: " + str(p_vec))
            #     print("w_vec: " + str(w_vec))

            if not (exclude_low_rang_routes and p_with_rang['rang'] < 0.001):
                places_with_rang.append(p_with_rang)
            # i += 1

        print("len places: ", len(places_with_rang))

        return sorted(places_with_rang, key=lambda p: p['rang'], reverse=True), None
    

    def __get_max_seconds(self, start_time, end_time):
        start = start_time.split(':')
        end = end_time.split(':')
        minutes = 0
        hours = 0
        if int(end[1]) - int(start[1]) < 0:
            minutes = int(end[1]) + 60 - int(start[1])
            hours = int(end[0]) - int(start[0]) - 1
        else:
            minutes = int(end[1]) - int(start[1])
            hours = int(end[0]) - int(start[0])
        max_seconds = hours * 3600 + minutes * 60
        return max_seconds

    def __filter_places(self, places, start_place, max_seconds, lvl_saturation_stay):
        start_station = self.__repo.get_station(start_place)
        if start_station is None:
            return None, None, "Отсутствует начальная точка маршрута"
        durations = start_station['duration']

        categories = self.__repo.get_categories()

        t_dest_from_station_to_place = 15 * 60       # 15 минут

        filtered_places = []
        for place in places:
            subways = place['subway'].split(', ')
            duration = -1
            for subway in subways:
                if subway in durations and durations[subway] != 0:
                    duration = durations[subway]
                    break
            
            p_categories = place['categories']
            times = [category['stay_time'] for category in categories
                     if category['name'] in p_categories]
            
            if len(times) != 0:
                base_time = sum(times) // len(times)
                stay_time = base_time * lvl_saturation_stay
                if (base_time > 0 and duration != -1 and 
                    duration + t_dest_from_station_to_place + stay_time <= max_seconds):
                    place['stay_time'] = stay_time
                    filtered_places.append(place)

        return filtered_places, max_seconds, None
    

    def __update_vector(self, user_id, inc_c, hard_c, use_prev_history):
        old_set = set()

        req_categories, err = self.__repo.get_last_request(user_id)
        if err and use_prev_history:
            return None, err
        elif not err:
            old_set = set(req_categories['included_categories']) - set(req_categories['hard_excluded_categories'])
        u_inc_c = old_set.union(inc_c)
        u_set = u_inc_c - hard_c

        self.__repo.update_user_vector(user_id, list(u_set))
        return u_inc_c, None


    # def __update_vector(self, user_id, included_categories):
    #     user = self.__repo.get_user(user_id)
    #     user_vector = user['vector']
    #     categories_vector = self.__repo.get_all_categories_vector()
    #     for category in included_categories:
    #         categories_vector[category] = 1

    #     print("categories_vector: ", categories_vector, "\n")

    #     # self.__repo.update_user_vector(user_id, categories_vector)

    #     # sum_vector = np.add.reduce([list(user_vector.values()), list(categories_vector.values())])
    #     sum_vector = list(user_vector.values())
    #     normalized_vector = sum_vector / np.linalg.norm(sum_vector)

    #     # print("dif sets:", set(categories_vector.values())^set(normalized_vector))

    #     categories_normalized_vector = dict()
    #     i = 0
    #     for category in categories_vector:
    #         categories_normalized_vector[category] = normalized_vector[i]
    #         i += 1

    #     self.__repo.update_user_vector(user_id, categories_normalized_vector)


    def __build_route(self, places, start_place_name, start_time, max_seconds, exclude_low_rang_routes, limit=10):
        start_station = self.__repo.get_station(start_place_name)
        start_durations = start_station['duration']
        stations = self.__repo.get_stations()

        routes = []
        sum_rang = 0

        stack = deque()
        stack.append(
            {
                "idx": -1,
                "route": [],    # [(idx, sum_rang)]
            }
        )

        places_count = len(places)

        while stack:
            node = stack.pop()

            if node["idx"] == places_count:
                continue

            if len(routes) == limit:
                break

            cur_node_route = [elem[0] for elem in node["route"]]
            cur_route = [places[i] for i in cur_node_route]
            sum_rang = 0 if len(cur_node_route) == 0 else node["route"][-1][1]
            if exclude_low_rang_routes and not self.__check_rang(len(cur_route), sum_rang):
                continue

            check_time, _ = self.__check_time(start_durations, stations, cur_route, max_seconds)
            if check_time == 1:
                continue

            if check_time == 2:
                routes += [self.__optimize_route(start_place_name, start_durations, stations, start_time, cur_route)]
                # print("depth: " + str(node["idx"]) + ", routes count: " + str(len(routes)))
                stack.pop()
                continue

            node["idx"] += 1
            idx = node["idx"]

            next_rang = places[idx]["rang"] if idx < places_count else 0

            stack.append(node)
            stack.append(
                {
                    "idx": idx,
                    "route": node["route"] + [(idx, sum_rang + next_rang)],
                }
            )

        return routes
    

    def __get_distance_matrix(self, start_durations, stations, places):
        t_dest_from_station_to_place = 15 * 60       # 15 минут
        
        matrix = []
        start_row = [0]
        for place in places:
            subways = place['subway'].split(', ')
            duration = float('inf')
            # выбрать станцию метро, до которой можно добраться за минимальное время
            for subway in subways:
                if (subway in start_durations and
                    start_durations[subway] > 0 and
                    start_durations[subway] + t_dest_from_station_to_place < duration):
                    # st_durations[subway] == 0, если нет пути между station_from и station_to
                    duration = start_durations[subway] + t_dest_from_station_to_place
            start_row.append(duration)
        matrix.append(start_row)

        for place_from in places:
            row = [0]
            subways_from = place_from['subway'].split(', ')
            for place_to in places:
                if place_to['title'] == place_from['title']:
                    min_duration = 0
                    row.append(min_duration)
                    continue

                subways_to = place_to['subway'].split(', ')
                if (set(subways_from) & set(subways_to)):
                    min_duration = t_dest_from_station_to_place
                    row.append(min_duration)
                    continue

                min_duration = float('inf')
                for station_from in subways_from:
                    if station_from in stations:
                        st_durations = station_from['duration']
                        for station_to in subways_to:
                            if (station_to in st_durations and
                                st_durations[station_to] > 0 and
                                st_durations[station_to] + t_dest_from_station_to_place < min_duration):
                                # st_durations[station_to] == 0, если нет пути между station_from и station_to
                                min_duration = st_durations[station_to] + t_dest_from_station_to_place
                row.append(min_duration)
            matrix.append(row)

        return matrix

    # 1 - route duration is more than max seconds
    # 2 - route is full
    # 3 - route is not full
    def __check_time(self, start_durations, stations, places, max_seconds, eps=2400):
        dist = 0
        if len(places) == 0:
            return 3, max_seconds - dist
        
        matrix = self.__get_distance_matrix(start_durations, stations, places)
        np_matrix = np.array(matrix)
        _, dist = solve_tsp_dynamic_programming(np_matrix)
        
        dist += sum([place['stay_time'] for place in places])

        if dist > max_seconds:
            return 1, None
        elif max_seconds - dist <= eps:
            return 2, max_seconds - dist
        else:
            return 3, max_seconds - dist


    def __check_rang(self, count_places, sum_rang, limit=0.2):
        if count_places == 0:
            return True
        return sum_rang / count_places > limit


    def __optimize_route(self, start_place_name, start_durations, stations, start_time, route):
        matrix = self.__get_distance_matrix(start_durations, stations, route)
        np_matrix = np.array(matrix)
        permutation, _ = solve_tsp_dynamic_programming(np_matrix)

        optimized_route = []
        next_place_title = ""

        for i in range(len(permutation) - 1):
            # i == 0 => cur_place -- начальная станция метро
            # i != 0 => cur_place -- место из маршрута
            cur_place_title = next_place_title if i != 0 else start_place_name

            next_place = route[permutation[i + 1] - 1]

            sec_to_next_place = matrix[permutation[i]][permutation[i + 1]]
            hours_to_next_place = sec_to_next_place // 3600
            min_to_next_place = (sec_to_next_place - hours_to_next_place * 3600) // 60

            [prev_h, prev_m] = [next_h, next_m] if i != 0 else [int(elem) for elem in start_time.split(":")]

            cur_h = prev_h + hours_to_next_place + (prev_m + min_to_next_place) // 60
            cur_m = (prev_m + min_to_next_place) % 60
            
            full_m = cur_m + (next_place['stay_time']) // 60
            next_h = int(cur_h + full_m // 60)
            next_m = int(full_m % 60)

            h_t = [prev_h, cur_h, next_h]
            h_zeros = [""] * len(h_t)
            for i, el in enumerate(h_t):
                if el < 10:
                    h_zeros[i] = "0"

            m_t = [prev_m, cur_m, next_m]
            m_zeros = [""] * len(m_t)
            for i, el in enumerate(m_t):
                if el < 10:
                    m_zeros[i] = "0"

            next_place_title = next_place['title']

            optimized_route += [
                {
                    "step": cur_place_title + " → " + next_place_title,
                    "time": h_zeros[0] + str(prev_h) + ":" + m_zeros[0] + str(prev_m) + "–" + 
                            h_zeros[1] + str(cur_h) + ":" + m_zeros[1] + str(cur_m)
                },
                {
                    "step": next_place_title,
                    "time": h_zeros[1] + str(cur_h) + ":" + m_zeros[1] + str(cur_m) + "–" + 
                            h_zeros[2] + str(next_h) + ":" + m_zeros[2] + str(next_m)
                }
            ]

        return optimized_route
